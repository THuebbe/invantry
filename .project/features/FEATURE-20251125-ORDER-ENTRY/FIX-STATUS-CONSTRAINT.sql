-- ============================================================================
-- FIX: Update restaurant_orders status constraint
-- ============================================================================
-- Issue: CHECK constraint doesn't allow 'complete' status
-- This updates the constraint to include all required statuses
-- ============================================================================

-- Check current constraint
SELECT
    'Current constraint:' as info,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'restaurant_orders_status_check';

-- Drop old constraint
ALTER TABLE restaurant_orders
DROP CONSTRAINT IF EXISTS restaurant_orders_status_check;

-- Add updated constraint with all required statuses
ALTER TABLE restaurant_orders
ADD CONSTRAINT restaurant_orders_status_check
CHECK (status IN ('draft', 'submitted', 'partially_fulfilled', 'fulfilled', 'cancelled', 'complete', 'open'));

-- Verify new constraint
SELECT
    'Updated constraint:' as info,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'restaurant_orders_status_check';

-- ============================================================================
-- Now you can re-run RESEED_TEST_DATA.sql
-- ============================================================================
