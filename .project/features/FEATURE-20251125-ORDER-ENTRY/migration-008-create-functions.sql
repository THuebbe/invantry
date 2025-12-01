-- Migration 008: Create database functions and triggers
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Helper functions for order-to-PO workflow calculations
-- Created: 2025-11-25

-- ============================================================================
-- FUNCTION 1: Calculate quantity_on_order for an ingredient
-- ============================================================================
-- Used by "Populate Lines" to suggest order quantities accounting for open POs

CREATE OR REPLACE FUNCTION get_ingredient_quantity_on_order(
    p_ingredient_id UUID,
    p_restaurant_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
    v_qty_on_order NUMERIC;
BEGIN
    -- Sum up quantities from all open order items that haven't been fully received
    SELECT COALESCE(SUM(roi.quantity - COALESCE(roi.quantity_received, 0)), 0)
    INTO v_qty_on_order
    FROM restaurant_order_items roi
    JOIN restaurant_orders ro ON roi.order_id = ro.id
    WHERE roi.ingredient_id = p_ingredient_id
      AND ro.restaurant_id = p_restaurant_id
      AND roi.status IN ('on_po', 'partially_received')
      AND ro.status NOT IN ('cancelled', 'complete');

    RETURN COALESCE(v_qty_on_order, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_ingredient_quantity_on_order IS 'Returns total quantity of an ingredient on open orders/POs that has not yet been received';

-- ============================================================================
-- FUNCTION 2: Calculate suggested reorder quantity
-- ============================================================================
-- Formula: (par_level * 2) - current_qty - qty_on_order

CREATE OR REPLACE FUNCTION calculate_suggested_reorder_quantity(
    p_ingredient_id UUID,
    p_restaurant_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
    v_current_qty NUMERIC;
    v_par_level NUMERIC;
    v_qty_on_order NUMERIC;
    v_suggested_qty NUMERIC;
BEGIN
    -- Get current inventory levels
    SELECT quantity, minimum_quantity
    INTO v_current_qty, v_par_level
    FROM restaurant_inventory
    WHERE ingredient_id = p_ingredient_id
      AND restaurant_id = p_restaurant_id;

    -- If ingredient not in inventory, return 0
    IF v_par_level IS NULL THEN
        RETURN 0;
    END IF;

    -- Get quantity already on order
    v_qty_on_order := get_ingredient_quantity_on_order(p_ingredient_id, p_restaurant_id);

    -- Calculate suggested quantity: (par * 2) - current - on_order
    v_suggested_qty := (v_par_level * 2) - COALESCE(v_current_qty, 0) - v_qty_on_order;

    -- Don't suggest negative quantities
    IF v_suggested_qty < 0 THEN
        RETURN 0;
    END IF;

    RETURN v_suggested_qty;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_suggested_reorder_quantity IS 'Calculates suggested reorder quantity based on par level, current stock, and items on order';

-- ============================================================================
-- FUNCTION 3: Get low stock items for "Populate Lines"
-- ============================================================================

CREATE OR REPLACE FUNCTION get_low_stock_items(
    p_restaurant_id UUID
)
RETURNS TABLE (
    ingredient_id UUID,
    ingredient_name VARCHAR,
    category VARCHAR,
    current_qty NUMERIC,
    par_level NUMERIC,
    qty_on_order NUMERIC,
    suggested_qty NUMERIC,
    unit VARCHAR,
    preferred_vendor VARCHAR,
    estimated_cost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id as ingredient_id,
        i.name as ingredient_name,
        i.category,
        inv.quantity as current_qty,
        inv.minimum_quantity as par_level,
        get_ingredient_quantity_on_order(i.id, p_restaurant_id) as qty_on_order,
        calculate_suggested_reorder_quantity(i.id, p_restaurant_id) as suggested_qty,
        i.unit,
        COALESCE(
            (SELECT v.name
             FROM ingredient_vendor_mapping ivm
             JOIN vendors v ON ivm.vendor_id = v.id
             WHERE ivm.ingredient_id = i.id AND ivm.is_preferred = true
             LIMIT 1),
            'Unknown'
        ) as preferred_vendor,
        COALESCE(
            (SELECT ivm.unit_cost
             FROM ingredient_vendor_mapping ivm
             WHERE ivm.ingredient_id = i.id AND ivm.is_preferred = true
             LIMIT 1),
            inv.cost_per_unit
        ) as estimated_cost
    FROM ingredient_library i
    JOIN restaurant_inventory inv ON i.id = inv.ingredient_id
    WHERE inv.restaurant_id = p_restaurant_id
      AND inv.quantity < inv.minimum_quantity
      AND calculate_suggested_reorder_quantity(i.id, p_restaurant_id) > 0
    ORDER BY
        -- Prioritize items most below par level
        (inv.minimum_quantity - inv.quantity) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_low_stock_items IS 'Returns all low stock items with suggested reorder quantities for "Populate Lines" feature';

-- ============================================================================
-- FUNCTION 4: Update order status based on item statuses
-- ============================================================================

CREATE OR REPLACE FUNCTION update_order_status_from_items()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id UUID;
    v_all_received BOOLEAN;
    v_all_on_po BOOLEAN;
    v_any_on_po BOOLEAN;
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    -- Check if all items are received
    SELECT NOT EXISTS(
        SELECT 1 FROM restaurant_order_items
        WHERE order_id = v_order_id
          AND status NOT IN ('received', 'cancelled')
    ) INTO v_all_received;

    -- Check if all items are on POs
    SELECT NOT EXISTS(
        SELECT 1 FROM restaurant_order_items
        WHERE order_id = v_order_id
          AND status = 'pending'
    ) INTO v_all_on_po;

    -- Check if any items are on POs
    SELECT EXISTS(
        SELECT 1 FROM restaurant_order_items
        WHERE order_id = v_order_id
          AND status IN ('on_po', 'partially_received', 'received')
    ) INTO v_any_on_po;

    -- Update order status
    UPDATE restaurant_orders
    SET
        status = CASE
            WHEN v_all_received THEN 'complete'
            WHEN v_all_on_po AND v_any_on_po THEN 'open'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = v_order_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_status_from_items ON restaurant_order_items;
CREATE TRIGGER trigger_update_order_status_from_items
    AFTER INSERT OR UPDATE OR DELETE ON restaurant_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_from_items();

-- ============================================================================
-- FUNCTION 5: Update PO status based on item receipt
-- ============================================================================

CREATE OR REPLACE FUNCTION update_po_status_from_items()
RETURNS TRIGGER AS $$
DECLARE
    v_po_id UUID;
    v_all_received BOOLEAN;
BEGIN
    v_po_id := COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

    -- Check if all items fully received
    SELECT NOT EXISTS(
        SELECT 1 FROM purchase_order_items
        WHERE purchase_order_id = v_po_id
          AND quantity_received < quantity_ordered
    ) INTO v_all_received;

    -- Update PO status
    UPDATE purchase_orders
    SET
        status = CASE
            WHEN v_all_received THEN 'complete'
            WHEN status = 'draft' THEN 'draft'
            ELSE 'backordered'
        END,
        actual_delivery_date = CASE
            WHEN v_all_received AND actual_delivery_date IS NULL THEN CURRENT_DATE
            ELSE actual_delivery_date
        END,
        updated_at = NOW()
    WHERE id = v_po_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_po_status_from_items ON purchase_order_items;
CREATE TRIGGER trigger_update_po_status_from_items
    AFTER INSERT OR UPDATE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_po_status_from_items();

-- ============================================================================
-- FUNCTION 6: Prevent duplicate POs for same vendor in draft status
-- ============================================================================

CREATE OR REPLACE FUNCTION check_duplicate_draft_po()
RETURNS TRIGGER AS $$
DECLARE
    v_existing_po_id UUID;
BEGIN
    -- Only check for draft POs
    IF NEW.status = 'draft' THEN
        SELECT id INTO v_existing_po_id
        FROM purchase_orders
        WHERE restaurant_id = NEW.restaurant_id
          AND supplier_name = NEW.supplier_name
          AND status = 'draft'
          AND id != NEW.id
        LIMIT 1;

        IF v_existing_po_id IS NOT NULL THEN
            RAISE WARNING 'Draft PO already exists for vendor % (PO ID: %). Consider merging instead.',
                NEW.supplier_name, v_existing_po_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_duplicate_draft_po ON purchase_orders;
CREATE TRIGGER trigger_check_duplicate_draft_po
    BEFORE INSERT OR UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_draft_po();

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Test get_ingredient_quantity_on_order:
-- SELECT get_ingredient_quantity_on_order(
--     (SELECT id FROM ingredient_library LIMIT 1),
--     (SELECT id FROM restaurants LIMIT 1)
-- );

-- Test calculate_suggested_reorder_quantity:
-- SELECT calculate_suggested_reorder_quantity(
--     (SELECT id FROM ingredient_library LIMIT 1),
--     (SELECT id FROM restaurants LIMIT 1)
-- );

-- Test get_low_stock_items:
-- SELECT * FROM get_low_stock_items((SELECT id FROM restaurants LIMIT 1));

-- List all functions created:
-- SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%ingredient%' OR routine_name LIKE '%order%' OR routine_name LIKE '%po%';
