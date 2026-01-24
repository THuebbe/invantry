-- Migration 005: Create vendors table
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Create vendor management table for supplier relationships
-- Created: 2025-11-25

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address JSONB,
    payment_terms VARCHAR(100),
    account_number VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate vendor names per restaurant
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_restaurant_name
ON vendors(restaurant_id, LOWER(name));

-- Add index for active vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendors_restaurant_active
ON vendors(restaurant_id, is_active)
WHERE is_active = true;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_vendors_email
ON vendors(email)
WHERE email IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE vendors IS 'Vendor/supplier master table for restaurant purchasing';
COMMENT ON COLUMN vendors.id IS 'Unique vendor identifier (UUID)';
COMMENT ON COLUMN vendors.restaurant_id IS 'Restaurant that this vendor supplies to';
COMMENT ON COLUMN vendors.name IS 'Vendor/supplier business name';
COMMENT ON COLUMN vendors.contact_name IS 'Primary contact person at vendor';
COMMENT ON COLUMN vendors.phone IS 'Vendor phone number';
COMMENT ON COLUMN vendors.email IS 'Vendor email address';
COMMENT ON COLUMN vendors.address IS 'Vendor address object: {"street": "123 Main St", "city": "Chicago", "state": "IL", "zip": "60601"}';
COMMENT ON COLUMN vendors.payment_terms IS 'Payment terms (e.g., "Net 30", "COD", "Net 15")';
COMMENT ON COLUMN vendors.account_number IS 'Restaurant''s account number with this vendor';
COMMENT ON COLUMN vendors.is_active IS 'Whether vendor is currently active for ordering';
COMMENT ON COLUMN vendors.notes IS 'Additional notes about vendor (hours, special instructions, etc.)';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_vendors_updated_at ON vendors;
CREATE TRIGGER trigger_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_vendors_updated_at();

-- Seed some common vendors (optional - can be removed for production)
-- INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
-- SELECT
--     id as restaurant_id,
--     'Sysco Corporation',
--     'Sales Department',
--     '1-800-SYSCO-01',
--     'orders@sysco.com',
--     'Net 30',
--     true
-- FROM restaurants
-- WHERE business_type = 'restaurant'
-- LIMIT 1;

-- Migration validation:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'vendors';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vendors';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'vendors';
