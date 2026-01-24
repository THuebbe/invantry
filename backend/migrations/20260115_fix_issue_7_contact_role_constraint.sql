-- Sprint 2 - P2 Fix: Issue #7 - Update Contact Role Check Constraint
-- Date: 2026-01-15
-- Purpose: Add AR Specialist, AP Specialist, and Territory Manager to allowed roles
--
-- Problem: Database check constraint vendor_contacts_role_check only allows:
--          Sales Rep, Account Manager, Billing Contact, Customer Service,
--          Delivery Coordinator, Other
--
-- Solution: Update constraint to include all roles used by frontend and backend:
--          - AR Specialist (Accounts Receivable)
--          - AP Specialist (Accounts Payable)
--          - Territory Manager

-- Drop the existing check constraint
ALTER TABLE vendor_contacts
DROP CONSTRAINT IF EXISTS vendor_contacts_role_check;

-- Create new check constraint with all valid roles
ALTER TABLE vendor_contacts
ADD CONSTRAINT vendor_contacts_role_check CHECK (
    role IS NULL OR role IN (
        'Sales Rep',
        'Account Manager',
        'Billing Contact',
        'AR Specialist',
        'AP Specialist',
        'Customer Service',
        'Delivery Coordinator',
        'Territory Manager',
        'Other'
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
    WHERE conname = 'vendor_contacts_role_check'
        AND conrelid = 'vendor_contacts'::regclass;

    IF constraint_def IS NULL THEN
        RAISE EXCEPTION 'Failed to create constraint vendor_contacts_role_check';
    END IF;

    -- Check that the new roles are included
    IF constraint_def LIKE '%AR Specialist%'
        AND constraint_def LIKE '%AP Specialist%'
        AND constraint_def LIKE '%Territory Manager%' THEN
        RAISE NOTICE 'Successfully updated constraint vendor_contacts_role_check with new roles';
    ELSE
        RAISE EXCEPTION 'Constraint created but does not include all new roles';
    END IF;
END $$;

-- Update comment on role column
COMMENT ON COLUMN vendor_contacts.role IS
'Contact role: Sales Rep, Account Manager, Billing Contact, AR Specialist, AP Specialist, Customer Service, Delivery Coordinator, Territory Manager, Other';

-- Verify the change - show current constraint definition
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'vendor_contacts_role_check'
    AND conrelid = 'vendor_contacts'::regclass;
