# Vendor ERP Seed Data

## Overview

Comprehensive test data for the Vendor ERP module including 10 realistic vendors with complete address, contact, payment, document, scorecard, and ingredient mapping data.

This seed data enables thorough testing of all Vendor ERP features without requiring manual data entry.

## Quick Start

### Method 1: Run SQL Directly in Supabase (Recommended)

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `seed-vendor-data.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute

### Method 2: Use the JavaScript Runner (Verification Only)

```bash
cd backend
node scripts/run-seed-vendor-data.js
```

Note: This script primarily verifies data and provides instructions, as Supabase doesn't allow direct SQL execution via the client API for security reasons.

## Seed Data Contents

### 10 Vendors with Complete Profiles

1. **Sysco Foods (SEED-SYS001)** - Grade A Performance
   - Large national distributor
   - 3 addresses (billing, shipping, remittance)
   - 4 contacts (Account Manager, Customer Service, AR Manager, Delivery Coordinator)
   - 18 ingredient mappings (full-line distributor)
   - 3 documents (Insurance, W9, HACCP)
   - 4 scorecard metrics (Quality: 95, Delivery: 98, Price: 88, Service: 92)
   - Net 30 terms, ACH payment, $50k credit limit

2. **US Foods (SEED-USF001)** - Grade A Performance
   - Large national distributor, competitive on produce
   - 2 addresses (billing, shipping)
   - 3 contacts (Territory Manager, Customer Care, AR Specialist)
   - 9 ingredient mappings (strong produce selection)
   - 3 documents (Insurance expiring in 2 months, W9, Food Safety)
   - 4 scorecard metrics (Quality: 93, Delivery: 96, Price: 90, Service: 94)
   - Net 30 terms, ACH payment, $40k credit limit

3. **Local Farm Fresh (SEED-LFF001)** - Grade B Performance
   - Regional organic produce supplier
   - 2 addresses (farm office + loading dock)
   - 2 contacts (Owner, Farm Manager)
   - 8 ingredient mappings (organic produce only)
   - 3 documents (Insurance, Organic Certificate, W9)
   - 4 scorecard metrics (Quality: 97, Delivery: 82, Price: 75, Service: 88)
   - 2/10 Net 30 terms, Check payment, $5k credit limit

4. **Harbor Seafood Co (SEED-HSC001)** - Grade A Performance
   - Premium seafood specialist
   - 2 addresses (office, distribution dock)
   - 3 contacts (Sales Director, Quality Manager, AR)
   - 2 ingredient mappings (salmon, shrimp)
   - 4 documents (Insurance, HACCP, CA Fish Dealer License, W9)
   - 4 scorecard metrics (Quality: 99, Delivery: 100, Price: 85, Service: 96)
   - Net 30 terms, ACH payment, $25k credit limit

5. **Prime Meats Inc (SEED-PMI001)** - Grade B Performance
   - Meat supplier with occasional quality variance
   - 2 addresses (processing facility + loading bay)
   - 2 contacts (Sales Manager, Office Manager)
   - 4 ingredient mappings (chicken, beef, pork, bacon)
   - 3 documents (Insurance EXPIRED, USDA Inspection, W9)
   - 4 scorecard metrics (Quality: 88, Delivery: 84, Price: 82, Service: 80)
   - Net 45 terms, Wire Transfer, $30k credit limit

6. **Artisan Bakery Supply (SEED-ABS001)** - Grade C Performance
   - Small artisan bakery with delivery timing issues
   - 1 address (bakery/office combo)
   - 1 contact (Owner/Baker - requires 48hrs notice)
   - 3 ingredient mappings (flour, sugar, butter)
   - 2 documents (Business License, Food Handler Certificate)
   - 4 scorecard metrics (Quality: 92, Delivery: 70, Price: 78, Service: 75)
   - Net 60 terms, Check payment, $3k credit limit

7. **Global Spice Traders (SEED-GST001)** - Grade A Performance
   - Premium spice and seasoning specialist
   - 2 addresses (Manhattan office, NJ warehouse)
   - 3 contacts (VP Sales, Product Specialist, Accounting Manager)
   - 8 ingredient mappings (spices, herbs, olive oil)
   - 3 documents (Insurance, W9, FDA Import Certificate)
   - 4 scorecard metrics (Quality: 98, Delivery: 95, Price: 92, Service: 97)
   - Net 30 terms, ACH payment, $15k credit limit

8. **Dairy Distributors LLC (SEED-DDL001)** - Grade B Performance
   - Regional dairy products supplier
   - 2 addresses (dairy plant, cooler bay)
   - 2 contacts (Account Rep, Billing Coordinator)
   - 5 ingredient mappings (milk, butter, cheeses, cream)
   - 3 documents (Insurance EXPIRED, Dairy Processing Permit, W9)
   - 4 scorecard metrics (Quality: 86, Delivery: 88, Price: 85, Service: 83)
   - Net 30 terms, ACH payment, $10k credit limit

9. **Restaurant Depot (SEED-RD001)** - Grade C Performance
   - Cash and carry warehouse for emergency supplies
   - 1 address (warehouse location)
   - 1 contact (Store Manager)
   - 15 ingredient mappings (higher prices than distributors)
   - 1 document (Membership card)
   - 4 scorecard metrics (Quality: 80, Delivery: 100, Price: 72, Service: 65)
   - Due on Receipt terms, Cash payment, $0 credit

10. **ChefWare Supply (SEED-CWS001)** - Inactive Vendor (Grade D)
    - Previously used equipment supplier, now inactive
    - 1 address (Atlanta facility)
    - 1 contact (Sales Rep)
    - 0 ingredient mappings
    - 1 document (Old W9)
    - 0 scorecards (inactive)
    - Net 60 terms, Check payment, $0 credit limit

## Data Statistics

| Table | Count | Notes |
|-------|-------|-------|
| Vendors | 10 | 9 active, 1 inactive |
| Vendor Addresses | 23 | Multiple types per vendor |
| Vendor Contacts | 29 | 10 primary, 19 secondary |
| Vendor Payment Info | 10 | One per vendor with complete payment details |
| Vendor Scorecards | 36 | 4 metrics per active vendor (9 vendors) |
| Vendor Documents | 30 | Mix of current, expiring, and expired |
| Ingredient Mappings | ~95 | Realistic pricing and package sizes |

## Testing Scenarios Enabled

This seed data supports testing:

### 1. Vendor Management
- [x] Creating/editing vendors with complete profiles
- [x] Activating/deactivating vendors
- [x] Viewing vendor performance grades (A, B, C, D)
- [x] Filtering by status and grade

### 2. Contact Management
- [x] Multiple contacts per vendor with different roles
- [x] Primary vs secondary contact designation
- [x] Order and invoice recipient preferences
- [x] Contact search and filtering

### 3. Address Management
- [x] Multiple address types (billing, shipping, remittance, ship_from)
- [x] Primary address per type
- [x] Complete address information with phone/email

### 4. Payment Information
- [x] Various payment terms (Net 30, Net 45, Net 60, 2/10 Net 30, Due on Receipt)
- [x] Multiple payment methods (ACH, Check, Wire Transfer, Cash)
- [x] Credit limits and tax IDs
- [x] Bank account information (masked)

### 5. Performance Tracking
- [x] Scorecard metrics (Quality, Delivery, Price, Service)
- [x] Historical performance data
- [x] Grade calculation based on scores
- [x] Performance trends over time

### 6. Document Management
- [x] Multiple document types (Insurance, W9, Food Safety, Business License)
- [x] Current, expiring soon, and expired documents
- [x] Expiration tracking and alerts
- [x] Document metadata (issue dates, notes)

### 7. Ingredient-Vendor Relationships
- [x] Vendor item codes and descriptions
- [x] Pricing and package sizes
- [x] Lead times and minimum order quantities
- [x] Preferred vendor designation
- [x] Price comparison across vendors

### 8. Edge Cases and Real-World Scenarios
- [x] Expired insurance certificates (Prime Meats, Dairy Distributors)
- [x] Small vendors with limited availability (Artisan Bakery)
- [x] Cash-only vendors (Restaurant Depot)
- [x] Inactive vendors with historical data (ChefWare Supply)
- [x] Premium pricing for specialty items (Harbor Seafood, Global Spice)
- [x] Organic products at higher prices (Local Farm Fresh)

## Cleaning Seed Data

To remove all seed data from the database:

```sql
-- Run these in Supabase SQL Editor in this order (reverse dependency)
DELETE FROM ingredient_vendor_mapping WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendor_documents WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendor_scorecards WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendor_payment_info WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendor_contacts WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendor_addresses WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
DELETE FROM vendors WHERE vendor_code LIKE 'SEED-%';
```

Alternatively, uncomment the cleanup section at the top of `seed-vendor-data.sql` and run it.

## Verification Queries

After seeding, verify the data:

```sql
-- Count records in each table
SELECT 'Vendors' as table_name, COUNT(*) as count FROM vendors WHERE vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Addresses', COUNT(*) FROM vendor_addresses va JOIN vendors v ON va.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Contacts', COUNT(*) FROM vendor_contacts vc JOIN vendors v ON vc.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Payment Info', COUNT(*) FROM vendor_payment_info vpi JOIN vendors v ON vpi.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Scorecards', COUNT(*) FROM vendor_scorecards vs JOIN vendors v ON vs.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Documents', COUNT(*) FROM vendor_documents vd JOIN vendors v ON vd.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Ingredient Mappings', COUNT(*) FROM ingredient_vendor_mapping ivm JOIN vendors v ON ivm.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%';
```

Expected results:
- Vendors: 10
- Addresses: 23
- Contacts: 29
- Payment Info: 10
- Scorecards: 36
- Documents: 30
- Ingredient Mappings: ~95

## Notes and Considerations

### Restaurant ID
All seed data is associated with restaurant_id: `1e9c773e-913f-4a9b-b812-5ee2b5a4b15a`

If your restaurant has a different ID, you'll need to update this value in the SQL file before running.

### Ingredient Library
The ingredient mappings reference existing ingredients in the `ingredient_library` table. The seed data assumes you have at least these ingredients:
- Tomatoes (Roma)
- Lettuce (Romaine)
- Onions (Yellow)
- Bell Peppers (Mixed)
- Mushrooms (Button)
- Carrots
- Celery
- Potatoes (Russet)
- Chicken Breast (Boneless)
- Ground Beef (80/20)
- Salmon Fillets (Atlantic)
- Shrimp (31/40 ct)
- Pork Chops (Center Cut)
- Bacon (Applewood Smoked)
- Eggs (Large)
- Milk (Whole)
- Butter (Unsalted)
- Cheddar Cheese (Sharp)
- Mozzarella Cheese (Shredded)
- Heavy Cream
- Olive Oil (Extra Virgin)
- Salt (Kosher)
- Black Pepper (Ground)
- Garlic Powder
- Paprika
- Cumin (Ground)
- Oregano (Dried)
- Basil (Dried)
- All-Purpose Flour
- Granulated Sugar

If these ingredients don't exist, the ingredient mapping inserts will fail. Create them first or modify the SQL to match your ingredient library.

### Payment Terms
The seed data references the standard payment terms that should already exist in your `payment_terms` table:
- Due on Receipt (0 days)
- Net 15 (15 days)
- Net 30 (30 days)
- 2/10 Net 30 (30 days with 2% discount)
- Net 45 (45 days)
- Net 60 (60 days)

If these don't exist, create them first or modify the SQL.

### Realistic Pricing
All prices are realistic wholesale restaurant pricing based on 2024-2025 market rates:
- Produce: $12-35 per 25 lb case
- Proteins: $3-6 per lb
- Dairy: $3-6 per unit
- Spices: $7-12 per lb
- Oils: $32-42 per liter

### Document URLs
Document file URLs are placeholders (https://example.com/docs/...). These demonstrate the structure but don't link to actual files. In production, these would be real cloud storage URLs (S3, Supabase Storage, etc.).

## Troubleshooting

### Issue: "relation does not exist"
**Solution:** Ensure all Vendor ERP tables are created. Run the database migration scripts first.

### Issue: "violates foreign key constraint"
**Solution:** Check that:
1. Restaurant ID exists in `restaurants` table
2. Ingredient names match exactly what's in `ingredient_library`
3. Payment terms exist in `payment_terms` table

### Issue: "duplicate key value"
**Solution:** Seed data may already exist. Run the cleanup queries first, then re-seed.

### Issue: Ingredient mappings failing
**Solution:** Verify ingredient names match exactly (case-sensitive). Run this query to see your ingredients:
```sql
SELECT name, category FROM ingredient_library ORDER BY category, name;
```

## Next Steps After Seeding

1. **Test Vendor List View**
   - Navigate to Vendor ERP module
   - Verify all 10 vendors appear
   - Test filtering by status and grade
   - Test search functionality

2. **Test Vendor Detail Views**
   - Click into each vendor
   - Verify all tabs load (Overview, Contacts, Addresses, Payment, Documents, Scorecards)
   - Test CRUD operations on each tab

3. **Test Performance Features**
   - View scorecard metrics
   - Check grade calculations
   - Verify performance trends

4. **Test Document Management**
   - View document list
   - Check expiration status (should see expired docs for Prime Meats and Dairy Distributors)
   - Test upload/delete (if implemented)

5. **Test Ingredient Relationships**
   - View vendor items
   - Compare prices across vendors for same ingredients
   - Test preferred vendor functionality

## Support

If you encounter issues with the seed data:
1. Check the Supabase SQL Editor for error messages
2. Verify all prerequisite data exists (payment_terms, ingredients)
3. Review the troubleshooting section above
4. Check that your restaurant_id matches the one in the SQL file

---

**Created:** 2026-01-03
**Purpose:** Comprehensive test data for Vendor ERP module
**Version:** 1.0
**Restaurant ID:** 1e9c773e-913f-4a9b-b812-5ee2b5a4b15a
