-- Fix: Drop Address Unique INDEX (not constraint)
-- Date: 2026-01-20
-- Purpose: Allow multiple addresses of the same type per vendor
--
-- Problem: Previous migration tried DROP CONSTRAINT but it's actually a UNIQUE INDEX
-- Error: idx_vendor_addresses_vendor_type_unique still blocking duplicates

-- Drop the unique INDEX (not constraint)
DROP INDEX IF EXISTS idx_vendor_addresses_vendor_type_unique;

-- Verify it's dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_vendor_addresses_vendor_type_unique'
    ) THEN
        RAISE EXCEPTION 'Failed to drop index idx_vendor_addresses_vendor_type_unique';
    ELSE
        RAISE NOTICE 'Successfully dropped index idx_vendor_addresses_vendor_type_unique';
    END IF;
END $$;

-- Create non-unique index for query performance
CREATE INDEX IF NOT EXISTS idx_vendor_addresses_vendor_type_lookup
ON vendor_addresses (vendor_id, address_type);
