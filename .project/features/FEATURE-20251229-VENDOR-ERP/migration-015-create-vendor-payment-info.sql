-- Migration 015: Create vendor_payment_info table
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Banking info, tax ID, payment terms FK (one-to-one with vendor)
-- Created: 2025-12-29

-- Create vendor_payment_info table (one-to-one with vendor)
CREATE TABLE IF NOT EXISTS vendor_payment_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    tax_id VARCHAR(50),
    credit_limit DECIMAL(15,2) CHECK (credit_limit >= 0),
    payment_terms_id UUID REFERENCES payment_terms(id),
    bank_name VARCHAR(255),
    account_number TEXT,
    routing_number TEXT,
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    preferred_payment_method VARCHAR(50) CHECK (preferred_payment_method IN ('Check', 'ACH', 'Wire Transfer', 'Credit Card', 'Cash', 'Other')),
    default_currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for vendor lookups (one-to-one relationship)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_payment_info_vendor
ON vendor_payment_info(vendor_id);

-- Add index for restaurant lookups (multi-tenancy enforcement)
CREATE INDEX IF NOT EXISTS idx_vendor_payment_info_restaurant
ON vendor_payment_info(restaurant_id);

-- Add index for payment terms lookups
CREATE INDEX IF NOT EXISTS idx_vendor_payment_info_payment_terms
ON vendor_payment_info(payment_terms_id)
WHERE payment_terms_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE vendor_payment_info IS 'Banking and payment information for vendors (one-to-one with vendor). Banking data relies on Supabase database-level encryption.';
COMMENT ON COLUMN vendor_payment_info.id IS 'Unique payment info identifier (UUID)';
COMMENT ON COLUMN vendor_payment_info.vendor_id IS 'Reference to vendor (UNIQUE - one-to-one relationship)';
COMMENT ON COLUMN vendor_payment_info.restaurant_id IS 'Restaurant that owns this vendor relationship (multi-tenancy)';
COMMENT ON COLUMN vendor_payment_info.tax_id IS 'Vendor tax ID / EIN number (for 1099 reporting)';
COMMENT ON COLUMN vendor_payment_info.credit_limit IS 'Maximum credit limit allowed with this vendor';
COMMENT ON COLUMN vendor_payment_info.payment_terms_id IS 'Reference to payment_terms table (Net 30, COD, etc.)';
COMMENT ON COLUMN vendor_payment_info.bank_name IS 'Bank name for ACH/wire transfers';
COMMENT ON COLUMN vendor_payment_info.account_number IS 'Bank account number (encrypted by Supabase at rest)';
COMMENT ON COLUMN vendor_payment_info.routing_number IS 'Bank routing number (encrypted by Supabase at rest)';
COMMENT ON COLUMN vendor_payment_info.swift_code IS 'SWIFT code for international wire transfers';
COMMENT ON COLUMN vendor_payment_info.iban IS 'IBAN number for international payments';
COMMENT ON COLUMN vendor_payment_info.preferred_payment_method IS 'Preferred payment method: Check, ACH, Wire Transfer, Credit Card, Cash, Other';
COMMENT ON COLUMN vendor_payment_info.default_currency IS 'Default currency for transactions (ISO 4217 code, default: USD)';
COMMENT ON COLUMN vendor_payment_info.notes IS 'Additional payment notes (special instructions, payment portal URL, etc.)';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_payment_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_vendor_payment_info_updated_at ON vendor_payment_info;
CREATE TRIGGER trigger_vendor_payment_info_updated_at
    BEFORE UPDATE ON vendor_payment_info
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_payment_info_updated_at();

-- Migration validation queries:
-- Verify table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'vendor_payment_info';

-- Verify columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'vendor_payment_info'
-- ORDER BY ordinal_position;

-- Verify indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vendor_payment_info';

-- Verify unique constraint on vendor_id (one-to-one relationship)
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'vendor_payment_info'
-- AND constraint_type = 'UNIQUE';

-- Verify foreign key to payment_terms
-- SELECT
--     tc.constraint_name,
--     kcu.column_name,
--     ccu.table_name AS foreign_table_name,
--     ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--     ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--     ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.table_name = 'vendor_payment_info'
-- AND tc.constraint_type = 'FOREIGN KEY';

-- Verify triggers exist
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'vendor_payment_info';

-- Test query: Get vendor payment info with payment terms details
-- SELECT
--     v.name as vendor_name,
--     vpi.tax_id,
--     vpi.credit_limit,
--     pt.name as payment_terms,
--     pt.days as payment_days,
--     vpi.preferred_payment_method,
--     vpi.default_currency
-- FROM vendors v
-- LEFT JOIN vendor_payment_info vpi ON v.id = vpi.vendor_id
-- LEFT JOIN payment_terms pt ON vpi.payment_terms_id = pt.id
-- WHERE v.restaurant_id = '<restaurant_uuid>';
