-- Migration 014: Create vendor_contacts table
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Multiple contacts per vendor with roles and notification preferences
-- Created: 2025-12-29

-- Create vendor_contacts table
CREATE TABLE IF NOT EXISTS vendor_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    role VARCHAR(100) CHECK (role IN ('Sales Rep', 'Account Manager', 'Billing Contact', 'Customer Service', 'Delivery Driver', 'Owner', 'Other')),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    receive_orders BOOLEAN DEFAULT false,
    receive_invoices BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor
ON vendor_contacts(vendor_id);

-- Add index for restaurant lookups (multi-tenancy enforcement)
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_restaurant
ON vendor_contacts(restaurant_id);

-- Add index for primary contact lookups
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_primary
ON vendor_contacts(vendor_id, is_primary)
WHERE is_primary = true;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_email
ON vendor_contacts(email)
WHERE email IS NOT NULL;

-- Add index for notification preferences (contacts who receive orders)
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_receive_orders
ON vendor_contacts(vendor_id, receive_orders)
WHERE receive_orders = true;

-- Add index for notification preferences (contacts who receive invoices)
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_receive_invoices
ON vendor_contacts(vendor_id, receive_invoices)
WHERE receive_invoices = true;

-- Add index for role lookups
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_role
ON vendor_contacts(vendor_id, role)
WHERE role IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE vendor_contacts IS 'Multiple contacts per vendor with roles and notification preferences';
COMMENT ON COLUMN vendor_contacts.id IS 'Unique contact identifier (UUID)';
COMMENT ON COLUMN vendor_contacts.vendor_id IS 'Reference to vendor this contact belongs to';
COMMENT ON COLUMN vendor_contacts.restaurant_id IS 'Restaurant that owns this vendor relationship (multi-tenancy)';
COMMENT ON COLUMN vendor_contacts.first_name IS 'Contact first name';
COMMENT ON COLUMN vendor_contacts.last_name IS 'Contact last name';
COMMENT ON COLUMN vendor_contacts.title IS 'Job title (e.g., "Regional Sales Manager")';
COMMENT ON COLUMN vendor_contacts.role IS 'Contact role: Sales Rep, Account Manager, Billing Contact, Customer Service, Delivery Driver, Owner, Other';
COMMENT ON COLUMN vendor_contacts.email IS 'Email address';
COMMENT ON COLUMN vendor_contacts.phone IS 'Office/desk phone number';
COMMENT ON COLUMN vendor_contacts.mobile IS 'Mobile phone number';
COMMENT ON COLUMN vendor_contacts.is_primary IS 'Whether this is the primary contact for the vendor';
COMMENT ON COLUMN vendor_contacts.receive_orders IS 'Whether this contact should receive purchase order notifications';
COMMENT ON COLUMN vendor_contacts.receive_invoices IS 'Whether this contact should receive invoice notifications';
COMMENT ON COLUMN vendor_contacts.notes IS 'Additional notes about this contact (preferred contact times, etc.)';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_vendor_contacts_updated_at ON vendor_contacts;
CREATE TRIGGER trigger_vendor_contacts_updated_at
    BEFORE UPDATE ON vendor_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_contacts_updated_at();

-- Create trigger function to ensure only one primary contact per vendor
CREATE OR REPLACE FUNCTION enforce_single_primary_vendor_contact()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this contact as primary, unset all other primary contacts for this vendor
    IF NEW.is_primary = true THEN
        UPDATE vendor_contacts
        SET is_primary = false
        WHERE vendor_id = NEW.vendor_id
          AND id != NEW.id
          AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_enforce_single_primary_vendor_contact ON vendor_contacts;
CREATE TRIGGER trigger_enforce_single_primary_vendor_contact
    BEFORE INSERT OR UPDATE ON vendor_contacts
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION enforce_single_primary_vendor_contact();

-- Migration validation queries:
-- Verify table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'vendor_contacts';

-- Verify columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'vendor_contacts'
-- ORDER BY ordinal_position;

-- Verify indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vendor_contacts';

-- Verify triggers exist
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'vendor_contacts';

-- Test query: Get all contacts for a vendor who should receive orders
-- SELECT first_name, last_name, email, role
-- FROM vendor_contacts
-- WHERE vendor_id = '<vendor_uuid>'
-- AND receive_orders = true;

-- Test query: Get primary contact for each vendor
-- SELECT v.name as vendor_name,
--        vc.first_name || ' ' || vc.last_name as primary_contact,
--        vc.email, vc.phone
-- FROM vendors v
-- LEFT JOIN vendor_contacts vc ON v.id = vc.vendor_id AND vc.is_primary = true
-- WHERE v.restaurant_id = '<restaurant_uuid>';
