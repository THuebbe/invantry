-- Migration 020: Migrate existing vendor data to new schema
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Critical data migration from old vendor schema to new ERP structure
-- Created: 2025-12-29
-- Phase: 2 - Multi-Tenancy & ERP Fields
-- WARNING: This migration modifies existing data - run validation queries before and after

-- ============================================================================
-- PART 1: POPULATE ingredient_vendor_mapping.restaurant_id
-- ============================================================================

-- Display pre-migration counts for validation
DO $$
DECLARE
    total_mappings INTEGER;
    vendors_count INTEGER;
    mappings_with_restaurant_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_mappings FROM ingredient_vendor_mapping;
    SELECT COUNT(*) INTO vendors_count FROM vendors;
    SELECT COUNT(restaurant_id) INTO mappings_with_restaurant_id FROM ingredient_vendor_mapping;

    RAISE NOTICE 'PRE-MIGRATION VALIDATION:';
    RAISE NOTICE '  Total ingredient_vendor_mapping records: %', total_mappings;
    RAISE NOTICE '  Total vendors: %', vendors_count;
    RAISE NOTICE '  Mappings with restaurant_id: %', mappings_with_restaurant_id;
    RAISE NOTICE '  Expected after migration: %', total_mappings;
END $$;

-- Populate restaurant_id from associated vendor's restaurant_id
-- This is the critical step for multi-tenancy enforcement
UPDATE ingredient_vendor_mapping ivm
SET restaurant_id = v.restaurant_id
FROM vendors v
WHERE ivm.vendor_id = v.id
AND ivm.restaurant_id IS NULL;

-- Verify all records now have restaurant_id
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM ingredient_vendor_mapping
    WHERE restaurant_id IS NULL;

    SELECT COUNT(*) INTO total_count
    FROM ingredient_vendor_mapping;

    RAISE NOTICE 'POST-UPDATE VALIDATION:';
    RAISE NOTICE '  Total mappings: %', total_count;
    RAISE NOTICE '  Mappings with NULL restaurant_id: %', null_count;

    IF null_count > 0 THEN
        RAISE EXCEPTION 'Data migration failed: % records still have NULL restaurant_id', null_count;
    END IF;

    RAISE NOTICE '  ✓ All mappings successfully populated with restaurant_id';
END $$;

-- Make restaurant_id NOT NULL now that all records are populated
ALTER TABLE ingredient_vendor_mapping
ALTER COLUMN restaurant_id SET NOT NULL;

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE '✓ restaurant_id column is now NOT NULL';
END $$;

-- ============================================================================
-- PART 2: MIGRATE vendors.address (JSONB) → vendor_addresses table
-- ============================================================================

-- Insert primary addresses from vendors.address JSONB field
INSERT INTO vendor_addresses (
    vendor_id,
    restaurant_id,
    address_type,
    is_primary,
    address_line1,
    city,
    state,
    postal_code,
    country
)
SELECT
    v.id as vendor_id,
    v.restaurant_id,
    'primary' as address_type,
    true as is_primary,
    COALESCE(v.address->>'street', v.address->>'address_line1', '') as address_line1,
    COALESCE(v.address->>'city', '') as city,
    COALESCE(v.address->>'state', '') as state,
    COALESCE(v.address->>'zip', v.address->>'postal_code', '') as postal_code,
    COALESCE(v.address->>'country', 'US') as country
FROM vendors v
WHERE v.address IS NOT NULL
AND v.address != 'null'::jsonb
AND v.address::text != '{}'
-- Only insert if address doesn't already exist (idempotent)
AND NOT EXISTS (
    SELECT 1 FROM vendor_addresses va
    WHERE va.vendor_id = v.id AND va.address_type = 'primary'
);

-- Display migration results
DO $$
DECLARE
    addresses_created INTEGER;
    vendors_with_address INTEGER;
BEGIN
    SELECT COUNT(*) INTO addresses_created
    FROM vendor_addresses
    WHERE address_type = 'primary';

    SELECT COUNT(*) INTO vendors_with_address
    FROM vendors
    WHERE address IS NOT NULL
    AND address != 'null'::jsonb
    AND address::text != '{}';

    RAISE NOTICE 'ADDRESS MIGRATION:';
    RAISE NOTICE '  Vendors with address data: %', vendors_with_address;
    RAISE NOTICE '  Primary addresses created: %', addresses_created;
END $$;

-- ============================================================================
-- PART 3: MIGRATE vendors.contact_name → vendor_contacts table
-- ============================================================================

-- Split contact_name into first_name and last_name, create primary contact
INSERT INTO vendor_contacts (
    vendor_id,
    restaurant_id,
    first_name,
    last_name,
    role,
    email,
    phone,
    is_primary,
    receive_orders,
    receive_invoices
)
SELECT
    v.id as vendor_id,
    v.restaurant_id,
    -- Split contact_name: everything before last space = first_name
    CASE
        WHEN v.contact_name LIKE '% %' THEN
            TRIM(SUBSTRING(v.contact_name FROM 1 FOR LENGTH(v.contact_name) - LENGTH(SPLIT_PART(v.contact_name, ' ', ARRAY_LENGTH(STRING_TO_ARRAY(v.contact_name, ' '), 1)))))
        ELSE
            COALESCE(v.contact_name, 'Unknown')
    END as first_name,
    -- Split contact_name: last word = last_name
    CASE
        WHEN v.contact_name LIKE '% %' THEN
            SPLIT_PART(v.contact_name, ' ', ARRAY_LENGTH(STRING_TO_ARRAY(v.contact_name, ' '), 1))
        ELSE
            ''
    END as last_name,
    'Account Manager' as role,
    v.email,
    v.phone,
    true as is_primary,
    true as receive_orders,
    true as receive_invoices
FROM vendors v
WHERE v.contact_name IS NOT NULL
AND TRIM(v.contact_name) != ''
-- Only insert if contact doesn't already exist (idempotent)
AND NOT EXISTS (
    SELECT 1 FROM vendor_contacts vc
    WHERE vc.vendor_id = v.id AND vc.is_primary = true
);

-- Display migration results
DO $$
DECLARE
    contacts_created INTEGER;
    vendors_with_contact INTEGER;
BEGIN
    SELECT COUNT(*) INTO contacts_created
    FROM vendor_contacts
    WHERE is_primary = true;

    SELECT COUNT(*) INTO vendors_with_contact
    FROM vendors
    WHERE contact_name IS NOT NULL
    AND TRIM(contact_name) != '';

    RAISE NOTICE 'CONTACT MIGRATION:';
    RAISE NOTICE '  Vendors with contact_name: %', vendors_with_contact;
    RAISE NOTICE '  Primary contacts created: %', contacts_created;
END $$;

-- ============================================================================
-- PART 4: MIGRATE vendors.payment_terms → vendor_payment_info table
-- ============================================================================

-- Map common payment terms strings to payment_terms.id
-- First, create a temporary mapping of common payment terms
INSERT INTO vendor_payment_info (
    vendor_id,
    restaurant_id,
    payment_terms_id,
    preferred_payment_method,
    default_currency
)
SELECT
    v.id as vendor_id,
    v.restaurant_id,
    -- Map payment_terms string to payment_terms.id
    CASE
        WHEN LOWER(v.payment_terms) LIKE '%net 30%' OR LOWER(v.payment_terms) = 'net 30' THEN
            (SELECT id FROM payment_terms WHERE name = 'Net 30' LIMIT 1)
        WHEN LOWER(v.payment_terms) LIKE '%net 45%' OR LOWER(v.payment_terms) = 'net 45' THEN
            (SELECT id FROM payment_terms WHERE name = 'Net 45' LIMIT 1)
        WHEN LOWER(v.payment_terms) LIKE '%net 60%' OR LOWER(v.payment_terms) = 'net 60' THEN
            (SELECT id FROM payment_terms WHERE name = 'Net 60' LIMIT 1)
        WHEN LOWER(v.payment_terms) LIKE '%net 15%' OR LOWER(v.payment_terms) = 'net 15' THEN
            (SELECT id FROM payment_terms WHERE name = 'Net 15' LIMIT 1)
        WHEN LOWER(v.payment_terms) LIKE '%cod%' OR LOWER(v.payment_terms) = 'due on receipt' THEN
            (SELECT id FROM payment_terms WHERE name = 'Due on Receipt' LIMIT 1)
        WHEN LOWER(v.payment_terms) LIKE '%2/10%' OR LOWER(v.payment_terms) LIKE '%2% 10%' THEN
            (SELECT id FROM payment_terms WHERE name = '2/10 Net 30' LIMIT 1)
        WHEN LOWER(v.payment_terms) LIKE '%1/10%' OR LOWER(v.payment_terms) LIKE '%1% 10%' THEN
            (SELECT id FROM payment_terms WHERE name = '1/10 Net 30' LIMIT 1)
        ELSE
            -- Default to Net 30 if no match
            (SELECT id FROM payment_terms WHERE name = 'Net 30' LIMIT 1)
    END as payment_terms_id,
    'Check' as preferred_payment_method,
    'USD' as default_currency
FROM vendors v
WHERE v.payment_terms IS NOT NULL
AND TRIM(v.payment_terms) != ''
-- Only insert if payment info doesn't already exist (idempotent)
AND NOT EXISTS (
    SELECT 1 FROM vendor_payment_info vpi
    WHERE vpi.vendor_id = v.id
);

-- Display migration results
DO $$
DECLARE
    payment_info_created INTEGER;
    vendors_with_payment_terms INTEGER;
    net_30_count INTEGER;
    net_45_count INTEGER;
    due_on_receipt_count INTEGER;
    other_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO payment_info_created FROM vendor_payment_info;

    SELECT COUNT(*) INTO vendors_with_payment_terms
    FROM vendors
    WHERE payment_terms IS NOT NULL
    AND TRIM(payment_terms) != '';

    SELECT COUNT(*) INTO net_30_count
    FROM vendor_payment_info vpi
    JOIN payment_terms pt ON vpi.payment_terms_id = pt.id
    WHERE pt.name = 'Net 30';

    SELECT COUNT(*) INTO net_45_count
    FROM vendor_payment_info vpi
    JOIN payment_terms pt ON vpi.payment_terms_id = pt.id
    WHERE pt.name = 'Net 45';

    SELECT COUNT(*) INTO due_on_receipt_count
    FROM vendor_payment_info vpi
    JOIN payment_terms pt ON vpi.payment_terms_id = pt.id
    WHERE pt.name = 'Due on Receipt';

    SELECT COUNT(*) INTO other_count
    FROM vendor_payment_info vpi
    JOIN payment_terms pt ON vpi.payment_terms_id = pt.id
    WHERE pt.name NOT IN ('Net 30', 'Net 45', 'Due on Receipt');

    RAISE NOTICE 'PAYMENT TERMS MIGRATION:';
    RAISE NOTICE '  Vendors with payment_terms: %', vendors_with_payment_terms;
    RAISE NOTICE '  Payment info records created: %', payment_info_created;
    RAISE NOTICE '  Mapped to Net 30: %', net_30_count;
    RAISE NOTICE '  Mapped to Net 45: %', net_45_count;
    RAISE NOTICE '  Mapped to Due on Receipt: %', due_on_receipt_count;
    RAISE NOTICE '  Mapped to other terms: %', other_count;
END $$;

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

DO $$
DECLARE
    total_vendors INTEGER;
    mappings_with_restaurant INTEGER;
    addresses_created INTEGER;
    contacts_created INTEGER;
    payment_info_created INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_vendors FROM vendors;
    SELECT COUNT(*) INTO mappings_with_restaurant
    FROM ingredient_vendor_mapping
    WHERE restaurant_id IS NOT NULL;
    SELECT COUNT(*) INTO addresses_created FROM vendor_addresses;
    SELECT COUNT(*) INTO contacts_created FROM vendor_contacts;
    SELECT COUNT(*) INTO payment_info_created FROM vendor_payment_info;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION 020 - FINAL SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total vendors: %', total_vendors;
    RAISE NOTICE 'Ingredient mappings with restaurant_id: %', mappings_with_restaurant;
    RAISE NOTICE 'Vendor addresses created: %', addresses_created;
    RAISE NOTICE 'Vendor contacts created: %', contacts_created;
    RAISE NOTICE 'Vendor payment info created: %', payment_info_created;
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Migration completed successfully';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (FOR EMERGENCY USE ONLY)
-- ============================================================================

-- ROLLBACK STEPS (uncomment and run if needed):
--
-- -- 1. Revert ingredient_vendor_mapping.restaurant_id to nullable
-- ALTER TABLE ingredient_vendor_mapping
-- ALTER COLUMN restaurant_id DROP NOT NULL;
--
-- -- 2. Clear restaurant_id values
-- UPDATE ingredient_vendor_mapping SET restaurant_id = NULL;
--
-- -- 3. Delete migrated vendor addresses (only primary addresses created by this migration)
-- DELETE FROM vendor_addresses WHERE address_type = 'primary';
--
-- -- 4. Delete migrated vendor contacts (only primary contacts created by this migration)
-- DELETE FROM vendor_contacts WHERE is_primary = true AND role = 'Account Manager';
--
-- -- 5. Delete migrated vendor payment info
-- DELETE FROM vendor_payment_info;
--
-- RAISE NOTICE '✓ Rollback completed - all migrated data removed';

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- Verify restaurant_id is NOT NULL
-- SELECT column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'ingredient_vendor_mapping' AND column_name = 'restaurant_id';
-- Expected: is_nullable = 'NO'

-- Verify all mappings have restaurant_id
-- SELECT COUNT(*) as total, COUNT(restaurant_id) as with_restaurant_id
-- FROM ingredient_vendor_mapping;
-- Expected: total = with_restaurant_id

-- Verify multi-tenant isolation works
-- SELECT
--     r.name as restaurant_name,
--     COUNT(DISTINCT v.id) as vendor_count,
--     COUNT(DISTINCT ivm.id) as vendor_item_count
-- FROM restaurants r
-- LEFT JOIN vendors v ON r.id = v.restaurant_id
-- LEFT JOIN ingredient_vendor_mapping ivm ON v.id = ivm.vendor_id AND r.id = ivm.restaurant_id
-- GROUP BY r.id, r.name;

-- Verify address migration
-- SELECT
--     v.name as vendor_name,
--     v.address as old_address_jsonb,
--     va.address_line1 || ', ' || va.city || ', ' || va.state || ' ' || va.postal_code as new_address_text
-- FROM vendors v
-- LEFT JOIN vendor_addresses va ON v.id = va.vendor_id AND va.address_type = 'primary'
-- WHERE v.address IS NOT NULL
-- LIMIT 10;

-- Verify contact migration
-- SELECT
--     v.name as vendor_name,
--     v.contact_name as old_contact_name,
--     vc.first_name || ' ' || vc.last_name as new_contact_name,
--     vc.email,
--     vc.phone
-- FROM vendors v
-- LEFT JOIN vendor_contacts vc ON v.id = vc.vendor_id AND vc.is_primary = true
-- WHERE v.contact_name IS NOT NULL
-- LIMIT 10;

-- Verify payment terms migration
-- SELECT
--     v.name as vendor_name,
--     v.payment_terms as old_payment_terms,
--     pt.name as new_payment_terms,
--     pt.days,
--     vpi.preferred_payment_method
-- FROM vendors v
-- LEFT JOIN vendor_payment_info vpi ON v.id = vpi.vendor_id
-- LEFT JOIN payment_terms pt ON vpi.payment_terms_id = pt.id
-- WHERE v.payment_terms IS NOT NULL
-- LIMIT 10;
