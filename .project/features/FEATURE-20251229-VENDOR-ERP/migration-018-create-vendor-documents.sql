-- Migration 018: Create vendor_documents table
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Document management for compliance (W9, contracts, insurance) and pricing sheets
-- Created: 2025-12-29
-- Phase: 2 - Multi-Tenancy & ERP Fields

-- Create vendor_documents table
CREATE TABLE IF NOT EXISTS vendor_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'W9', 'W8', '1099', 'contract', 'insurance_general', 'insurance_liability',
        'insurance_workers_comp', 'license_business', 'license_food_handler',
        'certification_organic', 'certification_halal', 'certification_kosher',
        'pricing_sheet', 'product_catalog', 'spec_sheet', 'other'
    )),
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_path TEXT,
    file_size_bytes BIGINT CHECK (file_size_bytes > 0),
    mime_type VARCHAR(100),
    issue_date DATE,
    expiration_date DATE,
    is_expired BOOLEAN DEFAULT false,
    is_current BOOLEAN DEFAULT false,
    reminder_days_before INTEGER DEFAULT 30 CHECK (reminder_days_before >= 0),
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add check constraint for date logic
ALTER TABLE vendor_documents
ADD CONSTRAINT chk_vendor_documents_dates
CHECK (expiration_date IS NULL OR issue_date IS NULL OR expiration_date >= issue_date);

-- Add unique index for vendor + document_type (except certain types)
-- Only one W9, one contract, etc. per vendor, but multiple pricing_sheets are allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_documents_unique_type
ON vendor_documents(vendor_id, document_type)
WHERE document_type NOT IN ('pricing_sheet', 'product_catalog', 'spec_sheet', 'other');

-- Add index for vendor lookups (multi-tenancy enforcement)
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_restaurant
ON vendor_documents(vendor_id, restaurant_id);

-- Add index for restaurant lookups
CREATE INDEX IF NOT EXISTS idx_vendor_documents_restaurant
ON vendor_documents(restaurant_id);

-- Add index for finding expired and expiring documents
-- Note: Date comparisons (expired vs expiring soon) happen at query time in application layer
-- This single index supports both patterns efficiently without requiring volatile functions in WHERE clause
-- Usage: WHERE expiration_date IS NOT NULL AND expiration_date < CURRENT_DATE (for expired)
-- Usage: WHERE expiration_date IS NOT NULL AND expiration_date >= CURRENT_DATE (for expiring soon)
CREATE INDEX IF NOT EXISTS idx_vendor_documents_expiration
ON vendor_documents(vendor_id, expiration_date)
WHERE expiration_date IS NOT NULL;

-- Add index for finding current pricing sheets
CREATE INDEX IF NOT EXISTS idx_vendor_documents_current_pricing
ON vendor_documents(vendor_id, document_type, is_current)
WHERE document_type = 'pricing_sheet' AND is_current = true;

-- Add index for document type filtering
CREATE INDEX IF NOT EXISTS idx_vendor_documents_type
ON vendor_documents(vendor_id, document_type);

-- Add comments for documentation
COMMENT ON TABLE vendor_documents IS 'Document management for vendor compliance, contracts, and pricing sheets';
COMMENT ON COLUMN vendor_documents.id IS 'Unique document identifier (UUID)';
COMMENT ON COLUMN vendor_documents.vendor_id IS 'Reference to vendor';
COMMENT ON COLUMN vendor_documents.restaurant_id IS 'Restaurant that owns this vendor relationship (multi-tenancy)';
COMMENT ON COLUMN vendor_documents.document_type IS 'Type of document: W9, W8, 1099, contract, insurance types, licenses, certifications, pricing_sheet, product_catalog, spec_sheet, other';
COMMENT ON COLUMN vendor_documents.document_name IS 'User-friendly name for the document (e.g., "2024 General Liability Insurance")';
COMMENT ON COLUMN vendor_documents.file_url IS 'Public URL for document access (Supabase Storage public URL)';
COMMENT ON COLUMN vendor_documents.file_path IS 'Internal storage path (e.g., "vendor_docs/vendor_uuid/filename.pdf")';
COMMENT ON COLUMN vendor_documents.file_size_bytes IS 'File size in bytes';
COMMENT ON COLUMN vendor_documents.mime_type IS 'MIME type (e.g., "application/pdf", "image/jpeg")';
COMMENT ON COLUMN vendor_documents.issue_date IS 'Date document was issued/signed';
COMMENT ON COLUMN vendor_documents.expiration_date IS 'Date document expires (NULL = no expiration)';
COMMENT ON COLUMN vendor_documents.is_expired IS 'Whether document has expired (computed: expiration_date < today). Should be calculated in application layer or via inline query: (expiration_date < CURRENT_DATE)';
COMMENT ON COLUMN vendor_documents.is_current IS 'For pricing_sheet type: marks the active pricing sheet (only one per vendor should be true)';
COMMENT ON COLUMN vendor_documents.reminder_days_before IS 'How many days before expiration to send reminder (default: 30)';
COMMENT ON COLUMN vendor_documents.last_reminder_sent IS 'Timestamp when expiration reminder was last sent';
COMMENT ON COLUMN vendor_documents.uploaded_by IS 'User who uploaded the document';
COMMENT ON COLUMN vendor_documents.notes IS 'Additional notes about the document';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_vendor_documents_updated_at ON vendor_documents;
CREATE TRIGGER trigger_vendor_documents_updated_at
    BEFORE UPDATE ON vendor_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_documents_updated_at();

-- Create trigger to enforce single is_current pricing sheet per vendor
-- When a new pricing sheet is set as current, unset all others for that vendor
CREATE OR REPLACE FUNCTION enforce_single_current_pricing_sheet()
RETURNS TRIGGER AS $$
BEGIN
    -- Only apply to pricing_sheet documents
    IF NEW.document_type = 'pricing_sheet' AND NEW.is_current = true THEN
        -- Unset is_current for all other pricing sheets for this vendor
        UPDATE vendor_documents
        SET is_current = false
        WHERE vendor_id = NEW.vendor_id
        AND document_type = 'pricing_sheet'
        AND id != NEW.id
        AND is_current = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_single_current_pricing_sheet ON vendor_documents;
CREATE TRIGGER trigger_enforce_single_current_pricing_sheet
    BEFORE INSERT OR UPDATE ON vendor_documents
    FOR EACH ROW
    WHEN (NEW.document_type = 'pricing_sheet' AND NEW.is_current = true)
    EXECUTE FUNCTION enforce_single_current_pricing_sheet();

-- Migration validation queries:
-- Verify table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'vendor_documents';

-- Verify columns
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'vendor_documents'
-- ORDER BY ordinal_position;

-- Verify is_expired is a generated column
-- SELECT column_name, is_generated, generation_expression
-- FROM information_schema.columns
-- WHERE table_name = 'vendor_documents' AND column_name = 'is_expired';

-- Verify indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'vendor_documents';

-- Verify unique constraint on document_type (except pricing_sheet, etc.)
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'vendor_documents'
-- AND indexname = 'idx_vendor_documents_unique_type';

-- Verify triggers exist
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE event_object_table = 'vendor_documents';

-- Verify check constraints
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'vendor_documents'
-- AND constraint_type = 'CHECK';

-- Test query: Find all expired documents across all vendors
-- SELECT
--     v.name as vendor_name,
--     vd.document_type,
--     vd.document_name,
--     vd.expiration_date,
--     vd.is_expired
-- FROM vendor_documents vd
-- JOIN vendors v ON vd.vendor_id = v.id
-- WHERE vd.is_expired = true
-- AND vd.restaurant_id = '<restaurant_uuid>'
-- ORDER BY vd.expiration_date;

-- Test query: Find documents expiring in next 30 days
-- SELECT
--     v.name as vendor_name,
--     vd.document_type,
--     vd.document_name,
--     vd.expiration_date,
--     vd.expiration_date - CURRENT_DATE as days_until_expiration
-- FROM vendor_documents vd
-- JOIN vendors v ON vd.vendor_id = v.id
-- WHERE vd.expiration_date IS NOT NULL
-- AND vd.is_expired = false
-- AND vd.expiration_date <= CURRENT_DATE + INTERVAL '30 days'
-- AND vd.restaurant_id = '<restaurant_uuid>'
-- ORDER BY vd.expiration_date;

-- Test query: Find current pricing sheet for each vendor
-- SELECT
--     v.name as vendor_name,
--     vd.document_name,
--     vd.issue_date,
--     vd.file_url
-- FROM vendor_documents vd
-- JOIN vendors v ON vd.vendor_id = v.id
-- WHERE vd.document_type = 'pricing_sheet'
-- AND vd.is_current = true
-- AND vd.restaurant_id = '<restaurant_uuid>';

-- Test query: Get all documents for a specific vendor
-- SELECT
--     vd.document_type,
--     vd.document_name,
--     vd.issue_date,
--     vd.expiration_date,
--     vd.is_expired,
--     vd.file_size_bytes,
--     vd.mime_type
-- FROM vendor_documents vd
-- WHERE vd.vendor_id = '<vendor_uuid>'
-- AND vd.restaurant_id = '<restaurant_uuid>'
-- ORDER BY vd.document_type, vd.created_at DESC;
