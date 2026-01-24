# Quick Start: Vendor ERP Seed Data

## 3-Step Process

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click "SQL Editor" in the left sidebar
3. Create a new query

### Step 2: Run the Seed Data
1. Open the file: `backend/scripts/seed-vendor-data.sql`
2. Copy the **entire file** (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **"Run"** button

**Expected Time:** 5-10 seconds

### Step 3: Verify Import
Open terminal and run:
```bash
cd backend
node scripts/run-seed-vendor-data.js
```

**Expected Output:**
```
✓ Seed Vendors: 10
✓ Seed Addresses: 23
✓ Seed Contacts: 29
✓ Seed Payment Info: 10
✓ Seed Scorecards: 36
✓ Seed Documents: 30
✓ Seed Ingredient Mappings: ~95

✓✓✓ SEED DATA SUCCESSFULLY LOADED ✓✓✓
```

---

## What You Get

### 10 Realistic Vendors:
1. **Sysco Foods** - Large distributor (Grade A)
2. **US Foods** - Large distributor (Grade A)
3. **Local Farm Fresh** - Organic produce (Grade B)
4. **Harbor Seafood Co** - Premium seafood (Grade A)
5. **Prime Meats Inc** - Meat supplier (Grade B) - *EXPIRED insurance*
6. **Artisan Bakery Supply** - Small bakery (Grade C)
7. **Global Spice Traders** - Specialty spices (Grade A)
8. **Dairy Distributors LLC** - Regional dairy (Grade B) - *EXPIRED insurance*
9. **Restaurant Depot** - Cash & carry (Grade C)
10. **ChefWare Supply** - INACTIVE vendor (Grade D)

### Complete Data:
- ✅ Multiple contacts per vendor
- ✅ Multiple addresses (billing, shipping, etc.)
- ✅ Payment information with varied terms
- ✅ Performance scorecards with metrics
- ✅ Documents (some expired for testing)
- ✅ ~95 ingredient-vendor mappings with pricing

---

## Testing the UI

After seeding, test these features:

1. **Vendor List View**
   - Should show all 10 vendors
   - Filter by status (Active/Inactive)
   - Filter by grade (A/B/C/D)

2. **Vendor Detail View**
   - Click any vendor to see details
   - Check all tabs: Overview, Contacts, Addresses, Payment, Documents, Scorecards

3. **Document Alerts**
   - Prime Meats and Dairy Distributors should show expired insurance alerts

4. **Performance Grades**
   - Each vendor has a grade badge (A, B, C, or D)
   - View scorecard metrics for active vendors

5. **Ingredient Price Comparison**
   - Many ingredients have multiple vendors
   - Compare prices across vendors

---

## Troubleshooting

### "relation does not exist"
Run the vendor ERP database migrations first

### "violates foreign key constraint"
Make sure:
- Restaurant ID `1e9c773e-913f-4a9b-b812-5ee2b5a4b15a` exists
- Payment terms table is populated
- Ingredient library has the required ingredients

### "duplicate key value"
Seed data already exists. Clean it first:
```sql
DELETE FROM ingredient_vendor_mapping WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendor_documents WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendor_scorecards WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendor_payment_info WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendor_contacts WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendor_addresses WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendors WHERE vendor_code LIKE 'SEED-%';
```

---

## Need More Info?

Read the full documentation:
- **Detailed Guide:** `backend/scripts/SEED_DATA_README.md`
- **Completion Report:** `backend/SEED_DATA_COMPLETION_REPORT.md`

---

**Ready to seed?** Just follow the 3 steps above!
