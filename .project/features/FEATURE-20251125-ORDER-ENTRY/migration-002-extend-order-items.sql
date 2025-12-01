-- Migration 002: Extend restaurant_order_items table
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Add fields for non-library items, vendor mapping, and quantity tracking
-- Created: 2025-11-25

-- Add item_name for non-library items (when ingredient_id is null)
ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);

-- Add vendor-specific item identifiers
ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS item_number VARCHAR(100);

ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS upc VARCHAR(50);

-- Add category for non-library items
ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add preferred vendor tracking
ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS preferred_vendor VARCHAR(255);

-- Add quantity tracking fields for PO lifecycle
ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS quantity_on_po NUMERIC(10,2) DEFAULT 0;

ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS quantity_received NUMERIC(10,2) DEFAULT 0;

-- Add approval flag for new items requiring Admin review
ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

-- Update status enum to include new states for order-to-PO workflow
-- First, check if we need to drop the existing constraint
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'restaurant_order_items'
        AND constraint_name LIKE '%status%check%'
    ) THEN
        ALTER TABLE restaurant_order_items DROP CONSTRAINT IF EXISTS restaurant_order_items_status_check;
    END IF;
END $$;

-- Add new status constraint with expanded enum values
ALTER TABLE restaurant_order_items
ADD CONSTRAINT restaurant_order_items_status_check
CHECK (status IN ('pending', 'on_po', 'partially_received', 'received', 'cancelled'));

-- Add check constraint to ensure quantity_on_po doesn't exceed quantity
ALTER TABLE restaurant_order_items
ADD CONSTRAINT restaurant_order_items_quantity_on_po_check
CHECK (quantity_on_po <= quantity);

-- Add check constraint to ensure quantity_received doesn't exceed quantity
ALTER TABLE restaurant_order_items
ADD CONSTRAINT restaurant_order_items_quantity_received_check
CHECK (quantity_received <= quantity);

-- Add comments for documentation
COMMENT ON COLUMN restaurant_order_items.item_name IS 'Item name for non-library items (when ingredient_id is null)';
COMMENT ON COLUMN restaurant_order_items.item_number IS 'Vendor-specific item/SKU number';
COMMENT ON COLUMN restaurant_order_items.upc IS 'Barcode/UPC for item lookup';
COMMENT ON COLUMN restaurant_order_items.category IS 'Item category for non-library items';
COMMENT ON COLUMN restaurant_order_items.preferred_vendor IS 'Preferred vendor name for this item';
COMMENT ON COLUMN restaurant_order_items.quantity_on_po IS 'Quantity assigned to purchase orders';
COMMENT ON COLUMN restaurant_order_items.quantity_received IS 'Quantity received from purchase orders';
COMMENT ON COLUMN restaurant_order_items.requires_approval IS 'Flag indicating item requires Admin approval before library addition';

-- Migration validation queries:
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'restaurant_order_items' AND column_name IN ('item_name', 'item_number', 'upc', 'category', 'preferred_vendor', 'quantity_on_po', 'quantity_received', 'requires_approval');
