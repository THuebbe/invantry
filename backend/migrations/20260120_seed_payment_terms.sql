-- Seed: Add standard payment terms to reference table
-- Date: 2026-01-20
-- Purpose: Populate payment_terms table with standard industry terms
--
-- Problem: Payment terms dropdown is empty because table has no data

-- Insert standard payment terms (only if they don't exist)
INSERT INTO payment_terms (name, days, description, is_active)
SELECT * FROM (VALUES
    ('Due on Receipt', 0, 'Payment due immediately upon receipt of invoice', true),
    ('Net 7', 7, 'Payment due within 7 days', true),
    ('Net 10', 10, 'Payment due within 10 days', true),
    ('Net 15', 15, 'Payment due within 15 days', true),
    ('Net 30', 30, 'Payment due within 30 days', true),
    ('Net 45', 45, 'Payment due within 45 days', true),
    ('Net 60', 60, 'Payment due within 60 days', true),
    ('Net 90', 90, 'Payment due within 90 days', true),
    ('2/10 Net 30', 30, '2% discount if paid within 10 days, otherwise net 30', true),
    ('1/10 Net 30', 30, '1% discount if paid within 10 days, otherwise net 30', true)
) AS v(name, days, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM payment_terms WHERE name = v.name);

-- Verify data was inserted
DO $$
DECLARE
    term_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO term_count FROM payment_terms;

    IF term_count = 0 THEN
        RAISE EXCEPTION 'Failed to seed payment_terms - table is empty';
    ELSE
        RAISE NOTICE 'payment_terms table now has % rows', term_count;
    END IF;
END $$;

-- Show the terms
SELECT name, days, description FROM payment_terms ORDER BY days;
