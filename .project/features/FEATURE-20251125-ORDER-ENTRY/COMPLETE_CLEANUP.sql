-- ============================================================================
-- COMPLETE CLEANUP - Nuclear option
-- ============================================================================
-- This will delete ALL restaurant-related data from ALL restaurants
-- Use this if you want a completely fresh start
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COMPLETE DATABASE CLEANUP';
    RAISE NOTICE 'Deleting ALL restaurant data!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Delete ALL data (not just test user)
    RAISE NOTICE 'Deleting ALL waste_log...';
    DELETE FROM waste_log;

    RAISE NOTICE 'Deleting ALL recipe_ingredients...';
    DELETE FROM recipe_ingredients;

    RAISE NOTICE 'Deleting ALL menu_items...';
    DELETE FROM menu_items;

    RAISE NOTICE 'Deleting ALL restaurant_order_items...';
    DELETE FROM restaurant_order_items;

    RAISE NOTICE 'Deleting ALL restaurant_orders...';
    DELETE FROM restaurant_orders;

    RAISE NOTICE 'Deleting ALL purchase_order_items...';
    DELETE FROM purchase_order_items;

    RAISE NOTICE 'Deleting ALL purchase_orders...';
    DELETE FROM purchase_orders;

    RAISE NOTICE 'Deleting ALL inventory_deductions...';
    DELETE FROM inventory_deductions;

    RAISE NOTICE 'Deleting ALL ingredient_vendor_mapping...';
    DELETE FROM ingredient_vendor_mapping;

    RAISE NOTICE 'Deleting ALL vendors...';
    DELETE FROM vendors;

    RAISE NOTICE 'Deleting ALL restaurant_inventory...';
    DELETE FROM restaurant_inventory;

    RAISE NOTICE 'Deleting ALL ingredient_library...';
    DELETE FROM ingredient_library;

    RAISE NOTICE '';
    RAISE NOTICE '✅ COMPLETE CLEANUP DONE!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run RESEED_TEST_DATA.sql';
    RAISE NOTICE '';

END $$;
