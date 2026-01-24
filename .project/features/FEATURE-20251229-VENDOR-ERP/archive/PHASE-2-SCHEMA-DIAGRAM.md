# Phase 2 Database Schema Diagram

## Table Relationships - Phase 2 Additions

```
restaurants (existing)
    |
    +---> vendors (existing, extended in Phase 1)
            |
            +---> vendor_addresses (Phase 1)
            |       - Multiple addresses per vendor
            |       - Types: primary, billing, remittance, ship_from, warehouse
            |
            +---> vendor_contacts (Phase 1)
            |       - Multiple contacts per vendor
            |       - Roles: Sales Rep, Account Manager, Billing Contact
            |
            +---> vendor_payment_info (Phase 1)
            |       - One-to-one with vendor
            |       - Banking info, payment terms, credit limit
            |       - FK to payment_terms (platform-wide)
            |       - AUDIT TABLE: vendor_payment_info_audit
            |
            +---> vendor_purchasing_data (Phase 1)
            |       - One-to-one with vendor
            |       - Lead time, min/max order values, freight terms
            |
            +---> vendor_documents (Phase 2) ⭐ NEW
            |       - Multiple documents per vendor
            |       - Types: W9, contracts, insurance, pricing_sheet
            |       - Generated column: is_expired
            |       - Special: is_current flag for pricing sheets
            |
            +---> vendor_scorecards (Phase 2) ⭐ NEW
            |       - Multiple metrics per vendor per period
            |       - 11 metric types (on_time_delivery_pct, etc.)
            |       - Period tracking: period_start, period_end
            |
            +---> ingredient_vendor_mapping (existing, EXTENDED Phase 2) ⭐ MODIFIED
                    |
                    +---> ingredient_library (existing)
                    |
                    +---> NEW FIELDS (Phase 2):
                            - restaurant_id (CRITICAL - populated in migration 020)
                            - vendor_item_description
                            - currency (USD, CAD, EUR, etc.)
                            - package_size, package_unit, case_quantity
                            - last_price_update (auto-tracked by trigger)
                            - price_effective_date, price_expiration_date
                            - is_active, discontinue_date
```

## Field Count Summary

### ingredient_vendor_mapping (Extended)
**Before Phase 2**: 9 fields
- id, ingredient_id, vendor_id, is_preferred, vendor_item_number, unit_cost, lead_time_days, minimum_order_qty, notes, created_at, updated_at

**After Phase 2**: 20 fields (+11 new fields)
- All existing fields PLUS:
- restaurant_id ⭐
- vendor_item_description ⭐
- currency ⭐
- package_size ⭐
- package_unit ⭐
- case_quantity ⭐
- last_price_update ⭐
- price_effective_date ⭐
- price_expiration_date ⭐
- is_active ⭐
- discontinue_date ⭐

### vendor_documents (New Table)
**Total**: 18 fields
- id, vendor_id, restaurant_id
- document_type (16 types), document_name
- file_url, file_path, file_size_bytes, mime_type
- issue_date, expiration_date, is_expired (GENERATED)
- is_current (for pricing sheets)
- reminder_days_before, last_reminder_sent
- uploaded_by, notes
- created_at, updated_at

### vendor_scorecards (New Table)
**Total**: 13 fields
- id, vendor_id, restaurant_id
- metric_name (11 metric types)
- metric_value, score (0-100)
- period_start, period_end, calculation_date
- data_points_count
- notes
- created_at, updated_at

## Multi-Tenancy Enforcement

All Phase 2 tables enforce multi-tenancy with `restaurant_id` FK:

```
restaurants
    |
    +-- CASCADE DELETE --> vendor_documents
    +-- CASCADE DELETE --> vendor_scorecards
    +-- CASCADE DELETE --> ingredient_vendor_mapping (now has restaurant_id)
```

When a restaurant is deleted, all related vendor data is automatically deleted via CASCADE.

## Trigger Flow Diagram

### Price Change Tracking
```
User updates ingredient_vendor_mapping.unit_cost
    |
    v
BEFORE UPDATE trigger: track_ingredient_vendor_price_change()
    |
    +---> NEW.last_price_update = NOW()
    +---> IF NEW.price_effective_date IS NULL THEN
            NEW.price_effective_date = CURRENT_DATE
    |
    v
BEFORE UPDATE trigger: update_ingredient_vendor_mapping_updated_at()
    |
    +---> NEW.updated_at = NOW()
    |
    v
Record saved with auto-tracked timestamps
```

### Pricing Sheet Current Flag
```
User inserts/updates vendor_documents with is_current=true
    |
    v
BEFORE INSERT/UPDATE trigger: enforce_single_current_pricing_sheet()
    |
    +---> IF NEW.document_type = 'pricing_sheet' AND NEW.is_current = true THEN
            UPDATE vendor_documents
            SET is_current = false
            WHERE vendor_id = NEW.vendor_id
            AND document_type = 'pricing_sheet'
            AND id != NEW.id
    |
    v
Only one pricing sheet is_current=true per vendor
```

### Audit Logging
```
User modifies vendor_payment_info (INSERT/UPDATE/DELETE)
    |
    v
AFTER trigger: audit_vendor_payment_info_changes()
    |
    +---> INSERT INTO vendor_payment_info_audit (
            operation (INSERT/UPDATE/DELETE),
            old_data (JSONB),
            new_data (JSONB),
            changed_at (NOW())
          )
    |
    v
Full audit trail maintained
```

## Index Strategy

### Multi-Tenancy Indexes (Critical for Performance)
```sql
-- Filter by restaurant_id (most common query pattern)
idx_ingredient_vendor_mapping_restaurant (restaurant_id)
idx_vendor_documents_restaurant (restaurant_id)
idx_vendor_scorecards_restaurant (restaurant_id)

-- Composite indexes for multi-tenant + other filters
idx_ingredient_vendor_mapping_ingredient_restaurant (ingredient_id, restaurant_id, is_active)
idx_ingredient_vendor_mapping_preferred_restaurant (restaurant_id, ingredient_id, is_preferred)
idx_vendor_documents_vendor_restaurant (vendor_id, restaurant_id)
idx_vendor_scorecards_vendor_restaurant (vendor_id, restaurant_id)
```

### Business Logic Indexes
```sql
-- Price expiration tracking
idx_ingredient_vendor_mapping_price_expiring (vendor_id, price_expiration_date)
  WHERE price_expiration_date IS NOT NULL
  AND price_expiration_date >= CURRENT_DATE
  AND is_active = true

-- Document expiration tracking
idx_vendor_documents_expired (vendor_id, is_expired)
  WHERE is_expired = true

idx_vendor_documents_expiring_soon (vendor_id, expiration_date)
  WHERE expiration_date IS NOT NULL
  AND is_expired = false

-- Current pricing sheet lookup
idx_vendor_documents_current_pricing (vendor_id, document_type, is_current)
  WHERE document_type = 'pricing_sheet'
  AND is_current = true

-- Scorecard metric history
idx_vendor_scorecards_metric_history (vendor_id, metric_name, period_start DESC)
```

## Data Flow Example: PO Generation

```
1. User selects vendor for PO
    |
    v
2. Query vendor_purchasing_data
    - Get lead_time_days
    - Get minimum_order_value
    - Get default_freight_terms
    |
    v
3. Query ingredient_vendor_mapping
    - Filter: vendor_id, restaurant_id, is_active=true
    - Get: unit_cost, package_size, package_unit, case_quantity
    - Calculate packages needed
    |
    v
4. Query vendor_addresses
    - Get ship_from address
    - Get billing address
    |
    v
5. Query vendor_contacts
    - Get primary contact (receive_orders=true)
    |
    v
6. Create purchase_order with all vendor data
```

## Data Flow Example: Pricing Sheet Upload

```
1. User uploads pricing sheet PDF
    |
    v
2. Upload to Supabase Storage
    - Get file_url, file_path
    |
    v
3. INSERT into vendor_documents
    - document_type = 'pricing_sheet'
    - is_current = true
    - file_url, file_size_bytes, mime_type
    |
    v
4. Trigger: enforce_single_current_pricing_sheet()
    - Unsets is_current on old pricing sheets
    |
    v
5. (Future) OCR/Parse pricing sheet
    - Extract unit costs for vendor items
    |
    v
6. (Future) UPDATE ingredient_vendor_mapping.unit_cost
    - Trigger: track_ingredient_vendor_price_change()
    - Auto-sets last_price_update = NOW()
```

## Migration Dependencies

```
migration-011 (payment_terms)
    |
    v
migration-012 (extend vendors)
    |
    v
migration-013 (vendor_addresses)
migration-014 (vendor_contacts)
    |
    v
migration-015 (vendor_payment_info)
    |  depends on payment_terms
    v
migration-016 (vendor_purchasing_data)
    |
    v
migration-017 (extend ingredient_vendor_mapping)
    |  Adds restaurant_id (NULLABLE)
    v
migration-018 (vendor_documents)
migration-019 (vendor_scorecards)
    |
    v
migration-020 (CRITICAL DATA MIGRATION)
    |  Populates restaurant_id from vendors
    |  Makes restaurant_id NOT NULL
    |  Migrates address/contact/payment_terms data
    v
migration-021 (indexes + triggers)
    |  Price tracking trigger
    |  Audit logging
    |  Performance indexes
    v
✅ Phase 2 Complete
```

## Storage Size Estimates

Based on typical usage for a restaurant with 10 vendors:

### ingredient_vendor_mapping
- Before: ~200 records × 500 bytes = 100 KB
- After: ~200 records × 800 bytes = 160 KB (+60%)
- Growth: Minimal, one-time extension

### vendor_documents
- Per vendor: ~10 documents
- Per document: ~500 bytes metadata + file size
- 10 vendors × 10 docs = 100 records × 500 bytes = 50 KB (metadata only)
- Files stored in Supabase Storage (separate)

### vendor_scorecards
- Per vendor: 11 metrics × 12 periods (monthly) = 132 records/year
- 10 vendors × 132 = 1,320 records/year
- 1,320 × 300 bytes = 396 KB/year
- Growth: Linear with time (monthly calculations)

**Total Phase 2 Storage Impact**: ~500 KB + files (minimal)

---

**Note**: This diagram shows Phase 2 additions to the vendor ERP schema. See Phase 1 documentation for vendor_addresses, vendor_contacts, vendor_payment_info, and vendor_purchasing_data details.
