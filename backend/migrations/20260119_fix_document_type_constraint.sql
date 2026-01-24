-- Sprint 2 - P2 Fix: Update Document Type Check Constraint
-- Date: 2026-01-19
-- Purpose: Update vendor_documents document_type constraint to allow all valid document types
--
-- Problem: Database check constraint vendor_documents_document_type_check may not include
--          all document types used by the application
--
-- Solution: Update constraint to include all valid document types:
--          - W9 (Tax form)
--          - W8 (Tax form for foreign entities)
--          - 1099 (Tax form)
--          - contract (Vendor contracts)
--          - insurance (Insurance certificates)
--          - certification (Food safety, organic, etc.)
--          - license (Business licenses)
--          - pricing_sheet (Pricing documents)
--          - other (Miscellaneous documents)

-- Drop the existing check constraint
ALTER TABLE vendor_documents
DROP CONSTRAINT IF EXISTS vendor_documents_document_type_check;

-- Create new check constraint with all valid document types
ALTER TABLE vendor_documents
ADD CONSTRAINT vendor_documents_document_type_check CHECK (
    document_type IS NULL OR document_type IN (
        'W9',
        'W8',
        '1099',
        'contract',
        'insurance',
        'certification',
        'license',
        'pricing_sheet',
        'other'
    )
);

-- Verify the constraint is created correctly
DO $$
DECLARE
    constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid)
    INTO constraint_def
    FROM pg_constraint
    WHERE conname = 'vendor_documents_document_type_check'
        AND conrelid = 'vendor_documents'::regclass;

    IF constraint_def IS NULL THEN
        RAISE EXCEPTION 'Failed to create constraint vendor_documents_document_type_check';
    END IF;

    -- Check that the key document types are included
    IF constraint_def LIKE '%W9%'
        AND constraint_def LIKE '%W8%'
        AND constraint_def LIKE '%1099%'
        AND constraint_def LIKE '%contract%'
        AND constraint_def LIKE '%insurance%'
        AND constraint_def LIKE '%certification%'
        AND constraint_def LIKE '%license%'
        AND constraint_def LIKE '%pricing_sheet%'
        AND constraint_def LIKE '%other%' THEN
        RAISE NOTICE 'Successfully updated constraint vendor_documents_document_type_check with all document types';
    ELSE
        RAISE EXCEPTION 'Constraint created but does not include all required document types';
    END IF;
END $$;

-- Update comment on document_type column
COMMENT ON COLUMN vendor_documents.document_type IS
'Document type: W9, W8, 1099, contract, insurance, certification, license, pricing_sheet, other';

-- Verify the change - show current constraint definition
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'vendor_documents_document_type_check'
    AND conrelid = 'vendor_documents'::regclass;
