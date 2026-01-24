# Database Migration Summary - Order Entry Feature

**Feature ID**: FEATURE-20251125-ORDER-ENTRY
**Created**: 2025-11-25
**Technical Architect**: Claude Technical Architect Agent
**Status**: Ready for Execution

---

## Executive Summary

This document outlines the database schema extensions required to support the Order Entry & Purchase Order Management feature. The migrations extend existing tables with new fields for order-to-PO workflow tracking, create new vendor management tables, and implement intelligent database functions for automated calculations.

**Total Migration Files**: 9 (8 forward migrations + 1 rollback script)

---

## Migration Files Overview

| File | Purpose | Breaking Changes | Estimated Time |
|------|---------|------------------|----------------|
| migration-001-extend-restaurant-orders.sql | Add order_purpose for tab labels | None | 30 seconds |
| migration-002-extend-order-items.sql | Add item tracking fields | None | 1 minute |
| migration-003-extend-purchase-orders.sql | Add addresses, update supplier_id | **YES** - supplier_id type change | 2 minutes |
| migration-004-extend-po-items.sql | Add source order tracking | None | 1 minute |
| migration-005-create-vendors-table.sql | Create vendor master table | None | 1 minute |
| migration-006-create-ingredient-vendor-mapping.sql | Create ingredient-vendor relationships | None | 1 minute |
| migration-007-create-indexes.sql | Performance indexes | None | 2 minutes |
| migration-008-create-functions.sql | Database functions & triggers | None | 1 minute |
| rollback-all.sql | Rollback all changes | **DATA LOSS** | 2 minutes |

**Total Migration Time**: ~10 minutes

---

## Detailed Migration Breakdown

### Migration 001: Extend restaurant_orders

**Changes**:
- Add `order_purpose` VARCHAR(255) - For tab labeling (e.g., "Weekly Reorder", "Nov 25")

**Impact**:
- No breaking changes
- Existing data preserved
- Field is nullable

**Validation**:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'restaurant_orders'
AND column_name = 'order_purpose';
```

---

### Migration 002: Extend restaurant_order_items

**Changes**:
- Add `item_name` VARCHAR(255) - Item name for non-library items
- Add `item_number` VARCHAR(100) - Vendor item number
- Add `upc` VARCHAR(50) - Barcode/UPC
- Add `category` VARCHAR(100) - Item category
- Add `preferred_vendor` VARCHAR(255) - Preferred vendor name
- Add `quantity_on_po` NUMERIC(10,2) DEFAULT 0 - Quantity assigned to POs
- Add `quantity_received` NUMERIC(10,2) DEFAULT 0 - Quantity received
- Add `requires_approval` BOOLEAN DEFAULT false - Admin approval flag
- Update status enum: 'pending', 'on_po', 'partially_received', 'received', 'cancelled'

**Impact**:
- No breaking changes
- All new fields have defaults or are nullable
- Status constraint updated (existing statuses may need mapping)

**Data Migration Required**:
- If existing records have statuses other than the new enum, they need to be mapped:
  - 'po_created' → 'on_po'
  - 'ordered' → 'on_po'

**Validation**:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'restaurant_order_items'
AND column_name IN ('item_name', 'quantity_on_po', 'quantity_received');
```

---

### Migration 003: Extend purchase_orders

**Changes**:
- Add `ship_to_address` JSONB - Shipping address
- Add `bill_to_address` JSONB - Billing address
- Add `supplier_id_new` UUID - New UUID-based supplier reference
- Update status enum: 'draft', 'backordered', 'complete', 'cancelled' (remove 'submitted', add 'backordered')

**CRITICAL - Breaking Change**:
- The `supplier_id` field needs to change from VARCHAR to UUID
- This migration adds `supplier_id_new` as UUID
- **Manual data migration required** before swapping columns
- The old `supplier_id` VARCHAR is preserved until migration complete

**Migration Path**:
1. Run migration-003 (adds supplier_id_new)
2. After vendors table exists, populate supplier_id_new:
   ```sql
   UPDATE purchase_orders p
   SET supplier_id_new = v.id
   FROM vendors v
   WHERE p.supplier_name = v.name;
   ```
3. Manually verify data migration
4. Swap columns:
   ```sql
   ALTER TABLE purchase_orders DROP COLUMN supplier_id;
   ALTER TABLE purchase_orders RENAME COLUMN supplier_id_new TO supplier_id;
   ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_supplier_fk
     FOREIGN KEY (supplier_id) REFERENCES vendors(id);
   ```

**Impact**:
- **HIGH RISK** - Requires manual data migration
- Existing POs need vendor mapping
- Consider running after vendors table is populated

**Validation**:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'purchase_orders'
AND column_name IN ('ship_to_address', 'bill_to_address', 'supplier_id_new');
```

---

### Migration 004: Extend purchase_order_items

**Changes**:
- Add `source_order_item_ids` UUID[] - Array of source order items (for consolidation)
- Add `item_name` VARCHAR(255) - Item name for display
- Add `item_number` VARCHAR(100) - Vendor item number
- Create trigger to update source order items on PO receipt

**Impact**:
- No breaking changes
- Automatic proportional quantity tracking via trigger
- Supports consolidated PO lines from multiple orders

**How It Works**:
When a PO item is received, the trigger automatically:
1. Calculates proportional received amounts for each source order item
2. Updates `quantity_received` on each source order item
3. Updates status (pending → partially_received → received)

**Example**:
```
PO Line: 8 lbs Chicken, received 6 lbs
Source Items:
  - Order #1: 5 lbs → receives (5/8) * 6 = 3.75 lbs
  - Order #2: 3 lbs → receives (3/8) * 6 = 2.25 lbs
```

**Validation**:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'purchase_order_items'
AND column_name IN ('source_order_item_ids', 'item_name');
```

---

### Migration 005: Create vendors table

**Changes**:
- Create new `vendors` table with full supplier information
- Fields: id, restaurant_id, name, contact_name, phone, email, address, payment_terms, account_number, is_active, notes
- Add unique constraint on (restaurant_id, name)
- Add updated_at trigger

**Impact**:
- New table, no breaking changes
- Enables proper vendor management (previously hardcoded)
- Required before migration-003 supplier_id swap

**Recommended Seed Data**:
```sql
INSERT INTO vendors (restaurant_id, name, phone, email, payment_terms, is_active)
VALUES
  (<restaurant_id>, 'Sysco Corporation', '1-800-SYSCO-01', 'orders@sysco.com', 'Net 30', true),
  (<restaurant_id>, 'Gordon Food Service', '1-800-968-4164', 'orders@gfs.com', 'Net 30', true),
  (<restaurant_id>, 'US Foods', '1-800-937-4000', 'orders@usfoods.com', 'Net 30', true);
```

**Validation**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'vendors';
```

---

### Migration 006: Create ingredient_vendor_mapping

**Changes**:
- Create many-to-many relationship table
- Fields: id, ingredient_id, vendor_id, is_preferred, vendor_item_number, unit_cost, lead_time_days, minimum_order_qty, notes
- Unique constraint on (ingredient_id, vendor_id)
- Trigger to enforce single preferred vendor per ingredient
- Updated_at trigger

**Impact**:
- New table, no breaking changes
- Enables vendor pricing and preferred vendor tracking
- Required for "Populate Lines" vendor assignment logic

**Business Logic**:
- Each ingredient can have multiple vendors
- Only one vendor can be marked as "preferred" per ingredient
- Trigger automatically unsets other preferred vendors when a new one is set

**Validation**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'ingredient_vendor_mapping';
```

---

### Migration 007: Create indexes

**Changes**:
- 15+ new indexes across all tables
- Optimized for order-to-PO workflows

**Key Indexes**:
1. **Low Stock Queries**: `idx_inventory_low_stock`, `idx_inventory_quantities`
2. **PO Generation**: `idx_order_items_pending_vendor`, `idx_order_items_ingredient_status`
3. **PO Consolidation**: `idx_purchase_orders_supplier_status`
4. **Receiving Workflow**: `idx_po_items_partial_receipt`
5. **Dashboard Views**: `idx_restaurant_orders_status_created`

**Impact**:
- Significant performance improvement for queries
- Minimal overhead on writes (small tables)
- Recommended to run during low-traffic period

**Estimated Performance Gains**:
- "Populate Lines" query: 90% faster (from 5s to 0.5s for 100+ items)
- Vendor grouping: 85% faster
- Status filtering: 80% faster

**Validation**:
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('restaurant_orders', 'restaurant_order_items', 'purchase_orders', 'purchase_order_items', 'vendors')
ORDER BY tablename, indexname;
```

---

### Migration 008: Create functions and triggers

**Changes**:
6 new database functions:
1. `get_ingredient_quantity_on_order(ingredient_id, restaurant_id)` - Returns qty on open orders/POs
2. `calculate_suggested_reorder_quantity(ingredient_id, restaurant_id)` - Calculates (par*2) - current - on_order
3. `get_low_stock_items(restaurant_id)` - Returns all low-stock items with suggested quantities
4. `update_order_status_from_items()` - Trigger to auto-update order status
5. `update_po_status_from_items()` - Trigger to auto-update PO status
6. `check_duplicate_draft_po()` - Warns about duplicate draft POs

**Impact**:
- No breaking changes
- Automatic status management (reduces manual updates)
- Enables intelligent "Populate Lines" feature
- Prevents duplicate PO creation

**Function Examples**:

**Get Low Stock Items**:
```sql
SELECT * FROM get_low_stock_items('restaurant-uuid');
-- Returns: ingredient_name, current_qty, par_level, qty_on_order, suggested_qty, vendor, cost
```

**Calculate Suggested Reorder**:
```sql
SELECT calculate_suggested_reorder_quantity('ingredient-uuid', 'restaurant-uuid');
-- Returns: 25 (if par=20, current=5, on_order=10)
```

**Validation**:
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%ingredient%' OR routine_name LIKE '%order%' OR routine_name LIKE '%po%';
```

---

## Execution Plan

### Phase 1: Pre-Migration Checklist

- [ ] **Backup database** - Create full backup before any migrations
- [ ] **Test on staging** - Run all migrations on staging environment first
- [ ] **Verify Supabase version** - Ensure PostgreSQL version compatibility (14+)
- [ ] **Check existing data** - Review current order/PO data for migration impacts
- [ ] **Notify users** - Schedule maintenance window (recommended: 15 minutes)

### Phase 2: Execute Migrations (Recommended Order)

**Step 1: Table Extensions** (Low Risk)
```bash
# Execute in this order:
1. migration-001-extend-restaurant-orders.sql
2. migration-002-extend-order-items.sql
```

**Step 2: New Tables** (No Risk)
```bash
3. migration-005-create-vendors-table.sql
4. migration-006-create-ingredient-vendor-mapping.sql
```

**Step 3: PO Extensions** (Medium Risk - requires data migration)
```bash
5. migration-003-extend-purchase-orders.sql
   # STOP HERE - Populate vendors table with seed data
   # STOP HERE - Migrate supplier_id data manually
   # STOP HERE - Verify data migration before continuing

6. migration-004-extend-po-items.sql
```

**Step 4: Performance & Logic** (No Risk)
```bash
7. migration-007-create-indexes.sql
8. migration-008-create-functions.sql
```

### Phase 3: Post-Migration Verification

**Run Validation Queries**:
```sql
-- 1. Verify all new columns exist
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('restaurant_orders', 'restaurant_order_items', 'purchase_orders', 'purchase_order_items')
AND column_name IN ('order_purpose', 'item_name', 'quantity_on_po', 'ship_to_address', 'source_order_item_ids')
ORDER BY table_name, column_name;

-- 2. Verify new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('vendors', 'ingredient_vendor_mapping');

-- 3. Verify functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('get_ingredient_quantity_on_order', 'calculate_suggested_reorder_quantity', 'get_low_stock_items');

-- 4. Verify indexes created
SELECT count(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
AND (indexname LIKE '%restaurant_order%' OR indexname LIKE '%purchase_order%' OR indexname LIKE '%vendor%');
-- Should return: ~20 indexes

-- 5. Test low stock function
SELECT * FROM get_low_stock_items((SELECT id FROM restaurants LIMIT 1)) LIMIT 5;

-- 6. Check trigger functionality
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('restaurant_order_items', 'purchase_order_items', 'vendors');
-- Should return: 6+ triggers
```

### Phase 4: Data Population (Optional but Recommended)

**Seed Vendor Data**:
```sql
-- Add common vendors for each restaurant
INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
SELECT
    id as restaurant_id,
    'Sysco Corporation',
    'Sales Department',
    '1-800-967-9726',
    'orders@sysco.com',
    'Net 30',
    true
FROM restaurants;

-- Repeat for other major vendors (US Foods, Gordon Food Service, etc.)
```

**Map Existing Ingredients to Vendors**:
```sql
-- Example: Map all meat products to preferred vendor
INSERT INTO ingredient_vendor_mapping (ingredient_id, vendor_id, is_preferred, unit_cost)
SELECT
    i.id as ingredient_id,
    v.id as vendor_id,
    true as is_preferred,
    ri.cost_per_unit
FROM ingredient_library i
JOIN restaurant_inventory ri ON i.id = ri.ingredient_id
JOIN vendors v ON v.name = 'Sysco Corporation' AND v.restaurant_id = ri.restaurant_id
WHERE i.category = 'Meat & Poultry'
ON CONFLICT (ingredient_id, vendor_id) DO NOTHING;
```

---

## Potential Issues & Solutions

### Issue 1: Existing PO Status Mapping

**Problem**: Existing POs may have status 'submitted' which is replaced by 'backordered'

**Solution**:
```sql
-- Before running migration-003, update existing statuses
UPDATE purchase_orders
SET status = 'backordered'
WHERE status = 'submitted';
```

### Issue 2: Existing Order Item Status Mapping

**Problem**: Existing order items may have statuses not in new enum

**Solution**:
```sql
-- Before running migration-002
UPDATE restaurant_order_items
SET status = 'on_po'
WHERE status IN ('po_created', 'ordered');
```

### Issue 3: supplier_id Type Change

**Problem**: Changing supplier_id from VARCHAR to UUID requires data migration

**Solution**:
1. Run migration-003 (adds supplier_id_new)
2. Populate vendors table
3. Run manual mapping:
```sql
UPDATE purchase_orders p
SET supplier_id_new = v.id
FROM vendors v
WHERE p.supplier_name = v.name
  AND v.restaurant_id = p.restaurant_id;
```
4. Verify all POs have supplier_id_new populated
5. Manually swap columns (see migration-003 comments)

### Issue 4: Performance During Index Creation

**Problem**: Creating indexes on large tables may lock tables briefly

**Solution**:
```sql
-- Use CONCURRENTLY for production (doesn't lock table)
CREATE INDEX CONCURRENTLY idx_name ON table_name(column_name);
```

### Issue 5: Trigger Performance

**Problem**: New triggers may slow down inserts/updates

**Solution**:
- Triggers are optimized for performance
- Monitor query performance after deployment
- If issues arise, consider disabling triggers during bulk operations:
```sql
ALTER TABLE purchase_order_items DISABLE TRIGGER trigger_update_source_order_items;
-- Run bulk operation
ALTER TABLE purchase_order_items ENABLE TRIGGER trigger_update_source_order_items;
```

---

## Rollback Strategy

### Quick Rollback (All Migrations)

**File**: `rollback-all.sql`

**Warning**: This will DELETE all data in new tables and columns

**Execution**:
```bash
psql -U postgres -d invantry_db -f rollback-all.sql
```

**What Gets Removed**:
- All new columns (order_purpose, item_name, quantity_on_po, etc.)
- All new tables (vendors, ingredient_vendor_mapping)
- All new functions and triggers
- All new indexes

**What Gets Preserved**:
- All existing data in unmodified columns
- Existing table structures
- Existing indexes and functions

### Selective Rollback

If you need to rollback only specific migrations:

**Rollback migration-008 (functions)**:
```sql
DROP TRIGGER IF EXISTS trigger_check_duplicate_draft_po ON purchase_orders;
DROP FUNCTION IF EXISTS check_duplicate_draft_po();
-- etc. (see rollback-all.sql for complete list)
```

**Rollback migration-007 (indexes)**:
```sql
DROP INDEX IF EXISTS idx_inventory_low_stock;
DROP INDEX IF EXISTS idx_order_items_pending_vendor;
-- etc.
```

---

## Testing Recommendations

### Unit Tests (Database Level)

**Test 1: Low Stock Calculation**
```sql
-- Setup test data
INSERT INTO restaurant_inventory (restaurant_id, ingredient_id, quantity, minimum_quantity)
VALUES ('test-restaurant-uuid', 'test-ingredient-uuid', 5, 20);

-- Test function
SELECT calculate_suggested_reorder_quantity('test-ingredient-uuid', 'test-restaurant-uuid');
-- Expected: 35 (formula: 20*2 - 5 - 0 = 35)

-- Cleanup
DELETE FROM restaurant_inventory WHERE restaurant_id = 'test-restaurant-uuid';
```

**Test 2: Preferred Vendor Enforcement**
```sql
-- Insert two mappings for same ingredient
INSERT INTO ingredient_vendor_mapping (ingredient_id, vendor_id, is_preferred)
VALUES ('test-ingredient-uuid', 'vendor1-uuid', true);

INSERT INTO ingredient_vendor_mapping (ingredient_id, vendor_id, is_preferred)
VALUES ('test-ingredient-uuid', 'vendor2-uuid', true);

-- Verify only one is preferred
SELECT COUNT(*) FROM ingredient_vendor_mapping
WHERE ingredient_id = 'test-ingredient-uuid' AND is_preferred = true;
-- Expected: 1 (trigger should have unset the first one)
```

**Test 3: Proportional Receipt Calculation**
```sql
-- Create test order items
INSERT INTO restaurant_order_items (order_id, ingredient_id, quantity, status)
VALUES
  ('order1-uuid', 'chicken-uuid', 5, 'on_po'),
  ('order2-uuid', 'chicken-uuid', 3, 'on_po');

-- Create PO item with both sources
INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity_ordered, quantity_received, source_order_item_ids)
VALUES ('po-uuid', 'chicken-uuid', 8, 6, ARRAY['order1-item-uuid', 'order2-item-uuid']);

-- Verify proportional distribution
SELECT quantity_received FROM restaurant_order_items WHERE id = 'order1-item-uuid';
-- Expected: 3.75 (5/8 * 6)

SELECT quantity_received FROM restaurant_order_items WHERE id = 'order2-item-uuid';
-- Expected: 2.25 (3/8 * 6)
```

### Integration Tests (Application Level)

**Test 1: Create Order with Populate Lines**
```javascript
// Test API endpoint: POST /api/orders/populate-lines
const response = await api.post('/api/orders/populate-lines', {
  restaurant_id: testRestaurantId
});

expect(response.data.items).toBeArray();
expect(response.data.items[0]).toHaveProperty('suggested_qty');
expect(response.data.items[0]).toHaveProperty('preferred_vendor');
```

**Test 2: Generate PO from Orders**
```javascript
// Create test order
const order = await createTestOrder();

// Generate PO
const response = await api.post('/api/purchase-orders/generate', {
  vendor_name: 'Sysco Corporation',
  restaurant_id: testRestaurantId
});

expect(response.data.po).toHaveProperty('supplier_name', 'Sysco Corporation');
expect(response.data.po.items).toBeArray();
```

**Test 3: Receive PO with Partial Quantity**
```javascript
// Create PO
const po = await createTestPO();

// Receive partial quantity
const response = await api.post(`/api/purchase-orders/${po.id}/receive`, {
  items: [
    { po_item_id: po.items[0].id, quantity_received: 6, quantity_ordered: 10 }
  ]
});

// Verify order item updated
const orderItem = await getOrderItem(po.items[0].source_order_item_ids[0]);
expect(orderItem.quantity_received).toBe(6);
expect(orderItem.status).toBe('partially_received');
```

---

## Performance Benchmarks

### Before Migration (Estimated)

| Operation | Time | Notes |
|-----------|------|-------|
| Get low stock items (100 items) | ~5s | Full table scan |
| Generate PO for vendor | ~3s | No indexes on vendor field |
| Dashboard order list | ~2s | Status filter unoptimized |

### After Migration (Expected)

| Operation | Time | Notes |
|-----------|------|-------|
| Get low stock items (100 items) | ~0.5s | Using `get_low_stock_items()` function + indexes |
| Generate PO for vendor | ~0.4s | Indexed vendor lookup |
| Dashboard order list | ~0.3s | Composite indexes |

**Performance Improvement**: ~85% reduction in query times

---

## Database Size Impact

### New Tables Estimated Size

| Table | Estimated Rows | Size per Row | Total Size |
|-------|---------------|--------------|------------|
| vendors | 10-50 per restaurant | ~500 bytes | 5-25 KB |
| ingredient_vendor_mapping | 100-500 per restaurant | ~200 bytes | 20-100 KB |

### New Columns Estimated Size

| Table | New Columns | Size Impact |
|-------|-------------|-------------|
| restaurant_orders | order_purpose | ~50 bytes per row |
| restaurant_order_items | 8 new columns | ~300 bytes per row |
| purchase_orders | 3 new columns | ~200 bytes per row |
| purchase_order_items | 3 new columns | ~150 bytes per row |

### Index Size Impact

Estimated total index size: ~500 KB - 2 MB (depending on data volume)

**Total Database Size Increase**: ~1-5 MB for typical restaurant (negligible)

---

## Security Considerations

### Row Level Security (RLS)

If using Supabase RLS, add policies for new tables:

```sql
-- Vendors table policies
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendors for their restaurant"
ON vendors FOR SELECT
USING (restaurant_id IN (
  SELECT r.id FROM restaurants r
  JOIN users u ON u.businessId = r.business_id
  WHERE u.id = auth.uid()
));

CREATE POLICY "Admins can manage vendors"
ON vendors FOR ALL
USING (
  restaurant_id IN (
    SELECT r.id FROM restaurants r
    JOIN users u ON u.businessId = r.business_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Repeat similar policies for ingredient_vendor_mapping
```

### Data Access Patterns

**Who Can Access**:
- **vendors**: All authenticated users can view, Admins can edit
- **ingredient_vendor_mapping**: All users can view, Managers/Admins can edit
- **Order fields**: Users can view their restaurant's orders, Managers can edit

**API Permissions** (to be implemented in backend):
- POST /api/vendors - Admin only
- GET /api/vendors - All authenticated users
- POST /api/orders/populate-lines - Manager and above
- POST /api/purchase-orders/generate - Admin only

---

## Monitoring & Maintenance

### Post-Deployment Monitoring

**Week 1: Monitor These Metrics**
1. Query performance (especially `get_low_stock_items()`)
2. Index usage (should see high scan counts)
3. Trigger execution times
4. Database size growth

**Queries to Monitor**:
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%restaurant_order%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename IN ('restaurant_orders', 'restaurant_order_items', 'purchase_orders', 'purchase_order_items')
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('vendors', 'ingredient_vendor_mapping', 'restaurant_orders', 'purchase_orders')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Maintenance Tasks

**Monthly**:
- Vacuum analyze new tables
```sql
VACUUM ANALYZE vendors;
VACUUM ANALYZE ingredient_vendor_mapping;
```

**Quarterly**:
- Review index usage and remove unused indexes
- Update statistics for query planner
```sql
ANALYZE restaurant_orders;
ANALYZE restaurant_order_items;
ANALYZE purchase_orders;
ANALYZE purchase_order_items;
```

---

## Success Criteria

Migration is successful when:

- [ ] All 8 migration files execute without errors
- [ ] All validation queries return expected results
- [ ] All new tables exist with correct schema
- [ ] All new columns exist with correct data types
- [ ] All indexes created successfully
- [ ] All functions return expected results
- [ ] All triggers execute correctly
- [ ] No data loss in existing tables
- [ ] Rollback script tested and verified on staging
- [ ] Application can query new tables/columns without errors
- [ ] Performance benchmarks meet expectations (85% improvement)

---

## Next Steps After Migration

1. **Backend Implementation** (Task 1.2):
   - Update API endpoints to use new fields
   - Implement vendor management endpoints
   - Implement "Populate Lines" logic using `get_low_stock_items()`
   - Implement PO generation with consolidation

2. **Frontend Implementation** (Tasks 2.x):
   - Build split-view order entry UI
   - Implement tabbed interface
   - Build vendor selection components
   - Implement address input modals

3. **Testing** (Task 4.x):
   - Write API tests for new endpoints
   - Write integration tests for order-to-PO workflow
   - Perform user acceptance testing

4. **Documentation**:
   - Update API documentation
   - Create user guides for new features
   - Document vendor management workflows

---

## Support & Troubleshooting

### Common Errors

**Error**: `relation "vendors" does not exist`
- **Cause**: migration-005 not executed
- **Fix**: Run migration-005-create-vendors-table.sql

**Error**: `column "order_purpose" does not exist`
- **Cause**: migration-001 not executed
- **Fix**: Run migration-001-extend-restaurant-orders.sql

**Error**: `function get_low_stock_items() does not exist`
- **Cause**: migration-008 not executed
- **Fix**: Run migration-008-create-functions.sql

**Error**: `constraint violation on restaurant_order_items_status_check`
- **Cause**: Existing data has status not in new enum
- **Fix**: Update existing statuses before running migration-002 (see Issue 2 above)

### Getting Help

If you encounter issues during migration:

1. **Check migration logs** for specific error messages
2. **Run validation queries** to identify what's missing
3. **Review rollback script** if you need to revert changes
4. **Test on staging first** before production migration
5. **Contact database administrator** for complex issues

---

## Appendix A: Complete Execution Script

```bash
#!/bin/bash
# Execute all migrations in order
# Run from .project/features/FEATURE-20251125-ORDER-ENTRY/

echo "Starting database migrations for Order Entry feature..."

# Set your database connection string
DB_CONNECTION="postgresql://user:password@host:port/database"

# Migration 1
echo "Running migration-001..."
psql $DB_CONNECTION -f migration-001-extend-restaurant-orders.sql
if [ $? -ne 0 ]; then echo "Migration 001 failed!"; exit 1; fi

# Migration 2
echo "Running migration-002..."
psql $DB_CONNECTION -f migration-002-extend-order-items.sql
if [ $? -ne 0 ]; then echo "Migration 002 failed!"; exit 1; fi

# Migration 5 (vendors table first)
echo "Running migration-005..."
psql $DB_CONNECTION -f migration-005-create-vendors-table.sql
if [ $? -ne 0 ]; then echo "Migration 005 failed!"; exit 1; fi

# Migration 6
echo "Running migration-006..."
psql $DB_CONNECTION -f migration-006-create-ingredient-vendor-mapping.sql
if [ $? -ne 0 ]; then echo "Migration 006 failed!"; exit 1; fi

# Migration 3 (IMPORTANT: Manual step required after this)
echo "Running migration-003..."
echo "WARNING: Manual data migration required for supplier_id"
psql $DB_CONNECTION -f migration-003-extend-purchase-orders.sql
if [ $? -ne 0 ]; then echo "Migration 003 failed!"; exit 1; fi

echo "STOP: Populate vendors table and migrate supplier_id data"
echo "Press Enter when ready to continue..."
read

# Migration 4
echo "Running migration-004..."
psql $DB_CONNECTION -f migration-004-extend-po-items.sql
if [ $? -ne 0 ]; then echo "Migration 004 failed!"; exit 1; fi

# Migration 7
echo "Running migration-007..."
psql $DB_CONNECTION -f migration-007-create-indexes.sql
if [ $? -ne 0 ]; then echo "Migration 007 failed!"; exit 1; fi

# Migration 8
echo "Running migration-008..."
psql $DB_CONNECTION -f migration-008-create-functions.sql
if [ $? -ne 0 ]; then echo "Migration 008 failed!"; exit 1; fi

echo "All migrations completed successfully!"
echo "Run validation queries to verify migration success."
```

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-25 | Technical Architect Agent | Initial migration plan created |

---

**End of Database Migration Summary**
