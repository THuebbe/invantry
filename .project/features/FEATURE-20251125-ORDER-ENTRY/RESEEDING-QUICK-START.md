# Database Reseeding Quick Start Guide

## Overview
Fresh test data with package quantities for user `fakeemail@fake.net`

## What Was Created

1. **migration-009-package-quantities.sql** - Adds package tracking fields
2. **RESEED_TEST_DATA.sql** - Wipes and reseeds all test data
3. **VALIDATION_QUERIES.sql** - Verifies data integrity

## What You'll Get

- ✅ 30 fresh ingredients with realistic package quantities
- ✅ 3 vendors (Sysco, US Foods, Gordon Food Service)
- ✅ 30 ingredient-vendor mappings with realistic pricing
- ✅ 30 inventory items with varied stock levels (30% below par for testing)
- ✅ Expiration dates ranging from 1-90 days
- ✅ All dates current (no expired items)

## Execution Steps

### Step 1: Run Package Quantities Migration (5 minutes)

1. Open Supabase SQL Editor
2. Open file: `migration-009-package-quantities.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**
6. **Expected output**: "Success. No rows returned"

**Verify migration:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ingredient_library'
AND column_name IN ('package_quantity', 'item_quantity', 'item_uom');
```
Should return 3 rows.

---

### Step 2: Run Data Reseeding Script (1-2 minutes)

1. Still in Supabase SQL Editor
2. Open file: `RESEED_TEST_DATA.sql`
3. **Review lines 20-22** - Confirm user ID matches yours
4. Copy entire contents
5. Paste into SQL Editor
6. Click **Run**
7. **Expected output**: Progress messages ending with "DATA RESEEDING COMPLETE!"

**Sample output:**
```
NOTICE: User found: fakeemail@fake.net (0a55eb9c-1fa1-45d4-be38-c736b61bdd1e)
NOTICE: Business ID: [your-business-id]
NOTICE: Restaurant ID: [your-restaurant-id]
...
NOTICE: ✅ Seeded 30 ingredients with package quantities
NOTICE: ✅ Seeded 3 vendors
NOTICE: ✅ Mapped all ingredients to vendors with pricing
NOTICE: ✅ Seeded 30 inventory items with realistic stock levels
```

---

### Step 3: Validate Data (1 minute)

1. Still in Supabase SQL Editor
2. Open file: `VALIDATION_QUERIES.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**
6. Review results - **all checks should show ✅ PASS**

**Key validations:**
- ✅ 30 ingredients
- ✅ 3 vendors
- ✅ 30 ingredient-vendor mappings
- ✅ 30 inventory items
- ✅ Package quantities populated
- ✅ No orphaned data
- ✅ No negative values

---

### Step 4: Test in Application (5 minutes)

1. **Login**: Navigate to your app and login as `fakeemail@fake.net`

2. **Check Inventory Page**:
   - Should see 30 items with varied expiration dates
   - Some items should be below par (highlighted)
   - No expired items

3. **Test "Populate Lines"**:
   - Go to Orders → Create Quick Order
   - Click "Populate Lines" button
   - Should see low-stock items with suggested quantities
   - **NEW**: Each item shows package quantities (e.g., "2 bags × 5 lbs")

4. **Check Dashboard**:
   - Metrics should reflect fresh inventory
   - Low-stock warnings should appear
   - Total inventory value displayed

---

## Package Quantities Examples

After reseeding, you'll see realistic packaging like:

| Ingredient | Package Quantity | Item Quantity | Item UOM | Total |
|------------|------------------|---------------|----------|-------|
| Chicken Breast | 2 bags | 5 lbs | lbs | 10 lbs per case |
| Ground Beef | 4 tubes | 5 lbs | lbs | 20 lbs per case |
| Tomatoes | 1 box | 25 lbs | lbs | 25 lbs per case |
| Milk | 4 gallons | 1 gal | gal | 4 gal per case |
| Olive Oil | 6 bottles | 750 ml | ml | 4500 ml per case |
| Eggs | 15 dozen | 12 eggs | eggs | 180 eggs per flat |

## Inventory Stock Levels

Your inventory will have realistic distribution:

- **Below Par (30%)**: ~9 items - Triggers "Populate Lines"
- **At Par (40%)**: ~12 items - Normal stock levels
- **Above Par (30%)**: ~9 items - Well-stocked

## Vendor Mappings

Each ingredient is mapped to a preferred vendor:

- **Sysco**: Proteins, Dairy, Beverages
- **US Foods**: Produce
- **Gordon Food Service**: Dry Goods, Condiments

All have realistic pricing, lead times, and vendor item numbers.

---

## Troubleshooting

### Error: "User not found"
- Check user ID in RESEED_TEST_DATA.sql line 21
- Verify user exists: `SELECT * FROM users WHERE email = 'fakeemail@fake.net';`

### Error: "Column does not exist"
- Migration-009 wasn't run or failed
- Re-run migration-009-package-quantities.sql
- Check for errors in Supabase SQL Editor

### No low-stock items appearing
- Random distribution may have all items above par
- Manually adjust some inventory quantities in Supabase
- Or re-run RESEED_TEST_DATA.sql (random each time)

### Validation shows ❌ FAIL
- Check error message in validation output
- Review RESEED_TEST_DATA.sql for issues
- Check Supabase logs for constraint violations

---

## Rolling Back

If you need to start over:

```sql
-- Run cleanup only (preserves user/business/restaurant)
DELETE FROM waste_log WHERE restaurant_id = 'your-restaurant-id';
DELETE FROM restaurant_inventory WHERE restaurant_id = 'your-restaurant-id';
DELETE FROM ingredient_vendor_mapping WHERE vendor_id IN (SELECT id FROM vendors WHERE restaurant_id = 'your-restaurant-id');
DELETE FROM vendors WHERE restaurant_id = 'your-restaurant-id';
DELETE FROM ingredient_library;
```

Then re-run RESEED_TEST_DATA.sql.

---

## Next Steps

Once reseeding is complete:

1. ✅ **Test Order Creation**: Create orders with package quantities
2. ✅ **Test PO Generation**: Generate POs and verify consolidation
3. ✅ **Test Receiving**: Receive PO items with package quantities
4. ✅ **Verify Calculations**: Check that totals = package_qty × item_qty

---

## Files Location

```
.project/features/FEATURE-20251125-ORDER-ENTRY/
├── migration-009-package-quantities.sql  ← Run first
├── RESEED_TEST_DATA.sql                  ← Run second
├── VALIDATION_QUERIES.sql                ← Run third
└── RESEEDING-QUICK-START.md             ← This file
```

---

**Ready to test? Run the scripts in order and you'll have fresh, realistic test data! 🚀**
