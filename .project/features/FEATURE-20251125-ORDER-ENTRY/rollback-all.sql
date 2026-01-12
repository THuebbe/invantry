-- Rollback Script for Order Entry Feature Database Migrations
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Created: 2025-11-25
-- WARNING: This script will remove all changes made by migrations 001-008
-- IMPORTANT: Backup your database before running this rollback script!

-- ============================================================================
-- ROLLBACK STEP 1: Drop all functions and triggers created in migration-008
-- ============================================================================

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS trigger_check_duplicate_draft_po ON purchase_orders;
DROP TRIGGER IF EXISTS trigger_update_po_status_from_items ON purchase_order_items;
DROP TRIGGER IF EXISTS trigger_update_order_status_from_items ON restaurant_order_items;

-- Drop functions
DROP FUNCTION IF EXISTS check_duplicate_draft_po();
DROP FUNCTION IF EXISTS update_po_status_from_items();
DROP FUNCTION IF EXISTS update_order_status_from_items();
DROP FUNCTION IF EXISTS get_low_stock_items(UUID);
DROP FUNCTION IF EXISTS calculate_suggested_reorder_quantity(UUID, UUID);
DROP FUNCTION IF EXISTS get_ingredient_quantity_on_order(UUID, UUID);

-- ============================================================================
-- ROLLBACK STEP 2: Drop indexes created in migration-007
-- ============================================================================

DROP INDEX IF EXISTS idx_inventory_quantities;
DROP INDEX IF EXISTS idx_inventory_low_stock;
DROP INDEX IF EXISTS idx_vendors_restaurant_active_name;
DROP INDEX IF EXISTS idx_po_items_partial_receipt;
DROP INDEX IF EXISTS idx_po_items_ingredient_po;
DROP INDEX IF EXISTS idx_purchase_orders_order_number;
DROP INDEX IF EXISTS idx_purchase_orders_status_expected_delivery;
DROP INDEX IF EXISTS idx_purchase_orders_supplier_status;
DROP INDEX IF EXISTS idx_order_items_quantity_tracking;
DROP INDEX IF EXISTS idx_order_items_requires_approval;
DROP INDEX IF EXISTS idx_order_items_ingredient_status;
DROP INDEX IF EXISTS idx_order_items_pending_vendor;
DROP INDEX IF EXISTS idx_restaurant_orders_created_by_status;
DROP INDEX IF EXISTS idx_restaurant_orders_order_number;
DROP INDEX IF EXISTS idx_restaurant_orders_status_created;

-- ============================================================================
-- ROLLBACK STEP 3: Drop ingredient_vendor_mapping table (migration-006)
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_enforce_single_preferred_vendor ON ingredient_vendor_mapping;
DROP TRIGGER IF EXISTS trigger_ingredient_vendor_mapping_updated_at ON ingredient_vendor_mapping;

-- Drop functions
DROP FUNCTION IF EXISTS enforce_single_preferred_vendor();
DROP FUNCTION IF EXISTS update_ingredient_vendor_mapping_updated_at();

-- Drop table
DROP TABLE IF EXISTS ingredient_vendor_mapping;

-- ============================================================================
-- ROLLBACK STEP 4: Drop vendors table (migration-005)
-- ============================================================================

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_vendors_updated_at ON vendors;

-- Drop function
DROP FUNCTION IF EXISTS update_vendors_updated_at();

-- Drop table
DROP TABLE IF EXISTS vendors;

-- ============================================================================
-- ROLLBACK STEP 5: Rollback purchase_order_items extensions (migration-004)
-- ============================================================================

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_update_source_order_items ON purchase_order_items;

-- Drop function
DROP FUNCTION IF EXISTS update_source_order_items_on_po_receipt();

-- Drop columns
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS source_order_item_ids;
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS item_name;
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS item_number;

-- Drop index
DROP INDEX IF EXISTS idx_po_items_source_order_items;

-- ============================================================================
-- ROLLBACK STEP 6: Rollback purchase_orders extensions (migration-003)
-- ============================================================================

-- Drop columns
ALTER TABLE purchase_orders DROP COLUMN IF EXISTS ship_to_address;
ALTER TABLE purchase_orders DROP COLUMN IF EXISTS bill_to_address;
ALTER TABLE purchase_orders DROP COLUMN IF EXISTS supplier_id_new;

-- Restore original status constraint (if you know the original values)
-- This is a best-effort restore - adjust based on your original schema
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE purchase_orders
ADD CONSTRAINT purchase_orders_status_check
CHECK (status IN ('draft', 'submitted', 'complete', 'cancelled'));

-- ============================================================================
-- ROLLBACK STEP 7: Rollback restaurant_order_items extensions (migration-002)
-- ============================================================================

-- Drop columns
ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS item_name;
ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS item_number;
ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS upc;
ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS category;
ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS preferred_vendor;
ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS quantity_on_po;
ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS quantity_received;
ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS requires_approval;

-- Drop constraints
ALTER TABLE restaurant_order_items DROP CONSTRAINT IF EXISTS restaurant_order_items_quantity_received_check;
ALTER TABLE restaurant_order_items DROP CONSTRAINT IF EXISTS restaurant_order_items_quantity_on_po_check;

-- Restore original status constraint (if you know the original values)
-- This is a best-effort restore - adjust based on your original schema
ALTER TABLE restaurant_order_items DROP CONSTRAINT IF EXISTS restaurant_order_items_status_check;
ALTER TABLE restaurant_order_items
ADD CONSTRAINT restaurant_order_items_status_check
CHECK (status IN ('pending', 'po_created', 'ordered', 'received', 'cancelled'));

-- ============================================================================
-- ROLLBACK STEP 8: Rollback restaurant_orders extensions (migration-001)
-- ============================================================================

ALTER TABLE restaurant_orders DROP COLUMN IF EXISTS order_purpose;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify rollback was successful:

-- Check that new columns are removed:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'restaurant_orders' AND column_name = 'order_purpose';
-- Should return 0 rows

-- Check that new tables are removed:
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('vendors', 'ingredient_vendor_mapping');
-- Should return 0 rows

-- Check that functions are removed:
-- SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('get_ingredient_quantity_on_order', 'calculate_suggested_reorder_quantity', 'get_low_stock_items');
-- Should return 0 rows

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

-- All migrations have been rolled back.
-- Your database should now be in the state it was before applying migrations 001-008.
--
-- IMPORTANT NOTES:
-- 1. If you had data in the new tables (vendors, ingredient_vendor_mapping), it is now lost
-- 2. If you modified the supplier_id field in purchase_orders, you may need manual data recovery
-- 3. Any data in the new columns (order_purpose, item_name, etc.) has been deleted
-- 4. You may need to restore from backup if data recovery is needed
