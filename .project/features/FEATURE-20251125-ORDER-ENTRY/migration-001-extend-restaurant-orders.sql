-- Migration 001: Extend restaurant_orders table
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Add order_purpose field for tab labeling
-- Created: 2025-11-25

-- Add order_purpose field for custom tab labels
-- This allows users to label orders with meaningful names like "Weekly Reorder", "Nov 25", "Holiday Prep"
ALTER TABLE restaurant_orders
ADD COLUMN IF NOT EXISTS order_purpose VARCHAR(255);

-- Add comment to explain the field
COMMENT ON COLUMN restaurant_orders.order_purpose IS 'Custom label for order tab identification (e.g., "Weekly Reorder", "Nov 25", "Holiday Prep")';

-- Migration validation: Check if column was added successfully
-- Run this query to verify: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'restaurant_orders' AND column_name = 'order_purpose';
