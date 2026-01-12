-- ============================================================================
-- INVANTRY DATABASE MIGRATIONS - ORDER ENTRY & PO SPLIT-VIEW FEATURE
-- ============================================================================
--
-- Feature ID: FEATURE-20251125-ORDER-ENTRY
-- Created: 2025-11-25
-- Total Migrations: 8
-- Estimated Execution Time: 2-5 minutes
--
-- ⚠️  IMPORTANT NOTES:
--   1. This file contains ALL migrations combined in the correct execution order
--   2. Review MIGRATION_INSTRUCTIONS.md for detailed step-by-step guidance
--   3. Backup your database before running (Supabase auto-backups daily)
--   4. Test on a staging environment first if available
--
-- EXECUTION OPTIONS:
--   Option A (Recommended): Run this entire file in Supabase SQL Editor
--   Option B: Run individual migration files one-by-one (see instructions)
--
-- POST-MIGRATION REQUIREMENTS:
--   After running this file, you MUST:
--   1. Run vendor data migration (see MIGRATION_INSTRUCTIONS.md)
--   2. Run post-migration verification queries
--   3. Optionally seed vendor data
--
-- WHAT THIS MIGRATION DOES:
--   Phase 1: Extends restaurant_orders and restaurant_order_items tables
--   Phase 2: Creates vendors and ingredient_vendor_mapping tables
--   Phase 3: Extends purchase_orders and purchase_order_items tables
--   Phase 4: Creates 15+ performance indexes
--   Phase 5: Creates 6 database functions and triggers for automation
--
-- NEW FEATURES ENABLED:
--   ✓ Multi-tab order creation with custom labels
--   ✓ Smart PO consolidation across multiple orders
--   ✓ Quantity-on-order tracking to prevent over-ordering
--   ✓ Partial fulfillment support
--   ✓ Dynamic vendor management
--   ✓ Automated order/PO status transitions
--   ✓ Intelligent "Populate Lines" feature
--
-- ROLLBACK:
--   If you need to rollback, use rollback-all.sql
--   WARNING: Rollback will delete all new tables and columns
--
-- SUPPORT:
--   - See database-migration-summary.md for detailed documentation
--   - See MIGRATION_INSTRUCTIONS.md for troubleshooting
--
-- ============================================================================
-- BEGIN MIGRATIONS
-- ============================================================================

-- Migration 001: Extend restaurant_orders table
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Add order_purpose field for tab labeling
-- Created: 2025-11-25

-- Add order_purpose field for custom tab labels
-- This allows users to label orders with meaningful names like "Weekly Reorder", "Nov 25", "Holiday Prep"
ALTER TABLE restaurant_orders
ADD COLUMN IF NOT EXISTS order_purpose VARCHAR(255);

-- Add comment to explain the field
COMMENT ON COLUMN restaurant_orders.order_purpose IS 'Custom label for order tab identification (e.g., "Weekly Reorder", "Nov 25", "Holiday Prep")';

-- Migration validation: Check if column was added successfully
-- Run this query to verify: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'restaurant_orders' AND column_name = 'order_purpose';
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
-- Migration 005: Create vendors table
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Create vendor management table for supplier relationships
-- Created: 2025-11-25

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address JSONB,
    payment_terms VARCHAR(100),
    account_number VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate vendor names per restaurant
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_restaurant_name
ON vendors(restaurant_id, LOWER(name));

-- Add index for active vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendors_restaurant_active
ON vendors(restaurant_id, is_active)
WHERE is_active = true;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_vendors_email
ON vendors(email)
WHERE email IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE vendors IS 'Vendor/supplier master table for restaurant purchasing';
COMMENT ON COLUMN vendors.id IS 'Unique vendor identifier (UUID)';
COMMENT ON COLUMN vendors.restaurant_id IS 'Restaurant that this vendor supplies to';
COMMENT ON COLUMN vendors.name IS 'Vendor/supplier business name';
COMMENT ON COLUMN vendors.contact_name IS 'Primary contact person at vendor';
COMMENT ON COLUMN vendors.phone IS 'Vendor phone number';
COMMENT ON COLUMN vendors.email IS 'Vendor email address';
COMMENT ON COLUMN vendors.address IS 'Vendor address object: {"street": "123 Main St", "city": "Chicago", "state": "IL", "zip": "60601"}';
COMMENT ON COLUMN vendors.payment_terms IS 'Payment terms (e.g., "Net 30", "COD", "Net 15")';
COMMENT ON COLUMN vendors.account_number IS 'Restaurant''s account number with this vendor';
COMMENT ON COLUMN vendors.is_active IS 'Whether vendor is currently active for ordering';
COMMENT ON COLUMN vendors.notes IS 'Additional notes about vendor (hours, special instructions, etc.)';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_vendors_updated_at ON vendors;
CREATE TRIGGER trigger_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_vendors_updated_at();

-- Seed some common vendors (optional - can be removed for production)
-- INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
-- SELECT
--     id as restaurant_id,
--     'Sysco Corporation',
--     'Sales Department',
--     '1-800-SYSCO-01',
--     'orders@sysco.com',
--     'Net 30',
--     true
-- FROM restaurants
-- WHERE business_type = 'restaurant'
-- LIMIT 1;

-- Migration validation:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'vendors';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vendors';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'vendors';
-- Migration 006: Create ingredient_vendor_mapping table
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Many-to-many relationship between ingredients and vendors with pricing/lead time
-- Created: 2025-11-25

-- Create ingredient-vendor mapping table
CREATE TABLE IF NOT EXISTS ingredient_vendor_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES ingredient_library(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    is_preferred BOOLEAN DEFAULT false,
    vendor_item_number VARCHAR(100),
    unit_cost NUMERIC(10,2),
    lead_time_days INTEGER,
    minimum_order_qty NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique combination of ingredient and vendor
    CONSTRAINT uq_ingredient_vendor UNIQUE(ingredient_id, vendor_id)
);

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_ingredient
ON ingredient_vendor_mapping(ingredient_id);

CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_vendor
ON ingredient_vendor_mapping(vendor_id);

-- Index for finding preferred vendors
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_preferred
ON ingredient_vendor_mapping(ingredient_id, is_preferred)
WHERE is_preferred = true;

-- Add check constraint for valid lead time
ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT ingredient_vendor_mapping_lead_time_check
CHECK (lead_time_days IS NULL OR lead_time_days >= 0);

-- Add check constraint for valid minimum order quantity
ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT ingredient_vendor_mapping_min_order_check
CHECK (minimum_order_qty IS NULL OR minimum_order_qty > 0);

-- Add check constraint for valid unit cost
ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT ingredient_vendor_mapping_unit_cost_check
CHECK (unit_cost IS NULL OR unit_cost >= 0);

-- Add comments for documentation
COMMENT ON TABLE ingredient_vendor_mapping IS 'Many-to-many relationship mapping ingredients to vendors with pricing and lead time information';
COMMENT ON COLUMN ingredient_vendor_mapping.id IS 'Unique mapping identifier';
COMMENT ON COLUMN ingredient_vendor_mapping.ingredient_id IS 'Reference to ingredient in library';
COMMENT ON COLUMN ingredient_vendor_mapping.vendor_id IS 'Reference to vendor';
COMMENT ON COLUMN ingredient_vendor_mapping.is_preferred IS 'Whether this is the preferred vendor for this ingredient';
COMMENT ON COLUMN ingredient_vendor_mapping.vendor_item_number IS 'Vendor''s SKU/item number for this ingredient';
COMMENT ON COLUMN ingredient_vendor_mapping.unit_cost IS 'Cost per unit from this vendor';
COMMENT ON COLUMN ingredient_vendor_mapping.lead_time_days IS 'Typical delivery time in days';
COMMENT ON COLUMN ingredient_vendor_mapping.minimum_order_qty IS 'Minimum order quantity for this item from this vendor';
COMMENT ON COLUMN ingredient_vendor_mapping.notes IS 'Vendor-specific notes for this ingredient';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ingredient_vendor_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ingredient_vendor_mapping_updated_at ON ingredient_vendor_mapping;
CREATE TRIGGER trigger_ingredient_vendor_mapping_updated_at
    BEFORE UPDATE ON ingredient_vendor_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredient_vendor_mapping_updated_at();

-- Create trigger to ensure only one preferred vendor per ingredient
CREATE OR REPLACE FUNCTION enforce_single_preferred_vendor()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this as preferred, unset others
    IF NEW.is_preferred = true THEN
        UPDATE ingredient_vendor_mapping
        SET is_preferred = false
        WHERE ingredient_id = NEW.ingredient_id
        AND vendor_id != NEW.vendor_id
        AND is_preferred = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_single_preferred_vendor ON ingredient_vendor_mapping;
CREATE TRIGGER trigger_enforce_single_preferred_vendor
    BEFORE INSERT OR UPDATE ON ingredient_vendor_mapping
    FOR EACH ROW
    WHEN (NEW.is_preferred = true)
    EXECUTE FUNCTION enforce_single_preferred_vendor();

-- Migration validation:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'ingredient_vendor_mapping';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ingredient_vendor_mapping';
-- SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'ingredient_vendor_mapping';
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
-- Migration 007: Create additional performance indexes
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Add indexes for efficient querying in order-to-PO workflows
-- Created: 2025-11-25

-- ============================================================================
-- RESTAURANT_ORDERS INDEXES
-- ============================================================================

-- Index for filtering orders by status (for dashboard views)
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_status_created
ON restaurant_orders(restaurant_id, status, created_at DESC);

-- Index for finding orders by order_number (for search)
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_order_number
ON restaurant_orders(order_number);

-- Index for finding draft orders by user
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_created_by_status
ON restaurant_orders(created_by, status)
WHERE status = 'draft';

-- ============================================================================
-- RESTAURANT_ORDER_ITEMS INDEXES
-- ============================================================================

-- Index for finding pending items that need PO assignment
CREATE INDEX IF NOT EXISTS idx_order_items_pending_vendor
ON restaurant_order_items(preferred_vendor, status)
WHERE status IN ('pending', 'on_po');

-- Index for finding items by ingredient (for consolidation logic)
CREATE INDEX IF NOT EXISTS idx_order_items_ingredient_status
ON restaurant_order_items(ingredient_id, status)
WHERE status != 'cancelled';

-- Index for finding items requiring approval
CREATE INDEX IF NOT EXISTS idx_order_items_requires_approval
ON restaurant_order_items(requires_approval)
WHERE requires_approval = true;

-- Index for tracking quantities (for low stock calculations)
CREATE INDEX IF NOT EXISTS idx_order_items_quantity_tracking
ON restaurant_order_items(order_id, quantity, quantity_on_po, quantity_received);

-- ============================================================================
-- PURCHASE_ORDERS INDEXES
-- ============================================================================

-- Index for finding POs by supplier (for PO consolidation logic)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_status
ON purchase_orders(supplier_name, status)
WHERE status = 'draft';

-- Index for finding POs by status and date (for receiving workflow)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status_expected_delivery
ON purchase_orders(restaurant_id, status, expected_delivery_date)
WHERE status IN ('backordered', 'draft');

-- Index for finding POs by order number (for search)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_number
ON purchase_orders(order_number);

-- ============================================================================
-- PURCHASE_ORDER_ITEMS INDEXES
-- ============================================================================

-- Index for finding PO items by ingredient (for receiving)
CREATE INDEX IF NOT EXISTS idx_po_items_ingredient_po
ON purchase_order_items(ingredient_id, purchase_order_id);

-- Index for finding partially received items
CREATE INDEX IF NOT EXISTS idx_po_items_partial_receipt
ON purchase_order_items(purchase_order_id)
WHERE quantity_received < quantity_ordered;

-- ============================================================================
-- VENDORS INDEXES
-- ============================================================================

-- Index for active vendor lookup by restaurant
CREATE INDEX IF NOT EXISTS idx_vendors_restaurant_active_name
ON vendors(restaurant_id, is_active, name)
WHERE is_active = true;

-- ============================================================================
-- RESTAURANT_INVENTORY INDEXES (if not already present)
-- ============================================================================

-- Index for finding low stock items (for "Populate Lines" feature)
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
ON restaurant_inventory(restaurant_id, ingredient_id)
WHERE quantity < minimum_quantity;

-- Composite index for low stock queries with quantities
CREATE INDEX IF NOT EXISTS idx_inventory_quantities
ON restaurant_inventory(restaurant_id, ingredient_id, quantity, minimum_quantity);

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Run these queries to verify indexes were created:
-- SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('restaurant_orders', 'restaurant_order_items', 'purchase_orders', 'purchase_order_items', 'vendors', 'restaurant_inventory') ORDER BY tablename, indexname;

-- Check index usage (run after application is running):
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes WHERE schemaname = 'public' AND tablename IN ('restaurant_orders', 'restaurant_order_items', 'purchase_orders', 'purchase_order_items', 'vendors') ORDER BY idx_scan DESC;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- These indexes are designed to optimize:
-- 1. "Populate Lines" queries that find low-stock items
-- 2. PO generation queries that group items by vendor
-- 3. PO consolidation logic that prevents duplicate POs
-- 4. Item consolidation that merges quantities across orders
-- 5. Receiving workflow that tracks partial fulfillment
-- 6. Dashboard views filtering by status
-- 7. Search functionality by order/PO numbers

-- Monitor query performance and adjust indexes as needed based on actual usage patterns
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
