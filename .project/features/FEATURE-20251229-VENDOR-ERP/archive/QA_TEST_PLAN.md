# Vendor ERP Module - Comprehensive QA Test Plan

**Feature:** FEATURE-20251229-VENDOR-ERP
**Test Plan Version:** 1.0
**Created:** 2025-12-31
**Test Lead:** QA Specialist Agent
**Target:** Backend Service Layer & API Routes

---

## Test Strategy Overview

This test plan covers comprehensive quality assurance for the Vendor ERP backend implementation, including:

1. **Service Layer Testing** - Business logic and data access
2. **API Endpoint Testing** - REST API functionality
3. **Multi-Tenancy Testing** - Restaurant data isolation
4. **Data Integrity Testing** - Constraints, triggers, relationships
5. **Performance Testing** - Query optimization and scalability
6. **Security Testing** - Authentication, authorization, input validation
7. **Error Handling Testing** - Graceful failure and error messages

---

## Phase 1: Service Layer CRUD Testing

### Test Group 1.1: Payment Terms Service

**Service File:** `backend/src/services/paymentTerms.js`

#### Test Case PT-001: Get All Payment Terms
**Priority:** HIGH
**Type:** Functional

**Test Steps:**
1. Call `getAll()` from payment terms service
2. Verify returns 8 standard payment terms
3. Validate each term has: id, name, days, description
4. Verify sorting by days (ascending)

**Expected Results:**
```json
[
  { "name": "Due on Receipt", "days": 0, "discount_percent": null },
  { "name": "COD", "days": 0, "discount_percent": null },
  { "name": "Net 15", "days": 15, "discount_percent": null },
  { "name": "Net 30", "days": 30, "discount_percent": null },
  ...
]
```

**Acceptance Criteria:**
- ✓ Returns all 8 payment terms
- ✓ Correct data types (days is integer, discount_percent is decimal)
- ✓ No authentication required (public lookup data)

---

#### Test Case PT-002: Get Payment Term by ID
**Priority:** HIGH
**Type:** Functional

**Test Steps:**
1. Get ID of "Net 30" payment term
2. Call `getById(id)` with valid ID
3. Verify returns single payment term object

**Expected Results:**
```json
{
  "id": "uuid-here",
  "name": "Net 30",
  "days": 30,
  "discount_percent": null,
  "description": "Payment due within 30 days"
}
```

**Acceptance Criteria:**
- ✓ Returns correct payment term
- ✓ Returns null for non-existent ID
- ✓ Handles invalid UUID format gracefully

---

#### Test Case PT-003: Create Custom Payment Term
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Call `create()` with new payment term data:
   ```json
   {
     "name": "Net 90",
     "days": 90,
     "description": "Payment due within 90 days"
   }
   ```
2. Verify returns created payment term with ID
3. Verify can retrieve using getById()

**Expected Results:**
- Payment term created successfully
- ID auto-generated (UUID)
- created_at and updated_at timestamps set

**Acceptance Criteria:**
- ✓ Name uniqueness enforced
- ✓ Days must be >= 0
- ✓ Discount percent must be 0-100 if provided

---

### Test Group 1.2: Vendor Addresses Service

**Service File:** `backend/src/services/vendorAddresses.js`

#### Test Case VA-001: Create Vendor Address
**Priority:** HIGH
**Type:** Functional

**Prerequisites:**
- Valid vendor ID (e.g., Sysco)
- Valid restaurant ID from authenticated user

**Test Steps:**
1. Call `createAddress()` with address data:
   ```json
   {
     "vendor_id": "sysco-vendor-id",
     "restaurant_id": "test-restaurant-id",
     "address_type": "shipping",
     "street_address": "123 Warehouse Blvd",
     "city": "Houston",
     "state": "TX",
     "postal_code": "77001",
     "country": "USA",
     "is_primary": true
   }
   ```
2. Verify address created successfully
3. Verify is_primary flag set correctly

**Expected Results:**
- Address created with auto-generated ID
- Timestamps set automatically
- Can retrieve address by vendor_id

**Acceptance Criteria:**
- ✓ vendor_id must exist (FK constraint)
- ✓ restaurant_id must exist (FK constraint)
- ✓ Only one primary address per vendor per type
- ✓ address_type validation (shipping, billing, remittance)

---

#### Test Case VA-002: Get Addresses by Vendor
**Priority:** HIGH
**Type:** Functional

**Test Steps:**
1. Create 2 addresses for same vendor (1 shipping, 1 billing)
2. Call `getByVendorId(vendor_id, restaurant_id)`
3. Verify returns both addresses
4. Verify filtered by restaurant_id (multi-tenancy)

**Expected Results:**
```json
[
  {
    "address_type": "shipping",
    "street_address": "123 Warehouse Blvd",
    "is_primary": true
  },
  {
    "address_type": "billing",
    "street_address": "456 Office St",
    "is_primary": true
  }
]
```

**Acceptance Criteria:**
- ✓ Returns only addresses for specified vendor
- ✓ Filters by restaurant_id (no cross-restaurant leakage)
- ✓ Returns empty array if no addresses

---

#### Test Case VA-003: Update Address
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Get existing address ID
2. Call `updateAddress(id, restaurant_id, updateData)`
3. Change street_address and postal_code
4. Verify changes saved
5. Verify updated_at timestamp changed

**Expected Results:**
- Address updated successfully
- updated_at timestamp updated automatically (trigger)
- Other fields unchanged

**Acceptance Criteria:**
- ✓ Can only update addresses for own restaurant
- ✓ Cannot update address_type if would create duplicate primary
- ✓ Validation on postal_code format

---

#### Test Case VA-004: Delete Address
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Create address for vendor
2. Call `deleteAddress(id, restaurant_id)`
3. Verify address deleted
4. Verify cannot retrieve deleted address

**Expected Results:**
- Address deleted successfully
- Returns deleted address object
- Subsequent queries return empty

**Acceptance Criteria:**
- ✓ Can only delete own restaurant's addresses
- ✓ Soft delete vs hard delete (depends on implementation)
- ✓ If only address, vendor still accessible

---

#### Test Case VA-005: Primary Address Enforcement
**Priority:** HIGH
**Type:** Data Integrity

**Test Steps:**
1. Create primary shipping address for vendor
2. Attempt to create another primary shipping address for same vendor
3. Verify trigger prevents duplicate primary

**Expected Results:**
- Second primary address creation fails
- Error message: "Vendor already has a primary shipping address"
- First address remains primary

**Acceptance Criteria:**
- ✓ Trigger `ensure_single_primary_address` fires correctly
- ✓ Can have multiple addresses if not all primary
- ✓ Can change which address is primary (update operation)

---

### Test Group 1.3: Vendor Contacts Service

**Service File:** `backend/src/services/vendorContacts.js`

#### Test Case VC-001: Create Vendor Contact
**Priority:** HIGH
**Type:** Functional

**Test Steps:**
1. Call `createContact()` with contact data:
   ```json
   {
     "vendor_id": "sysco-vendor-id",
     "restaurant_id": "test-restaurant-id",
     "first_name": "John",
     "last_name": "Doe",
     "email": "john.doe@sysco.com",
     "phone": "555-1234",
     "contact_type": "sales",
     "is_primary": true
   }
   ```
2. Verify contact created
3. Verify email validation

**Expected Results:**
- Contact created with UUID
- Email format validated
- Phone number stored

**Acceptance Criteria:**
- ✓ Email format validation (RFC 5322)
- ✓ Phone number formatting (flexible international support)
- ✓ contact_type validation (sales, purchasing, accounting, support)
- ✓ Only one primary contact per type per vendor

---

#### Test Case VC-002: Get Contacts by Vendor
**Priority:** HIGH
**Type:** Functional

**Test Steps:**
1. Create 3 contacts for vendor (sales, purchasing, accounting)
2. Call `getByVendorId(vendor_id, restaurant_id)`
3. Verify returns all 3 contacts
4. Verify filtered by restaurant_id

**Expected Results:**
```json
[
  { "contact_type": "sales", "first_name": "John", "is_primary": true },
  { "contact_type": "purchasing", "first_name": "Jane", "is_primary": true },
  { "contact_type": "accounting", "first_name": "Bob", "is_primary": false }
]
```

**Acceptance Criteria:**
- ✓ Returns all contacts for vendor
- ✓ Sorted by is_primary (primary first)
- ✓ Multi-tenant filtering enforced

---

#### Test Case VC-003: Update Contact
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Update contact email and phone
2. Verify changes saved
3. Verify updated_at timestamp changed

**Expected Results:**
- Contact updated successfully
- Email validation on update
- Trigger updates timestamp

**Acceptance Criteria:**
- ✓ Email validation on update
- ✓ Cannot change vendor_id (FK integrity)
- ✓ Can change is_primary (with trigger enforcement)

---

#### Test Case VC-004: Delete Contact
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Delete non-primary contact
2. Verify deletion successful
3. Attempt to delete primary contact (should warn or fail)

**Expected Results:**
- Non-primary contact deleted
- Primary contact deletion requires confirmation or fails

**Acceptance Criteria:**
- ✓ Cannot delete last contact for vendor (business rule)
- ✓ Multi-tenant authorization enforced

---

### Test Group 1.4: Vendor Payment Info Service

**Service File:** `backend/src/services/vendorPayment.js`

#### Test Case VPI-001: Create Payment Info
**Priority:** HIGH
**Type:** Functional & Security

**Test Steps:**
1. Call `createPaymentInfo()` with bank details:
   ```json
   {
     "vendor_id": "sysco-vendor-id",
     "restaurant_id": "test-restaurant-id",
     "payment_method": "ACH",
     "bank_name": "Chase Bank",
     "account_number": "****1234",
     "routing_number": "021000021",
     "account_holder": "Sysco Corporation"
   }
   ```
2. Verify sensitive data encrypted/masked
3. Verify only authorized users can access

**Expected Results:**
- Payment info created
- account_number masked in responses
- routing_number stored securely

**Acceptance Criteria:**
- ✓ Sensitive data NOT logged
- ✓ Account numbers masked in API responses
- ✓ Only admin/owner can view full account details
- ✓ payment_method validation (ACH, Wire, Check, CreditCard)

---

#### Test Case VPI-002: Get Payment Info by Vendor
**Priority:** HIGH
**Type:** Security

**Test Steps:**
1. Create payment info for vendor
2. Call `getByVendorId()` as authenticated user
3. Verify returns masked account details
4. Verify restaurant_id filtering

**Expected Results:**
```json
{
  "payment_method": "ACH",
  "bank_name": "Chase Bank",
  "account_number": "****1234",
  "routing_number": "****0021",
  "account_holder": "Sysco Corporation"
}
```

**Acceptance Criteria:**
- ✓ account_number masked (show last 4 digits)
- ✓ routing_number partially masked
- ✓ SWIFT codes protected
- ✓ Multi-tenant filtering enforced

---

#### Test Case VPI-003: Update Payment Info
**Priority:** MEDIUM
**Type:** Security

**Test Steps:**
1. Update bank account number
2. Verify old number cannot be retrieved
3. Verify audit trail (if implemented)

**Expected Results:**
- Update successful
- Previous values not exposed
- Change logged (optional)

**Acceptance Criteria:**
- ✓ Requires authentication and authorization
- ✓ Cannot update another restaurant's payment info
- ✓ Validation on bank details format

---

#### Test Case VPI-004: Delete Payment Info
**Priority:** LOW
**Type:** Functional

**Test Steps:**
1. Delete payment info
2. Verify cascade behavior (vendor still exists)

**Expected Results:**
- Payment info deleted
- Vendor record unaffected
- Can re-add payment info later

**Acceptance Criteria:**
- ✓ Authorization required
- ✓ Soft delete vs hard delete policy
- ✓ Audit trail maintained

---

### Test Group 1.5: Vendor Purchasing Data Service

**Service File:** `backend/src/services/vendorPurchasing.js`

#### Test Case VPD-001: Create Purchasing Defaults
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Call `createPurchasingData()`:
   ```json
   {
     "vendor_id": "sysco-vendor-id",
     "restaurant_id": "test-restaurant-id",
     "min_order_amount": 250.00,
     "lead_time_days": 2,
     "freight_terms": "FOB Destination",
     "default_carrier": "Sysco Fleet"
   }
   ```
2. Verify defaults saved

**Expected Results:**
- Purchasing defaults created
- min_order_amount decimal precision correct
- lead_time_days integer

**Acceptance Criteria:**
- ✓ min_order_amount >= 0
- ✓ lead_time_days >= 0
- ✓ freight_terms validation (FOB Origin, FOB Destination, Prepaid, etc.)

---

#### Test Case VPD-002: Get Purchasing Data by Vendor
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Create purchasing data
2. Call `getByVendorId(vendor_id, restaurant_id)`
3. Verify returns correct defaults

**Expected Results:**
- Returns purchasing defaults
- Filtered by restaurant_id
- Returns null if no defaults set

**Acceptance Criteria:**
- ✓ Multi-tenant filtering
- ✓ Can have different defaults for same vendor across restaurants

---

#### Test Case VPD-003: Update Purchasing Data
**Priority:** LOW
**Type:** Functional

**Test Steps:**
1. Update min_order_amount and lead_time_days
2. Verify changes saved

**Expected Results:**
- Update successful
- Validation enforced

**Acceptance Criteria:**
- ✓ Numeric validation
- ✓ Cannot set negative values

---

### Test Group 1.6: Vendor Documents Service

**Service File:** `backend/src/services/vendorDocuments.js`

#### Test Case VD-001: Upload Vendor Document
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Call `uploadDocument()` with document metadata:
   ```json
   {
     "vendor_id": "sysco-vendor-id",
     "restaurant_id": "test-restaurant-id",
     "document_type": "contract",
     "file_name": "sysco-contract-2025.pdf",
     "file_url": "https://storage.example.com/docs/contract.pdf",
     "expires_at": "2026-01-01"
   }
   ```
2. Verify document record created
3. Verify file_url is accessible

**Expected Results:**
- Document metadata stored
- file_url points to uploaded file
- expires_at tracked for expiration alerts

**Acceptance Criteria:**
- ✓ document_type validation (contract, insurance, w9, license, certification)
- ✓ file_name sanitized for security
- ✓ file_url format validation
- ✓ expires_at optional but validated if provided

---

#### Test Case VD-002: Get Documents by Vendor
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Upload 3 documents (contract, insurance, w9)
2. Call `getByVendorId(vendor_id, restaurant_id)`
3. Verify returns all 3 documents
4. Verify filtered by restaurant

**Expected Results:**
```json
[
  { "document_type": "contract", "expires_at": "2026-01-01" },
  { "document_type": "insurance", "expires_at": "2025-12-31" },
  { "document_type": "w9", "expires_at": null }
]
```

**Acceptance Criteria:**
- ✓ Returns all documents for vendor
- ✓ Sorted by created_at (newest first)
- ✓ Multi-tenant filtering

---

#### Test Case VD-003: Get Expiring Documents
**Priority:** MEDIUM
**Type:** Business Logic

**Test Steps:**
1. Upload documents with various expiration dates
2. Call `getExpiringDocuments(restaurant_id, days_ahead = 30)`
3. Verify returns documents expiring within 30 days

**Expected Results:**
- Returns documents expiring soon
- Excludes already-expired documents
- Excludes documents without expiration

**Acceptance Criteria:**
- ✓ Date comparison logic correct
- ✓ Sorted by expires_at (soonest first)
- ✓ Restaurant filtering enforced

---

#### Test Case VD-004: Delete Document
**Priority:** LOW
**Type:** Functional

**Test Steps:**
1. Delete document record
2. Verify file_url still accessible (orphaned file)
3. OR verify file deleted from storage (cascading)

**Expected Results:**
- Document record deleted
- File handling depends on implementation

**Acceptance Criteria:**
- ✓ Authorization required
- ✓ File cleanup policy defined

---

### Test Group 1.7: Vendor Scorecards Service

**Service File:** `backend/src/services/vendorScorecards.js`

#### Test Case VS-001: Create Vendor Scorecard
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Call `createScorecard()`:
   ```json
   {
     "vendor_id": "sysco-vendor-id",
     "restaurant_id": "test-restaurant-id",
     "evaluation_period": "2025-Q1",
     "evaluation_date": "2025-03-31",
     "quality_score": 92,
     "delivery_score": 88,
     "service_score": 95,
     "overall_rating": 4.5,
     "notes": "Excellent quality, occasional late deliveries"
   }
   ```
2. Verify scorecard created
3. Verify score validation

**Expected Results:**
- Scorecard created successfully
- Scores within valid ranges
- overall_rating calculated or validated

**Acceptance Criteria:**
- ✓ quality_score, delivery_score, service_score between 0-100
- ✓ overall_rating between 1-5 (half stars allowed)
- ✓ evaluation_period format validation (YYYY-QN or YYYY-MM)
- ✓ evaluation_date <= current date

---

#### Test Case VS-002: Get Scorecards by Vendor
**Priority:** MEDIUM
**Type:** Functional

**Test Steps:**
1. Create scorecards for multiple periods
2. Call `getByVendorId(vendor_id, restaurant_id)`
3. Verify returns all scorecards sorted by evaluation_date

**Expected Results:**
```json
[
  { "evaluation_period": "2025-Q1", "overall_rating": 4.5 },
  { "evaluation_period": "2024-Q4", "overall_rating": 4.2 },
  { "evaluation_period": "2024-Q3", "overall_rating": 4.0 }
]
```

**Acceptance Criteria:**
- ✓ Sorted by evaluation_date descending (newest first)
- ✓ Multi-tenant filtering
- ✓ Can filter by date range

---

#### Test Case VS-003: Get Vendor Performance Trend
**Priority:** MEDIUM
**Type:** Business Logic

**Test Steps:**
1. Create scorecards for 4 quarters
2. Call `getPerformanceTrend(vendor_id, restaurant_id, periods = 4)`
3. Verify returns trend data

**Expected Results:**
```json
{
  "vendor_id": "sysco-vendor-id",
  "trend": [
    { "period": "2025-Q1", "avg_score": 91.67, "overall_rating": 4.5 },
    { "period": "2024-Q4", "avg_score": 88.33, "overall_rating": 4.2 },
    { "period": "2024-Q3", "avg_score": 85.00, "overall_rating": 4.0 },
    { "period": "2024-Q2", "avg_score": 82.67, "overall_rating": 3.8 }
  ],
  "improvement": "positive"
}
```

**Acceptance Criteria:**
- ✓ Average calculated correctly
- ✓ Trend direction calculated (positive, negative, stable)
- ✓ Handles missing periods gracefully

---

#### Test Case VS-004: Update Scorecard
**Priority:** LOW
**Type:** Functional

**Test Steps:**
1. Update existing scorecard scores
2. Verify changes saved
3. Verify updated_at timestamp changed

**Expected Results:**
- Scorecard updated
- Validation enforced on update

**Acceptance Criteria:**
- ✓ Cannot update another restaurant's scorecards
- ✓ Score validation on update
- ✓ Cannot change vendor_id (FK integrity)

---

#### Test Case VS-005: Delete Scorecard
**Priority:** LOW
**Type:** Functional

**Test Steps:**
1. Delete scorecard
2. Verify vendor still exists
3. Verify historical trend recalculated

**Expected Results:**
- Scorecard deleted
- Vendor unaffected
- Trend data reflects deletion

**Acceptance Criteria:**
- ✓ Authorization required
- ✓ Soft delete vs hard delete policy

---

## Phase 2: Multi-Tenancy Testing

### Test Group 2.1: Restaurant Data Isolation

#### Test Case MT-001: Vendor Isolation
**Priority:** CRITICAL
**Type:** Security

**Test Steps:**
1. Create vendor for Restaurant A
2. Create vendor for Restaurant B (same name)
3. As Restaurant A user, query vendors
4. Verify only Restaurant A's vendor returned

**Expected Results:**
- No cross-restaurant data leakage
- Each restaurant sees only own vendors

**Acceptance Criteria:**
- ✓ restaurant_id filtering enforced in service layer
- ✓ Cannot query other restaurant's vendors by ID
- ✓ Error if attempting to access unauthorized vendor

---

#### Test Case MT-002: Address Isolation
**Priority:** CRITICAL
**Type:** Security

**Test Steps:**
1. Restaurant A creates address for their vendor
2. Restaurant B attempts to access that address
3. Verify access denied

**Expected Results:**
- Restaurant B gets empty result
- No error exposing existence of address

**Acceptance Criteria:**
- ✓ All address queries filtered by restaurant_id
- ✓ No information leakage via error messages

---

#### Test Case MT-003: Contact Isolation
**Priority:** CRITICAL
**Type:** Security

**Test Steps:**
1. Restaurant A creates contact for vendor
2. Restaurant B attempts to query same vendor_id
3. Verify Restaurant B sees different vendor (or none)

**Expected Results:**
- No contact data leakage
- Each restaurant has isolated vendor contact list

**Acceptance Criteria:**
- ✓ Contact queries filtered by restaurant_id
- ✓ Cannot update another restaurant's contacts

---

#### Test Case MT-004: Payment Info Isolation
**Priority:** CRITICAL
**Type:** Security

**Test Steps:**
1. Restaurant A stores payment info for vendor
2. Restaurant B attempts to query payment info
3. Verify access completely denied (not just masked)

**Expected Results:**
- Restaurant B gets null/empty result
- No data exposure via error messages

**Acceptance Criteria:**
- ✓ Payment info strictly isolated by restaurant
- ✓ Even vendor_id collision doesn't expose data

---

#### Test Case MT-005: Document Isolation
**Priority:** CRITICAL
**Type:** Security

**Test Steps:**
1. Restaurant A uploads vendor document
2. Restaurant B attempts to access file_url
3. Verify access control on storage layer

**Expected Results:**
- Storage layer enforces access control
- file_url not guessable or enumerable

**Acceptance Criteria:**
- ✓ Document queries filtered by restaurant_id
- ✓ File storage has authentication/authorization
- ✓ Cannot list other restaurants' documents

---

#### Test Case MT-006: Scorecard Isolation
**Priority:** HIGH
**Type:** Security

**Test Steps:**
1. Restaurant A creates vendor scorecard
2. Restaurant B attempts to view scorecard
3. Verify complete isolation

**Expected Results:**
- No scorecard data leakage
- Performance trends isolated per restaurant

**Acceptance Criteria:**
- ✓ Scorecards filtered by restaurant_id
- ✓ Trend calculations respect multi-tenancy

---

### Test Group 2.2: Cross-Tenant Attack Prevention

#### Test Case CTA-001: ID Enumeration Attack
**Priority:** HIGH
**Type:** Security

**Test Steps:**
1. As Restaurant B, attempt to access Restaurant A's address by ID
2. Try sequential UUIDs, common patterns
3. Verify no data returned

**Expected Results:**
- All attempts return 404 or empty result
- No error message reveals existence

**Acceptance Criteria:**
- ✓ Service layer validates restaurant_id matches authenticated user
- ✓ Generic error messages (no info leakage)

---

#### Test Case CTA-002: SQL Injection via vendor_id
**Priority:** HIGH
**Type:** Security

**Test Steps:**
1. Attempt SQL injection in vendor_id parameter
2. Try `'; DROP TABLE vendors; --`
3. Verify input sanitization

**Expected Results:**
- Input rejected or sanitized
- No SQL execution
- Error logged securely

**Acceptance Criteria:**
- ✓ Parameterized queries used throughout
- ✓ Input validation on all parameters
- ✓ No raw SQL string concatenation

---

#### Test Case CTA-003: Restaurant ID Tampering
**Priority:** CRITICAL
**Type:** Security

**Test Steps:**
1. Intercept API request
2. Modify restaurant_id in request body
3. Verify server-side validation rejects tampered request

**Expected Results:**
- Request rejected
- restaurant_id from JWT token used (not request body)

**Acceptance Criteria:**
- ✓ restaurant_id from authenticated session only
- ✓ Cannot override via request parameters
- ✓ Middleware enforces authentication

---

## Phase 3: Data Integrity Testing

### Test Group 3.1: Foreign Key Constraints

#### Test Case FK-001: Vendor Deletion Cascade
**Priority:** HIGH
**Type:** Data Integrity

**Test Steps:**
1. Create vendor with addresses, contacts, payment info
2. Delete vendor
3. Verify all related records cascade deleted

**Expected Results:**
- vendor_addresses deleted
- vendor_contacts deleted
- vendor_payment_info deleted
- vendor_purchasing_data deleted
- vendor_documents deleted
- vendor_scorecards deleted

**Acceptance Criteria:**
- ✓ ON DELETE CASCADE configured correctly
- ✓ No orphaned records
- ✓ ingredient_vendor_mapping handling (set null or cascade?)

---

#### Test Case FK-002: Non-Existent Vendor ID
**Priority:** MEDIUM
**Type:** Data Integrity

**Test Steps:**
1. Attempt to create address with non-existent vendor_id
2. Verify FK constraint prevents creation

**Expected Results:**
- Error: "Vendor does not exist"
- No address record created

**Acceptance Criteria:**
- ✓ FK constraint enforced at database level
- ✓ Graceful error handling in service layer
- ✓ Appropriate error message to client

---

#### Test Case FK-003: Non-Existent Restaurant ID
**Priority:** MEDIUM
**Type:** Data Integrity

**Test Steps:**
1. Attempt to create vendor with invalid restaurant_id
2. Verify FK constraint prevents creation

**Expected Results:**
- Error: "Restaurant does not exist"
- No vendor created

**Acceptance Criteria:**
- ✓ FK constraint enforced
- ✓ Service layer validates restaurant_id exists

---

### Test Group 3.2: Unique Constraints

#### Test Case UC-001: Duplicate Vendor Code
**Priority:** MEDIUM
**Type:** Data Integrity

**Test Steps:**
1. Create vendor with vendor_code = "V001"
2. Attempt to create another vendor with same code for same restaurant
3. Verify unique constraint prevents duplicate

**Expected Results:**
- Error: "Vendor code already exists for this restaurant"
- Second vendor not created

**Acceptance Criteria:**
- ✓ Unique constraint on (restaurant_id, vendor_code)
- ✓ NULL vendor_code allowed (multiple vendors can have NULL)
- ✓ Different restaurants CAN use same vendor_code

---

#### Test Case UC-002: Duplicate Payment Term Name
**Priority:** LOW
**Type:** Data Integrity

**Test Steps:**
1. Attempt to create payment term named "Net 30"
2. Verify unique constraint prevents duplicate

**Expected Results:**
- Error: "Payment term name already exists"
- No duplicate created

**Acceptance Criteria:**
- ✓ Unique constraint on payment_terms.name
- ✓ Case-insensitive comparison
- ✓ Trimmed whitespace

---

### Test Group 3.3: Check Constraints

#### Test Case CC-001: Scorecard Score Ranges
**Priority:** MEDIUM
**Type:** Data Integrity

**Test Steps:**
1. Attempt to create scorecard with quality_score = 150
2. Verify check constraint rejects invalid score

**Expected Results:**
- Error: "Score must be between 0 and 100"
- No scorecard created

**Acceptance Criteria:**
- ✓ quality_score CHECK (value >= 0 AND value <= 100)
- ✓ delivery_score CHECK (value >= 0 AND value <= 100)
- ✓ service_score CHECK (value >= 0 AND value <= 100)
- ✓ overall_rating CHECK (value >= 1 AND value <= 5)

---

#### Test Case CC-002: Negative Price Prevention
**Priority:** HIGH
**Type:** Data Integrity

**Test Steps:**
1. Attempt to set price_per_unit = -10.00 in ingredient_vendor_mapping
2. Verify check constraint prevents negative price

**Expected Results:**
- Error: "Price must be greater than 0"
- No record created/updated

**Acceptance Criteria:**
- ✓ price_per_unit CHECK (value > 0)
- ✓ Applied to both INSERT and UPDATE

---

### Test Group 3.4: Trigger Validation

#### Test Case TG-001: Updated At Trigger
**Priority:** MEDIUM
**Type:** Automation

**Test Steps:**
1. Create vendor address
2. Note created_at and updated_at timestamps
3. Wait 1 second
4. Update address
5. Verify updated_at changed, created_at unchanged

**Expected Results:**
- updated_at timestamp reflects update time
- created_at timestamp unchanged
- Automatic (no manual timestamp setting)

**Acceptance Criteria:**
- ✓ Trigger fires on UPDATE
- ✓ Trigger does NOT fire on INSERT
- ✓ All vendor tables have updated_at trigger

---

#### Test Case TG-002: Primary Address Enforcement
**Priority:** HIGH
**Type:** Automation

**Test Steps:**
1. Create primary shipping address for vendor
2. Attempt to create second primary shipping address
3. Verify trigger prevents duplicate

**Expected Results:**
- Error: "Vendor already has a primary shipping address"
- Trigger rolls back transaction

**Acceptance Criteria:**
- ✓ Trigger `ensure_single_primary_address` fires BEFORE INSERT/UPDATE
- ✓ Can have multiple addresses if not all primary
- ✓ Can change which address is primary (UPDATE old to false, new to true)

---

#### Test Case TG-003: Primary Contact Enforcement
**Priority:** HIGH
**Type:** Automation

**Test Steps:**
1. Create primary sales contact for vendor
2. Attempt to create second primary sales contact
3. Verify trigger prevents duplicate

**Expected Results:**
- Error: "Vendor already has a primary sales contact"
- Trigger rolls back transaction

**Acceptance Criteria:**
- ✓ Trigger `ensure_single_primary_contact` fires BEFORE INSERT/UPDATE
- ✓ Different contact_types can each have primary
- ✓ Can swap primary contacts

---

#### Test Case TG-004: Price Change Tracking
**Priority:** MEDIUM
**Type:** Automation

**Test Steps:**
1. Create ingredient_vendor_mapping with price = $10.00
2. Update price to $12.00
3. Verify last_price_update timestamp set automatically

**Expected Results:**
- last_price_update = current timestamp
- Automatic tracking (no manual setting required)

**Acceptance Criteria:**
- ✓ Trigger `track_price_changes` fires on UPDATE
- ✓ Only fires when price_per_unit actually changes
- ✓ Does NOT update if price unchanged

---

## Phase 4: API Endpoint Testing

### Test Group 4.1: Payment Terms Endpoints

**Base URL:** `/api/payment-terms`

#### Test Case API-PT-001: GET /api/payment-terms
**Priority:** HIGH
**Type:** API Functional

**Request:**
```http
GET /api/payment-terms
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "uuid",
    "name": "Net 30",
    "days": 30,
    "discount_percent": null,
    "description": "Payment due within 30 days"
  },
  ...
]
```

**Acceptance Criteria:**
- ✓ Returns all payment terms
- ✓ Sorted by days ascending
- ✓ Authentication optional (public data)

---

#### Test Case API-PT-002: GET /api/payment-terms/:id
**Priority:** MEDIUM
**Type:** API Functional

**Request:**
```http
GET /api/payment-terms/{uuid}
Authorization: Bearer {jwt_token}
```

**Expected Response (Success):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "uuid",
  "name": "Net 30",
  "days": 30,
  "discount_percent": null,
  "description": "Payment due within 30 days"
}
```

**Expected Response (Not Found):**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Payment term not found"
}
```

**Acceptance Criteria:**
- ✓ Returns single payment term
- ✓ 404 for non-existent ID
- ✓ Valid UUID format required

---

#### Test Case API-PT-003: POST /api/payment-terms
**Priority:** MEDIUM
**Type:** API Functional

**Request:**
```http
POST /api/payment-terms
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Net 90",
  "days": 90,
  "description": "Payment due within 90 days"
}
```

**Expected Response (Success):**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "new-uuid",
  "name": "Net 90",
  "days": 90,
  "discount_percent": null,
  "description": "Payment due within 90 days",
  "created_at": "2025-12-31T12:00:00Z"
}
```

**Expected Response (Duplicate):**
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": "Payment term with this name already exists"
}
```

**Acceptance Criteria:**
- ✓ Requires authentication
- ✓ Validates name uniqueness
- ✓ Validates days >= 0
- ✓ Validates discount_percent 0-100 if provided

---

### Test Group 4.2: Vendor Addresses Endpoints

**Base URL:** `/api/vendor-addresses`

#### Test Case API-VA-001: POST /api/vendor-addresses
**Priority:** HIGH
**Type:** API Functional

**Request:**
```http
POST /api/vendor-addresses
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "vendor_id": "sysco-vendor-id",
  "address_type": "shipping",
  "street_address": "123 Warehouse Blvd",
  "city": "Houston",
  "state": "TX",
  "postal_code": "77001",
  "country": "USA",
  "is_primary": true
}
```

**Expected Response (Success):**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "new-uuid",
  "vendor_id": "sysco-vendor-id",
  "restaurant_id": "user-restaurant-id",
  "address_type": "shipping",
  "street_address": "123 Warehouse Blvd",
  "city": "Houston",
  "state": "TX",
  "postal_code": "77001",
  "country": "USA",
  "is_primary": true,
  "created_at": "2025-12-31T12:00:00Z"
}
```

**Expected Response (Unauthorized Vendor):**
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Vendor does not belong to your restaurant"
}
```

**Acceptance Criteria:**
- ✓ Requires authentication
- ✓ restaurant_id from JWT token (not request body)
- ✓ Validates vendor belongs to user's restaurant
- ✓ Validates address_type enum
- ✓ Postal code validation

---

#### Test Case API-VA-002: GET /api/vendor-addresses/vendor/:vendorId
**Priority:** HIGH
**Type:** API Functional

**Request:**
```http
GET /api/vendor-addresses/vendor/{vendor_id}
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "uuid1",
    "address_type": "shipping",
    "street_address": "123 Warehouse Blvd",
    "is_primary": true
  },
  {
    "id": "uuid2",
    "address_type": "billing",
    "street_address": "456 Office St",
    "is_primary": true
  }
]
```

**Acceptance Criteria:**
- ✓ Returns only addresses for specified vendor
- ✓ Filtered by user's restaurant_id
- ✓ Returns empty array if no addresses
- ✓ 403 if vendor not in user's restaurant

---

#### Test Case API-VA-003: PUT /api/vendor-addresses/:id
**Priority:** MEDIUM
**Type:** API Functional

**Request:**
```http
PUT /api/vendor-addresses/{address_id}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "street_address": "789 New Location Ave",
  "postal_code": "77002"
}
```

**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "address_id",
  "street_address": "789 New Location Ave",
  "postal_code": "77002",
  "updated_at": "2025-12-31T13:00:00Z"
}
```

**Acceptance Criteria:**
- ✓ Requires authentication
- ✓ Can only update own restaurant's addresses
- ✓ Partial updates supported
- ✓ Validation on changed fields

---

#### Test Case API-VA-004: DELETE /api/vendor-addresses/:id
**Priority:** MEDIUM
**Type:** API Functional

**Request:**
```http
DELETE /api/vendor-addresses/{address_id}
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Address deleted successfully",
  "deleted": {
    "id": "address_id",
    "address_type": "shipping"
  }
}
```

**Acceptance Criteria:**
- ✓ Requires authentication
- ✓ Can only delete own restaurant's addresses
- ✓ Returns deleted object for confirmation
- ✓ 404 if address not found

---

### Test Group 4.3: Vendor Contacts Endpoints

**Base URL:** `/api/vendor-contacts`

#### Test Case API-VC-001: POST /api/vendor-contacts
**Priority:** HIGH
**Type:** API Functional

**Request:**
```http
POST /api/vendor-contacts
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "vendor_id": "sysco-vendor-id",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@sysco.com",
  "phone": "555-1234",
  "contact_type": "sales",
  "is_primary": true
}
```

**Expected Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "new-uuid",
  "vendor_id": "sysco-vendor-id",
  "restaurant_id": "user-restaurant-id",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@sysco.com",
  "phone": "555-1234",
  "contact_type": "sales",
  "is_primary": true,
  "created_at": "2025-12-31T12:00:00Z"
}
```

**Acceptance Criteria:**
- ✓ Email validation (RFC 5322)
- ✓ contact_type enum validation
- ✓ Primary contact enforcement (trigger)
- ✓ Vendor ownership verification

---

#### Test Case API-VC-002: GET /api/vendor-contacts/vendor/:vendorId
**Priority:** HIGH
**Type:** API Functional

**Request:**
```http
GET /api/vendor-contacts/vendor/{vendor_id}
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "uuid1",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@sysco.com",
    "phone": "555-1234",
    "contact_type": "sales",
    "is_primary": true
  },
  ...
]
```

**Acceptance Criteria:**
- ✓ Returns all contacts for vendor
- ✓ Sorted by is_primary DESC, then last_name
- ✓ Multi-tenant filtering

---

### Test Group 4.4: Vendor Payment Info Endpoints

**Base URL:** `/api/vendor-payment`

#### Test Case API-VPI-001: POST /api/vendor-payment
**Priority:** HIGH
**Type:** API Functional & Security

**Request:**
```http
POST /api/vendor-payment
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "vendor_id": "sysco-vendor-id",
  "payment_method": "ACH",
  "bank_name": "Chase Bank",
  "account_number": "12345678",
  "routing_number": "021000021",
  "account_holder": "Sysco Corporation"
}
```

**Expected Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "new-uuid",
  "vendor_id": "sysco-vendor-id",
  "payment_method": "ACH",
  "bank_name": "Chase Bank",
  "account_number": "****5678",
  "routing_number": "****0021",
  "account_holder": "Sysco Corporation",
  "created_at": "2025-12-31T12:00:00Z"
}
```

**Acceptance Criteria:**
- ✓ account_number masked in response
- ✓ routing_number partially masked
- ✓ Sensitive data NOT logged
- ✓ HTTPS required (enforce in production)

---

#### Test Case API-VPI-002: GET /api/vendor-payment/vendor/:vendorId
**Priority:** HIGH
**Type:** API Functional & Security

**Request:**
```http
GET /api/vendor-payment/vendor/{vendor_id}
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "uuid",
  "payment_method": "ACH",
  "bank_name": "Chase Bank",
  "account_number": "****5678",
  "routing_number": "****0021",
  "account_holder": "Sysco Corporation"
}
```

**Acceptance Criteria:**
- ✓ Returns masked payment info
- ✓ Multi-tenant filtering enforced
- ✓ Admin role can view full details (optional enhancement)

---

### Test Group 4.5: Vendor Documents Endpoints

**Base URL:** `/api/vendor-documents`

#### Test Case API-VD-001: POST /api/vendor-documents
**Priority:** MEDIUM
**Type:** API Functional

**Request:**
```http
POST /api/vendor-documents
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "vendor_id": "sysco-vendor-id",
  "document_type": "contract",
  "file_name": "sysco-contract-2025.pdf",
  "file_url": "https://storage.example.com/docs/contract.pdf",
  "expires_at": "2026-01-01"
}
```

**Expected Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "new-uuid",
  "vendor_id": "sysco-vendor-id",
  "restaurant_id": "user-restaurant-id",
  "document_type": "contract",
  "file_name": "sysco-contract-2025.pdf",
  "file_url": "https://storage.example.com/docs/contract.pdf",
  "expires_at": "2026-01-01T00:00:00Z",
  "created_at": "2025-12-31T12:00:00Z"
}
```

**Acceptance Criteria:**
- ✓ document_type validation
- ✓ file_name sanitization (no path traversal)
- ✓ file_url format validation
- ✓ Vendor ownership verification

---

#### Test Case API-VD-002: GET /api/vendor-documents/vendor/:vendorId
**Priority:** MEDIUM
**Type:** API Functional

**Request:**
```http
GET /api/vendor-documents/vendor/{vendor_id}
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "uuid1",
    "document_type": "contract",
    "file_name": "sysco-contract-2025.pdf",
    "expires_at": "2026-01-01T00:00:00Z"
  },
  ...
]
```

**Acceptance Criteria:**
- ✓ Returns all documents for vendor
- ✓ Sorted by created_at DESC
- ✓ Multi-tenant filtering

---

#### Test Case API-VD-003: GET /api/vendor-documents/expiring
**Priority:** MEDIUM
**Type:** API Business Logic

**Request:**
```http
GET /api/vendor-documents/expiring?days=30
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "uuid1",
    "vendor_id": "sysco-vendor-id",
    "vendor_name": "Sysco Corporation",
    "document_type": "insurance",
    "expires_at": "2025-01-15T00:00:00Z",
    "days_until_expiration": 15
  },
  ...
]
```

**Acceptance Criteria:**
- ✓ Returns documents expiring within N days
- ✓ Sorted by expires_at ASC (soonest first)
- ✓ Includes vendor name for convenience
- ✓ Restaurant filtering enforced

---

### Test Group 4.6: Vendor Scorecards Endpoints

**Base URL:** `/api/vendor-scorecards`

#### Test Case API-VS-001: POST /api/vendor-scorecards
**Priority:** MEDIUM
**Type:** API Functional

**Request:**
```http
POST /api/vendor-scorecards
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "vendor_id": "sysco-vendor-id",
  "evaluation_period": "2025-Q1",
  "evaluation_date": "2025-03-31",
  "quality_score": 92,
  "delivery_score": 88,
  "service_score": 95,
  "overall_rating": 4.5,
  "notes": "Excellent quality, occasional late deliveries"
}
```

**Expected Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "new-uuid",
  "vendor_id": "sysco-vendor-id",
  "restaurant_id": "user-restaurant-id",
  "evaluation_period": "2025-Q1",
  "evaluation_date": "2025-03-31T00:00:00Z",
  "quality_score": 92,
  "delivery_score": 88,
  "service_score": 95,
  "overall_rating": 4.5,
  "notes": "Excellent quality, occasional late deliveries",
  "created_at": "2025-12-31T12:00:00Z"
}
```

**Acceptance Criteria:**
- ✓ Score validation (0-100 for component scores)
- ✓ Rating validation (1-5 for overall)
- ✓ evaluation_period format validation
- ✓ Vendor ownership verification

---

#### Test Case API-VS-002: GET /api/vendor-scorecards/vendor/:vendorId
**Priority:** MEDIUM
**Type:** API Functional

**Request:**
```http
GET /api/vendor-scorecards/vendor/{vendor_id}
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "uuid1",
    "evaluation_period": "2025-Q1",
    "evaluation_date": "2025-03-31T00:00:00Z",
    "quality_score": 92,
    "delivery_score": 88,
    "service_score": 95,
    "overall_rating": 4.5
  },
  ...
]
```

**Acceptance Criteria:**
- ✓ Returns all scorecards for vendor
- ✓ Sorted by evaluation_date DESC
- ✓ Multi-tenant filtering

---

#### Test Case API-VS-003: GET /api/vendor-scorecards/vendor/:vendorId/trend
**Priority:** MEDIUM
**Type:** API Business Logic

**Request:**
```http
GET /api/vendor-scorecards/vendor/{vendor_id}/trend?periods=4
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "vendor_id": "sysco-vendor-id",
  "vendor_name": "Sysco Corporation",
  "trend": [
    {
      "period": "2025-Q1",
      "avg_score": 91.67,
      "overall_rating": 4.5
    },
    ...
  ],
  "improvement": "positive"
}
```

**Acceptance Criteria:**
- ✓ Calculates average of component scores
- ✓ Determines trend direction
- ✓ Handles missing periods gracefully
- ✓ Restaurant filtering enforced

---

## Phase 5: Performance Testing

### Test Group 5.1: Query Performance

#### Test Case PERF-001: Large Vendor List
**Priority:** MEDIUM
**Type:** Performance

**Test Steps:**
1. Create 1,000 vendors for restaurant
2. Query GET /api/vendors
3. Measure response time

**Expected Results:**
- Response time < 500ms
- Pagination implemented (if >100 vendors)
- Proper indexing on restaurant_id

**Acceptance Criteria:**
- ✓ Query uses index on restaurant_id
- ✓ Response time acceptable
- ✓ Pagination or limit/offset supported

---

#### Test Case PERF-002: Address Lookup by Vendor
**Priority:** MEDIUM
**Type:** Performance

**Test Steps:**
1. Create 50 addresses for single vendor
2. Query GET /api/vendor-addresses/vendor/:id
3. Measure response time

**Expected Results:**
- Response time < 200ms
- Index on vendor_id used

**Acceptance Criteria:**
- ✓ Query plan uses idx_vendor_addresses_vendor_id
- ✓ No full table scan

---

#### Test Case PERF-003: Expiring Documents Query
**Priority:** LOW
**Type:** Performance

**Test Steps:**
1. Create 500 vendor documents with various expiration dates
2. Query GET /api/vendor-documents/expiring?days=30
3. Measure response time

**Expected Results:**
- Response time < 300ms
- Date range index used

**Acceptance Criteria:**
- ✓ Query optimized with date filtering
- ✓ Restaurant filtering indexed

---

### Test Group 5.2: Concurrent Operations

#### Test Case CONC-001: Simultaneous Address Creation
**Priority:** LOW
**Type:** Concurrency

**Test Steps:**
1. Spawn 10 concurrent requests to create addresses for same vendor
2. Verify all succeed or fail gracefully
3. Check for race conditions on is_primary

**Expected Results:**
- All requests complete without deadlock
- is_primary enforcement consistent
- No data corruption

**Acceptance Criteria:**
- ✓ Database handles concurrent writes
- ✓ Triggers handle concurrent primary flag changes
- ✓ No lost updates

---

## Phase 6: Error Handling Testing

### Test Group 6.1: Input Validation Errors

#### Test Case ERR-001: Missing Required Fields
**Priority:** HIGH
**Type:** Error Handling

**Request:**
```http
POST /api/vendor-addresses
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "vendor_id": "sysco-vendor-id"
  // Missing required fields
}
```

**Expected Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Validation failed",
  "details": [
    "address_type is required",
    "street_address is required",
    "city is required"
  ]
}
```

**Acceptance Criteria:**
- ✓ 400 status code
- ✓ Clear error message
- ✓ Lists all missing fields

---

#### Test Case ERR-002: Invalid Email Format
**Priority:** MEDIUM
**Type:** Error Handling

**Request:**
```http
POST /api/vendor-contacts
Content-Type: application/json

{
  "email": "not-an-email"
}
```

**Expected Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid email format"
}
```

**Acceptance Criteria:**
- ✓ Email validation using regex or library
- ✓ Clear error message

---

#### Test Case ERR-003: Invalid Enum Value
**Priority:** MEDIUM
**Type:** Error Handling

**Request:**
```http
POST /api/vendor-contacts
Content-Type: application/json

{
  "contact_type": "invalid_type"
}
```

**Expected Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid contact_type. Must be one of: sales, purchasing, accounting, support"
}
```

**Acceptance Criteria:**
- ✓ Enum validation
- ✓ Lists valid options

---

### Test Group 6.2: Authorization Errors

#### Test Case ERR-AUTH-001: Missing JWT Token
**Priority:** HIGH
**Type:** Security

**Request:**
```http
GET /api/vendor-addresses
// No Authorization header
```

**Expected Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Authentication required"
}
```

**Acceptance Criteria:**
- ✓ 401 status code
- ✓ Generic error message (no info leakage)

---

#### Test Case ERR-AUTH-002: Invalid JWT Token
**Priority:** HIGH
**Type:** Security

**Request:**
```http
GET /api/vendor-addresses
Authorization: Bearer invalid-token-here
```

**Expected Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Invalid or expired token"
}
```

**Acceptance Criteria:**
- ✓ 401 status code
- ✓ Token validation in middleware

---

#### Test Case ERR-AUTH-003: Accessing Another Restaurant's Data
**Priority:** CRITICAL
**Type:** Security

**Request:**
```http
GET /api/vendor-addresses/{other-restaurant-address-id}
Authorization: Bearer {valid-jwt-for-restaurant-A}
```

**Expected Response:**
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Access denied"
}
```

**Acceptance Criteria:**
- ✓ 403 status code
- ✓ No info about whether resource exists
- ✓ Restaurant ID validation

---

### Test Group 6.3: Database Errors

#### Test Case ERR-DB-001: Foreign Key Violation
**Priority:** MEDIUM
**Type:** Error Handling

**Test Steps:**
1. Attempt to create address with non-existent vendor_id

**Expected Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Vendor not found"
}
```

**Acceptance Criteria:**
- ✓ User-friendly error message
- ✓ Database error not exposed
- ✓ Error logged server-side

---

#### Test Case ERR-DB-002: Unique Constraint Violation
**Priority:** MEDIUM
**Type:** Error Handling

**Test Steps:**
1. Create payment term named "Net 30"
2. Attempt to create duplicate

**Expected Response:**
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": "Payment term with this name already exists"
}
```

**Acceptance Criteria:**
- ✓ 409 status code
- ✓ Clear conflict message
- ✓ No SQL error exposed

---

#### Test Case ERR-DB-003: Check Constraint Violation
**Priority:** MEDIUM
**Type:** Error Handling

**Test Steps:**
1. Attempt to create scorecard with quality_score = 150

**Expected Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "quality_score must be between 0 and 100"
}
```

**Acceptance Criteria:**
- ✓ Validation before database attempt
- ✓ Clear range specification

---

## Test Execution Summary

### Priority Levels

| Priority | Description | Execute When |
|----------|-------------|--------------|
| CRITICAL | Security, data isolation, authentication | Immediately, before any deployment |
| HIGH | Core CRUD functionality, multi-tenancy | Before feature completion |
| MEDIUM | Extended functionality, validation | Before QA signoff |
| LOW | Edge cases, performance optimization | Before production release |

### Test Coverage Goals

| Test Type | Target Coverage |
|-----------|----------------|
| Service Layer | 90% code coverage |
| API Endpoints | 100% endpoint coverage |
| Multi-Tenancy | 100% isolation verification |
| Data Integrity | All constraints tested |
| Error Handling | All error paths tested |
| Security | All attack vectors tested |

---

## Test Automation Recommendations

### Unit Tests (Backend)

**Framework:** Jest or Mocha
**Files to Test:**
- `backend/src/services/paymentTerms.js`
- `backend/src/services/vendorAddresses.js`
- `backend/src/services/vendorContacts.js`
- `backend/src/services/vendorPayment.js`
- `backend/src/services/vendorPurchasing.js`
- `backend/src/services/vendorDocuments.js`
- `backend/src/services/vendorScorecards.js`

**Example Test Structure:**
```javascript
// backend/src/tests/services/vendorAddresses.test.js
describe('Vendor Addresses Service', () => {
  describe('createAddress', () => {
    it('should create address with valid data', async () => {
      // Test Case VA-001
    });

    it('should enforce multi-tenancy', async () => {
      // Test Case MT-002
    });

    it('should prevent duplicate primary addresses', async () => {
      // Test Case VA-005
    });
  });
});
```

---

### Integration Tests (API)

**Framework:** Supertest + Jest
**Test Database:** Separate test database with migrations

**Example:**
```javascript
// backend/src/tests/api/vendorAddresses.test.js
const request = require('supertest');
const app = require('../../index');

describe('Vendor Addresses API', () => {
  let authToken;
  let vendorId;

  beforeAll(async () => {
    authToken = await getTestAuthToken();
    vendorId = await createTestVendor();
  });

  describe('POST /api/vendor-addresses', () => {
    it('should create address with authentication', async () => {
      const response = await request(app)
        .post('/api/vendor-addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor_id: vendorId,
          address_type: 'shipping',
          street_address: '123 Test St',
          city: 'Houston',
          state: 'TX',
          postal_code: '77001',
          country: 'USA',
          is_primary: true
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      // Test Case API-VA-001
    });
  });
});
```

---

### Database Tests

**Framework:** Custom migration verification
**Focus:**
- Constraint enforcement
- Trigger behavior
- Index usage
- Cascade behavior

**Example:**
```javascript
describe('Database Constraints', () => {
  it('should enforce unique vendor codes per restaurant', async () => {
    // Test Case UC-001
  });

  it('should cascade delete vendor addresses when vendor deleted', async () => {
    // Test Case FK-001
  });
});
```

---

## Success Criteria

### Phase Completion Checklist

**Phase 1: Service Layer CRUD Testing**
- [ ] All 7 service modules tested
- [ ] CRUD operations verified for each entity
- [ ] Error handling validated
- [ ] Multi-tenancy enforced in all queries

**Phase 2: Multi-Tenancy Testing**
- [ ] No cross-restaurant data leakage
- [ ] All queries filtered by restaurant_id
- [ ] Authorization checks enforced
- [ ] Attack prevention validated

**Phase 3: Data Integrity Testing**
- [ ] All FK constraints working
- [ ] Unique constraints enforced
- [ ] Check constraints validated
- [ ] Triggers firing correctly

**Phase 4: API Endpoint Testing**
- [ ] All 30+ endpoints tested
- [ ] Authentication required where needed
- [ ] Error responses standardized
- [ ] Response formats match specs

**Phase 5: Performance Testing**
- [ ] Query performance acceptable
- [ ] Indexes used efficiently
- [ ] Concurrency handled correctly
- [ ] No N+1 query problems

**Phase 6: Error Handling Testing**
- [ ] Input validation comprehensive
- [ ] Auth errors handled gracefully
- [ ] Database errors translated to user-friendly messages
- [ ] No sensitive data leaked in errors

---

## Final Validation Report Template

Upon completion of all test phases, generate a report with:

1. **Executive Summary**
   - Total tests executed
   - Pass/fail rate
   - Critical issues found
   - Recommendation (approve/reject for production)

2. **Test Results by Phase**
   - Detailed pass/fail for each test case
   - Performance metrics
   - Security findings

3. **Defect Log**
   - Severity classification
   - Steps to reproduce
   - Recommended fixes

4. **Risk Assessment**
   - Remaining risks
   - Mitigation strategies
   - Acceptance criteria for deployment

5. **Sign-Off**
   - QA approval
   - Backend specialist confirmation
   - Product manager acceptance

---

**Test Plan Prepared By:** QA Specialist Agent
**Date:** 2025-12-31
**Status:** READY FOR EXECUTION
**Estimated Test Effort:** 40-60 hours (with automation: 20-30 hours)

