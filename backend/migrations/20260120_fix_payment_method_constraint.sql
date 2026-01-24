-- Fix: Update Payment Method CHECK Constraint
-- Date: 2026-01-20
-- Purpose: Allow all valid payment methods used by the application
--
-- Problem: Database CHECK constraint rejects "Wire" and possibly other values
-- Error: vendor_payment_info_preferred_payment_method_check violation

-- Drop the existing check constraint
ALTER TABLE vendor_payment_info
DROP CONSTRAINT IF EXISTS vendor_payment_info_preferred_payment_method_check;

-- Create new check constraint with all valid payment methods
ALTER TABLE vendor_payment_info
ADD CONSTRAINT vendor_payment_info_preferred_payment_method_check CHECK (
    preferred_payment_method IS NULL OR preferred_payment_method IN (
        'ACH',
        'Wire',
        'Check',
        'Credit Card',
        'Other'
    )
);

-- Verify the constraint
DO $$
DECLARE
    constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid)
    INTO constraint_def
    FROM pg_constraint
    WHERE conname = 'vendor_payment_info_preferred_payment_method_check'
        AND conrelid = 'vendor_payment_info'::regclass;

    IF constraint_def IS NULL THEN
        RAISE EXCEPTION 'Failed to create payment method constraint';
    END IF;

    IF constraint_def LIKE '%Wire%' AND constraint_def LIKE '%ACH%' THEN
        RAISE NOTICE 'Successfully updated payment method constraint';
    ELSE
        RAISE EXCEPTION 'Constraint missing required payment methods';
    END IF;
END $$;

-- Update column comment
COMMENT ON COLUMN vendor_payment_info.preferred_payment_method IS
'Payment method: ACH, Wire, Check, Credit Card, Other';
