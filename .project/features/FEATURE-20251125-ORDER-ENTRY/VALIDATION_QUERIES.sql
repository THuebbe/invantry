-- ============================================================================
-- VALIDATION QUERIES - Test Data Reseeding
-- ============================================================================
-- Purpose: Verify that RESEED_TEST_DATA.sql executed successfully
-- Run these queries after reseeding to confirm data integrity
-- ============================================================================

-- ============================================================================
-- 1. DATA COUNTS
-- ============================================================================

SELECT '========== DATA COUNTS ==========' as section;

SELECT
    'ingredient_library' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) = 33 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM ingredient_library;

SELECT
    'vendors' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM vendors
WHERE restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

SELECT
    'ingredient_vendor_mapping' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) >= 33 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM ingredient_vendor_mapping;

SELECT
    'restaurant_inventory' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) = 33 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM restaurant_inventory
WHERE restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

-- ============================================================================
-- 2. PACKAGE QUANTITIES VALIDATION
-- ============================================================================

SELECT '========== PACKAGE QUANTITIES ==========' as section;

SELECT
    'Ingredients with package data' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 33 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM ingredient_library
WHERE package_quantity IS NOT NULL
  AND item_quantity IS NOT NULL
  AND item_uom IS NOT NULL;

-- Show sample package quantities
SELECT
    'Sample: ' || name as ingredient,
    package_quantity || ' × ' || item_quantity || ' ' || item_uom as packaging,
    (package_quantity * item_quantity)::NUMERIC(10,2) || ' ' || COALESCE(item_uom, unit) as total_quantity
FROM ingredient_library
ORDER BY category, name
LIMIT 10;

-- ============================================================================
-- 3. VENDOR MAPPINGS
-- ============================================================================

SELECT '========== VENDOR MAPPINGS ==========' as section;

SELECT
    v.name as vendor_name,
    COUNT(ivm.id) as ingredients_mapped,
    COUNT(CASE WHEN ivm.is_preferred THEN 1 END) as preferred_count
FROM vendors v
LEFT JOIN ingredient_vendor_mapping ivm ON v.id = ivm.vendor_id
WHERE v.restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
)
GROUP BY v.name
ORDER BY v.name;

-- ============================================================================
-- 4. INVENTORY LEVELS
-- ============================================================================

SELECT '========== INVENTORY LEVELS ==========' as section;

SELECT
    'Below Par (<80%)' as level,
    COUNT(*) as count
FROM restaurant_inventory
WHERE quantity < (minimum_quantity * 0.8)
  AND restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

SELECT
    'At Par (80-120%)' as level,
    COUNT(*) as count
FROM restaurant_inventory
WHERE quantity BETWEEN (minimum_quantity * 0.8) AND (minimum_quantity * 1.2)
  AND restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

SELECT
    'Above Par (>120%)' as level,
    COUNT(*) as count
FROM restaurant_inventory
WHERE quantity > (minimum_quantity * 1.2)
  AND restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

-- Low stock items (should trigger "Populate Lines")
SELECT
    il.name,
    ri.quantity,
    ri.minimum_quantity,
    ri.unit,
    ROUND(((ri.minimum_quantity * 2) - ri.quantity)::NUMERIC, 2) as suggested_order_qty
FROM restaurant_inventory ri
JOIN ingredient_library il ON ri.ingredient_id = il.id
WHERE ri.quantity < ri.minimum_quantity
  AND ri.restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
)
ORDER BY (ri.quantity / NULLIF(ri.minimum_quantity, 0)) ASC
LIMIT 10;

-- ============================================================================
-- 5. EXPIRATION DATES
-- ============================================================================

SELECT '========== EXPIRATION DATES ==========' as section;

SELECT
    'Expiring Soon (1-7 days)' as expiration_range,
    COUNT(*) as count
FROM restaurant_inventory
WHERE expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

SELECT
    'Short-term (8-30 days)' as expiration_range,
    COUNT(*) as count
FROM restaurant_inventory
WHERE expiration_date BETWEEN CURRENT_DATE + INTERVAL '8 days' AND CURRENT_DATE + INTERVAL '30 days'
  AND restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

SELECT
    'Medium-term (31-60 days)' as expiration_range,
    COUNT(*) as count
FROM restaurant_inventory
WHERE expiration_date BETWEEN CURRENT_DATE + INTERVAL '31 days' AND CURRENT_DATE + INTERVAL '60 days'
  AND restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

SELECT
    'Long-term (61-90 days)' as expiration_range,
    COUNT(*) as count
FROM restaurant_inventory
WHERE expiration_date BETWEEN CURRENT_DATE + INTERVAL '61 days' AND CURRENT_DATE + INTERVAL '90 days'
  AND restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

-- ============================================================================
-- 6. DATA INTEGRITY CHECKS
-- ============================================================================

SELECT '========== DATA INTEGRITY ==========' as section;

-- Check for orphaned inventory (no ingredient)
SELECT
    'Orphaned inventory items' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM restaurant_inventory ri
LEFT JOIN ingredient_library il ON ri.ingredient_id = il.id
WHERE il.id IS NULL;

-- Check for missing vendor mappings
SELECT
    'Ingredients without vendor' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM ingredient_library il
LEFT JOIN ingredient_vendor_mapping ivm ON il.id = ivm.ingredient_id
WHERE ivm.id IS NULL;

-- Check for duplicate preferred vendors
SELECT
    'Ingredients with multiple preferred vendors' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM (
    SELECT ingredient_id
    FROM ingredient_vendor_mapping
    WHERE is_preferred = true
    GROUP BY ingredient_id
    HAVING COUNT(*) > 1
) duplicates;

-- Check for negative quantities
SELECT
    'Negative inventory quantities' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM restaurant_inventory
WHERE quantity < 0;

-- Check for negative costs
SELECT
    'Negative costs' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM restaurant_inventory
WHERE cost_per_unit < 0;

-- ============================================================================
-- 7. SUMMARY REPORT
-- ============================================================================

SELECT '========== SUMMARY ==========' as section;

SELECT
    'Test User' as detail,
    email as value
FROM users
WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e';

SELECT
    'Restaurant' as detail,
    r.business_name as value
FROM restaurants r
WHERE r.business_id = (
    SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
)
LIMIT 1;

SELECT
    'Total Ingredients' as detail,
    COUNT(*)::TEXT as value
FROM ingredient_library;

SELECT
    'Total Vendors' as detail,
    COUNT(*)::TEXT as value
FROM vendors
WHERE restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

SELECT
    'Inventory Value' as detail,
    '$' || ROUND(SUM(quantity * cost_per_unit)::NUMERIC, 2)::TEXT as value
FROM restaurant_inventory
WHERE restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

SELECT
    'Items Below Par' as detail,
    COUNT(*)::TEXT || ' items need reordering' as value
FROM restaurant_inventory
WHERE quantity < minimum_quantity
  AND restaurant_id IN (
    SELECT id FROM restaurants WHERE business_id = (
        SELECT "businessId" FROM users WHERE id = '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e'
    )
);

-- ============================================================================
-- END OF VALIDATION
-- ============================================================================

SELECT '========================================' as section;
SELECT 'VALIDATION COMPLETE' as section;
SELECT 'All checks should show ✅ PASS' as section;
SELECT 'If any show ❌ FAIL, review RESEED_TEST_DATA.sql' as section;
SELECT '========================================' as section;
