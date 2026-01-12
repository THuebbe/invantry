# Phase 2 Quick Reference Guide

## Migration Execution Order

```bash
# Run in this exact order:
psql -d your_database -f migration-017-extend-ingredient-vendor-mapping.sql
psql -d your_database -f migration-018-create-vendor-documents.sql
psql -d your_database -f migration-019-create-vendor-scorecards.sql
psql -d your_database -f migration-020-migrate-existing-vendor-data.sql  # ⚠️ CRITICAL
psql -d your_database -f migration-021-create-indexes-triggers.sql
```

## Critical Warning

⚠️ **DO NOT use `ingredient_vendor_mapping` table between migrations 017 and 020**

- Migration 017: Adds `restaurant_id` as NULLABLE
- Migration 020: Populates `restaurant_id` from `vendors.restaurant_id`
- Migration 020: Makes `restaurant_id` NOT NULL

## What Each Migration Does

### Migration 017: Extend ingredient_vendor_mapping
Adds 11 new fields to existing table:
- `restaurant_id` - Multi-tenancy (populated in migration 020)
- `vendor_item_description` - Vendor's item description
- `currency` - Currency for unit_cost (default: USD)
- `package_size` - Size of individual package (e.g., 5 for "5 lb bag")
- `package_unit` - Unit (e.g., "lb", "kg", "oz")
- `case_quantity` - Number of packages per case
- `last_price_update` - Auto-tracked when unit_cost changes
- `price_effective_date` - When pricing became effective
- `price_expiration_date` - When pricing expires
- `is_active` - Item availability (default: true)
- `discontinue_date` - When vendor discontinued item

### Migration 018: Create vendor_documents
New table for compliance and pricing documents:
- 16 document types (W9, contracts, insurance, pricing_sheet, etc.)
- File storage fields (file_url, file_path, file_size_bytes, mime_type)
- **Generated column**: `is_expired` (computed from expiration_date)
- **Special feature**: `is_current` flag for pricing sheets
- Expiration tracking with reminder system

### Migration 019: Create vendor_scorecards
Performance metrics tracking:
- 11 metric types (on_time_delivery_pct, order_accuracy_pct, fill_rate_pct, etc.)
- Period tracking (period_start, period_end)
- Normalized scoring (0-100 score + raw metric_value)
- Data transparency (data_points_count)

### Migration 020: Migrate Existing Data ⚠️ CRITICAL
Safely migrates old data to new schema:
1. **Populate ingredient_vendor_mapping.restaurant_id** from vendors
2. **Migrate vendors.address (JSONB)** → vendor_addresses table
3. **Migrate vendors.contact_name** → vendor_contacts (split first/last name)
4. **Migrate vendors.payment_terms** → vendor_payment_info.payment_terms_id

Includes:
- Pre/post validation with data counts
- Idempotent design (can re-run safely)
- Complete rollback script

### Migration 021: Indexes & Triggers
Performance and automation:
- Updated_at triggers for all tables
- **Price tracking trigger**: Auto-updates `last_price_update` when `unit_cost` changes
- **Audit logging**: Tracks all changes to vendor payment info
- 18+ performance indexes for multi-tenant queries

## Key Business Rules

### Price Tracking (Automatic)
When you UPDATE `ingredient_vendor_mapping.unit_cost`:
- `last_price_update` is automatically set to NOW()
- `price_effective_date` is set to CURRENT_DATE (if not already set)

```sql
-- Example: Update price
UPDATE ingredient_vendor_mapping
SET unit_cost = 12.50
WHERE id = '<mapping_uuid>';

-- Automatically triggers:
-- last_price_update = NOW()
-- price_effective_date = CURRENT_DATE (if NULL)
```

### Single Current Pricing Sheet
When you set a pricing sheet as `is_current=true`:
- All other pricing sheets for that vendor are set to `is_current=false`

```sql
-- Example: Upload new pricing sheet
INSERT INTO vendor_documents (
    vendor_id, restaurant_id, document_type, document_name, is_current
) VALUES (
    '<vendor_uuid>', '<restaurant_uuid>', 'pricing_sheet', '2025 Pricing', true
);

-- Automatically triggers:
-- UPDATE vendor_documents SET is_current = false
-- WHERE vendor_id = '<vendor_uuid>' AND document_type = 'pricing_sheet' AND id != NEW.id
```

### Audit Logging
All changes to `vendor_payment_info` are logged:
- INSERT, UPDATE, DELETE operations tracked
- Stores old_data and new_data as JSONB
- Includes changed_at timestamp

```sql
-- View audit trail
SELECT
    operation,
    changed_at,
    old_data->>'credit_limit' as old_credit_limit,
    new_data->>'credit_limit' as new_credit_limit
FROM vendor_payment_info_audit
WHERE vendor_id = '<vendor_uuid>'
ORDER BY changed_at DESC;
```

## Multi-Tenancy Pattern

**CRITICAL**: Every query MUST filter by `restaurant_id`

```javascript
// ✅ CORRECT
const { data } = await supabase
  .from('ingredient_vendor_mapping')
  .select('*')
  .eq('vendor_id', vendorId)
  .eq('restaurant_id', restaurantId)  // Required!
  .eq('is_active', true);

// ❌ WRONG - Missing restaurant_id filter
const { data } = await supabase
  .from('ingredient_vendor_mapping')
  .select('*')
  .eq('vendor_id', vendorId);
```

## Validation Queries

### Verify Migration 020 Success
```sql
-- Check restaurant_id is NOT NULL
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'ingredient_vendor_mapping' AND column_name = 'restaurant_id';
-- Expected: is_nullable = 'NO'

-- Check all mappings have restaurant_id
SELECT COUNT(*) as total, COUNT(restaurant_id) as with_restaurant_id
FROM ingredient_vendor_mapping;
-- Expected: total = with_restaurant_id

-- Verify multi-tenant isolation
SELECT
    r.name as restaurant_name,
    COUNT(DISTINCT v.id) as vendor_count,
    COUNT(DISTINCT ivm.id) as vendor_item_count
FROM restaurants r
LEFT JOIN vendors v ON r.id = v.restaurant_id
LEFT JOIN ingredient_vendor_mapping ivm ON v.id = ivm.vendor_id AND r.id = ivm.restaurant_id
GROUP BY r.id, r.name;
```

### Verify Triggers Work
```sql
-- Test price tracking trigger
UPDATE ingredient_vendor_mapping
SET unit_cost = unit_cost + 1.00
WHERE vendor_item_number = 'TEST-001';

-- Verify last_price_update was set
SELECT
    vendor_item_number,
    unit_cost,
    last_price_update,
    price_effective_date
FROM ingredient_vendor_mapping
WHERE vendor_item_number = 'TEST-001';
-- Expected: last_price_update = NOW(), price_effective_date = CURRENT_DATE
```

## Common Use Cases

### Find Active Vendor Items for PO Generation
```sql
SELECT
    ivm.id,
    ivm.vendor_item_number,
    ivm.vendor_item_description,
    ivm.unit_cost,
    ivm.currency,
    ivm.package_size,
    ivm.package_unit,
    ivm.case_quantity,
    ivm.minimum_order_qty,
    ivm.lead_time_days
FROM ingredient_vendor_mapping ivm
WHERE ivm.vendor_id = '<vendor_uuid>'
AND ivm.restaurant_id = '<restaurant_uuid>'
AND ivm.is_active = true
AND (ivm.discontinue_date IS NULL OR ivm.discontinue_date > CURRENT_DATE)
ORDER BY ivm.vendor_item_number;
```

### Find Expired Documents
```sql
SELECT
    v.name as vendor_name,
    vd.document_type,
    vd.document_name,
    vd.expiration_date,
    vd.expiration_date - CURRENT_DATE as days_overdue
FROM vendor_documents vd
JOIN vendors v ON vd.vendor_id = v.id
WHERE vd.is_expired = true
AND vd.restaurant_id = '<restaurant_uuid>'
ORDER BY vd.expiration_date;
```

### Find Documents Expiring Soon
```sql
SELECT
    v.name as vendor_name,
    vd.document_type,
    vd.document_name,
    vd.expiration_date,
    vd.expiration_date - CURRENT_DATE as days_until_expiration
FROM vendor_documents vd
JOIN vendors v ON vd.vendor_id = v.id
WHERE vd.expiration_date IS NOT NULL
AND vd.is_expired = false
AND vd.expiration_date <= CURRENT_DATE + INTERVAL '30 days'
AND vd.restaurant_id = '<restaurant_uuid>'
ORDER BY vd.expiration_date;
```

### Get Current Pricing Sheet
```sql
SELECT
    v.name as vendor_name,
    vd.document_name,
    vd.issue_date,
    vd.file_url
FROM vendor_documents vd
JOIN vendors v ON vd.vendor_id = v.id
WHERE vd.document_type = 'pricing_sheet'
AND vd.is_current = true
AND vd.restaurant_id = '<restaurant_uuid>';
```

### Get Latest Vendor Scorecards
```sql
SELECT
    vs.metric_name,
    vs.metric_value,
    vs.score,
    vs.period_start,
    vs.period_end,
    vs.data_points_count
FROM vendor_scorecards vs
WHERE vs.vendor_id = '<vendor_uuid>'
AND vs.restaurant_id = '<restaurant_uuid>'
AND vs.period_start = (
    SELECT MAX(period_start)
    FROM vendor_scorecards
    WHERE vendor_id = '<vendor_uuid>'
)
ORDER BY vs.metric_name;
```

## Rollback Instructions (Emergency Only)

If you need to rollback migration 020:

```sql
-- 1. Revert restaurant_id to nullable
ALTER TABLE ingredient_vendor_mapping
ALTER COLUMN restaurant_id DROP NOT NULL;

-- 2. Clear restaurant_id values
UPDATE ingredient_vendor_mapping SET restaurant_id = NULL;

-- 3. Delete migrated vendor addresses
DELETE FROM vendor_addresses WHERE address_type = 'primary';

-- 4. Delete migrated vendor contacts
DELETE FROM vendor_contacts WHERE is_primary = true AND role = 'Primary Contact';

-- 5. Delete migrated vendor payment info
DELETE FROM vendor_payment_info;

-- Verify rollback
SELECT COUNT(*) as mappings_with_null_restaurant_id
FROM ingredient_vendor_mapping
WHERE restaurant_id IS NULL;
-- Expected: Should match total mappings count
```

## Next Steps

After migrations complete:
1. Update API service layer to use new fields
2. Implement document upload endpoints
3. Create scorecard calculation background jobs
4. Add multi-tenancy filters to all vendor queries
5. Test price tracking trigger with real data
6. Set up expiration reminder notifications

---

**Generated by**: backend-specialist agent
**Date**: 2025-12-29
