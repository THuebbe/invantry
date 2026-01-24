# QA Testing Quick Reference: Vendor ERP Backend
**Feature**: FEATURE-20251229-VENDOR-ERP
**Last Updated**: 2025-12-29
**Purpose**: Fast execution checklist for pre-production testing

---

## CRITICAL PATH TESTS (Must Pass Before Production)

### TEST 1: Data Migration Validation [15 minutes]
**Location**: Staging database, after running migrations 011-021

```sql
-- Run all 4 checks and verify results match expectations

-- CHECK 1: ingredient_vendor_mapping.restaurant_id Population
SELECT COUNT(*) as total_mappings,
       COUNT(restaurant_id) as with_restaurant_id,
       SUM(CASE WHEN restaurant_id IS NULL THEN 1 ELSE 0 END) as null_count
FROM ingredient_vendor_mapping;
-- EXPECTED: null_count = 0 (all populated)

-- CHECK 2: Address Migration Success
SELECT COUNT(*) as vendors_with_address,
       COUNT(DISTINCT va.vendor_id) as vendors_with_migrated_addresses,
       COUNT(va.id) as total_addresses_created
FROM vendors v
LEFT JOIN vendor_addresses va ON v.id = va.vendor_id AND va.address_type = 'primary'
WHERE v.address IS NOT NULL AND v.address != 'null'::jsonb AND v.address::text != '{}';
-- EXPECTED: vendors_with_address = vendors_with_migrated_addresses

-- CHECK 3: Contact Migration Success
SELECT COUNT(*) as vendors_with_contact,
       COUNT(DISTINCT vc.vendor_id) as vendors_with_migrated_contacts
FROM vendors v
LEFT JOIN vendor_contacts vc ON v.id = vc.vendor_id AND vc.is_primary = true
WHERE v.contact_name IS NOT NULL AND TRIM(v.contact_name) != '';
-- EXPECTED: vendors_with_contact = vendors_with_migrated_contacts

-- CHECK 4: Payment Terms Mapping Distribution
SELECT pt.name as payment_term,
       COUNT(vpi.id) as vendor_count,
       ROUND(100.0 * COUNT(vpi.id) / (SELECT COUNT(*) FROM vendor_payment_info), 1) as percentage
FROM vendor_payment_info vpi
JOIN payment_terms pt ON vpi.payment_terms_id = pt.id
GROUP BY pt.id, pt.name
ORDER BY vendor_count DESC;
-- EXPECTED: All vendors have a payment term assigned (no NULLs)
```

### TEST 2: Multi-Tenancy Isolation [20 minutes]
**Location**: Staging API with 2+ restaurants, Postman/curl

```bash
# SETUP: Create 2 test users in different restaurants
USER_A_RESTAURANT_ID="<restaurant-uuid-1>"
USER_B_RESTAURANT_ID="<restaurant-uuid-2>"

# Step 1: Login as User A
USER_A_TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user.a@test.com","password":"test123"}' \
  | jq -r '.token')

# Step 2: Get User A's vendors
VENDOR_A_LIST=$(curl -X GET http://localhost:3001/api/vendors \
  -H "Authorization: Bearer $USER_A_TOKEN")
echo "User A sees $(echo $VENDOR_A_LIST | jq 'length') vendors"

# Step 3: Login as User B
USER_B_TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user.b@test.com","password":"test123"}' \
  | jq -r '.token')

# Step 4: Get User B's vendors
VENDOR_B_LIST=$(curl -X GET http://localhost:3001/api/vendors \
  -H "Authorization: Bearer $USER_B_TOKEN")
echo "User B sees $(echo $VENDOR_B_LIST | jq 'length') vendors"

# Step 5: Attempt cross-tenant access (should fail with 404)
VENDOR_A_ID=$(echo $VENDOR_A_LIST | jq -r '.[0].id')
CROSS_TENANT_ATTEMPT=$(curl -X GET http://localhost:3001/api/vendors/$VENDOR_A_ID \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -w "\n%{http_code}")

STATUS_CODE=$(echo "$CROSS_TENANT_ATTEMPT" | tail -n1)
echo "Cross-tenant access attempt returned: $STATUS_CODE"

# EXPECTED RESULTS:
# - User A sees vendors from restaurant A only
# - User B sees vendors from restaurant B only
# - User B's attempt to access User A's vendor returns 404
# - No data from restaurant A leaks to restaurant B
```

### TEST 3: Authentication & Authorization [10 minutes]

```bash
# TEST 3a: Unauthenticated Access (should return 401)
curl -X GET http://localhost:3001/api/vendors \
  -w "\n%{http_code}\n"
# EXPECTED: 401 Unauthorized

# TEST 3b: Invalid Token (should return 401)
curl -X GET http://localhost:3001/api/vendors \
  -H "Authorization: Bearer invalid_token_xyz" \
  -w "\n%{http_code}\n"
# EXPECTED: 401 Unauthorized

# TEST 3c: Valid Token (should return 200)
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"test123"}' \
  | jq -r '.token')

curl -X GET http://localhost:3001/api/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n%{http_code}\n"
# EXPECTED: 200 OK with vendor list
```

### TEST 4: Data Integrity Constraints [15 minutes]

```bash
# TEST 4a: Duplicate Address Type Constraint
# Create first billing address
curl -X POST http://localhost:3001/api/vendors/<vendor_id>/addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address_type": "billing",
    "address_line1": "123 Main St",
    "city": "Chicago",
    "state": "IL",
    "postal_code": "60601"
  }'
# EXPECTED: 201 Created

# Try to create second billing address (should fail)
curl -X POST http://localhost:3001/api/vendors/<vendor_id>/addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address_type": "billing",
    "address_line1": "456 Oak Ave",
    "city": "Chicago",
    "state": "IL",
    "postal_code": "60602"
  }'
# EXPECTED: 409 Conflict (unique constraint violation)

# TEST 4b: Primary Address Trigger Enforcement
# Create address with is_primary=true
ADDR1=$(curl -X POST http://localhost:3001/api/vendors/<vendor_id>/addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address_type": "warehouse",
    "address_line1": "123 Main",
    "city": "Chicago",
    "state": "IL",
    "postal_code": "60601",
    "is_primary": true
  }' | jq -r '.id')

# Create second address with is_primary=true
ADDR2=$(curl -X POST http://localhost:3001/api/vendors/<vendor_id>/addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address_type": "warehouse",
    "address_line1": "456 Oak",
    "city": "Chicago",
    "state": "IL",
    "postal_code": "60602",
    "is_primary": true
  }' | jq -r '.id')

# Check first address (should now be is_primary=false)
ADDR1_STATUS=$(curl -X GET http://localhost:3001/api/vendors/<vendor_id>/addresses/$ADDR1 \
  -H "Authorization: Bearer $TOKEN" | jq '.is_primary')

ADDR2_STATUS=$(curl -X GET http://localhost:3001/api/vendors/<vendor_id>/addresses/$ADDR2 \
  -H "Authorization: Bearer $TOKEN" | jq '.is_primary')

# EXPECTED: ADDR1_STATUS=false, ADDR2_STATUS=true
```

### TEST 5: Sensitive Data Masking [10 minutes]

```bash
# TEST 5a: Create vendor payment info with real banking data
curl -X POST http://localhost:3001/api/vendors/<vendor_id>/payment-info \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": "123456789",
    "routing_number": "987654321",
    "account_type": "checking",
    "bank_name": "Test Bank",
    "preferred_payment_method": "ACH",
    "default_currency": "USD"
  }'
# EXPECTED: 201 Created

# TEST 5b: Retrieve payment info (should return masked data)
curl -X GET http://localhost:3001/api/vendors/<vendor_id>/payment-info \
  -H "Authorization: Bearer $TOKEN" | jq '.'
# EXPECTED OUTPUT (example):
# {
#   "vendor_id": "uuid-1234",
#   "account_number": "****6789",    <-- MASKED (last 4 only)
#   "routing_number": "****4321",    <-- MASKED (last 4 only)
#   "bank_name": "Test Bank",
#   "preferred_payment_method": "ACH",
#   ...
# }

# CRITICAL: Verify full account number NOT returned
RESPONSE=$(curl -X GET http://localhost:3001/api/vendors/<vendor_id>/payment-info \
  -H "Authorization: Bearer $TOKEN")

ACCOUNT=$(echo $RESPONSE | jq -r '.account_number')
if [[ $ACCOUNT == *"123456789"* ]]; then
  echo "FAIL: Full account number was returned unmasked!"
  exit 1
fi
echo "PASS: Account number properly masked"
```

### TEST 6: Error Handling Paths [10 minutes]

```bash
# TEST 6a: Missing Required Fields (should return 400)
curl -X POST http://localhost:3001/api/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  -w "\nStatus: %{http_code}\n"
# EXPECTED: 400 Bad Request with field validation error

# TEST 6b: Non-existent Vendor (should return 404)
curl -X GET http://localhost:3001/api/vendors/non-existent-uuid \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n"
# EXPECTED: 404 Not Found

# TEST 6c: Invalid Enum Value (should return 400)
curl -X POST http://localhost:3001/api/vendors/<vendor_id>/addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address_type": "invalid_type_xyz",
    "address_line1": "123 Main",
    "city": "Chicago",
    "state": "IL",
    "postal_code": "60601"
  }' \
  -w "\nStatus: %{http_code}\n"
# EXPECTED: 400 Bad Request with constraint violation error
```

---

## QUICK VALIDATION CHECKLIST

### Pre-Migration (Day Before)
- [ ] Database backup created and tested
- [ ] Staging server setup with production-like data volume
- [ ] All 11 migrations (011-021) copied to production deployment folder
- [ ] Rollback SQL extracted from migration-020
- [ ] Team notified of maintenance window
- [ ] All 6 service files deployed to staging
- [ ] All 6 route files deployed to staging
- [ ] index.js route registrations verified in staging
- [ ] Test users created in staging for 2+ restaurants

### Migration Day
- [ ] Send user notifications about downtime
- [ ] Create final database backup
- [ ] Run pre-migration validation queries (TEST 1)
- [ ] Apply migrations 011-021 in sequence (note any errors)
- [ ] Restart Node.js backend server
- [ ] Run TEST 1 again (post-migration validation)
- [ ] Quick smoke test: GET /api/vendors with valid auth (should return 200)

### Post-Migration (First 4 Hours)
- [ ] Run TEST 1 (data migration validation)
- [ ] Run TEST 2 (multi-tenancy isolation)
- [ ] Run TEST 3 (authentication)
- [ ] Monitor error logs for exceptions
- [ ] Verify response times < 500ms

### First 24 Hours
- [ ] Monitor error rate (should be < 0.1%)
- [ ] Check for any 401/403/404 spikes
- [ ] Verify new vendors can be created via API
- [ ] Verify addresses/contacts/payment info operations work
- [ ] Check database growth (should be stable)

---

## QUICK TROUBLESHOOTING

| Issue | Symptom | Resolution |
|-------|---------|-----------|
| Migration fails | SQL error during migration-017 | Verify ingredient_vendor_mapping has no foreign key conflicts |
| Multi-tenancy broken | All users see all vendors | Check restaurant_id is NOT NULL in ingredient_vendor_mapping |
| Auth fails on new routes | 401 on all vendor endpoints | Verify requireAuth middleware applied in route files |
| Masking not working | Account number returned unmasked | Verify maskAccountNumber() called in vendorPayment service |
| Duplicate address error | Can't create second warehouse | Verify unique constraint allows multiple 'warehouse' type |
| Primary address trigger fails | Can't set is_primary=true | Check trigger_enforce_single_primary_vendor_address trigger exists |

---

## TEST RESULT TEMPLATE

Use this format to document test results:

```
TEST: [Test Name]
DATE: [Date]
TESTER: [Name]
ENVIRONMENT: [Staging/Production]

PRECONDITIONS:
- [Setup required]

EXECUTION:
- [Steps performed]

RESULTS:
EXPECTED: [Expected result]
ACTUAL: [Actual result]
STATUS: [PASS/FAIL]

NOTES:
[Any observations or issues]

SIGN-OFF: [Tester signature]
```

---

## ROLLBACK PROCEDURE (If Needed)

If production migration fails, execute rollback in order:

```sql
-- STEP 1: Revert ingredient_vendor_mapping.restaurant_id to nullable
ALTER TABLE ingredient_vendor_mapping
ALTER COLUMN restaurant_id DROP NOT NULL;

-- STEP 2: Clear restaurant_id values
UPDATE ingredient_vendor_mapping SET restaurant_id = NULL;

-- STEP 3: Delete migrated vendor addresses (only primary addresses)
DELETE FROM vendor_addresses WHERE address_type = 'primary';

-- STEP 4: Delete migrated vendor contacts (only primary contacts)
DELETE FROM vendor_contacts WHERE is_primary = true AND role = 'Primary Contact';

-- STEP 5: Delete migrated vendor payment info
DELETE FROM vendor_payment_info;

-- STEP 6: Drop new tables (if rollback needed)
DROP TABLE IF EXISTS vendor_scorecards CASCADE;
DROP TABLE IF EXISTS vendor_documents CASCADE;
DROP TABLE IF EXISTS vendor_purchasing_data CASCADE;
DROP TABLE IF EXISTS vendor_payment_info CASCADE;
DROP TABLE IF EXISTS vendor_contacts CASCADE;
DROP TABLE IF EXISTS vendor_addresses CASCADE;
DROP TABLE IF EXISTS payment_terms CASCADE;

-- Verify rollback
SELECT COUNT(*) as null_restaurant_ids FROM ingredient_vendor_mapping WHERE restaurant_id IS NULL;
-- EXPECTED: Should equal total ingredient_vendor_mapping count
```

**Estimated rollback time**: 30 minutes from decision to full recovery

---

## KEY CONTACTS

- **Database Administrator**: [Name/Slack]
- **Backend Lead**: [Name/Slack]
- **QA Lead**: [Name/Slack]
- **On-Call Support**: [Name/Slack]

---

## SUCCESS CRITERIA

Migration is successful if:
- [x] All TEST 1-6 pass without failures
- [x] Error logs show no exceptions
- [x] Response times consistently < 500ms
- [x] No data loss detected
- [x] Multi-tenancy isolation verified
- [x] Sensitive data properly masked
- [x] All restaurants report normal operations
