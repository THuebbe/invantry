-- Migration 006: Create ingredient_vendor_mapping table
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Many-to-many relationship between ingredients and vendors with pricing/lead time
-- Created: 2025-11-25

-- Create ingredient-vendor mapping table
CREATE TABLE IF NOT EXISTS ingredient_vendor_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES ingredient_library(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    is_preferred BOOLEAN DEFAULT false,
    vendor_item_number VARCHAR(100),
    unit_cost NUMERIC(10,2),
    lead_time_days INTEGER,
    minimum_order_qty NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique combination of ingredient and vendor
    CONSTRAINT uq_ingredient_vendor UNIQUE(ingredient_id, vendor_id)
);

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_ingredient
ON ingredient_vendor_mapping(ingredient_id);

CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_vendor
ON ingredient_vendor_mapping(vendor_id);

-- Index for finding preferred vendors
CREATE INDEX IF NOT EXISTS idx_ingredient_vendor_mapping_preferred
ON ingredient_vendor_mapping(ingredient_id, is_preferred)
WHERE is_preferred = true;

-- Add check constraint for valid lead time
ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT ingredient_vendor_mapping_lead_time_check
CHECK (lead_time_days IS NULL OR lead_time_days >= 0);

-- Add check constraint for valid minimum order quantity
ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT ingredient_vendor_mapping_min_order_check
CHECK (minimum_order_qty IS NULL OR minimum_order_qty > 0);

-- Add check constraint for valid unit cost
ALTER TABLE ingredient_vendor_mapping
ADD CONSTRAINT ingredient_vendor_mapping_unit_cost_check
CHECK (unit_cost IS NULL OR unit_cost >= 0);

-- Add comments for documentation
COMMENT ON TABLE ingredient_vendor_mapping IS 'Many-to-many relationship mapping ingredients to vendors with pricing and lead time information';
COMMENT ON COLUMN ingredient_vendor_mapping.id IS 'Unique mapping identifier';
COMMENT ON COLUMN ingredient_vendor_mapping.ingredient_id IS 'Reference to ingredient in library';
COMMENT ON COLUMN ingredient_vendor_mapping.vendor_id IS 'Reference to vendor';
COMMENT ON COLUMN ingredient_vendor_mapping.is_preferred IS 'Whether this is the preferred vendor for this ingredient';
COMMENT ON COLUMN ingredient_vendor_mapping.vendor_item_number IS 'Vendor''s SKU/item number for this ingredient';
COMMENT ON COLUMN ingredient_vendor_mapping.unit_cost IS 'Cost per unit from this vendor';
COMMENT ON COLUMN ingredient_vendor_mapping.lead_time_days IS 'Typical delivery time in days';
COMMENT ON COLUMN ingredient_vendor_mapping.minimum_order_qty IS 'Minimum order quantity for this item from this vendor';
COMMENT ON COLUMN ingredient_vendor_mapping.notes IS 'Vendor-specific notes for this ingredient';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ingredient_vendor_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ingredient_vendor_mapping_updated_at ON ingredient_vendor_mapping;
CREATE TRIGGER trigger_ingredient_vendor_mapping_updated_at
    BEFORE UPDATE ON ingredient_vendor_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredient_vendor_mapping_updated_at();

-- Create trigger to ensure only one preferred vendor per ingredient
CREATE OR REPLACE FUNCTION enforce_single_preferred_vendor()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this as preferred, unset others
    IF NEW.is_preferred = true THEN
        UPDATE ingredient_vendor_mapping
        SET is_preferred = false
        WHERE ingredient_id = NEW.ingredient_id
        AND vendor_id != NEW.vendor_id
        AND is_preferred = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_single_preferred_vendor ON ingredient_vendor_mapping;
CREATE TRIGGER trigger_enforce_single_preferred_vendor
    BEFORE INSERT OR UPDATE ON ingredient_vendor_mapping
    FOR EACH ROW
    WHEN (NEW.is_preferred = true)
    EXECUTE FUNCTION enforce_single_preferred_vendor();

-- Migration validation:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'ingredient_vendor_mapping';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ingredient_vendor_mapping';
-- SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'ingredient_vendor_mapping';
