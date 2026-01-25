-- Vendor Accounts Payable Tables Migration
-- Created for Vendor ERP Module
-- Run this migration in Supabase SQL Editor

-- =====================================================
-- TABLE: vendor_invoices
-- Purpose: Track vendor invoices for accounts payable
-- =====================================================
CREATE TABLE IF NOT EXISTS vendor_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    received_date DATE DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    balance NUMERIC(12, 2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'disputed', 'cancelled')),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_vendor_invoice_number UNIQUE (vendor_id, restaurant_id, invoice_number)
);

-- Indexes for vendor_invoices
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_vendor_restaurant
    ON vendor_invoices(vendor_id, restaurant_id);

CREATE INDEX IF NOT EXISTS idx_vendor_invoices_status
    ON vendor_invoices(status) WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_vendor_invoices_due_date
    ON vendor_invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_vendor_invoices_restaurant_status
    ON vendor_invoices(restaurant_id, status);

-- Index for aging queries (unpaid invoices by due date)
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_aging
    ON vendor_invoices(restaurant_id, due_date, balance)
    WHERE status IN ('pending', 'partial', 'overdue');

-- Comments on vendor_invoices table
COMMENT ON TABLE vendor_invoices IS 'Tracks vendor invoices for accounts payable';
COMMENT ON COLUMN vendor_invoices.balance IS 'Auto-calculated as amount - amount_paid';
COMMENT ON COLUMN vendor_invoices.status IS 'pending=awaiting payment, partial=partially paid, paid=fully paid, overdue=past due date, disputed=under dispute, cancelled=soft deleted';


-- =====================================================
-- TABLE: vendor_payments
-- Purpose: Track payments made to vendors
-- =====================================================
CREATE TABLE IF NOT EXISTS vendor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'Check'
        CHECK (payment_method IN ('ACH', 'Wire', 'Check', 'Credit Card', 'Cash', 'PayPal', 'Other')),
    reference_number VARCHAR(100),
    invoice_id UUID REFERENCES vendor_invoices(id) ON DELETE SET NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for vendor_payments
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_restaurant
    ON vendor_payments(vendor_id, restaurant_id);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_invoice_id
    ON vendor_payments(invoice_id) WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_payments_payment_date
    ON vendor_payments(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_restaurant_date
    ON vendor_payments(restaurant_id, payment_date DESC);

-- Comments on vendor_payments table
COMMENT ON TABLE vendor_payments IS 'Tracks payments made to vendors for accounts payable';
COMMENT ON COLUMN vendor_payments.invoice_id IS 'Optional link to specific invoice being paid';


-- =====================================================
-- TRIGGER FUNCTION: update_invoice_on_payment
-- Purpose: Auto-update invoice amount_paid and status when payments change
-- =====================================================
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid NUMERIC(12, 2);
    v_invoice_amount NUMERIC(12, 2);
    v_invoice_due_date DATE;
    v_new_status VARCHAR(20);
    v_invoice_id UUID;
BEGIN
    -- Determine which invoice to update based on operation type
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    -- Exit early if no invoice is linked
    IF v_invoice_id IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- Calculate total paid for this invoice from all payments
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid
    FROM vendor_payments
    WHERE invoice_id = v_invoice_id;

    -- Get invoice details
    SELECT amount, due_date
    INTO v_invoice_amount, v_invoice_due_date
    FROM vendor_invoices
    WHERE id = v_invoice_id;

    -- Determine new status
    IF v_total_paid >= v_invoice_amount THEN
        v_new_status := 'paid';
    ELSIF v_total_paid > 0 THEN
        -- Check if overdue
        IF v_invoice_due_date < CURRENT_DATE THEN
            v_new_status := 'overdue';
        ELSE
            v_new_status := 'partial';
        END IF;
    ELSE
        -- No payments
        IF v_invoice_due_date < CURRENT_DATE THEN
            v_new_status := 'overdue';
        ELSE
            v_new_status := 'pending';
        END IF;
    END IF;

    -- Update the invoice
    UPDATE vendor_invoices
    SET
        amount_paid = v_total_paid,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = v_invoice_id
    AND status NOT IN ('cancelled', 'disputed'); -- Don't update cancelled or disputed invoices

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_update_invoice_on_payment ON vendor_payments;

-- Create trigger on vendor_payments
CREATE TRIGGER trg_update_invoice_on_payment
    AFTER INSERT OR UPDATE OR DELETE ON vendor_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_on_payment();

-- Comment on trigger
COMMENT ON FUNCTION update_invoice_on_payment() IS 'Automatically updates invoice amount_paid and status when payments are inserted, updated, or deleted';


-- =====================================================
-- TRIGGER FUNCTION: check_overdue_invoices
-- Purpose: Update overdue status for invoices (run periodically or on query)
-- =====================================================
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Update invoices that are past due date and not fully paid
    UPDATE vendor_invoices
    SET
        status = 'overdue',
        updated_at = NOW()
    WHERE due_date < CURRENT_DATE
    AND status IN ('pending', 'partial')
    AND balance > 0;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_overdue_invoices() IS 'Marks invoices as overdue if past due date. Run periodically via cron or call manually.';


-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on vendor_invoices
ALTER TABLE vendor_invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see invoices for their restaurant
CREATE POLICY vendor_invoices_restaurant_isolation ON vendor_invoices
    FOR ALL
    USING (restaurant_id IN (
        SELECT r.id FROM restaurants r
        JOIN users u ON u."businessId" = r.business_id
        WHERE u.id = auth.uid()::text
    ));

-- Enable RLS on vendor_payments
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see payments for their restaurant
CREATE POLICY vendor_payments_restaurant_isolation ON vendor_payments
    FOR ALL
    USING (restaurant_id IN (
        SELECT r.id FROM restaurants r
        JOIN users u ON u."businessId" = r.business_id
        WHERE u.id = auth.uid()::text
    ));


-- =====================================================
-- HELPER VIEW: vendor_invoice_summary
-- Purpose: Provides a summary view of invoices with vendor info
-- =====================================================
CREATE OR REPLACE VIEW vendor_invoice_summary AS
SELECT
    vi.id,
    vi.vendor_id,
    v.name AS vendor_name,
    v.vendor_code,
    vi.restaurant_id,
    vi.invoice_number,
    vi.invoice_date,
    vi.due_date,
    vi.received_date,
    vi.amount,
    vi.amount_paid,
    vi.balance,
    vi.status,
    vi.purchase_order_id,
    vi.currency,
    vi.notes,
    vi.created_at,
    vi.updated_at,
    -- Aging calculation
    CASE
        WHEN vi.status = 'paid' THEN 'paid'
        WHEN vi.due_date >= CURRENT_DATE THEN 'current'
        WHEN vi.due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30 days'
        WHEN vi.due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60 days'
        WHEN vi.due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90 days'
        ELSE 'over 90 days'
    END AS aging_bucket,
    -- Days overdue
    CASE
        WHEN vi.due_date >= CURRENT_DATE THEN 0
        ELSE CURRENT_DATE - vi.due_date
    END AS days_overdue
FROM vendor_invoices vi
JOIN vendors v ON vi.vendor_id = v.id
WHERE vi.status != 'cancelled';

COMMENT ON VIEW vendor_invoice_summary IS 'Summary view of vendor invoices with aging information';


-- =====================================================
-- Grant permissions (adjust based on your role setup)
-- =====================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_invoices TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_payments TO authenticated;
-- GRANT SELECT ON vendor_invoice_summary TO authenticated;


-- =====================================================
-- Sample data for testing (optional - comment out for production)
-- =====================================================
/*
-- Insert sample invoice
INSERT INTO vendor_invoices (
    vendor_id,
    restaurant_id,
    invoice_number,
    invoice_date,
    due_date,
    amount,
    status
) VALUES (
    '781c235c-bbb5-44b5-9f54-e4a842802148',
    '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
    'INV-2024-001',
    '2024-01-15',
    '2024-02-15',
    1500.00,
    'pending'
);

-- Insert sample payment
INSERT INTO vendor_payments (
    vendor_id,
    restaurant_id,
    payment_date,
    amount,
    payment_method,
    reference_number,
    invoice_id
) VALUES (
    '781c235c-bbb5-44b5-9f54-e4a842802148',
    '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
    '2024-01-20',
    500.00,
    'Check',
    'CHK-12345',
    'eac4818f-cbe0-476d-8fd6-c03669d2df6f'
);
*/
