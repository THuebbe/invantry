-- Migration 003: Extend purchase_orders table
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Add shipping/billing addresses and update supplier_id to UUID
-- Created: 2025-11-25
-- WARNING: This migration modifies supplier_id from VARCHAR to UUID - requires data migration

-- Add ship_to_address and bill_to_address fields as JSONB
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS ship_to_address JSONB;

ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS bill_to_address JSONB;

-- Add comments for address fields
COMMENT ON COLUMN purchase_orders.ship_to_address IS 'Shipping address object: {"street": "123 Main St", "city": "Springfield", "state": "IL", "zip": "62701"}';
COMMENT ON COLUMN purchase_orders.bill_to_address IS 'Billing address object: {"street": "123 Main St", "city": "Springfield", "state": "IL", "zip": "62701"}';

-- IMPORTANT: supplier_id type change from VARCHAR to UUID
-- This is a potentially breaking change that requires careful handling
-- First, we need to check if there's existing data and handle it appropriately

-- Step 1: Create a new column for UUID-based supplier_id
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS supplier_id_new UUID;

-- Step 2: If you have existing vendor data, you'll need to migrate it
-- Example migration (uncomment and modify based on your data):
-- UPDATE purchase_orders p
-- SET supplier_id_new = v.id
-- FROM vendors v
-- WHERE p.supplier_id = v.name OR p.supplier_name = v.name;

-- Step 3: After data migration is verified, swap the columns
-- This should be done manually after verifying data migration:
-- ALTER TABLE purchase_orders DROP COLUMN supplier_id;
-- ALTER TABLE purchase_orders RENAME COLUMN supplier_id_new TO supplier_id;
-- ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_supplier_fk FOREIGN KEY (supplier_id) REFERENCES vendors(id);

-- For now, we'll add a comment noting that supplier_id_new should be used going forward
COMMENT ON COLUMN purchase_orders.supplier_id_new IS 'UUID reference to vendors table (replaces varchar supplier_id after migration)';

-- Update status enum to replace 'submitted' with 'backordered'
-- Drop existing status constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'purchase_orders'
        AND constraint_name LIKE '%status%check%'
    ) THEN
        ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
    END IF;
END $$;

-- Add updated status constraint
-- Status flow: draft → backordered (submitted to vendor) → complete
ALTER TABLE purchase_orders
ADD CONSTRAINT purchase_orders_status_check
CHECK (status IN ('draft', 'backordered', 'complete', 'cancelled'));

COMMENT ON COLUMN purchase_orders.status IS 'PO status: draft (being created), backordered (submitted to vendor), complete (all items received), cancelled';

-- Migration validation:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name IN ('ship_to_address', 'bill_to_address', 'supplier_id_new');
-- SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name = 'purchase_orders_status_check';
