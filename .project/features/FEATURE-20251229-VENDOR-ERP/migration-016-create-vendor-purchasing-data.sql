-- Migration 016: Create vendor_purchasing_data table
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Purchasing defaults for PO generation (one-to-one with vendor)
-- Created: 2025-12-29

-- Create vendor_purchasing_data table (one-to-one with vendor)
CREATE TABLE IF NOT EXISTS vendor_purchasing_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    lead_time_days INTEGER DEFAULT 0 CHECK (lead_time_days >= 0),
    minimum_order_value DECIMAL(15,2) CHECK (minimum_order_value >= 0),
    maximum_order_value DECIMAL(15,2) CHECK (maximum_order_value >= 0),
    default_freight_terms VARCHAR(50) CHECK (default_freight_terms IN ('Prepaid', 'Collect', 'Prepaid & Add', 'Third Party', 'FOB Origin', 'FOB Destination')),
    default_incoterm VARCHAR(20) CHECK (default_incoterm IN ('EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF')),
    order_cutoff_time TIME,
    delivery_days VARCHAR(100),
    backorder_allowed BOOLEAN DEFAULT true,
    drop_ship_allowed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint to ensure maximum_order_value >= minimum_order_value
ALTER TABLE vendor_purchasing_data
ADD CONSTRAINT chk_vendor_purchasing_order_values
CHECK (maximum_order_value IS NULL OR minimum_order_value IS NULL OR maximum_order_value >= minimum_order_value);

-- Add index for vendor lookups (one-to-one relationship)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_purchasing_data_vendor
ON vendor_purchasing_data(vendor_id);

-- Add index for restaurant lookups (multi-tenancy enforcement)
CREATE INDEX IF NOT EXISTS idx_vendor_purchasing_data_restaurant
ON vendor_purchasing_data(restaurant_id);

-- Add comments for documentation
COMMENT ON TABLE vendor_purchasing_data IS 'Purchasing defaults and preferences for PO generation (one-to-one with vendor)';
COMMENT ON COLUMN vendor_purchasing_data.id IS 'Unique purchasing data identifier (UUID)';
COMMENT ON COLUMN vendor_purchasing_data.vendor_id IS 'Reference to vendor (UNIQUE - one-to-one relationship)';
COMMENT ON COLUMN vendor_purchasing_data.restaurant_id IS 'Restaurant that owns this vendor relationship (multi-tenancy)';
COMMENT ON COLUMN vendor_purchasing_data.lead_time_days IS 'Standard lead time in days from order to delivery (default: 0)';
COMMENT ON COLUMN vendor_purchasing_data.minimum_order_value IS 'Minimum order value required by vendor';
COMMENT ON COLUMN vendor_purchasing_data.maximum_order_value IS 'Maximum order value allowed per order';
COMMENT ON COLUMN vendor_purchasing_data.default_freight_terms IS 'Default freight terms: Prepaid, Collect, Prepaid & Add, Third Party, FOB Origin, FOB Destination';
COMMENT ON COLUMN vendor_purchasing_data.default_incoterm IS 'Default Incoterm for international shipments: EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF';
COMMENT ON COLUMN vendor_purchasing_data.order_cutoff_time IS 'Daily cutoff time for same-day order processing (e.g., 14:00:00 for 2 PM)';
COMMENT ON COLUMN vendor_purchasing_data.delivery_days IS 'Days of week vendor delivers (e.g., "Monday, Wednesday, Friday")';
COMMENT ON COLUMN vendor_purchasing_data.backorder_allowed IS 'Whether backorders are allowed for out-of-stock items (default: true)';
COMMENT ON COLUMN vendor_purchasing_data.drop_ship_allowed IS 'Whether vendor supports drop shipping to alternate addresses (default: false)';
COMMENT ON COLUMN vendor_purchasing_data.notes IS 'Additional purchasing notes (special ordering procedures, account requirements, etc.)';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_purchasing_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_vendor_purchasing_data_updated_at ON vendor_purchasing_data;
CREATE TRIGGER trigger_vendor_purchasing_data_updated_at
    BEFORE UPDATE ON vendor_purchasing_data
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_purchasing_data_updated_at();

-- Migration validation queries:
-- Verify table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'vendor_purchasing_data';

-- Verify columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'vendor_purchasing_data'
-- ORDER BY ordinal_position;

-- Verify indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vendor_purchasing_data';

-- Verify unique constraint on vendor_id (one-to-one relationship)
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'vendor_purchasing_data'
-- AND constraint_type = 'UNIQUE';

-- Verify constraint on order values
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'vendor_purchasing_data'
-- AND constraint_name = 'chk_vendor_purchasing_order_values';

-- Verify triggers exist
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'vendor_purchasing_data';

-- Test query: Get vendor purchasing data for PO generation
-- SELECT
--     v.name as vendor_name,
--     vpd.lead_time_days,
--     vpd.minimum_order_value,
--     vpd.maximum_order_value,
--     vpd.default_freight_terms,
--     vpd.order_cutoff_time,
--     vpd.delivery_days,
--     vpd.backorder_allowed,
--     vpd.drop_ship_allowed
-- FROM vendors v
-- LEFT JOIN vendor_purchasing_data vpd ON v.id = vpd.vendor_id
-- WHERE v.restaurant_id = '<restaurant_uuid>'
-- AND v.is_active = true;

-- Test query: Calculate expected delivery date based on lead time
-- SELECT
--     v.name as vendor_name,
--     vpd.lead_time_days,
--     CURRENT_DATE + vpd.lead_time_days * INTERVAL '1 day' as expected_delivery_date
-- FROM vendors v
-- JOIN vendor_purchasing_data vpd ON v.id = vpd.vendor_id
-- WHERE v.id = '<vendor_uuid>';
