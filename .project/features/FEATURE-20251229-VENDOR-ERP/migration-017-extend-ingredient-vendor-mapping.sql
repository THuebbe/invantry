-- Migration 017: Extend ingredient_vendor_mapping table
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Add restaurant_id FK and new ERP fields to existing ingredient_vendor_mapping table
-- Created: 2025-12-29
-- Phase: 2 - Multi-Tenancy & ERP Fields

-- CRITICAL: This migration adds restaurant_id column but does NOT populate it yet
-- Migration 020 will populate restaurant_id from vendors.restaurant_id via JOIN
-- Migration 020 will then make restaurant_id NOT NULL

-- Add restaurant_id column for multi-tenancy enforcement
-- NULLABLE initially - will be populated and made NOT NULL in migration 020
ALTER TABLE ingredient_vendor_mapping
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- Add new ERP fields for enhanced vendor-item management
ALTER TABLE ingredient_vendor_mapping
ADD COLUMN IF NOT EXISTS vendor_item_description TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS package_size NUMERIC(10,3),
ADD COLUMN IF NOT EXISTS package_unit VARCHAR(50),
ADD COLUMN IF NOT EXISTS case_quantity INTEGER,
ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS price_effective_date DATE,
ADD COLUMN IF NOT EXISTS price_expiration_date DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS discontinue_date DATE;

-- Add check constraints for new fields
ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT chk_ingredient_vendor_package_size
CHECK (package_size IS NULL OR package_size > 0);

ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT chk_ingredient_vendor_case_quantity
CHECK (case_quantity IS NULL OR case_quantity > 0);

ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT chk_ingredient_vendor_currency
CHECK (currency IN ('USD', 'CAD', 'EUR', 'GBP', 'JPY', 'AUD', 'MXN'));

ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT chk_ingredient_vendor_price_dates
CHECK (
    price_expiration_date IS NULL OR
    price_effective_date IS NULL OR
    price_expiration_date >= price_effective_date
);

-- Add index for restaurant_id lookups (multi-tenancy enforcement)
-- This index is critical for filtering by restaurant_id in all queries
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_restaurant
ON ingredient_vendor_mapping(restaurant_id);

-- Add index for active items lookups
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_active
ON ingredient_vendor_mapping(vendor_id, is_active)
WHERE is_active = true;

-- Add index for price effective dates (for finding current pricing)
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_price_dates
ON ingredient_vendor_mapping(vendor_id, price_effective_date, price_expiration_date)
WHERE is_active = true AND price_effective_date IS NOT NULL;

-- Add comments for new columns
COMMENT ON COLUMN ingredient_vendor_mapping.restaurant_id IS 'Restaurant that owns this vendor-item relationship (multi-tenancy) - populated in migration 020';
COMMENT ON COLUMN ingredient_vendor_mapping.vendor_item_description IS 'Vendor''s description of the item (may differ from ingredient name)';
COMMENT ON COLUMN ingredient_vendor_mapping.currency IS 'Currency for unit_cost (default: USD)';
COMMENT ON COLUMN ingredient_vendor_mapping.package_size IS 'Size of individual package (e.g., 5 for "5 lb bag")';
COMMENT ON COLUMN ingredient_vendor_mapping.package_unit IS 'Unit for package_size (e.g., "lb", "kg", "oz", "each")';
COMMENT ON COLUMN ingredient_vendor_mapping.case_quantity IS 'Number of packages per case/box (e.g., 6 for "6 x 5lb bags per case")';
COMMENT ON COLUMN ingredient_vendor_mapping.last_price_update IS 'Timestamp when unit_cost was last changed (auto-updated by trigger in migration 021)';
COMMENT ON COLUMN ingredient_vendor_mapping.price_effective_date IS 'Date when current pricing became effective';
COMMENT ON COLUMN ingredient_vendor_mapping.price_expiration_date IS 'Date when current pricing expires (NULL = no expiration)';
COMMENT ON COLUMN ingredient_vendor_mapping.is_active IS 'Whether this vendor item is currently available for ordering (default: true)';
COMMENT ON COLUMN ingredient_vendor_mapping.discontinue_date IS 'Date when vendor discontinued this item (NULL = still available)';

-- Migration validation queries:
-- Verify new columns exist
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'ingredient_vendor_mapping'
-- AND column_name IN ('restaurant_id', 'vendor_item_description', 'currency', 'package_size',
--                     'package_unit', 'case_quantity', 'last_price_update', 'price_effective_date',
--                     'price_expiration_date', 'is_active', 'discontinue_date')
-- ORDER BY ordinal_position;

-- Verify restaurant_id is nullable (will be made NOT NULL in migration 020)
-- SELECT column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'ingredient_vendor_mapping' AND column_name = 'restaurant_id';
-- Expected: is_nullable = 'YES'

-- Verify new indexes exist
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'ingredient_vendor_mapping'
-- AND indexname IN ('idx_ingredient_vendor_mapping_restaurant',
--                   'idx_ingredient_vendor_mapping_active',
--                   'idx_ingredient_vendor_mapping_price_dates');

-- Verify check constraints
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'ingredient_vendor_mapping'
-- AND constraint_name IN ('chk_ingredient_vendor_package_size',
--                         'chk_ingredient_vendor_case_quantity',
--                         'chk_ingredient_vendor_currency',
--                         'chk_ingredient_vendor_price_dates');

-- Count existing records (should all have NULL restaurant_id before migration 020)
-- SELECT
--     COUNT(*) as total_records,
--     COUNT(restaurant_id) as records_with_restaurant_id
-- FROM ingredient_vendor_mapping;
-- Expected: records_with_restaurant_id = 0

-- Test query: Preview what restaurant_id will be populated with
-- SELECT
--     ivm.id,
--     ivm.ingredient_id,
--     ivm.vendor_id,
--     ivm.restaurant_id as current_restaurant_id,
--     v.restaurant_id as will_be_populated_with
-- FROM ingredient_vendor_mapping ivm
-- JOIN vendors v ON ivm.vendor_id = v.id
-- LIMIT 10;
