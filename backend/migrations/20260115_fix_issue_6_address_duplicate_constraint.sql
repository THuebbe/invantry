-- Sprint 2 - P2 Fix: Issue #6 - Remove Duplicate Address Type Constraint
-- Date: 2026-01-15
-- Purpose: Allow vendors to have multiple addresses of the same type
--
-- Problem: Database has unique constraint idx_vendor_addresses_vendor_type_unique
--          preventing multiple addresses with same (vendor_id, address_type)
--
-- Solution: Drop the unique constraint to allow multiple billing/shipping addresses
--
-- Note: Primary address constraint is handled by application logic, not database

-- Drop the unique constraint on (vendor_id, address_type)
ALTER TABLE vendor_addresses
DROP CONSTRAINT IF EXISTS idx_vendor_addresses_vendor_type_unique;

-- Verify constraint is dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'idx_vendor_addresses_vendor_type_unique'
    ) THEN
        RAISE EXCEPTION 'Failed to drop constraint idx_vendor_addresses_vendor_type_unique';
    ELSE
        RAISE NOTICE 'Successfully dropped constraint idx_vendor_addresses_vendor_type_unique';
    END IF;
END $$;

-- Create a regular index (non-unique) for query performance
-- This helps with queries filtering by vendor_id and address_type
CREATE INDEX IF NOT EXISTS idx_vendor_addresses_vendor_type_lookup
ON vendor_addresses (vendor_id, address_type);

COMMENT ON INDEX idx_vendor_addresses_vendor_type_lookup IS
'Non-unique index for query performance on vendor_id + address_type lookups';

-- Verify the change
SELECT
    'vendor_addresses' as table_name,
    COUNT(*) FILTER (WHERE contype = 'u' AND conname LIKE '%vendor_type%') as unique_constraints,
    COUNT(*) FILTER (WHERE indexname LIKE '%vendor_type%') as indexes
FROM pg_constraint
CROSS JOIN pg_indexes
WHERE conrelid = 'vendor_addresses'::regclass
    OR tablename = 'vendor_addresses';
