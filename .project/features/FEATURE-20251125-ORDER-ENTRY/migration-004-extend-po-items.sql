-- Migration 004: Extend purchase_order_items table
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Add source order item tracking and item details for consolidated PO lines
-- Created: 2025-11-25

-- Add array field to track source order items (for consolidated PO lines)
-- Example: Order #1 needs 5 lbs chicken + Order #2 needs 3 lbs chicken = PO line with 8 lbs
-- This field stores both source order_item IDs: [uuid1, uuid2]
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS source_order_item_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Add item name for display (denormalized for performance)
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);

-- Add vendor item number
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS item_number VARCHAR(100);

-- Add index on source_order_item_ids for efficient lookups
CREATE INDEX IF NOT EXISTS idx_po_items_source_order_items
ON purchase_order_items USING GIN(source_order_item_ids);

-- Add comments for documentation
COMMENT ON COLUMN purchase_order_items.source_order_item_ids IS 'Array of restaurant_order_items.id that this PO line fulfills (supports consolidation)';
COMMENT ON COLUMN purchase_order_items.item_name IS 'Item name for display (denormalized from ingredient_library or custom items)';
COMMENT ON COLUMN purchase_order_items.item_number IS 'Vendor-specific item/SKU number';

-- Add trigger to automatically update source order items when PO item is received
CREATE OR REPLACE FUNCTION update_source_order_items_on_po_receipt()
RETURNS TRIGGER AS $$
DECLARE
    source_item_id UUID;
    total_ordered NUMERIC;
    total_received NUMERIC;
    proportional_received NUMERIC;
    source_item_qty NUMERIC;
BEGIN
    -- Only process when quantity_received changes
    IF (TG_OP = 'UPDATE' AND NEW.quantity_received != OLD.quantity_received) OR
       (TG_OP = 'INSERT' AND NEW.quantity_received > 0) THEN

        total_ordered := NEW.quantity_ordered;
        total_received := NEW.quantity_received;

        -- Loop through each source order item and update proportionally
        FOREACH source_item_id IN ARRAY NEW.source_order_item_ids
        LOOP
            -- Get the quantity for this specific source item
            SELECT quantity INTO source_item_qty
            FROM restaurant_order_items
            WHERE id = source_item_id;

            -- Calculate proportional received amount
            -- If PO line ordered 8 lbs and received 6 lbs, and this source item ordered 4 lbs
            -- Then this source item received: (4 / 8) * 6 = 3 lbs
            IF total_ordered > 0 THEN
                proportional_received := (source_item_qty / total_ordered) * total_received;

                -- Update the source order item
                UPDATE restaurant_order_items
                SET
                    quantity_received = LEAST(proportional_received, quantity),
                    status = CASE
                        WHEN proportional_received >= quantity THEN 'received'
                        WHEN proportional_received > 0 THEN 'partially_received'
                        ELSE status
                    END,
                    updated_at = NOW()
                WHERE id = source_item_id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_source_order_items ON purchase_order_items;
CREATE TRIGGER trigger_update_source_order_items
    AFTER INSERT OR UPDATE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_source_order_items_on_po_receipt();

-- Migration validation:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'purchase_order_items' AND column_name IN ('source_order_item_ids', 'item_name', 'item_number');
-- SELECT indexname FROM pg_indexes WHERE tablename = 'purchase_order_items' AND indexname = 'idx_po_items_source_order_items';
