# Vendor ERP Database Schemas

## Actual Database Schema (Verified 2026-01-05)

### 1. `vendors` Table

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NOT NULL | Primary key |
| restaurant_id | uuid | NOT NULL | Foreign key to restaurants |
| vendor_code | text | NULL | Vendor identifier code (e.g., 'SEED-SYS001') |
| name | text | NOT NULL | Vendor display name |
| legal_name | text | NULL | Legal business name |
| trade_name | text | NULL | Trade/DBA name |
| contact_name | text | NULL | **LEGACY**: Main contact (use vendor_contacts instead) |
| email | text | NULL | **LEGACY**: Main email (use vendor_contacts instead) |
| phone | text | NULL | **LEGACY**: Main phone (use vendor_contacts instead) |
| address | text | NULL | **LEGACY**: Main address (use vendor_addresses instead) |
| payment_terms | text | NULL | **LEGACY**: Terms description (use vendor_payment_info instead) |
| account_number | text | NULL | **LEGACY**: Account number (use vendor_payment_info instead) |
| notes | text | NULL | General notes |
| is_active | boolean | NOT NULL | Soft delete flag (default: true) |
| created_at | timestamp | NOT NULL | Auto-generated |
| updated_at | timestamp | NOT NULL | Auto-updated |

**Important Notes:**
- Legacy contact/payment columns still exist for backward compatibility
- New implementations should use related tables (vendor_contacts, vendor_addresses, vendor_payment_info)
- `address` is TEXT type, not JSON

---

### 2. `vendor_addresses` Table

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NOT NULL | Primary key |
| vendor_id | uuid | NOT NULL | Foreign key to vendors |
| restaurant_id | uuid | NOT NULL | For multi-tenancy |
| address_type | text | NOT NULL | 'billing', 'shipping', 'remittance', 'warehouse', 'primary', 'other' |
| address_line1 | text | NOT NULL | Street address |
| address_line2 | text | NULL | Suite, floor, etc. |
| city | text | NOT NULL | City name |
| state | text | NOT NULL | State/province |
| postal_code | text | NOT NULL | ZIP/postal code |
| country | text | NOT NULL | Country (default: 'USA') |
| phone | text | NULL | Location-specific phone |
| email | text | NULL | Location-specific email |
| website | text | NULL | Location-specific website |
| is_primary | boolean | NOT NULL | Primary address flag (default: false) |
| notes | text | NULL | Address-specific notes |
| created_at | timestamp | NOT NULL | Auto-generated |
| updated_at | timestamp | NOT NULL | Auto-updated |

**Constraints:**
- Only ONE address can have `is_primary = true` per vendor
- `address_type` values: Only one 'billing', 'shipping', 'remittance' per vendor (except 'warehouse' and 'other' which can have multiple)

---

### 3. `vendor_contacts` Table

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NOT NULL | Primary key |
| vendor_id | uuid | NOT NULL | Foreign key to vendors |
| restaurant_id | uuid | NOT NULL | For multi-tenancy |
| first_name | text | NOT NULL | Contact first name |
| last_name | text | NOT NULL | Contact last name |
| title | text | NULL | Job title |
| role | text | NULL | 'Sales Rep', 'Account Manager', 'Billing Contact', 'Customer Service', 'Delivery Coordinator', 'Other' |
| email | text | NULL | Contact email |
| phone | text | NULL | Office/direct phone |
| mobile | text | NULL | Mobile phone |
| is_primary | boolean | NOT NULL | Primary contact flag (default: false) |
| receive_orders | boolean | NOT NULL | Receives PO emails (default: false) |
| receive_invoices | boolean | NOT NULL | Receives invoice emails (default: false) |
| notes | text | NULL | Contact-specific notes |
| created_at | timestamp | NOT NULL | Auto-generated |
| updated_at | timestamp | NOT NULL | Auto-updated |

**Constraints:**
- Only ONE contact can have `is_primary = true` per vendor

---

### 4. `payment_terms` Table (READ-ONLY Reference)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NOT NULL | Primary key |
| name | text | NOT NULL | Display name (e.g., 'Net 30') |
| description | text | NULL | Full description |
| days | integer | NOT NULL | Net days (e.g., 30 for Net 30) |
| discount_percent | numeric | NULL | Early payment discount percentage |
| discount_days | integer | NULL | Days for discount eligibility |
| is_active | boolean | NOT NULL | Active flag (default: true) |
| created_at | timestamp | NOT NULL | Auto-generated |
| updated_at | timestamp | NOT NULL | Auto-updated |

**Note:** Platform-wide reference table. Standard terms pre-populated.

---

### 5. `vendor_payment_info` Table (1:1 with vendor)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NOT NULL | Primary key |
| vendor_id | uuid | NOT NULL | Foreign key to vendors (UNIQUE) |
| restaurant_id | uuid | NOT NULL | For multi-tenancy |
| tax_id | text | NULL | Tax ID/EIN (encrypted at DB level) |
| credit_limit | numeric | NULL | Credit limit amount |
| payment_terms_id | uuid | NULL | Foreign key to payment_terms |
| bank_name | text | NULL | Bank name |
| account_number | text | NULL | Bank account (masked in API responses) |
| routing_number | text | NULL | Routing number (masked in API responses) |
| swift_code | text | NULL | International wire code |
| iban | text | NULL | International bank account number |
| preferred_payment_method | text | NULL | 'ACH', 'Wire', 'Check', 'Credit Card', 'Other' |
| default_currency | text | NOT NULL | Currency code (default: 'USD') |
| notes | text | NULL | Payment-specific notes |
| created_at | timestamp | NOT NULL | Auto-generated |
| updated_at | timestamp | NOT NULL | Auto-updated |

**Security:**
- `account_number` and `routing_number` are MASKED in all API responses
- Database-level encryption recommended for sensitive fields

---

### 6. `vendor_scorecards` Table

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NOT NULL | Primary key |
| vendor_id | uuid | NOT NULL | Foreign key to vendors |
| restaurant_id | uuid | NOT NULL | For multi-tenancy |
| metric_name | text | NOT NULL | Metric identifier (e.g., 'on_time_delivery_pct') |
| metric_value | numeric | NOT NULL | Calculated metric value |
| score | integer | NULL | Normalized score 0-100 |
| period_start | date | NOT NULL | Evaluation period start |
| period_end | date | NOT NULL | Evaluation period end |
| calculation_date | timestamp | NOT NULL | When metric was calculated |
| data_points_count | integer | NULL | Number of data points used |
| notes | text | NULL | Scorecard notes |
| created_at | timestamp | NOT NULL | Auto-generated |
| updated_at | timestamp | NOT NULL | Auto-updated |

**Standard Metrics:**
- `on_time_delivery_pct` - On-time delivery percentage
- `order_accuracy_pct` - Order accuracy percentage
- `fill_rate_pct` - Fill rate percentage
- `quality_score` - Quality score
- `response_time_hours` - Average response time
- `price_competitiveness` - Price competitiveness score
- `invoice_accuracy_pct` - Invoice accuracy percentage
- `overall_rating` - Overall vendor rating

---

### 7. `vendor_documents` Table

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NOT NULL | Primary key |
| vendor_id | uuid | NOT NULL | Foreign key to vendors |
| restaurant_id | uuid | NOT NULL | For multi-tenancy |
| document_type | text | NOT NULL | 'W9', 'W8', '1099', 'contract', 'insurance', 'certification', 'license', 'pricing_sheet', 'other' |
| document_name | text | NOT NULL | Display name |
| file_url | text | NOT NULL | Supabase Storage URL |
| file_path | text | NULL | Storage bucket path |
| file_size_bytes | bigint | NULL | File size in bytes |
| mime_type | text | NULL | File MIME type |
| issue_date | date | NULL | Document issue date |
| expiration_date | date | NULL | Document expiration date |
| is_current | boolean | NOT NULL | Current version flag (for pricing_sheet) |
| is_expired | boolean | NOT NULL | Expired flag (default: false) |
| reminder_days_before | integer | NULL | Days before expiration to send reminder |
| last_reminder_sent | timestamp | NULL | Last reminder sent timestamp |
| uploaded_by | uuid | NULL | User who uploaded |
| notes | text | NULL | Document notes |
| created_at | timestamp | NOT NULL | Auto-generated |
| updated_at | timestamp | NOT NULL | Auto-updated |

**Constraints:**
- Only ONE `pricing_sheet` document can have `is_current = true` per vendor

---

### 8. `ingredient_vendor_mapping` Table

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NOT NULL | Primary key |
| vendor_id | uuid | NOT NULL | Foreign key to vendors |
| ingredient_id | uuid | NOT NULL | Foreign key to ingredient_library |
| restaurant_id | uuid | NOT NULL | For multi-tenancy |
| vendor_item_number | text | NULL | Vendor's SKU/item code |
| vendor_item_description | text | NULL | Vendor's item description |
| unit_cost | numeric | NOT NULL | Cost per unit |
| currency | text | NOT NULL | Currency code (default: 'USD') |
| item_quantity | numeric | NOT NULL | Quantity in item (e.g., 1 for single can) |
| item_uom | text | NOT NULL | Unit of measure (e.g., 'can', 'lb', 'kg') |
| package_quantity | numeric | NULL | Quantity in package (e.g., 6 for 6-pack) |
| package_size | text | NULL | Package size descriptor |
| package_unit | text | NULL | Package unit |
| case_quantity | numeric | NULL | Quantity in case |
| lead_time_days | integer | NULL | Lead time in days |
| minimum_order_qty | numeric | NULL | Minimum order quantity |
| is_preferred | boolean | NOT NULL | Preferred vendor flag (default: false) |
| is_active | boolean | NOT NULL | Active item flag (default: true) |
| price_effective_date | date | NULL | When price becomes effective |
| price_expiration_date | date | NULL | When price expires |
| last_price_update | timestamp | NULL | Last price update timestamp |
| discontinue_date | date | NULL | Item discontinuation date |
| notes | text | NULL | Item-specific notes |
| created_at | timestamp | NOT NULL | Auto-generated |
| updated_at | timestamp | NOT NULL | Auto-updated |

**Constraints:**
- Only ONE vendor can have `is_preferred = true` per ingredient
- Unique constraint on (vendor_id, ingredient_id)

---

## Foreign Key Relationships

```
vendors (1) ----< (many) vendor_addresses
vendors (1) ----< (many) vendor_contacts
vendors (1) ---- (1) vendor_payment_info
vendors (1) ----< (many) vendor_scorecards
vendors (1) ----< (many) vendor_documents
vendors (1) ----< (many) ingredient_vendor_mapping

payment_terms (1) ----< (many) vendor_payment_info

ingredient_library (1) ----< (many) ingredient_vendor_mapping
```

---

## Multi-Tenancy Pattern

ALL vendor-related tables include `restaurant_id` for row-level security:
- Ensures data isolation between restaurants
- All queries MUST filter by `restaurant_id`
- Enforced in service layer and RLS policies

---

## Indexing Recommendations

```sql
-- vendors table
CREATE INDEX idx_vendors_restaurant_id ON vendors(restaurant_id);
CREATE INDEX idx_vendors_vendor_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);

-- vendor_addresses table
CREATE INDEX idx_vendor_addresses_vendor_id ON vendor_addresses(vendor_id);
CREATE INDEX idx_vendor_addresses_is_primary ON vendor_addresses(is_primary);

-- vendor_contacts table
CREATE INDEX idx_vendor_contacts_vendor_id ON vendor_contacts(vendor_id);
CREATE INDEX idx_vendor_contacts_is_primary ON vendor_contacts(is_primary);

-- vendor_payment_info table
CREATE UNIQUE INDEX idx_vendor_payment_info_vendor_id ON vendor_payment_info(vendor_id);

-- vendor_scorecards table
CREATE INDEX idx_vendor_scorecards_vendor_id ON vendor_scorecards(vendor_id);
CREATE INDEX idx_vendor_scorecards_metric_name ON vendor_scorecards(metric_name);
CREATE INDEX idx_vendor_scorecards_calculation_date ON vendor_scorecards(calculation_date DESC);

-- vendor_documents table
CREATE INDEX idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_expiration_date ON vendor_documents(expiration_date);
CREATE INDEX idx_vendor_documents_is_expired ON vendor_documents(is_expired);

-- ingredient_vendor_mapping table
CREATE INDEX idx_ingredient_vendor_mapping_vendor_id ON ingredient_vendor_mapping(vendor_id);
CREATE INDEX idx_ingredient_vendor_mapping_ingredient_id ON ingredient_vendor_mapping(ingredient_id);
CREATE INDEX idx_ingredient_vendor_mapping_is_preferred ON ingredient_vendor_mapping(is_preferred);
CREATE UNIQUE INDEX idx_ingredient_vendor_mapping_unique ON ingredient_vendor_mapping(vendor_id, ingredient_id);
```
