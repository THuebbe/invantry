-- Migration 011: Create payment_terms table (Platform-wide reference)
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Platform-wide payment terms reference table with seed data
-- Created: 2025-12-29

-- Create payment_terms table (NO restaurant_id - shared across all restaurants)
CREATE TABLE IF NOT EXISTS payment_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    days INTEGER NOT NULL CHECK (days >= 0),
    discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_days INTEGER DEFAULT 0 CHECK (discount_days >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for active terms lookups
CREATE INDEX IF NOT EXISTS idx_payment_terms_active
ON payment_terms(is_active)
WHERE is_active = true;

-- Add index for name lookups
CREATE INDEX IF NOT EXISTS idx_payment_terms_name
ON payment_terms(name);

-- Add comments for documentation
COMMENT ON TABLE payment_terms IS 'Platform-wide payment terms reference table (shared across all restaurants)';
COMMENT ON COLUMN payment_terms.id IS 'Unique payment term identifier (UUID)';
COMMENT ON COLUMN payment_terms.name IS 'Payment term name (e.g., "Net 30", "2/10 Net 30")';
COMMENT ON COLUMN payment_terms.description IS 'Detailed description of payment terms';
COMMENT ON COLUMN payment_terms.days IS 'Number of days until payment is due';
COMMENT ON COLUMN payment_terms.discount_percent IS 'Early payment discount percentage (0-100)';
COMMENT ON COLUMN payment_terms.discount_days IS 'Days within which early payment discount applies';
COMMENT ON COLUMN payment_terms.is_active IS 'Whether this payment term is currently available for selection';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_terms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_payment_terms_updated_at ON payment_terms;
CREATE TRIGGER trigger_payment_terms_updated_at
    BEFORE UPDATE ON payment_terms
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_terms_updated_at();

-- Seed common payment terms
INSERT INTO payment_terms (name, description, days, discount_percent, discount_days, is_active)
VALUES
    ('Due on Receipt', 'Payment due immediately upon receipt of invoice', 0, 0, 0, true),
    ('Net 15', 'Payment due 15 days after invoice date', 15, 0, 0, true),
    ('Net 30', 'Payment due 30 days after invoice date', 30, 0, 0, true),
    ('Net 45', 'Payment due 45 days after invoice date', 45, 0, 0, true),
    ('Net 60', 'Payment due 60 days after invoice date', 60, 0, 0, true),
    ('2/10 Net 30', '2% discount if paid within 10 days, otherwise net 30', 30, 2.00, 10, true),
    ('1/10 Net 30', '1% discount if paid within 10 days, otherwise net 30', 30, 1.00, 10, true),
    ('COD', 'Cash on Delivery - payment due at time of delivery', 0, 0, 0, true)
ON CONFLICT (name) DO NOTHING;

-- Migration validation queries:
-- Verify table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'payment_terms';

-- Verify columns
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'payment_terms' ORDER BY ordinal_position;

-- Verify seed data (should return 8 rows)
-- SELECT COUNT(*) as seed_count FROM payment_terms;

-- View all payment terms
-- SELECT id, name, description, days, discount_percent, discount_days, is_active FROM payment_terms ORDER BY days;

-- Verify indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'payment_terms';
