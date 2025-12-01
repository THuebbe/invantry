-- Migration 010: Add package quantity fields to get_low_stock_items function
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Update get_low_stock_items to return package_quantity, item_quantity, item_uom
-- Created: 2025-11-28
-- Purpose: Enable Item Details panel to display package breakdown (e.g., "2 bags × 5 lbs = 10 lbs")

-- ============================================================================
-- UPDATE: get_low_stock_items function
-- ============================================================================
-- Adds package quantity fields to support detailed inventory display

-- DROP existing function (required when changing return type)
DROP FUNCTION IF EXISTS get_low_stock_items(UUID);

-- CREATE function with new return fields
CREATE FUNCTION get_low_stock_items(
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
    estimated_cost NUMERIC,
    package_quantity NUMERIC,
    item_quantity NUMERIC,
    item_uom VARCHAR
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
        ) as estimated_cost,
        i.package_quantity,
        i.item_quantity,
        i.item_uom
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

COMMENT ON FUNCTION get_low_stock_items IS 'Returns low stock items with suggested reorder quantities and package information for "Populate Lines" feature';

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Test that the function returns package fields:
-- SELECT
--     ingredient_name,
--     package_quantity,
--     item_quantity,
--     item_uom
-- FROM get_low_stock_items((SELECT id FROM restaurants LIMIT 1))
-- LIMIT 5;
