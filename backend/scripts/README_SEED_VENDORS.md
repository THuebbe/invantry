# Vendor Seed Data - Quick Start Guide

## TL;DR

The SQL file has issues with Supabase SQL Editor. Use the JavaScript seed script instead:

```bash
cd backend
node scripts/seed-vendors.js --clean
```

---

## What Happened?

The original `seed-vendor-data.sql` file gave this error in Supabase SQL Editor:

```
ERROR: invalid input syntax for type json
Token "Enclave" is invalid
```

**This was misleading.** The SQL was actually correct, but Supabase SQL Editor can't handle large multi-line INSERTs well.

---

## Solution: JavaScript Seed Script

We created a working JavaScript script that uses the Supabase client library.

### Usage

```bash
# Navigate to backend directory
cd backend

# Option 1: Seed vendors (keeps existing data)
node scripts/seed-vendors.js

# Option 2: Clean existing seed data and re-seed
node scripts/seed-vendors.js --clean
```

### What Gets Created

**9 vendors:**
1. Sysco Foods (SEED-SYS001) - Primary distributor
2. Local Farm Fresh (SEED-LFF001) - Organic produce
3. Harbor Seafood Co (SEED-HSC001) - Premium seafood
4. Prime Meats Inc (SEED-PMI001) - Quality meats
5. Artisan Bakery Supply (SEED-ABS001) - Breads and pastries
6. Global Spice Traders (SEED-GST001) - Spices
7. Dairy Distributors LLC (SEED-DDL001) - Dairy products
8. Restaurant Depot (SEED-RD001) - Cash & carry
9. ChefWare Supply (SEED-CWS001) - INACTIVE vendor

All vendors have:
- ✅ Unique vendor codes (SEED-*)
- ✅ Realistic contact information
- ✅ Legacy contact fields populated
- ✅ Realistic timestamps (created 2-12 months ago)
- ✅ Varied profiles and notes

---

## Verification

### Check what was created

```sql
SELECT vendor_code, name, is_active, created_at
FROM vendors
WHERE vendor_code LIKE 'SEED-%'
ORDER BY vendor_code;
```

### Utility Scripts

```bash
# View database schema
node scripts/check-vendors-schema.js

# List available payment terms
node scripts/check-payment-terms.js

# Test a single vendor insert
node scripts/test-vendor-insert.js
```

---

## Current Status

### ✅ Implemented (Working)
- Vendors table seeded
- 9 vendors with realistic data
- Clean and re-seed functionality

### ⏳ Not Yet Implemented (Future)
The script currently only creates vendors. Future enhancements could add:

- Vendor addresses (billing, shipping, remittance)
- Vendor contacts (sales reps, account managers)
- Vendor payment info (banking, credit limits)
- Vendor scorecards (performance metrics)
- Vendor documents (W9, contracts, pricing sheets)
- Ingredient-vendor mappings (pricing, availability)

**The original SQL file has all this data** and can serve as a reference.

---

## Why JavaScript Instead of SQL?

**Advantages:**
1. Works reliably (no parser issues)
2. Better error handling
3. Detailed logging
4. Supports flags like `--clean`
5. Can be extended easily
6. Part of automated setup scripts

**The SQL file is kept for reference** in case someone needs it for `psql` command-line tool.

---

## Documentation

Full documentation available:

- **`VENDOR_TABLE_SCHEMAS.md`** - Complete schema for all 8 tables
- **`SEED_DATA_FIX_SUMMARY.md`** - Problem analysis and solution
- **`SEED_DATA_FIX_COMPLETION_REPORT.md`** - Detailed completion report

---

## Questions?

If you need to seed additional data (addresses, contacts, etc.), you can either:

1. Extend the `seed-vendors.js` script with additional functions
2. Use the original SQL file as a reference for the data structure
3. Manually add via the application's vendor management interface

The database schema is fully documented in `VENDOR_TABLE_SCHEMAS.md`.

---

**Last Updated:** 2026-01-06
**Script Version:** 1.0 (vendors only)
**Restaurant ID:** 1e9c773e-913f-4a9b-b812-5ee2b5a4b15a
