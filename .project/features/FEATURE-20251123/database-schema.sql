-- Orders Dashboard Database Schema Extensions
-- Feature: FEATURE-20251123
-- Created: 2025-11-23

-- New restaurant_orders table (separate from legacy orders table)
-- This represents master orders that contain all items being ordered at a specific time
CREATE TABLE restaurant_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('quick', 'custom')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'partially_fulfilled', 'fulfilled', 'cancelled')),
  total_estimated_value DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items linking master orders to specific ingredients
CREATE TABLE restaurant_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES restaurant_orders(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredient_library(id),
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(20) NOT NULL,
  estimated_unit_cost DECIMAL(10,2),
  estimated_line_total DECIMAL(10,2),
  po_number VARCHAR(50), -- Links to purchase_orders.order_number when PO is generated
  po_id UUID REFERENCES purchase_orders(id), -- Direct reference to PO
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'po_created', 'ordered', 'received', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend purchase_orders table to link back to source restaurant orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS source_order_ids UUID[];
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'manual';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_restaurant_id ON restaurant_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_status ON restaurant_orders(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_created_at ON restaurant_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_order_id ON restaurant_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_ingredient_id ON restaurant_order_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_po_id ON restaurant_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_source_orders ON purchase_orders USING GIN(source_order_ids);

-- Add order counter to restaurants table for generating order numbers
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS order_counter INTEGER DEFAULT 0;

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number(rest_id UUID)
RETURNS TEXT AS $$
DECLARE
    counter_val INTEGER;
    restaurant_code TEXT;
BEGIN
    -- Get and increment counter
    UPDATE restaurants 
    SET order_counter = order_counter + 1
    WHERE id = rest_id
    RETURNING order_counter, restaurant_code INTO counter_val, restaurant_code;
    
    -- Generate order number: RC-001, RC-002, etc.
    RETURN COALESCE(restaurant_code, 'REST') || '-' || LPAD(counter_val::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate order numbers
CREATE OR REPLACE FUNCTION set_restaurant_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number(NEW.restaurant_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_restaurant_order_number
    BEFORE INSERT ON restaurant_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_restaurant_order_number();

-- Create function to update order totals
CREATE OR REPLACE FUNCTION update_restaurant_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE restaurant_orders
    SET total_estimated_value = (
        SELECT COALESCE(SUM(estimated_line_total), 0)
        FROM restaurant_order_items
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update order totals when items change
CREATE TRIGGER trigger_update_restaurant_order_total
    AFTER INSERT OR UPDATE OR DELETE ON restaurant_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurant_order_total();

-- Sample data for testing (optional - remove for production)
-- INSERT INTO restaurant_orders (restaurant_id, order_type, notes, created_by)
-- VALUES (
--   (SELECT id FROM restaurants LIMIT 1),
--   'quick',
--   'Auto-generated order for low stock items',
--   (SELECT id FROM users LIMIT 1)
-- );