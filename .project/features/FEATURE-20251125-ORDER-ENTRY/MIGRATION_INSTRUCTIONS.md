# Database Migration Instructions
## Order Entry & PO Split-View Feature

**Feature ID:** FEATURE-20251125-ORDER-ENTRY
**Date:** 2025-11-26
**Estimated Time:** 10-15 minutes

---

## 🎯 Quick Start

You have 2 options for running these migrations:

### Option A: Run All Migrations at Once (Recommended)
1. Open Supabase SQL Editor: https://app.supabase.com/project/uwgrpcuqakuxulgnbcpd/sql
2. Copy and paste the contents of `ALL_MIGRATIONS_COMBINED.sql` (will be created below)
3. Click "Run" to execute all migrations
4. Verify success with validation queries

### Option B: Run Migrations Step-by-Step
1. Execute each migration file individually in order (see below)
2. Verify each step before proceeding

---

## 📋 Migration Files (Execution Order)

### Phase 1: Table Extensions (2 migrations)
```
1. migration-001-extend-restaurant-orders.sql      ← Start here
2. migration-002-extend-order-items.sql
```

### Phase 2: New Tables (2 migrations)
```
3. migration-005-create-vendors-table.sql
4. migration-006-create-ingredient-vendor-mapping.sql
```

### Phase 3: PO Extensions (2 migrations)
```
5. migration-003-extend-purchase-orders.sql        ← ⚠️ Manual steps required after
6. migration-004-extend-po-items.sql
```

### Phase 4: Performance & Logic (2 migrations)
```
7. migration-007-create-indexes.sql
8. migration-008-create-functions.sql              ← Finish here
```

---

## ⚠️ Important Notes

### Before Starting
- ✅ Backup your database (Supabase does this automatically, but verify)
- ✅ Ensure no users are actively creating orders/POs
- ✅ Estimated downtime: < 5 minutes

### Critical Step: Migration 003
After running `migration-003-extend-purchase-orders.sql`:

**STOP and run this data migration:**

```sql
-- Step 1: Create vendors for existing purchase orders
INSERT INTO vendors (restaurant_id, name, contact_name, is_active)
SELECT DISTINCT
    p.restaurant_id,
    p.supplier_name,
    'Contact',
    true
FROM purchase_orders p
WHERE p.supplier_name IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 2: Map supplier_id_new to vendor IDs
UPDATE purchase_orders p
SET supplier_id_new = v.id
FROM vendors v
WHERE p.supplier_name = v.name
  AND p.restaurant_id = v.restaurant_id;

-- Step 3: Verify all POs have supplier_id_new populated
SELECT count(*) as unmapped_pos
FROM purchase_orders
WHERE supplier_id_new IS NULL AND supplier_name IS NOT NULL;
-- Should return 0

-- Step 4: Now you can proceed with migration-004
```

---

## ✅ Post-Migration Verification

Run these queries to verify everything worked:

```sql
-- 1. Check new columns exist
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('restaurant_orders', 'restaurant_order_items', 'purchase_orders', 'purchase_order_items')
AND column_name IN ('order_purpose', 'item_name', 'quantity_on_po', 'ship_to_address', 'source_order_item_ids')
ORDER BY table_name, column_name;
-- Should return 5 rows

-- 2. Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('vendors', 'ingredient_vendor_mapping')
ORDER BY table_name;
-- Should return 2 rows

-- 3. Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_ingredient_quantity_on_order', 'calculate_suggested_reorder_quantity', 'get_low_stock_items')
ORDER BY routine_name;
-- Should return 3 rows

-- 4. Check indexes created
SELECT count(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
AND (indexname LIKE '%restaurant_order%' OR indexname LIKE '%purchase_order%' OR indexname LIKE '%vendor%');
-- Should return ~15-20 indexes

-- 5. Test a database function
SELECT * FROM get_low_stock_items(
    (SELECT id FROM restaurants LIMIT 1)
) LIMIT 5;
-- Should return low stock items (or empty if none)
```

---

## 🌱 Optional: Seed Vendor Data

After migrations complete, you may want to add common vendors:

```sql
-- Add Sysco to all restaurants
INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
SELECT
    id as restaurant_id,
    'Sysco Corporation',
    'Sales Department',
    '1-800-967-9726',
    'orders@sysco.com',
    'Net 30',
    true
FROM restaurants
ON CONFLICT DO NOTHING;

-- Add US Foods to all restaurants
INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
SELECT
    id as restaurant_id,
    'US Foods',
    'Sales Department',
    '1-877-879-3663',
    'orders@usfoods.com',
    'Net 30',
    true
FROM restaurants
ON CONFLICT DO NOTHING;

-- Add Gordon Food Service
INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
SELECT
    id as restaurant_id,
    'Gordon Food Service',
    'Sales Department',
    '1-866-236-4673',
    'orders@gfs.com',
    'Net 30',
    true
FROM restaurants
ON CONFLICT DO NOTHING;

-- Verify vendors created
SELECT r.name as restaurant_name, v.name as vendor_name
FROM restaurants r
JOIN vendors v ON v.restaurant_id = r.id
ORDER BY r.name, v.name;
```

---

## 🔄 Rollback (If Needed)

If you encounter issues and need to rollback:

```bash
# Run the rollback script
# File: rollback-all.sql

⚠️ WARNING: This will DELETE:
- All new columns (order_purpose, quantity_on_po, etc.)
- All new tables (vendors, ingredient_vendor_mapping)
- All new functions and triggers
- All new indexes

Existing data in other columns will be preserved.
```

---

## 📊 Migration Progress Checklist

- [ ] Phase 1: Table Extensions complete
- [ ] Phase 2: New Tables complete
- [ ] Phase 3: PO Extensions complete
  - [ ] Migration 003 executed
  - [ ] Vendor data migration complete
  - [ ] Verification passed
  - [ ] Migration 004 executed
- [ ] Phase 4: Performance & Logic complete
- [ ] Post-migration verification passed
- [ ] Vendor seed data added (optional)
- [ ] Test database functions working

---

## 🆘 Troubleshooting

### Error: "column already exists"
**Solution:** Migration was partially run. Check which columns exist and skip those migrations.

### Error: "function already exists"
**Solution:** Functions were already created. You can safely skip migration-008 or drop the functions first.

### Error: "relation vendors does not exist"
**Solution:** You need to run migration-005 first before migration-003 data migration.

### Error: "constraint violation"
**Solution:** Existing data may not meet new constraints. Review data and adjust before migration.

---

## 📞 Support

If you encounter issues:
1. Check the `database-migration-summary.md` for detailed information
2. Review individual migration files for comments
3. Use the rollback script if needed to revert changes

---

**Ready to proceed?**
1. Open Supabase SQL Editor
2. Follow the migration order above
3. Run verification queries
4. Start testing!
