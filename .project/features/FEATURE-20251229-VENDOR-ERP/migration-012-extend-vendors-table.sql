-- Migration 012: Extend vendors table with ERP fields
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Add vendor_code, legal_name, trade_name to existing vendors table
-- Created: 2025-12-29

-- Add new columns to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255);

-- Add unique constraint on vendor_code per restaurant (vendor codes should be unique within a restaurant)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_restaurant_vendor_code
ON vendors(restaurant_id, vendor_code)
WHERE vendor_code IS NOT NULL;

-- Add index for legal_name lookups
CREATE INDEX IF NOT EXISTS idx_vendors_legal_name
ON vendors(legal_name)
WHERE legal_name IS NOT NULL;

-- Add comments for new columns
COMMENT ON COLUMN vendors.vendor_code IS 'Internal vendor code/ID for restaurant ERP system (alphanumeric identifier)';
COMMENT ON COLUMN vendors.legal_name IS 'Legal business name as registered (for tax and legal documents)';
COMMENT ON COLUMN vendors.trade_name IS 'Trading name or DBA (Doing Business As) if different from legal name';

-- Migration validation queries:
-- Verify columns were added
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'vendors'
-- AND column_name IN ('vendor_code', 'legal_name', 'trade_name');

-- Verify unique constraint on vendor_code
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'vendors'
-- AND indexname = 'idx_vendors_restaurant_vendor_code';

-- Check existing vendors (should see new columns with NULL values)
-- SELECT id, name, vendor_code, legal_name, trade_name
-- FROM vendors
-- LIMIT 5;
