-- ============================================================================
-- SAFE RESEEDING - Only affects test user's data
-- ============================================================================
-- This version DOES NOT delete shared ingredient_library
-- Instead, it only reseeds vendor and inventory data for the test user
-- ============================================================================

DO $$
DECLARE
    v_user_id TEXT := '0a55eb9c-1fa1-45d4-be38-c736b61bdd1e';
    v_business_id UUID;
    v_restaurant_id UUID;
    v_user_email TEXT;
    v_sysco_id UUID;
    v_usfoods_id UUID;
    v_gfs_id UUID;

BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAFE RESEEDING - Test User Only';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Get user details
    SELECT u."businessId", u.email
    INTO v_business_id, v_user_email
    FROM users u
    WHERE u.id = v_user_id;

    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'User % not found!', v_user_id;
    END IF;

    SELECT id INTO v_restaurant_id
    FROM restaurants
    WHERE business_id = v_business_id
    LIMIT 1;

    RAISE NOTICE 'User: %', v_user_email;
    RAISE NOTICE 'Restaurant ID: %', v_restaurant_id;
    RAISE NOTICE '';

    -- Delete only test user's data
    RAISE NOTICE 'Deleting test user data only...';
    DELETE FROM waste_log WHERE restaurant_id = v_restaurant_id;
    DELETE FROM recipe_ingredients WHERE menu_item_id IN (SELECT id FROM menu_items WHERE restaurant_id = v_restaurant_id);
    DELETE FROM menu_items WHERE restaurant_id = v_restaurant_id;
    DELETE FROM restaurant_order_items WHERE order_id IN (SELECT id FROM restaurant_orders WHERE restaurant_id = v_restaurant_id);
    DELETE FROM restaurant_orders WHERE restaurant_id = v_restaurant_id;
    DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE restaurant_id = v_restaurant_id);
    DELETE FROM purchase_orders WHERE restaurant_id = v_restaurant_id;
    DELETE FROM ingredient_vendor_mapping WHERE vendor_id IN (SELECT id FROM vendors WHERE restaurant_id = v_restaurant_id);
    DELETE FROM vendors WHERE restaurant_id = v_restaurant_id;
    DELETE FROM restaurant_inventory WHERE restaurant_id = v_restaurant_id;

    RAISE NOTICE '✅ Cleanup complete!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NOTE: ingredient_library was NOT deleted (shared table)';
    RAISE NOTICE '   Using existing ingredients for reseeding';
    RAISE NOTICE '';

    -- Reseed vendors (same as full script)
    RAISE NOTICE 'Seeding vendors...';
    INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
    VALUES (v_restaurant_id, 'Sysco Corporation', 'Sales Department', '1-800-967-9726', 'orders@sysco.com', 'Net 30', true)
    RETURNING id INTO v_sysco_id;

    INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
    VALUES (v_restaurant_id, 'US Foods', 'Sales Department', '1-877-879-3663', 'orders@usfoods.com', 'Net 30', true)
    RETURNING id INTO v_usfoods_id;

    INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
    VALUES (v_restaurant_id, 'Gordon Food Service', 'Sales Department', '1-866-236-4673', 'orders@gfs.com', 'Net 30', true)
    RETURNING id INTO v_gfs_id;

    RAISE NOTICE '✅ Created 3 vendors';
    RAISE NOTICE '';

    -- Map existing ingredients to vendors
    RAISE NOTICE 'Mapping ingredients to vendors...';
    INSERT INTO ingredient_vendor_mapping (ingredient_id, vendor_id, is_preferred, vendor_item_number, unit_cost, lead_time_days)
    SELECT
        il.id,
        CASE
            WHEN il.category = 'Produce' THEN v_usfoods_id
            WHEN il.category IN ('Protein', 'Dairy', 'Beverages') THEN v_sysco_id
            ELSE v_gfs_id
        END,
        true,
        'VND-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 6, '0'),
        RANDOM() * 50 + 10,
        (RANDOM() * 2 + 1)::INTEGER
    FROM ingredient_library il
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Mapped ingredients to vendors';
    RAISE NOTICE '';

    -- Seed inventory using existing ingredients
    RAISE NOTICE 'Seeding inventory...';
    INSERT INTO restaurant_inventory (
        restaurant_id, ingredient_id, quantity, unit, minimum_quantity,
        cost_per_unit, expiration_date, location
    )
    SELECT
        v_restaurant_id,
        il.id,
        (RANDOM() * 50 + 10)::NUMERIC(10,2),
        il.unit,
        (RANDOM() * 30 + 20)::NUMERIC(10,2),
        (RANDOM() * 30 + 5)::NUMERIC(10,2),
        CURRENT_DATE + (RANDOM() * 90)::INTEGER,
        CASE
            WHEN il.storage_type = 'frozen' THEN 'Freezer'
            WHEN il.storage_type = 'refrigerated' THEN 'Walk-in Cooler'
            ELSE 'Dry Storage'
        END
    FROM ingredient_library il
    LIMIT 30;

    RAISE NOTICE '✅ Seeded inventory';
    RAISE NOTICE '';
    RAISE NOTICE 'RESEEDING COMPLETE (SAFE MODE)!';

END $$;
