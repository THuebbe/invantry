-- ============================================================================
-- INVANTRY TEST DATA RESEEDING SCRIPT
-- ============================================================================
-- Purpose: Wipe and reseed all test data for user fakeemail@fake.net
-- User ID: 0a55eb9c-1fa1-45d4-be38-c736b61bdd1e
-- Created: 2025-11-27
--
-- ⚠️  WARNING: This script will DELETE ALL DATA for the specified user!
-- ⚠️  Make sure migration-009-package-quantities.sql has been run first!
--
-- WHAT THIS SCRIPT DOES:
-- 1. Deletes all existing data for test user (preserves user/business/restaurant structure)
-- 2. Seeds 33 realistic ingredients with package quantities
-- 3. Creates 3 vendors (Sysco, US Foods, Gordon Food Service)
-- 4. Maps ingredients to vendors with pricing
-- 5. Creates realistic inventory (30% below par for testing)
--
-- EXECUTION TIME: ~30-60 seconds
-- ============================================================================

-- ============================================================================
-- CONFIGURATION - Verify these values before running!
-- ============================================================================

DO $$
DECLARE
    v_user_id TEXT := '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e';
    v_business_id UUID;
    v_restaurant_id UUID;
    v_user_email TEXT;

    -- Vendor IDs (will be set during vendor creation)
    v_sysco_id UUID;
    v_usfoods_id UUID;
    v_gfs_id UUID;

    -- Ingredient IDs (will be generated)
    v_ingredient_ids UUID[];

    -- Order and PO IDs
    v_order_ids UUID[];
    v_po_ids UUID[];

BEGIN
    -- ========================================================================
    -- STEP 1: VALIDATE USER EXISTS
    -- ========================================================================

    RAISE NOTICE '========================================';
    RAISE NOTICE 'INVANTRY TEST DATA RESEEDING';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Get user details
    SELECT u."businessId", u.email
    INTO v_business_id, v_user_email
    FROM users u
    WHERE u.id = v_user_id;

    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'User % not found! Please check the user ID.', v_user_id;
    END IF;

    RAISE NOTICE 'User found: % (%)', v_user_email, v_user_id;
    RAISE NOTICE 'Business ID: %', v_business_id;

    -- Get restaurant ID
    SELECT id INTO v_restaurant_id
    FROM restaurants
    WHERE business_id = v_business_id
    LIMIT 1;

    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'No restaurant found for business %', v_business_id;
    END IF;

    RAISE NOTICE 'Restaurant ID: %', v_restaurant_id;
    RAISE NOTICE '';

    -- ========================================================================
    -- STEP 2: DATA CLEANUP
    -- ========================================================================

    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 2: CLEANING UP OLD DATA';
    RAISE NOTICE '========================================';

    -- Delete in correct order to respect foreign keys
    RAISE NOTICE 'Deleting waste_log...';
    DELETE FROM waste_log WHERE restaurant_id = v_restaurant_id;

    RAISE NOTICE 'Deleting recipe_ingredients...';
    DELETE FROM recipe_ingredients
    WHERE menu_item_id IN (SELECT id FROM menu_items WHERE restaurant_id = v_restaurant_id);

    RAISE NOTICE 'Deleting menu_items...';
    DELETE FROM menu_items WHERE restaurant_id = v_restaurant_id;

    RAISE NOTICE 'Deleting restaurant_order_items...';
    DELETE FROM restaurant_order_items
    WHERE order_id IN (SELECT id FROM restaurant_orders WHERE restaurant_id = v_restaurant_id);

    RAISE NOTICE 'Deleting restaurant_orders...';
    DELETE FROM restaurant_orders WHERE restaurant_id = v_restaurant_id;

    RAISE NOTICE 'Deleting purchase_order_items...';
    DELETE FROM purchase_order_items
    WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE restaurant_id = v_restaurant_id);

    RAISE NOTICE 'Deleting purchase_orders...';
    DELETE FROM purchase_orders WHERE restaurant_id = v_restaurant_id;

    RAISE NOTICE 'Deleting ingredient_vendor_mapping (THIS RESTAURANT)...';
    DELETE FROM ingredient_vendor_mapping
    WHERE vendor_id IN (SELECT id FROM vendors WHERE restaurant_id = v_restaurant_id);

    RAISE NOTICE 'Deleting vendors...';
    DELETE FROM vendors WHERE restaurant_id = v_restaurant_id;

    RAISE NOTICE 'Deleting restaurant_inventory (THIS RESTAURANT)...';
    DELETE FROM restaurant_inventory WHERE restaurant_id = v_restaurant_id;

    -- Now delete ALL records from shared tables to allow ingredient_library deletion
    RAISE NOTICE 'WARNING: Deleting ALL data that references ingredient_library...';
    RAISE NOTICE 'This affects ALL restaurants in the database!';
    RAISE NOTICE '';

    RAISE NOTICE 'Deleting ALL recipe_ingredients...';
    DELETE FROM recipe_ingredients;

    RAISE NOTICE 'Deleting ALL restaurant_order_items...';
    DELETE FROM restaurant_order_items;

    RAISE NOTICE 'Deleting ALL purchase_order_items...';
    DELETE FROM purchase_order_items;

    RAISE NOTICE 'Deleting ALL inventory_deductions...';
    DELETE FROM inventory_deductions;

    RAISE NOTICE 'Deleting ALL ingredient_vendor_mapping...';
    DELETE FROM ingredient_vendor_mapping;

    RAISE NOTICE 'Deleting ALL restaurant_inventory...';
    DELETE FROM restaurant_inventory;

    RAISE NOTICE 'Deleting ingredient_library...';
    DELETE FROM ingredient_library;

    RAISE NOTICE '✅ Cleanup complete!';
    RAISE NOTICE '';

    -- ========================================================================
    -- STEP 3: SEED INGREDIENT LIBRARY (33 ingredients)
    -- ========================================================================

    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 3: SEEDING INGREDIENT LIBRARY';
    RAISE NOTICE '========================================';

    -- PRODUCE (8 items)
    INSERT INTO ingredient_library (name, category, subcategory, unit, storage_type, shelf_life_days, package_quantity, item_quantity, item_uom, barcode, is_platform, created_by)
    VALUES
        ('Tomatoes (Roma)', 'Produce', 'Vegetables', 'lbs', 'refrigerated', 7, 1, 25, 'lbs', '001234567890', true, v_user_id),
        ('Lettuce (Romaine)', 'Produce', 'Vegetables', 'lbs', 'refrigerated', 5, 1, 20, 'lbs', '001234567891', true, v_user_id),
        ('Onions (Yellow)', 'Produce', 'Vegetables', 'lbs', 'dry', 14, 1, 50, 'lbs', '001234567892', true, v_user_id),
        ('Bell Peppers (Mixed)', 'Produce', 'Vegetables', 'lbs', 'refrigerated', 7, 1, 15, 'lbs', '001234567893', true, v_user_id),
        ('Mushrooms (Button)', 'Produce', 'Vegetables', 'lbs', 'refrigerated', 5, 1, 10, 'lbs', '001234567894', true, v_user_id),
        ('Carrots', 'Produce', 'Vegetables', 'lbs', 'refrigerated', 14, 1, 25, 'lbs', '001234567895', true, v_user_id),
        ('Celery', 'Produce', 'Vegetables', 'lbs', 'refrigerated', 7, 1, 15, 'lbs', '001234567896', true, v_user_id),
        ('Potatoes (Russet)', 'Produce', 'Vegetables', 'lbs', 'dry', 30, 1, 50, 'lbs', '001234567897', true, v_user_id);

    -- PROTEIN (7 items)
    INSERT INTO ingredient_library (name, category, subcategory, unit, storage_type, shelf_life_days, package_quantity, item_quantity, item_uom, barcode, is_platform, created_by)
    VALUES
        ('Chicken Breast (Boneless)', 'Protein', 'Poultry', 'lbs', 'refrigerated', 5, 2, 5, 'lbs', '002234567890', true, v_user_id),
        ('Ground Beef (80/20)', 'Protein', 'Beef', 'lbs', 'frozen', 90, 4, 5, 'lbs', '002234567891', true, v_user_id),
        ('Salmon Fillets (Atlantic)', 'Protein', 'Seafood', 'lbs', 'refrigerated', 3, 1, 10, 'lbs', '002234567892', true, v_user_id),
        ('Shrimp (31/40 ct)', 'Protein', 'Seafood', 'lbs', 'frozen', 180, 1, 5, 'lbs', '002234567893', true, v_user_id),
        ('Pork Chops (Center Cut)', 'Protein', 'Pork', 'lbs', 'refrigerated', 5, 1, 15, 'lbs', '002234567894', true, v_user_id),
        ('Bacon (Applewood Smoked)', 'Protein', 'Pork', 'lbs', 'refrigerated', 14, 12, 1, 'lbs', '002234567895', true, v_user_id),
        ('Eggs (Large)', 'Protein', 'Eggs', 'dozen', 'refrigerated', 21, 15, 12, 'eggs', '002234567896', true, v_user_id);

    -- DAIRY (5 items)
    INSERT INTO ingredient_library (name, category, subcategory, unit, storage_type, shelf_life_days, package_quantity, item_quantity, item_uom, barcode, is_platform, created_by)
    VALUES
        ('Milk (Whole)', 'Dairy', 'Milk', 'gal', 'refrigerated', 14, 4, 1, 'gal', '003234567890', true, v_user_id),
        ('Butter (Unsalted)', 'Dairy', 'Butter', 'lbs', 'refrigerated', 30, 1, 30, 'lbs', '003234567891', true, v_user_id),
        ('Cheddar Cheese (Sharp)', 'Dairy', 'Cheese', 'lbs', 'refrigerated', 60, 1, 10, 'lbs', '003234567892', true, v_user_id),
        ('Mozzarella Cheese (Low Moisture)', 'Dairy', 'Cheese', 'lbs', 'refrigerated', 45, 6, 5, 'lbs', '003234567893', true, v_user_id),
        ('Heavy Cream', 'Dairy', 'Cream', 'qt', 'refrigerated', 14, 12, 1, 'qt', '003234567894', true, v_user_id);

    -- DRY GOODS (6 items)
    INSERT INTO ingredient_library (name, category, subcategory, unit, storage_type, shelf_life_days, package_quantity, item_quantity, item_uom, barcode, is_platform, created_by)
    VALUES
        ('All-Purpose Flour', 'Dry Goods', 'Baking', 'lbs', 'dry', 365, 1, 50, 'lbs', '004234567890', true, v_user_id),
        ('White Rice (Long Grain)', 'Dry Goods', 'Grains', 'lbs', 'dry', 365, 1, 25, 'lbs', '004234567891', true, v_user_id),
        ('Pasta (Penne)', 'Dry Goods', 'Pasta', 'lbs', 'dry', 365, 1, 20, 'lbs', '004234567892', true, v_user_id),
        ('Bread (Hamburger Buns)', 'Dry Goods', 'Bread', 'dozen', 'dry', 7, 6, 12, 'buns', '004234567893', true, v_user_id),
        ('Panko Bread Crumbs', 'Dry Goods', 'Baking', 'lbs', 'dry', 180, 1, 5, 'lbs', '004234567894', true, v_user_id),
        ('Cornmeal (Yellow)', 'Dry Goods', 'Baking', 'lbs', 'dry', 180, 1, 10, 'lbs', '004234567895', true, v_user_id);

    -- CONDIMENTS/OILS (5 items)
    INSERT INTO ingredient_library (name, category, subcategory, unit, storage_type, shelf_life_days, package_quantity, item_quantity, item_uom, barcode, is_platform, created_by)
    VALUES
        ('Olive Oil (Extra Virgin)', 'Condiments', 'Oils', 'ml', 'dry', 365, 6, 750, 'ml', '005234567890', true, v_user_id),
        ('Vegetable Oil', 'Condiments', 'Oils', 'gal', 'dry', 365, 1, 1, 'gal', '005234567891', true, v_user_id),
        ('Salt (Kosher)', 'Condiments', 'Spices', 'lbs', 'dry', 730, 1, 3, 'lbs', '005234567892', true, v_user_id),
        ('Black Pepper (Ground)', 'Condiments', 'Spices', 'oz', 'dry', 365, 1, 16, 'oz', '005234567893', true, v_user_id),
        ('Garlic Powder', 'Condiments', 'Spices', 'oz', 'dry', 365, 1, 16, 'oz', '005234567894', true, v_user_id);

    -- BEVERAGES (2 items)
    INSERT INTO ingredient_library (name, category, subcategory, unit, storage_type, shelf_life_days, package_quantity, item_quantity, item_uom, barcode, is_platform, created_by)
    VALUES
        ('Coffee Beans (Whole Bean)', 'Beverages', 'Coffee', 'lbs', 'dry', 90, 1, 5, 'lbs', '006234567890', true, v_user_id),
        ('Orange Juice (Fresh Squeezed)', 'Beverages', 'Juice', 'gal', 'refrigerated', 7, 4, 1, 'gal', '006234567891', true, v_user_id);

    RAISE NOTICE '✅ Seeded 33 ingredients with package quantities';
    RAISE NOTICE '';

    -- Store ingredient IDs for later use
    SELECT ARRAY_AGG(id ORDER BY name) INTO v_ingredient_ids FROM ingredient_library;

    -- ========================================================================
    -- STEP 4: SEED VENDORS
    -- ========================================================================

    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 4: SEEDING VENDORS';
    RAISE NOTICE '========================================';

    -- Sysco Corporation
    INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
    VALUES (v_restaurant_id, 'Sysco Corporation', 'Sales Department', '1-800-967-9726', 'orders@sysco.com', 'Net 30', true)
    RETURNING id INTO v_sysco_id;

    RAISE NOTICE 'Created Sysco Corporation (ID: %)', v_sysco_id;

    -- US Foods
    INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
    VALUES (v_restaurant_id, 'US Foods', 'Sales Department', '1-877-879-3663', 'orders@usfoods.com', 'Net 30', true)
    RETURNING id INTO v_usfoods_id;

    RAISE NOTICE 'Created US Foods (ID: %)', v_usfoods_id;

    -- Gordon Food Service
    INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
    VALUES (v_restaurant_id, 'Gordon Food Service', 'Sales Department', '1-866-236-4673', 'orders@gfs.com', 'Net 30', true)
    RETURNING id INTO v_gfs_id;

    RAISE NOTICE 'Created Gordon Food Service (ID: %)', v_gfs_id;
    RAISE NOTICE '✅ Seeded 3 vendors';
    RAISE NOTICE '';

    -- ========================================================================
    -- STEP 5: MAP INGREDIENTS TO VENDORS
    -- ========================================================================

    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 5: MAPPING INGREDIENTS TO VENDORS';
    RAISE NOTICE '========================================';

    -- Map all produce to US Foods (preferred)
    INSERT INTO ingredient_vendor_mapping (ingredient_id, vendor_id, is_preferred, vendor_item_number, unit_cost, lead_time_days, package_quantity, item_quantity, item_uom)
    SELECT
        il.id,
        v_usfoods_id,
        true,
        'USF-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 6, '0'),
        CASE
            WHEN il.name LIKE '%Tomatoes%' THEN 35.00
            WHEN il.name LIKE '%Lettuce%' THEN 28.00
            WHEN il.name LIKE '%Onions%' THEN 22.00
            WHEN il.name LIKE '%Peppers%' THEN 32.00
            WHEN il.name LIKE '%Mushrooms%' THEN 38.00
            WHEN il.name LIKE '%Carrots%' THEN 20.00
            WHEN il.name LIKE '%Celery%' THEN 24.00
            WHEN il.name LIKE '%Potatoes%' THEN 18.00
        END,
        2,
        il.package_quantity,
        il.item_quantity,
        il.item_uom
    FROM ingredient_library il
    WHERE il.category = 'Produce';

    -- Map proteins to Sysco (preferred) and US Foods (alternate)
    INSERT INTO ingredient_vendor_mapping (ingredient_id, vendor_id, is_preferred, vendor_item_number, unit_cost, lead_time_days, package_quantity, item_quantity, item_uom)
    SELECT
        il.id,
        v_sysco_id,
        true,
        'SYS-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 6, '0'),
        CASE
            WHEN il.name LIKE '%Chicken%' THEN 45.00
            WHEN il.name LIKE '%Ground Beef%' THEN 95.00
            WHEN il.name LIKE '%Salmon%' THEN 120.00
            WHEN il.name LIKE '%Shrimp%' THEN 65.00
            WHEN il.name LIKE '%Pork%' THEN 55.00
            WHEN il.name LIKE '%Bacon%' THEN 48.00
            WHEN il.name LIKE '%Eggs%' THEN 42.00
        END,
        1,
        il.package_quantity,
        il.item_quantity,
        il.item_uom
    FROM ingredient_library il
    WHERE il.category = 'Protein';

    -- Map dairy to Sysco (preferred)
    INSERT INTO ingredient_vendor_mapping (ingredient_id, vendor_id, is_preferred, vendor_item_number, unit_cost, lead_time_days, package_quantity, item_quantity, item_uom)
    SELECT
        il.id,
        v_sysco_id,
        true,
        'SYS-' || LPAD((ROW_NUMBER() OVER () + 100)::TEXT, 6, '0'),
        CASE
            WHEN il.name LIKE '%Milk%' THEN 16.00
            WHEN il.name LIKE '%Butter%' THEN 85.00
            WHEN il.name LIKE '%Cheddar%' THEN 42.00
            WHEN il.name LIKE '%Mozzarella%' THEN 135.00
            WHEN il.name LIKE '%Cream%' THEN 32.00
        END,
        1,
        il.package_quantity,
        il.item_quantity,
        il.item_uom
    FROM ingredient_library il
    WHERE il.category = 'Dairy';

    -- Map dry goods to Gordon Food Service (preferred)
    INSERT INTO ingredient_vendor_mapping (ingredient_id, vendor_id, is_preferred, vendor_item_number, unit_cost, lead_time_days, package_quantity, item_quantity, item_uom)
    SELECT
        il.id,
        v_gfs_id,
        true,
        'GFS-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 6, '0'),
        CASE
            WHEN il.name LIKE '%Flour%' THEN 22.00
            WHEN il.name LIKE '%Rice%' THEN 28.00
            WHEN il.name LIKE '%Pasta%' THEN 24.00
            WHEN il.name LIKE '%Bread%' THEN 18.00
            WHEN il.name LIKE '%Panko%' THEN 15.00
            WHEN il.name LIKE '%Cornmeal%' THEN 12.00
        END,
        3,
        il.package_quantity,
        il.item_quantity,
        il.item_uom
    FROM ingredient_library il
    WHERE il.category = 'Dry Goods';

    -- Map condiments/oils to Gordon Food Service (preferred)
    INSERT INTO ingredient_vendor_mapping (ingredient_id, vendor_id, is_preferred, vendor_item_number, unit_cost, lead_time_days, package_quantity, item_quantity, item_uom)
    SELECT
        il.id,
        v_gfs_id,
        true,
        'GFS-' || LPAD((ROW_NUMBER() OVER () + 100)::TEXT, 6, '0'),
        CASE
            WHEN il.name LIKE '%Olive Oil%' THEN 45.00
            WHEN il.name LIKE '%Vegetable Oil%' THEN 12.00
            WHEN il.name LIKE '%Salt%' THEN 8.00
            WHEN il.name LIKE '%Pepper%' THEN 14.00
            WHEN il.name LIKE '%Garlic%' THEN 12.00
        END,
        2,
        il.package_quantity,
        il.item_quantity,
        il.item_uom
    FROM ingredient_library il
    WHERE il.category = 'Condiments';

    -- Map beverages to Sysco (preferred)
    INSERT INTO ingredient_vendor_mapping (ingredient_id, vendor_id, is_preferred, vendor_item_number, unit_cost, lead_time_days, package_quantity, item_quantity, item_uom)
    SELECT
        il.id,
        v_sysco_id,
        true,
        'SYS-' || LPAD((ROW_NUMBER() OVER () + 200)::TEXT, 6, '0'),
        CASE
            WHEN il.name LIKE '%Coffee%' THEN 35.00
            WHEN il.name LIKE '%Orange Juice%' THEN 18.00
        END,
        2,
        il.package_quantity,
        il.item_quantity,
        il.item_uom
    FROM ingredient_library il
    WHERE il.category = 'Beverages';

    RAISE NOTICE '✅ Mapped all ingredients to vendors with pricing';
    RAISE NOTICE '';

    -- ========================================================================
    -- STEP 6: SEED RESTAURANT INVENTORY
    -- ========================================================================

    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 6: SEEDING RESTAURANT INVENTORY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Strategy: 30%% below par, 40%% at par, 30%% above par';
    RAISE NOTICE '';

    -- Seed realistic inventory levels with varied expiration dates
    WITH inventory_data AS (
        SELECT
            il.id as ingredient_id,
            il.name,
            il.unit,
            il.package_quantity,
            il.item_quantity,
            il.item_uom,
            il.shelf_life_days,
            ivm.unit_cost,
            CASE
                -- High-volume items (proteins, produce)
                WHEN il.category IN ('Protein', 'Produce') THEN
                    CASE
                        WHEN ROW_NUMBER() OVER (PARTITION BY il.category ORDER BY RANDOM()) <= 2 THEN 40 -- below par
                        WHEN ROW_NUMBER() OVER (PARTITION BY il.category ORDER BY RANDOM()) <= 5 THEN 50 -- at par
                        ELSE 60 -- above par
                    END
                -- Medium-volume items (dairy, dry goods)
                WHEN il.category IN ('Dairy', 'Dry Goods') THEN
                    CASE
                        WHEN ROW_NUMBER() OVER (PARTITION BY il.category ORDER BY RANDOM()) <= 1 THEN 15
                        WHEN ROW_NUMBER() OVER (PARTITION BY il.category ORDER BY RANDOM()) <= 3 THEN 20
                        ELSE 30
                    END
                -- Low-volume items (condiments, beverages)
                ELSE
                    CASE
                        WHEN ROW_NUMBER() OVER (PARTITION BY il.category ORDER BY RANDOM()) <= 1 THEN 5
                        ELSE 10
                    END
            END as minimum_quantity
        FROM ingredient_library il
        JOIN ingredient_vendor_mapping ivm ON il.id = ivm.ingredient_id AND ivm.is_preferred = true
    )
    INSERT INTO restaurant_inventory (
        restaurant_id,
        ingredient_id,
        quantity,
        unit,
        minimum_quantity,
        cost_per_unit,
        package_quantity,
        item_quantity,
        item_uom,
        expiration_date,
        location
    )
    SELECT
        v_restaurant_id,
        ingredient_id,
        -- Current quantity (varied for testing)
        CASE
            WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) <= 9 THEN minimum_quantity * 0.6 -- 30% below par
            WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) <= 21 THEN minimum_quantity * 1.0 -- 40% at par
            ELSE minimum_quantity * 1.4 -- 30% above par
        END,
        unit,
        minimum_quantity,
        unit_cost,
        package_quantity,
        item_quantity,
        item_uom,
        -- Expiration dates varied based on shelf life
        CURRENT_DATE + (shelf_life_days * RANDOM())::INTEGER,
        CASE
            WHEN name LIKE ANY(ARRAY['%Frozen%', '%Shrimp%', '%Ground Beef%']) THEN 'Freezer'
            WHEN name LIKE ANY(ARRAY['%Milk%', '%Cheese%', '%Chicken%', '%Lettuce%']) THEN 'Walk-in Cooler'
            ELSE 'Dry Storage'
        END
    FROM inventory_data;

    RAISE NOTICE '✅ Seeded 33 inventory items with realistic stock levels';
    RAISE NOTICE '';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATA RESEEDING COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - 33 ingredients with package quantities';
    RAISE NOTICE '  - 3 vendors (Sysco, US Foods, GFS)';
    RAISE NOTICE '  - 33 ingredient-vendor mappings';
    RAISE NOTICE '  - 33 inventory items (varied stock levels)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Run VALIDATION_QUERIES.sql to verify data';
    RAISE NOTICE '  2. Login as % to test', v_user_email;
    RAISE NOTICE '  3. Navigate to Inventory page to see fresh data';
    RAISE NOTICE '  4. Test "Populate Lines" in Orders';
    RAISE NOTICE '';

END $$;
