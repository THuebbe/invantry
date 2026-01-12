-- Migration 007: Create additional performance indexes
-- Feature: FEATURE-20251125-ORDER-ENTRY
-- Description: Add indexes for efficient querying in order-to-PO workflows
-- Created: 2025-11-25

-- ============================================================================
-- RESTAURANT_ORDERS INDEXES
-- ============================================================================

-- Index for filtering orders by status (for dashboard views)
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_status_created
ON restaurant_orders(restaurant_id, status, created_at DESC);

-- Index for finding orders by order_number (for search)
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_order_number
ON restaurant_orders(order_number);

-- Index for finding draft orders by user
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_created_by_status
ON restaurant_orders(created_by, status)
WHERE status = 'draft';

-- ============================================================================
-- RESTAURANT_ORDER_ITEMS INDEXES
-- ============================================================================

-- Index for finding pending items that need PO assignment
CREATE INDEX IF NOT EXISTS idx_order_items_pending_vendor
ON restaurant_order_items(preferred_vendor, status)
WHERE status IN ('pending', 'on_po');

-- Index for finding items by ingredient (for consolidation logic)
CREATE INDEX IF NOT EXISTS idx_order_items_ingredient_status
ON restaurant_order_items(ingredient_id, status)
WHERE status != 'cancelled';

-- Index for finding items requiring approval
CREATE INDEX IF NOT EXISTS idx_order_items_requires_approval
ON restaurant_order_items(requires_approval)
WHERE requires_approval = true;

-- Index for tracking quantities (for low stock calculations)
CREATE INDEX IF NOT EXISTS idx_order_items_quantity_tracking
ON restaurant_order_items(order_id, quantity, quantity_on_po, quantity_received);

-- ============================================================================
-- PURCHASE_ORDERS INDEXES
-- ============================================================================

-- Index for finding POs by supplier (for PO consolidation logic)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_status
ON purchase_orders(supplier_name, status)
WHERE status = 'draft';

-- Index for finding POs by status and date (for receiving workflow)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status_expected_delivery
ON purchase_orders(restaurant_id, status, expected_delivery_date)
WHERE status IN ('backordered', 'draft');

-- Index for finding POs by order number (for search)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_number
ON purchase_orders(order_number);

-- ============================================================================
-- PURCHASE_ORDER_ITEMS INDEXES
-- ============================================================================

-- Index for finding PO items by ingredient (for receiving)
CREATE INDEX IF NOT EXISTS idx_po_items_ingredient_po
ON purchase_order_items(ingredient_id, purchase_order_id);

-- Index for finding partially received items
CREATE INDEX IF NOT EXISTS idx_po_items_partial_receipt
ON purchase_order_items(purchase_order_id)
WHERE quantity_received < quantity_ordered;

-- ============================================================================
-- VENDORS INDEXES
-- ============================================================================

-- Index for active vendor lookup by restaurant
CREATE INDEX IF NOT EXISTS idx_vendors_restaurant_active_name
ON vendors(restaurant_id, is_active, name)
WHERE is_active = true;

-- ============================================================================
-- RESTAURANT_INVENTORY INDEXES (if not already present)
-- ============================================================================

-- Index for finding low stock items (for "Populate Lines" feature)
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
ON restaurant_inventory(restaurant_id, ingredient_id)
WHERE quantity < minimum_quantity;

-- Composite index for low stock queries with quantities
CREATE INDEX IF NOT EXISTS idx_inventory_quantities
ON restaurant_inventory(restaurant_id, ingredient_id, quantity, minimum_quantity);

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Run these queries to verify indexes were created:
-- SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('restaurant_orders', 'restaurant_order_items', 'purchase_orders', 'purchase_order_items', 'vendors', 'restaurant_inventory') ORDER BY tablename, indexname;

-- Check index usage (run after application is running):
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes WHERE schemaname = 'public' AND tablename IN ('restaurant_orders', 'restaurant_order_items', 'purchase_orders', 'purchase_order_items', 'vendors') ORDER BY idx_scan DESC;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- These indexes are designed to optimize:
-- 1. "Populate Lines" queries that find low-stock items
-- 2. PO generation queries that group items by vendor
-- 3. PO consolidation logic that prevents duplicate POs
-- 4. Item consolidation that merges quantities across orders
-- 5. Receiving workflow that tracks partial fulfillment
-- 6. Dashboard views filtering by status
-- 7. Search functionality by order/PO numbers

-- Monitor query performance and adjust indexes as needed based on actual usage patterns
