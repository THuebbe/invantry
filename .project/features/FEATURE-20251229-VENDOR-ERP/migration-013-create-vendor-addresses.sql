-- Migration 013: Create vendor_addresses table
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Multiple addresses per vendor (billing, remittance, ship_from, warehouse, primary, other)
-- Created: 2025-12-29

-- Create vendor_addresses table
CREATE TABLE IF NOT EXISTS vendor_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    address_type VARCHAR(50) NOT NULL CHECK (address_type IN ('billing', 'remittance', 'ship_from', 'warehouse', 'primary', 'other')),
    is_primary BOOLEAN DEFAULT false,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'USA',
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint: only one address of each type per vendor (except 'warehouse' and 'other')
-- This allows multiple warehouses but only one billing, one remittance, etc.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_addresses_vendor_type_unique
ON vendor_addresses(vendor_id, address_type)
WHERE address_type NOT IN ('warehouse', 'other');

-- Add index for vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendor_addresses_vendor
ON vendor_addresses(vendor_id);

-- Add index for restaurant lookups (multi-tenancy enforcement)
CREATE INDEX IF NOT EXISTS idx_vendor_addresses_restaurant
ON vendor_addresses(restaurant_id);

-- Add index for primary address lookups
CREATE INDEX IF NOT EXISTS idx_vendor_addresses_primary
ON vendor_addresses(vendor_id, is_primary)
WHERE is_primary = true;

-- Add index for address type lookups
CREATE INDEX IF NOT EXISTS idx_vendor_addresses_type
ON vendor_addresses(vendor_id, address_type);

-- Add comments for documentation
COMMENT ON TABLE vendor_addresses IS 'Multiple addresses per vendor for different purposes (billing, shipping, etc.)';
COMMENT ON COLUMN vendor_addresses.id IS 'Unique address identifier (UUID)';
COMMENT ON COLUMN vendor_addresses.vendor_id IS 'Reference to vendor this address belongs to';
COMMENT ON COLUMN vendor_addresses.restaurant_id IS 'Restaurant that owns this vendor relationship (multi-tenancy)';
COMMENT ON COLUMN vendor_addresses.address_type IS 'Type of address: billing, remittance, ship_from, warehouse, primary, other';
COMMENT ON COLUMN vendor_addresses.is_primary IS 'Whether this is the primary/default address for the vendor';
COMMENT ON COLUMN vendor_addresses.address_line1 IS 'Street address line 1';
COMMENT ON COLUMN vendor_addresses.address_line2 IS 'Street address line 2 (suite, unit, etc.)';
COMMENT ON COLUMN vendor_addresses.city IS 'City name';
COMMENT ON COLUMN vendor_addresses.state IS 'State/province/region';
COMMENT ON COLUMN vendor_addresses.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN vendor_addresses.country IS 'Country (default: USA)';
COMMENT ON COLUMN vendor_addresses.phone IS 'Phone number for this location';
COMMENT ON COLUMN vendor_addresses.email IS 'Email address for this location';
COMMENT ON COLUMN vendor_addresses.website IS 'Website URL for this location';
COMMENT ON COLUMN vendor_addresses.notes IS 'Additional notes about this address (delivery instructions, gate codes, etc.)';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_vendor_addresses_updated_at ON vendor_addresses;
CREATE TRIGGER trigger_vendor_addresses_updated_at
    BEFORE UPDATE ON vendor_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_addresses_updated_at();

-- Create trigger function to ensure only one primary address per vendor
CREATE OR REPLACE FUNCTION enforce_single_primary_vendor_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this address as primary, unset all other primary addresses for this vendor
    IF NEW.is_primary = true THEN
        UPDATE vendor_addresses
        SET is_primary = false
        WHERE vendor_id = NEW.vendor_id
          AND id != NEW.id
          AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_enforce_single_primary_vendor_address ON vendor_addresses;
CREATE TRIGGER trigger_enforce_single_primary_vendor_address
    BEFORE INSERT OR UPDATE ON vendor_addresses
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION enforce_single_primary_vendor_address();

-- Migration validation queries:
-- Verify table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'vendor_addresses';

-- Verify columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'vendor_addresses'
-- ORDER BY ordinal_position;

-- Verify indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vendor_addresses';

-- Verify unique constraint on address_type (should allow multiple 'warehouse' but prevent duplicate 'billing')
-- INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, city, state, postal_code)
-- SELECT id, restaurant_id, 'billing', '123 Main St', 'Chicago', 'IL', '60601'
-- FROM vendors LIMIT 1;
-- The second insert with same address_type should fail:
-- INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, city, state, postal_code)
-- SELECT id, restaurant_id, 'billing', '456 Oak Ave', 'Chicago', 'IL', '60602'
-- FROM vendors LIMIT 1;

-- Verify triggers exist
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'vendor_addresses';
