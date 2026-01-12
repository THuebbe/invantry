# Vendor Seed Script Documentation

## Overview

`seed-vendor-complete.js` is a comprehensive seed script that populates the database with realistic vendor data for testing the Vendor ERP module.

## Usage

```bash
# Run from the backend directory
cd backend

# Seed vendor data (keeps existing data)
node scripts/seed-vendor-complete.js

# Clean ALL vendor data and reseed
node scripts/seed-vendor-complete.js --clean
```

## ⚠️ WARNING: --clean Flag

The `--clean` flag will **DELETE ALL** vendor-related data for the restaurant, including:
- All vendors (including non-SEED vendors)
- All vendor addresses
- All vendor contacts
- All vendor payment info
- All ingredient-vendor mappings
- All vendor scorecards and documents
- All purchase orders and items
- All restaurant orders and items

**Only use `--clean` in development/test environments!**

## Data Seeded

### Vendors (9 total)
- **SEED-SYS-001**: Sysco Corporation (Broadline distributor)
- **SEED-HSC-002**: Harbor Seafood Company (Seafood specialty)
- **SEED-LFF-003**: Local Farm Fresh (Organic produce)
- **SEED-PMC-004**: Prime Meats Co. (Protein specialist)
- **SEED-DDI-005**: Dairy Distributors Inc. (Dairy products)
- **SEED-GST-006**: Global Spice Trading (Spices & seasonings)
- **SEED-ABC-007**: Artisan Bakery Co-op (Bakery products)
- **SEED-RDP-008**: Restaurant Depot (Cash & carry)
- **SEED-INA-009**: Inactive Vendor Example (For testing filters)

### Addresses (2-3 per vendor)
- **Primary** address (marked as is_primary)
- **Ship From** warehouse address
- **Remittance** address (50% of vendors)

### Contacts (2-4 per vendor)
- Primary contact (Account Manager)
- Secondary contacts (Sales Rep, Customer Service, Billing Contact, Delivery Coordinator)
- Realistic names, emails, phone numbers
- Proper role assignments

### Payment Info (1 per active vendor)
- Linked to actual payment_terms records (Net 30, Net 45, Net 60)
- Masked bank account and routing numbers
- Realistic Tax ID (EIN format)
- Credit limits ranging from $20k-$110k
- Payment methods: ACH or Check

### Ingredient Mappings (10-20 per vendor)
- Realistic vendor-specific product assignments:
  - Sysco: Broad range (proteins, produce, dairy, dry goods)
  - Harbor Seafood: Seafood items only
  - Local Farm Fresh: Produce and vegetables
  - Prime Meats: Proteins only
  - Dairy Distributors: Dairy products
  - Global Spice: Spices (if available in library)
  - Artisan Bakery: Bakery items
  - Restaurant Depot: Mixed variety
- Realistic wholesale pricing ($5-$100 per unit)
- Lead times (1-7 days)
- Minimum order quantities
- Some marked as "preferred" vendors

### Scorecards
**Currently skipped** due to schema mismatch - needs investigation.

## Verification

After running the script, verify the data:

```sql
-- Check all seeded vendors
SELECT vendor_code, name, is_active
FROM vendors
WHERE vendor_code LIKE 'SEED-%';

-- Count addresses per vendor
SELECT v.name, COUNT(va.id) as address_count
FROM vendors v
LEFT JOIN vendor_addresses va ON v.id = va.vendor_id
WHERE v.vendor_code LIKE 'SEED-%'
GROUP BY v.name;

-- Count contacts per vendor
SELECT v.name, COUNT(vc.id) as contact_count
FROM vendors v
LEFT JOIN vendor_contacts vc ON v.id = vc.vendor_id
WHERE v.vendor_code LIKE 'SEED-%'
GROUP BY v.name;

-- Check ingredient mappings
SELECT v.name, COUNT(ivm.id) as ingredient_count
FROM vendors v
LEFT JOIN ingredient_vendor_mapping ivm ON v.id = ivm.vendor_id
WHERE v.vendor_code LIKE 'SEED-%'
GROUP BY v.name;

-- Check payment info
SELECT v.name, vpi.preferred_payment_method, vpi.credit_limit
FROM vendors v
LEFT JOIN vendor_payment_info vpi ON v.id = vpi.vendor_id
WHERE v.vendor_code LIKE 'SEED-%';
```

## Frontend Testing

With this seeded data, you can now test:

1. **Vendor List Page** - Should show 9 vendors (8 active, 1 inactive)
2. **Vendor Details - Overview Tab** - Shows vendor info, contacts, addresses
3. **Vendor Details - Addresses Tab** - Shows 2-3 addresses with types
4. **Vendor Details - Contacts Tab** - Shows 2-4 contacts with roles
5. **Vendor Details - Payment Tab** - Shows payment terms and banking info (masked)
6. **Vendor Details - Items Tab** - Shows 10-20 ingredients per vendor
7. **Vendor Details - Performance Tab** - Will be empty (scorecards skipped)

## Known Issues

### Schema Mismatches Fixed

1. **vendor_addresses.address_type** - Valid values: `billing`, `remittance`, `ship_from`, `warehouse`, `primary`, `other`
2. **vendor_contacts** - No `contact_type` field, uses `role` instead
3. **ingredient_vendor_mapping** - Uses `unit_cost` not `cost_per_unit`, `vendor_item_number` not `vendor_item_code`

### Schema Issues Remaining

1. **vendor_payment_info.preferred_payment_method** - Database constraint is more restrictive than service validation
   - Service allows: ACH, Wire, Check, Credit Card, Other
   - Database only allows: ACH, Check (based on testing)
   - **Workaround**: Seed script only uses ACH and Check
   - **Needs**: Database constraint should be updated to match service validation

2. **vendor_scorecards** - Schema unknown, columns don't match service expectations
   - **Status**: Skipped in seed script
   - **Needs**: Investigation of actual table schema

## Maintenance

If you need to modify the seed data:

1. Edit the `VENDORS` array at the top of the script
2. Adjust quantities in each `seed*()` function
3. Run with `--clean` to test your changes

## Dependencies

- Node.js with ES modules support
- @supabase/supabase-js
- dotenv
- Valid SUPABASE_URL and SUPABASE_SERVICE_KEY in .env

## Restaurant ID

The script is currently hardcoded to seed for restaurant ID:
```
1e9c773e-913f-4a9b-b812-5ee2b5a4b15a
```

To seed for a different restaurant, modify the `RESTAURANT_ID` constant at the top of the script.
