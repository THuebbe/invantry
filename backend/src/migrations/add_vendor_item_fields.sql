-- Add additional fields to ingredient_vendor_mapping table
-- These fields capture vendor-specific packaging and identification details

-- Pack size: quantity per package from this vendor (e.g., 10)
ALTER TABLE ingredient_vendor_mapping
ADD COLUMN IF NOT EXISTS pack_size NUMERIC(10, 2);

-- Pack unit of measure: how this vendor packages the item (e.g., "lb", "case", "each")
ALTER TABLE ingredient_vendor_mapping
ADD COLUMN IF NOT EXISTS pack_uom VARCHAR(50);

-- Vendor barcode: vendor's barcode/UPC for this item (for receiving/scanning)
ALTER TABLE ingredient_vendor_mapping
ADD COLUMN IF NOT EXISTS vendor_barcode VARCHAR(100);

-- Vendor's description: how the vendor names/describes this item
ALTER TABLE ingredient_vendor_mapping
ADD COLUMN IF NOT EXISTS vendor_item_description TEXT;

-- Add comments
COMMENT ON COLUMN ingredient_vendor_mapping.pack_size IS 'Quantity per package from this vendor';
COMMENT ON COLUMN ingredient_vendor_mapping.pack_uom IS 'Unit of measure for vendor packaging (case, lb, each, etc.)';
COMMENT ON COLUMN ingredient_vendor_mapping.vendor_barcode IS 'Vendor barcode/UPC for scanning during receiving';
COMMENT ON COLUMN ingredient_vendor_mapping.vendor_item_description IS 'How the vendor describes this item in their catalog';
