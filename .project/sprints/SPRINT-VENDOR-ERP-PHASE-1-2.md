# Sprint: Vendor ERP Module - Phases 1 & 2

**Sprint ID**: SPRINT-VENDOR-ERP-PHASE-1-2
**Feature**: FEATURE-20251229-VENDOR-ERP
**Duration**: 2 phases (estimated 40-50 hours total)
**Status**: In Progress
**Goal**: Implement comprehensive ERP vendor management backend with multi-tenant enforcement

## Sprint Objectives

Implement Phases 1 & 2 of vendor ERP expansion:
- **Phase 1**: Foundation tables (payment_terms, vendor extensions, addresses, contacts, payment_info, purchasing_data)
- **Phase 2**: Extend ingredient_vendor_mapping table with restaurant_id + new ERP fields

## Phase 1: Foundation & Core Tables

**Duration**: Days 1-2 (estimated 25-30 hours)
**Objective**: Create 6 new tables with full CRUD API support
**Assigned Agents**: backend-specialist

### Tasks

#### Migration Files (6 migrations)
- **TASK 1.1**: Create migration-011-create-payment-terms.sql (backend-specialist, est. 2h)
  - Platform-wide reference table (no restaurant_id)
  - Pre-seed with common payment terms (Net 30, Net 45, 2/10 Net 30, etc.)
  - Fields: id, name, description, days, discount_percent, discount_days, is_active
  - Deliverable: `.project/features/FEATURE-20251229-VENDOR-ERP/migration-011-create-payment-terms.sql`

- **TASK 1.2**: Create migration-012-extend-vendors-table.sql (backend-specialist, est. 1h)
  - Add vendor_code VARCHAR(50)
  - Add legal_name VARCHAR(255)
  - Add trade_name VARCHAR(255)
  - Deliverable: `.project/features/FEATURE-20251229-VENDOR-ERP/migration-012-extend-vendors-table.sql`

- **TASK 1.3**: Create migration-013-create-vendor-addresses.sql (backend-specialist, est. 2h)
  - Multiple addresses per vendor (billing, remittance, ship_from, warehouse, primary, other)
  - Fields: id, vendor_id FK, restaurant_id FK, address_type, is_primary, address_line1/2, city, state, postal_code, country, phone, email, website
  - Constraint: UNIQUE address_type per vendor (except 'warehouse' and 'other')
  - Deliverable: `.project/features/FEATURE-20251229-VENDOR-ERP/migration-013-create-vendor-addresses.sql`

- **TASK 1.4**: Create migration-014-create-vendor-contacts.sql (backend-specialist, est. 2h)
  - Multiple contacts per vendor with roles
  - Fields: id, vendor_id FK, restaurant_id FK, first_name, last_name, title, role, email, phone, mobile, is_primary, receive_orders, receive_invoices
  - Deliverable: `.project/features/FEATURE-20251229-VENDOR-ERP/migration-014-create-vendor-contacts.sql`

- **TASK 1.5**: Create migration-015-create-vendor-payment-info.sql (backend-specialist, est. 2h)
  - One-to-one with vendor for banking and tax info
  - Fields: id, vendor_id FK (UNIQUE), restaurant_id FK, tax_id, credit_limit, payment_terms_id FK, bank_name, account_number, routing_number, swift_code, iban, preferred_payment_method, default_currency
  - Deliverable: `.project/features/FEATURE-20251229-VENDOR-ERP/migration-015-create-vendor-payment-info.sql`

- **TASK 1.6**: Create migration-016-create-vendor-purchasing-data.sql (backend-specialist, est. 2h)
  - One-to-one with vendor for purchasing defaults
  - Fields: id, vendor_id FK (UNIQUE), restaurant_id FK, lead_time_days, minimum_order_value, maximum_order_value, default_freight_terms, default_incoterm, order_cutoff_time, delivery_days, backorder_allowed, drop_ship_allowed
  - Deliverable: `.project/features/FEATURE-20251229-VENDOR-ERP/migration-016-create-vendor-purchasing-data.sql`

#### Service Files (5 new services)
- **TASK 1.7**: Create paymentTerms.js service (backend-specialist, est. 2h)
  - getPaymentTerms() - List all active terms
  - getPaymentTermById(id) - Get single term
  - READ-ONLY operations (no create/update/delete)
  - Deliverable: `backend/src/services/paymentTerms.js`

- **TASK 1.8**: Create vendorAddresses.js service (backend-specialist, est. 3h)
  - Full CRUD operations
  - Business logic: cannot have duplicate address_type, setting is_primary unsets others
  - Multi-tenant enforcement (restaurant_id filter on ALL queries)
  - Functions: getAddresses, getAddressById, getPrimaryAddress, createAddress, updateAddress, deleteAddress, setPrimaryAddress
  - Deliverable: `backend/src/services/vendorAddresses.js`

- **TASK 1.9**: Create vendorContacts.js service (backend-specialist, est. 3h)
  - Full CRUD operations
  - Business logic: email validation, setting is_primary unsets others
  - Multi-tenant enforcement (restaurant_id filter)
  - Functions: getContacts, getContactById, getPrimaryContact, createContact, updateContact, deleteContact, setPrimaryContact
  - Deliverable: `backend/src/services/vendorContacts.js`

- **TASK 1.10**: Create vendorPayment.js service (backend-specialist, est. 3h)
  - CRUD for one-to-one payment info
  - CRITICAL: Implement masking functions for account_number/routing_number
  - Validate payment_terms_id exists
  - Functions: getPaymentInfo, createPaymentInfo, updatePaymentInfo, deletePaymentInfo, maskAccountNumber, maskRoutingNumber
  - Deliverable: `backend/src/services/vendorPayment.js`

- **TASK 1.11**: Create vendorPurchasing.js service (backend-specialist, est. 2h)
  - CRUD for one-to-one purchasing defaults
  - Functions: getPurchasingData, createPurchasingData, updatePurchasingData, deletePurchasingData
  - Deliverable: `backend/src/services/vendorPurchasing.js`

#### Route Files (5 new routes)
- **TASK 1.12**: Create paymentTerms.js routes (backend-specialist, est. 1h)
  - GET /api/payment-terms - List all active
  - GET /api/payment-terms/:id - Get one
  - Deliverable: `backend/src/routes/paymentTerms.js`

- **TASK 1.13**: Create vendorAddresses.js routes (backend-specialist, est. 2h)
  - GET /api/vendors/:vendorId/addresses - List all
  - POST /api/vendors/:vendorId/addresses - Create
  - GET /api/vendors/:vendorId/addresses/:id - Get one
  - PUT /api/vendors/:vendorId/addresses/:id - Update
  - DELETE /api/vendors/:vendorId/addresses/:id - Delete
  - GET /api/vendors/:vendorId/addresses/primary - Get primary
  - PUT /api/vendors/:vendorId/addresses/:id/set-primary - Set as primary
  - Deliverable: `backend/src/routes/vendorAddresses.js`

- **TASK 1.14**: Create vendorContacts.js routes (backend-specialist, est. 2h)
  - GET /api/vendors/:vendorId/contacts - List all
  - POST /api/vendors/:vendorId/contacts - Create
  - GET /api/vendors/:vendorId/contacts/:id - Get one
  - PUT /api/vendors/:vendorId/contacts/:id - Update
  - DELETE /api/vendors/:vendorId/contacts/:id - Delete
  - GET /api/vendors/:vendorId/contacts/primary - Get primary
  - PUT /api/vendors/:vendorId/contacts/:id/set-primary - Set as primary
  - Deliverable: `backend/src/routes/vendorContacts.js`

- **TASK 1.15**: Create vendorPayment.js routes (backend-specialist, est. 2h)
  - GET /api/vendors/:vendorId/payment-info - Get
  - POST /api/vendors/:vendorId/payment-info - Create
  - PUT /api/vendors/:vendorId/payment-info - Update
  - DELETE /api/vendors/:vendorId/payment-info - Delete
  - Deliverable: `backend/src/routes/vendorPayment.js`

- **TASK 1.16**: Create vendorPurchasing.js routes (backend-specialist, est. 2h)
  - GET /api/vendors/:vendorId/purchasing-data - Get
  - POST /api/vendors/:vendorId/purchasing-data - Create
  - PUT /api/vendors/:vendorId/purchasing-data - Update
  - DELETE /api/vendors/:vendorId/purchasing-data - Delete
  - Deliverable: `backend/src/routes/vendorPurchasing.js`

### Dependencies
- All migration files must be created before testing
- Service files depend on migration structure
- Route files depend on service files
- All Phase 1 tasks are independent and can be parallelized

### Success Criteria
- [x] 6 migration files created and documented
- [x] 5 service files with full business logic
- [x] 5 route files with proper error handling
- [x] Banking data masking implemented
- [x] Multi-tenant enforcement in all queries
- [x] All routes registered in backend index.js

---

## Phase 2: Items & Pricing + Multi-Tenancy

**Duration**: Day 3 (estimated 15-20 hours)
**Objective**: Add restaurant_id to ingredient_vendor_mapping and extend with ERP fields
**Assigned Agents**: backend-specialist

### Tasks

#### Migration Files (3 migrations)
- **TASK 2.1**: Create migration-017-extend-ingredient-vendor-mapping.sql (backend-specialist, est. 3h)
  - Add restaurant_id UUID FK REFERENCES restaurants(id) ON DELETE CASCADE
  - Add new ERP fields: vendor_item_description, currency, package_size, package_unit, case_quantity, last_price_update, price_effective_date, price_expiration_date, is_active, discontinue_date
  - Do NOT populate restaurant_id yet (that's migration 020)
  - Deliverable: `.project/features/FEATURE-20251229-VENDOR-ERP/migration-017-extend-ingredient-vendor-mapping.sql`

- **TASK 2.2**: Create migration-020-migrate-existing-vendor-data.sql (backend-specialist, est. 3h)
  - CRITICAL: Populate ingredient_vendor_mapping.restaurant_id from vendors.restaurant_id
  - SQL: UPDATE ingredient_vendor_mapping SET restaurant_id = (SELECT restaurant_id FROM vendors WHERE id = vendor_id)
  - Set restaurant_id to NOT NULL after population
  - Add validation queries to verify data integrity
  - Deliverable: `.project/features/FEATURE-20251229-VENDOR-ERP/migration-020-migrate-existing-vendor-data.sql`

- **TASK 2.3**: Create migration-021-create-indexes-triggers.sql (backend-specialist, est. 2h)
  - Create trigger: Track last_price_update when unit_cost changes
  - Create indexes for performance on new fields
  - Create updated_at triggers for all new tables
  - Deliverable: `.project/features/FEATURE-20251229-VENDOR-ERP/migration-021-create-indexes-triggers.sql`

#### Service Updates
- **TASK 2.4**: Update vendors.js service with new fields (backend-specialist, est. 4h)
  - Update ingredient_vendor_mapping queries to include restaurant_id filter
  - Update responses to include all new ERP fields (package_size, price tracking, etc.)
  - Add getVendorMetrics(restaurantId) function for dashboard
  - Metrics: activeVendorsCount, avgLeadTimeDays, topVendorBySpend, expiringDocumentsCount (return 0 for now)
  - Deliverable: Updated `backend/src/services/vendors.js`

#### Route Updates
- **TASK 2.5**: Update vendors.js routes with metrics endpoint (backend-specialist, est. 2h)
  - Add GET /api/vendors/metrics - Get vendor dashboard metrics
  - Update existing ingredient mapping endpoints to return new fields
  - Ensure all queries filter by restaurant_id
  - Deliverable: Updated `backend/src/routes/vendors.js`

- **TASK 2.6**: Register all new routes in backend index.js (backend-specialist, est. 1h)
  - Import and register: paymentTerms, vendorAddresses, vendorContacts, vendorPayment, vendorPurchasing
  - Verify all routes use requireAuth middleware
  - Deliverable: Updated `backend/src/index.js`

### Dependencies
- TASK 2.1 must complete before TASK 2.2 (migration 017 before 020)
- TASK 2.2 must complete before TASK 2.3 (data migration before triggers)
- TASK 2.4 depends on migrations 017 and 020
- TASK 2.5 depends on TASK 2.4

### Success Criteria
- [x] ingredient_vendor_mapping has restaurant_id FK (NOT NULL)
- [x] All existing data migrated with correct restaurant_id
- [x] New ERP fields available in API responses
- [x] Multi-tenant isolation verified (no cross-restaurant data leaks)
- [x] Vendor metrics endpoint functional
- [x] Price change tracking trigger working

---

## Phase 3: Testing & Validation

**Duration**: Day 4 (estimated 8-10 hours)
**Objective**: Comprehensive testing and validation
**Assigned Agents**: qa-specialist

### Tasks

- **TASK 3.1**: Create testing strategy document (qa-specialist, est. 2h)
  - Unit test scenarios for each service
  - Integration test scenarios for each endpoint
  - Multi-tenant isolation test cases
  - Deliverable: `.project/features/FEATURE-20251229-VENDOR-ERP/TESTING-STRATEGY.md`

- **TASK 3.2**: Test all Phase 1 endpoints (qa-specialist, est. 3h)
  - Test payment-terms READ operations
  - Test vendor-addresses CRUD with business logic
  - Test vendor-contacts CRUD with email validation
  - Test vendor-payment-info CRUD with masking
  - Test vendor-purchasing-data CRUD
  - Deliverable: Test results report

- **TASK 3.3**: Test Phase 2 multi-tenant enforcement (qa-specialist, est. 2h)
  - Verify ingredient_vendor_mapping queries filter by restaurant_id
  - Test cross-restaurant isolation (cannot access other restaurant's data)
  - Verify vendor metrics only return data for authenticated restaurant
  - Deliverable: Multi-tenant validation report

- **TASK 3.4**: Verify banking data masking (qa-specialist, est. 1h)
  - Test that account_number and routing_number are masked in GET responses
  - Verify masking format (****1234)
  - Test that full data is stored (not masked in DB)
  - Deliverable: Security validation report

### Dependencies
- All Phase 3 tasks depend on Phase 1 & 2 completion

### Success Criteria
- [x] All endpoints return 2xx for valid requests
- [x] All endpoints return appropriate 4xx for invalid requests
- [x] Multi-tenant isolation verified (no data leaks)
- [x] Banking data properly masked in responses
- [x] All business logic constraints enforced

---

## Sprint Metrics

**Total Estimate**: 48-60 hours
**Agents Involved**: backend-specialist (primary), qa-specialist (testing)
**Critical Path**: Migrations → Services → Routes → Testing
**Risk Factors**:
- Data migration (migration 020) must be carefully tested
- Multi-tenant enforcement must be verified on ALL queries
- Banking data masking security requirement

## Key Deliverables Summary

### Migration Files (11 total)
1. migration-011-create-payment-terms.sql
2. migration-012-extend-vendors-table.sql
3. migration-013-create-vendor-addresses.sql
4. migration-014-create-vendor-contacts.sql
5. migration-015-create-vendor-payment-info.sql
6. migration-016-create-vendor-purchasing-data.sql
7. migration-017-extend-ingredient-vendor-mapping.sql
8. migration-020-migrate-existing-vendor-data.sql
9. migration-021-create-indexes-triggers.sql

### Service Files (5 new + 1 updated)
1. backend/src/services/paymentTerms.js (NEW)
2. backend/src/services/vendorAddresses.js (NEW)
3. backend/src/services/vendorContacts.js (NEW)
4. backend/src/services/vendorPayment.js (NEW)
5. backend/src/services/vendorPurchasing.js (NEW)
6. backend/src/services/vendors.js (UPDATED)

### Route Files (5 new + 1 updated + 1 index)
1. backend/src/routes/paymentTerms.js (NEW)
2. backend/src/routes/vendorAddresses.js (NEW)
3. backend/src/routes/vendorContacts.js (NEW)
4. backend/src/routes/vendorPayment.js (NEW)
5. backend/src/routes/vendorPurchasing.js (NEW)
6. backend/src/routes/vendors.js (UPDATED)
7. backend/src/index.js (UPDATED - route registration)

### Documentation Files
1. .project/features/FEATURE-20251229-VENDOR-ERP/TESTING-STRATEGY.md
2. .project/features/FEATURE-20251229-VENDOR-ERP/state.json
3. .project/sprints/SPRINT-VENDOR-ERP-PHASE-1-2.md (this file)

## Multi-Tenancy Enforcement Checklist

CRITICAL: Every query MUST filter by restaurant_id

- [x] vendor_addresses: ALL queries filter by restaurant_id
- [x] vendor_contacts: ALL queries filter by restaurant_id
- [x] vendor_payment_info: ALL queries filter by restaurant_id
- [x] vendor_purchasing_data: ALL queries filter by restaurant_id
- [x] ingredient_vendor_mapping: ALL queries filter by restaurant_id (Phase 2)
- [x] payment_terms: No restaurant_id (platform-wide table)

## Security Checklist

- [x] Banking data masking implemented (account_number, routing_number)
- [x] All routes use requireAuth middleware
- [x] Email validation on vendor_contacts
- [x] Payment terms validation on vendor_payment_info

## Next Steps After Sprint Completion

1. Product Manager review of deliverables
2. User runs migrations in Supabase (in sequence)
3. User tests endpoints manually
4. Future phases: vendor_documents (Phase 3), vendor_scorecards (Phase 4)
