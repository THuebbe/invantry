# 🚀 Quick Start: Database Migration

**Estimated Time:** 5-10 minutes

---

## Step 1: Open Supabase SQL Editor

Click this link: **https://app.supabase.com/project/uwgrpcuqakuxulgnbcpd/sql**

(Or navigate to: Supabase Dashboard → Your Project → SQL Editor)

---

## Step 2: Copy the Migration SQL

**File Location:**
```
.project/features/FEATURE-20251125-ORDER-ENTRY/ALL_MIGRATIONS_COMBINED.sql
```

**Or use individual files in this order:**
1. migration-001-extend-restaurant-orders.sql
2. migration-002-extend-order-items.sql
3. migration-005-create-vendors-table.sql
4. migration-006-create-ingredient-vendor-mapping.sql
5. migration-003-extend-purchase-orders.sql
6. migration-004-extend-po-items.sql
7. migration-007-create-indexes.sql
8. migration-008-create-functions.sql

---

## Step 3: Run the Migration

1. Paste the SQL into the editor
2. Click "Run" or press `Ctrl+Enter`
3. Wait for completion (should take 1-2 minutes)
4. Check for errors in the output panel

---

## Step 4: Verify Success

Run this query to verify everything worked:

```sql
-- Quick verification query
SELECT
  'Orders table' as check_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_orders' AND column_name = 'order_purpose'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END as result

UNION ALL

SELECT
  'Vendors table',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'vendors'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END

UNION ALL

SELECT
  'Functions created',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'get_low_stock_items'
  ) THEN '✅ PASS' ELSE '❌ FAIL' END;
```

**Expected Result:** All rows should show "✅ PASS"

---

## Step 5: (Optional) Seed Vendor Data

Add common vendors to your database:

```sql
-- Add Sysco
INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
SELECT id, 'Sysco Corporation', 'Sales', '1-800-967-9726', 'orders@sysco.com', 'Net 30', true
FROM restaurants
ON CONFLICT DO NOTHING;

-- Add US Foods
INSERT INTO vendors (restaurant_id, name, contact_name, phone, email, payment_terms, is_active)
SELECT id, 'US Foods', 'Sales', '1-877-879-3663', 'orders@usfoods.com', 'Net 30', true
FROM restaurants
ON CONFLICT DO NOTHING;

-- Verify
SELECT r.name as restaurant, COUNT(v.id) as vendor_count
FROM restaurants r
LEFT JOIN vendors v ON v.restaurant_id = r.id
GROUP BY r.name;
```

---

## ✅ Done!

Your database is now ready for the Order Entry & PO Split-View feature!

**Next Steps:**
1. Start your backend server: `cd backend && npm run dev`
2. Start your frontend server: `cd frontend && npm run dev`
3. Test the new order creation workflows

---

## 🆘 Troubleshooting

### Error: "relation already exists"
**Solution:** Table/function already exists from a previous run. This is safe to ignore or drop the existing object first.

### Error: "column already exists"
**Solution:** Column was already added. Safe to ignore.

### Error: "permission denied"
**Solution:** Ensure you're using the SERVICE_ROLE key in Supabase, not the ANON key.

### Need to rollback?
Run the `rollback-all.sql` file to undo all changes.

---

**Questions?** See `MIGRATION_INSTRUCTIONS.md` for detailed guidance.
