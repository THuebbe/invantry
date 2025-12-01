-- ============================================================================
-- DATABASE VERIFICATION SCRIPT
-- Order Entry & PO Split-View Feature
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify database setup
-- ============================================================================

-- 1. Verify Table Structure
-- ============================================================================

SELECT '=== TABLE STRUCTURE VERIFICATION ===' as test_section;

-- Check restaurant_orders new columns
SELECT
  'restaurant_orders: order_purpose column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_orders' AND column_name = 'order_purpose'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check restaurant_order_items new columns
SELECT
  'restaurant_order_items: item_name column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_order_items' AND column_name = 'item_name'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT
  'restaurant_order_items: quantity_on_po column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_order_items' AND column_name = 'quantity_on_po'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT
  'restaurant_order_items: quantity_received column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_order_items' AND column_name = 'quantity_received'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check purchase_orders new columns
SELECT
  'purchase_orders: ship_to_address column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'ship_to_address'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT
  'purchase_orders: bill_to_address column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'bill_to_address'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check purchase_order_items new columns
SELECT
  'purchase_order_items: source_order_item_ids column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_order_items' AND column_name = 'source_order_item_ids'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check vendors table exists
SELECT
  'vendors: table exists' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'vendors'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check ingredient_vendor_mapping table exists
SELECT
  'ingredient_vendor_mapping: table exists' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredient_vendor_mapping'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- ============================================================================
-- 2. Verify Database Functions
-- ============================================================================

SELECT '=== DATABASE FUNCTIONS VERIFICATION ===' as test_section;

-- Check get_low_stock_items function
SELECT
  'get_low_stock_items function' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'get_low_stock_items'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check get_ingredient_quantity_on_order function
SELECT
  'get_ingredient_quantity_on_order function' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'get_ingredient_quantity_on_order'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check calculate_suggested_order_quantity function
SELECT
  'calculate_suggested_order_quantity function' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'calculate_suggested_order_quantity'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check get_order_items_by_vendor function
SELECT
  'get_order_items_by_vendor function' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'get_order_items_by_vendor'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check consolidate_po_items function
SELECT
  'consolidate_po_items function' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'consolidate_po_items'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check distribute_received_quantity function
SELECT
  'distribute_received_quantity function' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'distribute_received_quantity'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- ============================================================================
-- 3. Verify Indexes
-- ============================================================================

SELECT '=== INDEX VERIFICATION ===' as test_section;

-- Check for critical indexes
SELECT
  schemaname,
  tablename as table_name,
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'restaurant_orders',
    'restaurant_order_items',
    'purchase_orders',
    'purchase_order_items',
    'vendors',
    'ingredient_vendor_mapping'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. Verify Vendor Data
-- ============================================================================

SELECT '=== VENDOR DATA VERIFICATION ===' as test_section;

-- List all vendors
SELECT
  'Total vendors' as metric,
  COUNT(*)::text as value
FROM vendors;

SELECT
  id,
  name,
  contact_name,
  phone,
  email,
  payment_terms,
  is_active,
  restaurant_id
FROM vendors
ORDER BY name;

-- ============================================================================
-- 5. Test Database Functions with Sample Data
-- ============================================================================

SELECT '=== FUNCTIONAL TESTS (Requires Test Data) ===' as test_section;

-- Test get_low_stock_items (replace with your restaurant_id)
-- SELECT * FROM get_low_stock_items('YOUR_RESTAURANT_ID_HERE');

-- Test get_ingredient_quantity_on_order (replace with actual IDs)
-- SELECT get_ingredient_quantity_on_order(
--   'INGREDIENT_ID_HERE',
--   'RESTAURANT_ID_HERE'
-- );

-- ============================================================================
-- 6. Data Integrity Checks
-- ============================================================================

SELECT '=== DATA INTEGRITY CHECKS ===' as test_section;

-- Check for orphaned purchase order items (no valid PO)
SELECT
  'Orphaned PO items' as check_name,
  COUNT(*)::text as count
FROM purchase_order_items poi
LEFT JOIN purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.id IS NULL;

-- Check for order items with quantity_on_po > quantity
SELECT
  'Invalid quantity_on_po' as check_name,
  COUNT(*)::text as count
FROM restaurant_order_items
WHERE quantity_on_po > quantity;

-- Check for PO items with quantity_received > quantity_ordered
SELECT
  'Invalid quantity_received (PO)' as check_name,
  COUNT(*)::text as count
FROM purchase_order_items
WHERE quantity_received > quantity_ordered;

-- Check for vendors without restaurant_id
SELECT
  'Vendors without restaurant' as check_name,
  COUNT(*)::text as count
FROM vendors
WHERE restaurant_id IS NULL;

-- ============================================================================
-- 7. Performance Check
-- ============================================================================

SELECT '=== PERFORMANCE CHECK ===' as test_section;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'restaurant_orders',
    'restaurant_order_items',
    'purchase_orders',
    'purchase_order_items',
    'vendors',
    'ingredient_vendor_mapping',
    'restaurant_inventory',
    'ingredient_library'
  )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '=== VERIFICATION COMPLETE ===' as summary;

SELECT
  'All checks above should show ✅ PASS' as instruction,
  'If any show ❌ FAIL, review migration files' as action,
  'Orphaned/Invalid data counts should be 0' as data_quality;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

-- If all checks pass:
-- 1. Test API endpoints using api-test-script.js
-- 2. Follow MANUAL-TESTING-GUIDE.md for frontend testing
-- 3. Document any bugs in PHASE3-TEST-PLAN.md
-- ============================================================================
