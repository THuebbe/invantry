-- Migration 021: Create indexes and triggers for Phase 2
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Performance indexes and business rule triggers for new ERP tables
-- Created: 2025-12-29
-- Phase: 2 - Multi-Tenancy & ERP Fields

-- ============================================================================
-- PART 1: UPDATED_AT TRIGGERS FOR ALL NEW TABLES
-- ============================================================================

-- Create reusable trigger function for updated_at (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to vendor_addresses (if not already created in migration 013)
DROP TRIGGER IF EXISTS trigger_vendor_addresses_updated_at ON vendor_addresses;
CREATE TRIGGER trigger_vendor_addresses_updated_at
    BEFORE UPDATE ON vendor_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to vendor_contacts (if not already created in migration 014)
DROP TRIGGER IF EXISTS trigger_vendor_contacts_updated_at ON vendor_contacts;
CREATE TRIGGER trigger_vendor_contacts_updated_at
    BEFORE UPDATE ON vendor_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to vendor_payment_info (if not already created in migration 015)
DROP TRIGGER IF EXISTS trigger_vendor_payment_info_updated_at ON vendor_payment_info;
CREATE TRIGGER trigger_vendor_payment_info_updated_at
    BEFORE UPDATE ON vendor_payment_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to vendor_purchasing_data (if not already created in migration 016)
DROP TRIGGER IF EXISTS trigger_vendor_purchasing_data_updated_at ON vendor_purchasing_data;
CREATE TRIGGER trigger_vendor_purchasing_data_updated_at
    BEFORE UPDATE ON vendor_purchasing_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to vendor_documents (already created in migration 018)
-- Apply to vendor_scorecards (already created in migration 019)

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE '✓ updated_at triggers created for all Phase 2 tables';
END $$;

-- ============================================================================
-- PART 2: PRICE TRACKING TRIGGER FOR ingredient_vendor_mapping
-- ============================================================================

-- Create trigger to track last_price_update when unit_cost changes
CREATE OR REPLACE FUNCTION track_ingredient_vendor_price_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If unit_cost has changed, update last_price_update
    IF NEW.unit_cost IS DISTINCT FROM OLD.unit_cost THEN
        NEW.last_price_update = NOW();

        -- Optionally, if price_effective_date is not set, set it to today
        IF NEW.price_effective_date IS NULL THEN
            NEW.price_effective_date = CURRENT_DATE;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_track_price_change ON ingredient_vendor_mapping;
CREATE TRIGGER trigger_track_price_change
    BEFORE UPDATE ON ingredient_vendor_mapping
    FOR EACH ROW
    WHEN (NEW.unit_cost IS DISTINCT FROM OLD.unit_cost)
    EXECUTE FUNCTION track_ingredient_vendor_price_change();

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE '✓ Price tracking trigger created for ingredient_vendor_mapping';
END $$;

-- ============================================================================
-- PART 3: SINGLE CURRENT PRICING SHEET TRIGGER
-- ============================================================================

-- Already created in migration 018
-- Trigger: enforce_single_current_pricing_sheet
-- When a pricing sheet is set as is_current=true, unset all others for that vendor

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE '✓ Single current pricing sheet trigger already created in migration 018';
END $$;

-- ============================================================================
-- PART 4: PERFORMANCE INDEXES FOR QUERIES
-- ============================================================================

-- Indexes for vendor_addresses (already created in migration 013)
-- - idx_vendor_addresses_vendor_restaurant (multi-tenancy)
-- - idx_vendor_addresses_restaurant
-- - idx_vendor_addresses_primary

-- Indexes for vendor_contacts (already created in migration 014)
-- - idx_vendor_contacts_vendor_restaurant (multi-tenancy)
-- - idx_vendor_contacts_restaurant
-- - idx_vendor_contacts_primary
-- - idx_vendor_contacts_email

-- Indexes for vendor_payment_info (already created in migration 015)
-- - idx_vendor_payment_info_vendor (unique, one-to-one)
-- - idx_vendor_payment_info_restaurant

-- Indexes for vendor_purchasing_data (already created in migration 016)
-- - idx_vendor_purchasing_data_vendor (unique, one-to-one)
-- - idx_vendor_purchasing_data_restaurant

-- Indexes for ingredient_vendor_mapping (already created in migration 017)
-- - idx_ingredient_vendor_mapping_restaurant (multi-tenancy)
-- - idx_ingredient_vendor_mapping_active
-- - idx_ingredient_vendor_mapping_price_dates

-- Indexes for vendor_documents (already created in migration 018)
-- - idx_vendor_documents_vendor_restaurant (multi-tenancy)
-- - idx_vendor_documents_restaurant
-- - idx_vendor_documents_expired
-- - idx_vendor_documents_expiring_soon
-- - idx_vendor_documents_current_pricing
-- - idx_vendor_documents_type

-- Indexes for vendor_scorecards (already created in migration 019)
-- - idx_vendor_scorecards_vendor_restaurant (multi-tenancy)
-- - idx_vendor_scorecards_restaurant
-- - idx_vendor_scorecards_metric_history
-- - idx_vendor_scorecards_period
-- - idx_vendor_scorecards_latest

-- Additional composite indexes for common query patterns

-- Index for finding vendor items by ingredient and restaurant (multi-tenancy)
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_ingredient_restaurant
ON ingredient_vendor_mapping(ingredient_id, restaurant_id, is_active)
WHERE is_active = true;

-- Index for finding preferred vendor items by restaurant
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_preferred_restaurant
ON ingredient_vendor_mapping(restaurant_id, ingredient_id, is_preferred)
WHERE is_preferred = true AND is_active = true;

-- Index for vendor item number lookups (for barcode scanning, EDI)
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_item_number
ON ingredient_vendor_mapping(vendor_id, vendor_item_number)
WHERE vendor_item_number IS NOT NULL AND is_active = true;

-- Index for price expiration checks
-- NOTE: Date filtering (>= CURRENT_DATE) is NOT in WHERE clause because CURRENT_DATE is a volatile function
-- that PostgreSQL doesn't allow in partial index predicates. Date comparisons happen at query time.
-- This index covers the columns needed for efficient filtering.
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_price_expiration
ON ingredient_vendor_mapping(vendor_id, price_expiration_date, is_active)
WHERE price_expiration_date IS NOT NULL AND is_active = true;

-- Index for discontinued items
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_discontinued
ON ingredient_vendor_mapping(vendor_id, discontinue_date)
WHERE discontinue_date IS NOT NULL;

-- Index for vendor summary queries (vendor with all related data)
CREATE INDEX IF NOT EXISTS idx_vendor_addresses_vendor_type
ON vendor_addresses(vendor_id, address_type);

CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor_role
ON vendor_contacts(vendor_id, role)
WHERE is_primary = false;

-- Index for payment terms lookups (common in vendor_payment_info queries)
CREATE INDEX IF NOT EXISTS idx_vendor_payment_info_payment_terms
ON vendor_payment_info(payment_terms_id);

-- Index for finding vendors by delivery days
CREATE INDEX IF NOT EXISTS idx_vendor_purchasing_data_delivery_days
ON vendor_purchasing_data(restaurant_id)
WHERE delivery_days IS NOT NULL;

-- Index for document reminders (finds docs needing reminder soon)
-- NOTE: Time-based filtering (NOW() - INTERVAL '7 days') is NOT in WHERE clause because NOW() is a volatile function
-- that PostgreSQL doesn't allow in partial index predicates. Timestamp comparisons happen at query time.
-- This index covers the columns needed for efficient filtering and is_expired checks.
CREATE INDEX IF NOT EXISTS idx_vendor_documents_expiration_reminder
ON vendor_documents(vendor_id, expiration_date, last_reminder_sent, is_expired)
WHERE expiration_date IS NOT NULL;

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE '✓ Additional performance indexes created';
END $$;

-- ============================================================================
-- PART 5: VALIDATION TRIGGERS (OPTIONAL - BUSINESS RULES)
-- ============================================================================

-- Trigger to validate package quantities make sense
CREATE OR REPLACE FUNCTION validate_vendor_item_quantities()
RETURNS TRIGGER AS $$
BEGIN
    -- If case_quantity and package_size are both set, warn if minimum_order_qty doesn't align
    IF NEW.case_quantity IS NOT NULL AND NEW.package_size IS NOT NULL AND NEW.minimum_order_qty IS NOT NULL THEN
        -- Calculate total units in a case
        DECLARE
            units_per_case NUMERIC;
        BEGIN
            units_per_case := NEW.case_quantity * NEW.package_size;

            -- If minimum_order_qty is less than a full case, that might be unusual
            IF NEW.minimum_order_qty < units_per_case THEN
                RAISE NOTICE 'Vendor item %: minimum_order_qty (%) is less than case size (% x % = %)',
                    NEW.vendor_item_number,
                    NEW.minimum_order_qty,
                    NEW.case_quantity,
                    NEW.package_size,
                    units_per_case;
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger (as AFTER INSERT/UPDATE to avoid blocking)
DROP TRIGGER IF EXISTS trigger_validate_vendor_item_quantities ON ingredient_vendor_mapping;
CREATE TRIGGER trigger_validate_vendor_item_quantities
    AFTER INSERT OR UPDATE ON ingredient_vendor_mapping
    FOR EACH ROW
    WHEN (NEW.case_quantity IS NOT NULL AND NEW.package_size IS NOT NULL AND NEW.minimum_order_qty IS NOT NULL)
    EXECUTE FUNCTION validate_vendor_item_quantities();

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE '✓ Validation triggers created';
END $$;

-- ============================================================================
-- PART 6: AUDIT LOGGING TRIGGER (OPTIONAL - FOR SENSITIVE DATA)
-- ============================================================================

-- Create audit log table for tracking changes to vendor payment information
CREATE TABLE IF NOT EXISTS vendor_payment_info_audit (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_payment_info_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    restaurant_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB
);

-- Create index for audit lookups
CREATE INDEX IF NOT EXISTS idx_vendor_payment_info_audit_vendor
ON vendor_payment_info_audit(vendor_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_payment_info_audit_changed_at
ON vendor_payment_info_audit(changed_at DESC);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_vendor_payment_info_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO vendor_payment_info_audit (
            vendor_payment_info_id, vendor_id, restaurant_id, operation, new_data
        ) VALUES (
            NEW.id, NEW.vendor_id, NEW.restaurant_id, 'INSERT',
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO vendor_payment_info_audit (
            vendor_payment_info_id, vendor_id, restaurant_id, operation, old_data, new_data
        ) VALUES (
            NEW.id, NEW.vendor_id, NEW.restaurant_id, 'UPDATE',
            to_jsonb(OLD), to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO vendor_payment_info_audit (
            vendor_payment_info_id, vendor_id, restaurant_id, operation, old_data
        ) VALUES (
            OLD.id, OLD.vendor_id, OLD.restaurant_id, 'DELETE',
            to_jsonb(OLD)
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger
DROP TRIGGER IF EXISTS trigger_audit_vendor_payment_info ON vendor_payment_info;
CREATE TRIGGER trigger_audit_vendor_payment_info
    AFTER INSERT OR UPDATE OR DELETE ON vendor_payment_info
    FOR EACH ROW
    EXECUTE FUNCTION audit_vendor_payment_info_changes();

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE '✓ Audit logging triggers created for vendor_payment_info';
END $$;

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

DO $$
DECLARE
    trigger_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count triggers on Phase 2 tables
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE event_object_table IN (
        'vendor_addresses', 'vendor_contacts', 'vendor_payment_info',
        'vendor_purchasing_data', 'ingredient_vendor_mapping',
        'vendor_documents', 'vendor_scorecards'
    );

    -- Count indexes on Phase 2 tables
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename IN (
        'vendor_addresses', 'vendor_contacts', 'vendor_payment_info',
        'vendor_purchasing_data', 'ingredient_vendor_mapping',
        'vendor_documents', 'vendor_scorecards'
    );

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION 021 - FINAL SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total triggers created: %', trigger_count;
    RAISE NOTICE 'Total indexes created: %', index_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ All indexes and triggers created successfully';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- List all triggers on Phase 2 tables
-- SELECT
--     event_object_table as table_name,
--     trigger_name,
--     event_manipulation,
--     action_timing
-- FROM information_schema.triggers
-- WHERE event_object_table IN (
--     'vendor_addresses', 'vendor_contacts', 'vendor_payment_info',
--     'vendor_purchasing_data', 'ingredient_vendor_mapping',
--     'vendor_documents', 'vendor_scorecards'
-- )
-- ORDER BY event_object_table, trigger_name;

-- List all indexes on Phase 2 tables
-- SELECT
--     tablename,
--     indexname,
--     indexdef
-- FROM pg_indexes
-- WHERE tablename IN (
--     'vendor_addresses', 'vendor_contacts', 'vendor_payment_info',
--     'vendor_purchasing_data', 'ingredient_vendor_mapping',
--     'vendor_documents', 'vendor_scorecards'
-- )
-- ORDER BY tablename, indexname;

-- Test price tracking trigger
-- -- Insert a vendor item with initial price
-- INSERT INTO ingredient_vendor_mapping (
--     vendor_id, ingredient_id, restaurant_id, vendor_item_number, unit_cost
-- ) VALUES (
--     '<vendor_uuid>', '<ingredient_uuid>', '<restaurant_uuid>', 'TEST-001', 10.00
-- );
--
-- -- Update the price and verify last_price_update is set
-- UPDATE ingredient_vendor_mapping
-- SET unit_cost = 12.00
-- WHERE vendor_item_number = 'TEST-001';
--
-- -- Verify trigger worked
-- SELECT
--     vendor_item_number,
--     unit_cost,
--     last_price_update,
--     price_effective_date
-- FROM ingredient_vendor_mapping
-- WHERE vendor_item_number = 'TEST-001';
-- -- Expected: last_price_update = NOW(), price_effective_date = CURRENT_DATE

-- Test audit logging
-- SELECT
--     audit_id,
--     operation,
--     changed_at,
--     new_data->>'credit_limit' as credit_limit,
--     new_data->>'preferred_payment_method' as payment_method
-- FROM vendor_payment_info_audit
-- ORDER BY changed_at DESC
-- LIMIT 10;

-- Verify index usage with EXPLAIN ANALYZE
-- EXPLAIN ANALYZE
-- SELECT *
-- FROM ingredient_vendor_mapping
-- WHERE restaurant_id = '<restaurant_uuid>'
-- AND is_active = true
-- AND is_preferred = true;
-- -- Should use idx_ingredient_vendor_mapping_preferred_restaurant

-- EXPLAIN ANALYZE
-- SELECT *
-- FROM vendor_documents
-- WHERE vendor_id = '<vendor_uuid>'
-- AND document_type = 'pricing_sheet'
-- AND is_current = true;
-- -- Should use idx_vendor_documents_current_pricing
