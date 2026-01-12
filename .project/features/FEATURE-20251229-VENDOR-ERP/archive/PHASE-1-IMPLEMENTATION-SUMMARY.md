# Phase 1 Implementation Summary - Vendor ERP Foundation Tables

**Feature**: FEATURE-20251229-VENDOR-ERP
**Phase**: Phase 1 - Foundation & Core Tables
**Date**: 2025-12-29
**Status**: Complete - Migrations Created

## Overview

Phase 1 establishes the foundational database schema for the vendor ERP expansion, creating 6 migration files that add critical vendor management capabilities to the existing system.

## Migration Files Created

All migration files follow the established pattern from `migration-005-create-vendors-table.sql` with proper:
- UUID primary keys using `gen_random_uuid()`
- snake_case column naming
- Multi-tenant enforcement via `restaurant_id` FK (except platform-wide tables)
- Timestamps (created_at, updated_at) with triggers
- Comprehensive comments and documentation
- Validation queries at the bottom of each file

### Migration 011: Create payment_terms table
**File**: `migration-011-create-payment-terms.sql` (3.8 KB)
**Purpose**: Platform-wide payment terms reference table

**Key Features**:
- NO restaurant_id (shared across all restaurants)
- Pre-seeded with 8 common payment terms:
  - Due on Receipt
  - Net 15, Net 30, Net 45, Net 60
  - 2/10 Net 30 (2% discount if paid in 10 days)
  - 1/10 Net 30 (1% discount if paid in 10 days)
  - COD (Cash on Delivery)
- Supports early payment discounts (discount_percent, discount_days)
- is_active flag for enabling/disabling terms
- Unique constraint on name

**Columns**:
- id (UUID PK)
- name (VARCHAR 50, UNIQUE, NOT NULL)
- description (TEXT)
- days (INTEGER, NOT NULL, >= 0)
- discount_percent (DECIMAL 5,2, 0-100)
- discount_days (INTEGER, >= 0)
- is_active (BOOLEAN, default true)
- created_at, updated_at (TIMESTAMPTZ)

**Indexes**:
- idx_payment_terms_active (WHERE is_active = true)
- idx_payment_terms_name

---

### Migration 012: Extend vendors table
**File**: `migration-012-extend-vendors-table.sql` (1.8 KB)
**Purpose**: Add ERP fields to existing vendors table

**Key Features**:
- Extends existing table (no DROP/CREATE)
- Adds 3 new columns for ERP functionality
- Unique constraint on vendor_code per restaurant
- All new columns nullable to support existing data

**New Columns**:
- vendor_code (VARCHAR 50) - Internal ERP identifier
- legal_name (VARCHAR 255) - Legal business name
- trade_name (VARCHAR 255) - DBA/Trading name

**Indexes**:
- idx_vendors_restaurant_vendor_code (UNIQUE WHERE vendor_code IS NOT NULL)
- idx_vendors_legal_name (WHERE legal_name IS NOT NULL)

---

### Migration 013: Create vendor_addresses table
**File**: `migration-013-create-vendor-addresses.sql` (6.1 KB)
**Purpose**: Multiple addresses per vendor for different purposes

**Key Features**:
- One-to-many relationship: vendor → addresses
- 6 address types: billing, remittance, ship_from, warehouse, primary, other
- Unique constraint: only ONE address per type (except 'warehouse' and 'other')
- is_primary flag with trigger to enforce single primary address
- Full address fields plus contact info (phone, email, website)
- Multi-tenant enforcement with restaurant_id FK

**Columns**:
- id (UUID PK)
- vendor_id (UUID FK → vendors)
- restaurant_id (UUID FK → restaurants, NOT NULL, CASCADE)
- address_type (VARCHAR 50, CHECK constraint)
- is_primary (BOOLEAN, default false)
- address_line1, address_line2 (VARCHAR 255)
- city, state, postal_code (VARCHAR, NOT NULL)
- country (VARCHAR 100, default 'USA')
- phone, email, website (VARCHAR)
- notes (TEXT)
- created_at, updated_at (TIMESTAMPTZ)

**Indexes**:
- idx_vendor_addresses_vendor_type_unique (UNIQUE WHERE type NOT IN ('warehouse', 'other'))
- idx_vendor_addresses_vendor
- idx_vendor_addresses_restaurant
- idx_vendor_addresses_primary (WHERE is_primary = true)
- idx_vendor_addresses_type

**Triggers**:
- trigger_vendor_addresses_updated_at
- trigger_enforce_single_primary_vendor_address

---

### Migration 014: Create vendor_contacts table
**File**: `migration-014-create-vendor-contacts.sql` (6.1 KB)
**Purpose**: Multiple contacts per vendor with roles and notification preferences

**Key Features**:
- One-to-many relationship: vendor → contacts
- 7 predefined roles: Sales Rep, Account Manager, Billing Contact, Customer Service, Delivery Driver, Owner, Other
- Notification preferences: receive_orders, receive_invoices
- is_primary flag with trigger to enforce single primary contact
- Separate first_name/last_name for proper formatting
- Multi-tenant enforcement with restaurant_id FK

**Columns**:
- id (UUID PK)
- vendor_id (UUID FK → vendors)
- restaurant_id (UUID FK → restaurants, NOT NULL, CASCADE)
- first_name, last_name (VARCHAR 100, NOT NULL)
- title (VARCHAR 100) - Job title
- role (VARCHAR 100, CHECK constraint)
- email (VARCHAR 255)
- phone (VARCHAR 50) - Office/desk phone
- mobile (VARCHAR 50) - Mobile phone
- is_primary (BOOLEAN, default false)
- receive_orders (BOOLEAN, default false)
- receive_invoices (BOOLEAN, default false)
- notes (TEXT)
- created_at, updated_at (TIMESTAMPTZ)

**Indexes**:
- idx_vendor_contacts_vendor
- idx_vendor_contacts_restaurant
- idx_vendor_contacts_primary (WHERE is_primary = true)
- idx_vendor_contacts_email (WHERE email IS NOT NULL)
- idx_vendor_contacts_receive_orders (WHERE receive_orders = true)
- idx_vendor_contacts_receive_invoices (WHERE receive_invoices = true)
- idx_vendor_contacts_role (WHERE role IS NOT NULL)

**Triggers**:
- trigger_vendor_contacts_updated_at
- trigger_enforce_single_primary_vendor_contact

---

### Migration 015: Create vendor_payment_info table
**File**: `migration-015-create-vendor-payment-info.sql` (5.7 KB)
**Purpose**: Banking info, tax ID, payment terms (one-to-one with vendor)

**Key Features**:
- One-to-one relationship: vendor → payment_info (vendor_id UNIQUE)
- Foreign key to payment_terms table
- Banking information (relies on Supabase encryption at rest)
- 6 payment methods: Check, ACH, Wire Transfer, Credit Card, Cash, Other
- Tax ID for 1099 reporting
- Credit limit tracking
- Multi-tenant enforcement with restaurant_id FK

**Columns**:
- id (UUID PK)
- vendor_id (UUID FK → vendors, UNIQUE)
- restaurant_id (UUID FK → restaurants, NOT NULL, CASCADE)
- tax_id (VARCHAR 50) - EIN for 1099 reporting
- credit_limit (DECIMAL 15,2, >= 0)
- payment_terms_id (UUID FK → payment_terms)
- bank_name (VARCHAR 255)
- account_number (TEXT) - Encrypted by Supabase
- routing_number (TEXT) - Encrypted by Supabase
- swift_code (VARCHAR 20) - International transfers
- iban (VARCHAR 50) - International payments
- preferred_payment_method (VARCHAR 50, CHECK constraint)
- default_currency (VARCHAR 3, default 'USD')
- notes (TEXT)
- created_at, updated_at (TIMESTAMPTZ)

**Indexes**:
- idx_vendor_payment_info_vendor (UNIQUE)
- idx_vendor_payment_info_restaurant
- idx_vendor_payment_info_payment_terms (WHERE payment_terms_id IS NOT NULL)

**Triggers**:
- trigger_vendor_payment_info_updated_at

**Security Note**: Relies on Supabase database-level encryption for banking fields. API layer will implement masking for display.

---

### Migration 016: Create vendor_purchasing_data table
**File**: `migration-016-create-vendor-purchasing-data.sql` (6.2 KB)
**Purpose**: Purchasing defaults for PO generation (one-to-one with vendor)

**Key Features**:
- One-to-one relationship: vendor → purchasing_data (vendor_id UNIQUE)
- Lead time tracking for delivery estimation
- Order value constraints (minimum/maximum)
- 6 freight terms: Prepaid, Collect, Prepaid & Add, Third Party, FOB Origin, FOB Destination
- 11 Incoterms: EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF
- Order cutoff time and delivery days
- Backorder and drop-ship capabilities
- Multi-tenant enforcement with restaurant_id FK

**Columns**:
- id (UUID PK)
- vendor_id (UUID FK → vendors, UNIQUE)
- restaurant_id (UUID FK → restaurants, NOT NULL, CASCADE)
- lead_time_days (INTEGER, >= 0, default 0)
- minimum_order_value (DECIMAL 15,2, >= 0)
- maximum_order_value (DECIMAL 15,2, >= 0)
- default_freight_terms (VARCHAR 50, CHECK constraint)
- default_incoterm (VARCHAR 20, CHECK constraint)
- order_cutoff_time (TIME) - Daily cutoff
- delivery_days (VARCHAR 100) - e.g., "Monday, Wednesday, Friday"
- backorder_allowed (BOOLEAN, default true)
- drop_ship_allowed (BOOLEAN, default false)
- notes (TEXT)
- created_at, updated_at (TIMESTAMPTZ)

**Indexes**:
- idx_vendor_purchasing_data_vendor (UNIQUE)
- idx_vendor_purchasing_data_restaurant

**Constraints**:
- chk_vendor_purchasing_order_values (maximum >= minimum)

**Triggers**:
- trigger_vendor_purchasing_data_updated_at

---

## Schema Relationships

```
restaurants (existing)
    ↓ (1:N)
vendors (existing, extended with 3 new columns)
    ↓ (1:N)
vendor_addresses (NEW) ← restaurant_id FK
    ↓ (1:N)
vendor_contacts (NEW) ← restaurant_id FK
    ↓ (1:1)
vendor_payment_info (NEW) ← restaurant_id FK
    ↓ FK
payment_terms (NEW, platform-wide, NO restaurant_id)
    ↓ (1:1)
vendor_purchasing_data (NEW) ← restaurant_id FK
```

## Multi-Tenancy Enforcement

All new tables (except payment_terms) include:
- `restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE`
- Index on restaurant_id for efficient filtering
- Ensures data isolation between restaurants

**payment_terms** is platform-wide and shared across all restaurants.

## Database Triggers Implemented

1. **updated_at triggers** - All 5 tables (payment_terms, vendor_addresses, vendor_contacts, vendor_payment_info, vendor_purchasing_data)
2. **enforce_single_primary_vendor_address** - Ensures only one primary address per vendor
3. **enforce_single_primary_vendor_contact** - Ensures only one primary contact per vendor

## Validation Queries Included

Each migration file includes validation queries to verify:
- Table creation
- Column definitions and data types
- Index creation
- Constraint enforcement
- Trigger creation
- Sample data queries

## Next Steps - API Implementation

With Phase 1 migrations complete, the next steps are:

### 1. Run Migrations in Supabase
Execute all 6 migration files in sequence (011-016) in Supabase SQL editor.

### 2. Create Service Layer (Backend)
Create 5 new service files:
- `/backend/src/services/paymentTerms.js` (read-only)
- `/backend/src/services/vendorAddresses.js`
- `/backend/src/services/vendorContacts.js`
- `/backend/src/services/vendorPayment.js`
- `/backend/src/services/vendorPurchasing.js`

### 3. Create API Routes (Backend)
Create 5 new route files:
- `/backend/src/routes/paymentTerms.js`
- `/backend/src/routes/vendorAddresses.js`
- `/backend/src/routes/vendorContacts.js`
- `/backend/src/routes/vendorPayment.js`
- `/backend/src/routes/vendorPurchasing.js`

### 4. Extend Existing Vendor Routes
Update `/backend/src/routes/vendors.js` to support:
- vendor_code, legal_name, trade_name in responses
- New endpoints for vendor summary/stats

### 5. Implement Security
- Banking data masking utilities
- Encryption validation for sensitive fields
- Multi-tenant filtering on all queries

### 6. Testing
- Unit tests for service layer validation
- Integration tests for API endpoints
- Multi-tenant isolation verification
- Trigger behavior testing

## Files Created

```
.project/features/FEATURE-20251229-VENDOR-ERP/
├── migration-011-create-payment-terms.sql (3.8 KB)
├── migration-012-extend-vendors-table.sql (1.8 KB)
├── migration-013-create-vendor-addresses.sql (6.1 KB)
├── migration-014-create-vendor-contacts.sql (6.1 KB)
├── migration-015-create-vendor-payment-info.sql (5.7 KB)
└── migration-016-create-vendor-purchasing-data.sql (6.2 KB)
```

**Total**: 6 migration files, 29.7 KB of SQL

## Success Criteria Met

- [x] All 6 migration files created
- [x] UUID primary keys with gen_random_uuid()
- [x] snake_case column naming throughout
- [x] restaurant_id FK on all tables except payment_terms
- [x] created_at, updated_at timestamps with triggers
- [x] Comprehensive comments on tables and columns
- [x] Validation queries included
- [x] Follows pattern from migration-005-create-vendors-table.sql
- [x] payment_terms pre-seeded with 8 common terms
- [x] vendor_payment_info: vendor_id UNIQUE (1:1)
- [x] vendor_purchasing_data: vendor_id UNIQUE (1:1)
- [x] vendor_addresses: UNIQUE constraint on (vendor_id, address_type) WHERE type NOT IN ('warehouse', 'other')
- [x] CHECK constraints on enums and numeric values
- [x] Proper CASCADE behavior on FK deletes

## Phase 1 Status: COMPLETE

Phase 1 foundation tables are ready for migration execution and API implementation.
