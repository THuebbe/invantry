-- ============================================================================
-- Migration 009: Add Package Quantity Tracking
-- ============================================================================
-- Feature: FEATURE-20251125-ORDER-ENTRY (Enhancement)
-- Description: Add package quantity fields to support inventory tracking with
--              items per package, quantity per item, and item UOM
-- Created: 2025-11-27
--
-- EXAMPLES:
--   Case of chicken = 2 bags × 5 lbs = 10 lbs total
--   Case of vodka = 6 bottles × 750ml = 4500ml total
--   Bag of tomatoes = 1 bag × 10 lbs = 10 lbs total
--
-- AFFECTED TABLES:
--   - ingredient_library (default packaging)
--   - ingredient_vendor_mapping (vendor-specific packaging)
--   - restaurant_order_items (order packaging)
--   - purchase_order_items (PO packaging)
--   - restaurant_inventory (stock packaging)
-- ============================================================================

-- ============================================================================
-- 1. ingredient_library - Default packaging definition
-- ============================================================================

ALTER TABLE ingredient_library
ADD COLUMN IF NOT EXISTS package_quantity NUMERIC(10,2) DEFAULT 1;

ALTER TABLE ingredient_library
ADD COLUMN IF NOT EXISTS item_quantity NUMERIC(10,2);

ALTER TABLE ingredient_library
ADD COLUMN IF NOT EXISTS item_uom VARCHAR(20);

COMMENT ON COLUMN ingredient_library.package_quantity IS 'Number of items per package (e.g., 2 bags, 6 bottles, 1 box). Defaults to 1.';
COMMENT ON COLUMN ingredient_library.item_quantity IS 'Quantity per individual item (e.g., 5 lbs, 750ml, 10 lbs)';
COMMENT ON COLUMN ingredient_library.item_uom IS 'Unit of measure for item quantity (e.g., lbs, ml, oz, gal)';

-- Add check constraints for valid values
ALTER TABLE ingredient_library
ADD CONSTRAINT ingredient_library_package_quantity_check
CHECK (package_quantity > 0);

-- ============================================================================
-- 2. ingredient_vendor_mapping - Vendor-specific packaging
-- ============================================================================

ALTER TABLE ingredient_vendor_mapping
ADD COLUMN IF NOT EXISTS package_quantity NUMERIC(10,2) DEFAULT 1;

ALTER TABLE ingredient_vendor_mapping
ADD COLUMN IF NOT EXISTS item_quantity NUMERIC(10,2);

ALTER TABLE ingredient_vendor_mapping
ADD COLUMN IF NOT EXISTS item_uom VARCHAR(20);

COMMENT ON COLUMN ingredient_vendor_mapping.package_quantity IS 'Vendor-specific: Number of items per package (may differ from library default)';
COMMENT ON COLUMN ingredient_vendor_mapping.item_quantity IS 'Vendor-specific: Quantity per individual item';
COMMENT ON COLUMN ingredient_vendor_mapping.item_uom IS 'Vendor-specific: Unit of measure for item quantity';

-- Add check constraints
ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT ingredient_vendor_mapping_package_quantity_check
CHECK (package_quantity > 0);

-- ============================================================================
-- 3. restaurant_order_items - Ordering with package quantities
-- ============================================================================

ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS package_quantity NUMERIC(10,2) DEFAULT 1;

ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS item_quantity NUMERIC(10,2);

ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS item_uom VARCHAR(20);

COMMENT ON COLUMN restaurant_order_items.package_quantity IS 'Number of items in this order line (e.g., ordering 2 cases = 2)';
COMMENT ON COLUMN restaurant_order_items.item_quantity IS 'Quantity per item being ordered';
COMMENT ON COLUMN restaurant_order_items.item_uom IS 'Unit of measure for ordered items';

-- Add check constraints
ALTER TABLE restaurant_order_items
ADD CONSTRAINT restaurant_order_items_package_quantity_check
CHECK (package_quantity > 0);

-- ============================================================================
-- 4. purchase_order_items - Receiving with package quantities
-- ============================================================================

ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS package_quantity NUMERIC(10,2) DEFAULT 1;

ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS item_quantity NUMERIC(10,2);

ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS item_uom VARCHAR(20);

COMMENT ON COLUMN purchase_order_items.package_quantity IS 'Number of items on PO line (for receiving tracking)';
COMMENT ON COLUMN purchase_order_items.item_quantity IS 'Quantity per item on PO';
COMMENT ON COLUMN purchase_order_items.item_uom IS 'Unit of measure for PO items';

-- Add check constraints
ALTER TABLE purchase_order_items
ADD CONSTRAINT purchase_order_items_package_quantity_check
CHECK (package_quantity > 0);

-- ============================================================================
-- 5. restaurant_inventory - Stock tracking with packages
-- ============================================================================

ALTER TABLE restaurant_inventory
ADD COLUMN IF NOT EXISTS package_quantity NUMERIC(10,2) DEFAULT 1;

ALTER TABLE restaurant_inventory
ADD COLUMN IF NOT EXISTS item_quantity NUMERIC(10,2);

ALTER TABLE restaurant_inventory
ADD COLUMN IF NOT EXISTS item_uom VARCHAR(20);

COMMENT ON COLUMN restaurant_inventory.package_quantity IS 'Number of items currently in stock (e.g., 3 cases = 3)';
COMMENT ON COLUMN restaurant_inventory.item_quantity IS 'Quantity per item in inventory';
COMMENT ON COLUMN restaurant_inventory.item_uom IS 'Unit of measure for inventory items';

-- Add check constraints
ALTER TABLE restaurant_inventory
ADD CONSTRAINT restaurant_inventory_package_quantity_check
CHECK (package_quantity > 0);

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================
-- Run these queries after migration to verify success:

-- Check that all columns were added
SELECT
  'Column existence check' as test_type,
  table_name,
  column_name,
  data_type,
  CASE WHEN column_name IS NOT NULL THEN '✅ PASS' ELSE '❌ FAIL' END as result
FROM information_schema.columns
WHERE table_name IN (
  'ingredient_library',
  'ingredient_vendor_mapping',
  'restaurant_order_items',
  'purchase_order_items',
  'restaurant_inventory'
)
AND column_name IN ('package_quantity', 'item_quantity', 'item_uom')
ORDER BY table_name, column_name;

-- Check constraints
SELECT
  'Constraint check' as test_type,
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE constraint_name LIKE '%package_quantity_check%'
ORDER BY table_name;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
--
-- DEFAULT VALUES:
-- - package_quantity defaults to 1 (single item/unit)
-- - item_quantity and item_uom are nullable (will be populated during reseed)
--
-- CALCULATION:
-- - Total quantity = package_quantity × item_quantity
-- - Display format: "{package_quantity} {package_type} × {item_quantity} {item_uom}"
--   Example: "2 bags × 5 lbs" or "6 bottles × 750ml"
--
-- MIGRATION SAFETY:
-- - All columns are nullable or have defaults
-- - Existing data will not be affected
-- - No data migration required
-- - Constraints only validate positive package quantities
--
-- ROLLBACK:
-- If you need to rollback this migration, run:
--
-- ALTER TABLE ingredient_library DROP COLUMN IF EXISTS package_quantity;
-- ALTER TABLE ingredient_library DROP COLUMN IF EXISTS item_quantity;
-- ALTER TABLE ingredient_library DROP COLUMN IF EXISTS item_uom;
-- ALTER TABLE ingredient_vendor_mapping DROP COLUMN IF EXISTS package_quantity;
-- ALTER TABLE ingredient_vendor_mapping DROP COLUMN IF EXISTS item_quantity;
-- ALTER TABLE ingredient_vendor_mapping DROP COLUMN IF EXISTS item_uom;
-- ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS package_quantity;
-- ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS item_quantity;
-- ALTER TABLE restaurant_order_items DROP COLUMN IF EXISTS item_uom;
-- ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS package_quantity;
-- ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS item_quantity;
-- ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS item_uom;
-- ALTER TABLE restaurant_inventory DROP COLUMN IF EXISTS package_quantity;
-- ALTER TABLE restaurant_inventory DROP COLUMN IF EXISTS item_quantity;
-- ALTER TABLE restaurant_inventory DROP COLUMN IF EXISTS item_uom;
--
-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
