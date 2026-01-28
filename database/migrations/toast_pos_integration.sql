-- Toast POS Integration - Database Migrations
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- Phase 3: Sales Data Tables
-- ============================================

-- Table: pos_sales
-- Stores synced sales/orders from POS systems
CREATE TABLE IF NOT EXISTS pos_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
    pos_system VARCHAR(50) NOT NULL,
    pos_order_id VARCHAR(255) NOT NULL,
    order_number VARCHAR(100),
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    business_date DATE NOT NULL,
    closed_date TIMESTAMP WITH TIME ZONE,
    order_source VARCHAR(100),
    order_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'closed',
    total_amount NUMERIC(10,2),
    subtotal NUMERIC(10,2),
    tax NUMERIC(10,2),
    voided BOOLEAN DEFAULT false,
    raw_data JSONB,
    inventory_deducted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, pos_system, pos_order_id)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_pos_sales_restaurant_date
    ON pos_sales(restaurant_id, business_date);
CREATE INDEX IF NOT EXISTS idx_pos_sales_inventory_deducted
    ON pos_sales(restaurant_id, inventory_deducted)
    WHERE inventory_deducted = false AND voided = false;

-- Table: pos_sales_items
-- Stores line items from sales
CREATE TABLE IF NOT EXISTS pos_sales_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pos_sale_id UUID REFERENCES pos_sales(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    pos_menu_item_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2),
    total_price NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for joining to sales
CREATE INDEX IF NOT EXISTS idx_pos_sales_items_sale
    ON pos_sales_items(pos_sale_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_items_menu_item
    ON pos_sales_items(menu_item_id);

-- ============================================
-- Phase 4: Inventory Deduction Tables
-- ============================================

-- Table: inventory_deductions
-- Audit trail of inventory deductions from sales
CREATE TABLE IF NOT EXISTS inventory_deductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
    pos_sale_id UUID REFERENCES pos_sales(id),
    pos_sales_item_id UUID REFERENCES pos_sales_items(id),
    menu_item_id UUID REFERENCES menu_items(id),
    ingredient_id UUID REFERENCES ingredient_library(id),
    inventory_id UUID REFERENCES restaurant_inventory(id),
    quantity_deducted NUMERIC(10,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reason VARCHAR(100) DEFAULT 'sale',
    notes TEXT,
    reversed BOOLEAN DEFAULT false,
    reversed_at TIMESTAMP WITH TIME ZONE,
    reversed_by UUID,  -- User ID (no FK to avoid auth.users schema issues)
    deducted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for deduction queries
CREATE INDEX IF NOT EXISTS idx_inventory_deductions_restaurant
    ON inventory_deductions(restaurant_id, deducted_at);
CREATE INDEX IF NOT EXISTS idx_inventory_deductions_sale
    ON inventory_deductions(pos_sale_id);
CREATE INDEX IF NOT EXISTS idx_inventory_deductions_ingredient
    ON inventory_deductions(ingredient_id);

-- ============================================
-- POS Import History (for audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS pos_import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
    pos_system VARCHAR(50) NOT NULL,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_skipped INTEGER DEFAULT 0,
    items_errors INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    import_options JSONB,
    results_summary JSONB,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_import_history_restaurant
    ON pos_import_history(restaurant_id, completed_at DESC);

-- ============================================
-- Add columns to restaurants table
-- ============================================

-- Add last_pos_sync column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'restaurants' AND column_name = 'last_pos_sync'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN last_pos_sync TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add pos_system column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'restaurants' AND column_name = 'pos_system'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN pos_system VARCHAR(50);
    END IF;
END $$;

-- Add pos_integration_data column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'restaurants' AND column_name = 'pos_integration_data'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN pos_integration_data JSONB;
    END IF;
END $$;

-- ============================================
-- Add toast_menu_item_id to menu_items
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'menu_items' AND column_name = 'toast_menu_item_id'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN toast_menu_item_id VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_menu_items_toast_id
            ON menu_items(toast_menu_item_id);
    END IF;
END $$;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_import_history ENABLE ROW LEVEL SECURITY;

-- pos_sales policies
CREATE POLICY "Users can view their restaurant sales" ON pos_sales
    FOR SELECT USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE id = (
                SELECT "businessId" FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert their restaurant sales" ON pos_sales
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE id = (
                SELECT "businessId" FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their restaurant sales" ON pos_sales
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE id = (
                SELECT "businessId" FROM users WHERE id = auth.uid()
            )
        )
    );

-- pos_sales_items policies (inherit from parent sale)
CREATE POLICY "Users can view their sale items" ON pos_sales_items
    FOR SELECT USING (
        pos_sale_id IN (
            SELECT id FROM pos_sales WHERE restaurant_id IN (
                SELECT id FROM restaurants WHERE id = (
                    SELECT "businessId" FROM users WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can insert their sale items" ON pos_sales_items
    FOR INSERT WITH CHECK (
        pos_sale_id IN (
            SELECT id FROM pos_sales WHERE restaurant_id IN (
                SELECT id FROM restaurants WHERE id = (
                    SELECT "businessId" FROM users WHERE id = auth.uid()
                )
            )
        )
    );

-- inventory_deductions policies
CREATE POLICY "Users can view their deductions" ON inventory_deductions
    FOR SELECT USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE id = (
                SELECT "businessId" FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert their deductions" ON inventory_deductions
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE id = (
                SELECT "businessId" FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their deductions" ON inventory_deductions
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE id = (
                SELECT "businessId" FROM users WHERE id = auth.uid()
            )
        )
    );

-- pos_import_history policies
CREATE POLICY "Users can view their import history" ON pos_import_history
    FOR SELECT USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE id = (
                SELECT "businessId" FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert their import history" ON pos_import_history
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE id = (
                SELECT "businessId" FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================
-- Grant permissions for service role
-- ============================================

GRANT ALL ON pos_sales TO service_role;
GRANT ALL ON pos_sales_items TO service_role;
GRANT ALL ON inventory_deductions TO service_role;
GRANT ALL ON pos_import_history TO service_role;

-- Success message
SELECT 'Toast POS Integration tables created successfully!' as message;
