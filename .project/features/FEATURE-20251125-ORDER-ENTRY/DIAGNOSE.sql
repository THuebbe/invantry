-- Quick diagnostic queries

-- Check ingredient count
SELECT 'ingredient_library count' as check_name, COUNT(*) as count FROM ingredient_library;

-- Check vendors
SELECT 'vendors count' as check_name, COUNT(*) as count FROM vendors;

-- Check ingredient_vendor_mapping
SELECT 'ingredient_vendor_mapping count' as check_name, COUNT(*) as count FROM ingredient_vendor_mapping;

-- Check inventory
SELECT 'restaurant_inventory count' as check_name, COUNT(*) as count FROM restaurant_inventory;

-- Check if there were any errors in the seeding
-- Show what actually got created
SELECT 'Sample ingredients' as info;
SELECT id, name, package_quantity, item_quantity, item_uom FROM ingredient_library LIMIT 5;

SELECT 'Sample vendors' as info;
SELECT id, name FROM vendors LIMIT 5;

SELECT 'Sample inventory' as info;
SELECT id, ingredient_id, quantity, minimum_quantity FROM restaurant_inventory LIMIT 5;
