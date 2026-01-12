# Critical Bugs - Vendor ERP API

**Priority Order**: Fix these bugs in the order listed below for maximum impact.

---

## BLOCKER: BUG-1 - Create Vendor Returns 500 Error

**Priority**: CRITICAL - MUST FIX FIRST
**Endpoint**: `POST /api/vendors`
**Current Status**: 500 Internal Server Error
**Impact**: Cannot create new vendors through API, blocking all vendor onboarding workflows

### Error Details
```
Request: POST http://localhost:3001/api/vendors
Response: 500 Internal Server Error
Expected: 201 Created with vendor object
```

### Root Cause Analysis
Likely causes (in order of probability):
1. **Database constraint violation**: Missing required field or foreign key reference
2. **Service layer exception**: Unhandled error in vendors.js service
3. **Field mismatch**: Request body field names don't match database schema

### Debugging Steps
1. Check backend logs for actual error message
2. Review `/backend/src/services/vendors.js` createVendor method
3. Check database schema for vendors table required fields
4. Verify foreign key constraints (payment_term_id, business_id)

### Recommended Fix

**File**: `/backend/src/services/vendors.js`

```javascript
async createVendor(vendorData, businessId) {
  try {
    // Validate required fields before database insert
    const requiredFields = ['vendor_name', 'payment_term_id'];
    for (const field of requiredFields) {
      if (!vendorData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure business_id is set
    const insertData = {
      ...vendorData,
      business_id: businessId,
      is_active: vendorData.is_active !== undefined ? vendorData.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('vendors')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Create vendor database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Create vendor error:', error);
    throw error;
  }
}
```

**File**: `/backend/src/routes/vendors.js`

```javascript
router.post('/', async (req, res) => {
  try {
    const vendor = await vendorService.createVendor(req.body, req.user.businessId);
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Create vendor route error:', error);

    // Return appropriate error codes
    if (error.message.includes('Missing required field')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('foreign key')) {
      return res.status(400).json({ error: 'Invalid payment term or business reference' });
    }

    res.status(500).json({ error: 'Failed to create vendor', details: error.message });
  }
});
```

### Test After Fix
```bash
curl -X POST http://localhost:3001/api/vendors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "Test Vendor",
    "payment_term_id": "VALID_PAYMENT_TERM_ID",
    "vendor_code": "TEST001",
    "is_active": true
  }'
```

Expected: 201 Created with vendor object

---

## HIGH: BUG-2 - Get Primary Address Returns 500 Error

**Priority**: HIGH
**Endpoint**: `GET /api/vendors/{vendorId}/addresses/primary`
**Current Status**: 500 Internal Server Error
**Impact**: Cannot retrieve primary address for vendor display

### Error Details
```
Request: GET http://localhost:3001/api/vendors/4b6b0d30-2bf9-4ff4-bdb8-24f88357b0f2/addresses/primary
Response: 500 Internal Server Error
Expected: 200 OK with address object OR 404 Not Found
```

### Root Cause Analysis
Most likely: Attempting to access array[0] or object property on null/undefined result when no primary address exists.

### Recommended Fix

**File**: `/backend/src/services/vendorAddresses.js`

```javascript
async getPrimaryAddress(vendorId) {
  try {
    const { data, error } = await supabase
      .from('vendor_addresses')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_primary', true)
      .eq('is_deleted', false)
      .maybeSingle(); // Use maybeSingle() instead of single() to allow null

    if (error) {
      console.error('Get primary address error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data; // Will be null if no primary address exists
  } catch (error) {
    console.error('Get primary address error:', error);
    throw error;
  }
}
```

**File**: `/backend/src/routes/vendorAddresses.js`

```javascript
router.get('/:vendorId/addresses/primary', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const address = await vendorAddressService.getPrimaryAddress(vendorId);

    if (!address) {
      return res.status(404).json({ error: 'No primary address found for this vendor' });
    }

    res.json(address);
  } catch (error) {
    console.error('Get primary address route error:', error);
    res.status(500).json({ error: 'Failed to get primary address', details: error.message });
  }
});
```

### Test After Fix
```bash
# Test with vendor that has primary address
curl http://localhost:3001/api/vendors/4b6b0d30-2bf9-4ff4-bdb8-24f88357b0f2/addresses/primary \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK with address object

# Test with vendor that has no primary address
curl http://localhost:3001/api/vendors/VENDOR_WITHOUT_PRIMARY_ADDRESS/addresses/primary \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 404 Not Found
```

---

## HIGH: BUG-3 - Get Primary Contact Returns 500 Error

**Priority**: HIGH
**Endpoint**: `GET /api/vendors/{vendorId}/contacts/primary`
**Current Status**: 500 Internal Server Error
**Impact**: Cannot retrieve primary contact for vendor display

### Error Details
```
Request: GET http://localhost:3001/api/vendors/4b6b0d30-2bf9-4ff4-bdb8-24f88357b0f2/contacts/primary
Response: 500 Internal Server Error
Expected: 200 OK with contact object OR 404 Not Found
```

### Root Cause Analysis
Same as BUG-2: Null/undefined handling issue when no primary contact exists.

### Recommended Fix

**File**: `/backend/src/services/vendorContacts.js`

```javascript
async getPrimaryContact(vendorId) {
  try {
    const { data, error } = await supabase
      .from('vendor_contacts')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_primary', true)
      .eq('is_deleted', false)
      .maybeSingle(); // Use maybeSingle() instead of single()

    if (error) {
      console.error('Get primary contact error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data; // Will be null if no primary contact exists
  } catch (error) {
    console.error('Get primary contact error:', error);
    throw error;
  }
}
```

**File**: `/backend/src/routes/vendorContacts.js`

```javascript
router.get('/:vendorId/contacts/primary', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const contact = await vendorContactService.getPrimaryContact(vendorId);

    if (!contact) {
      return res.status(404).json({ error: 'No primary contact found for this vendor' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Get primary contact route error:', error);
    res.status(500).json({ error: 'Failed to get primary contact', details: error.message });
  }
});
```

### Test After Fix
```bash
curl http://localhost:3001/api/vendors/4b6b0d30-2bf9-4ff4-bdb8-24f88357b0f2/contacts/primary \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK with contact object OR 404 Not Found
```

---

## HIGH: BUG-4 - Update Vendor Payment Info Returns 500 Error

**Priority**: HIGH
**Endpoint**: `PUT /api/vendors/{vendorId}/payment-info`
**Current Status**: 500 Internal Server Error
**Impact**: Cannot update payment information after initial creation

### Error Details
```
Request: PUT http://localhost:3001/api/vendors/4b6b0d30-2bf9-4ff4-bdb8-24f88357b0f2/payment-info
Response: 500 Internal Server Error
Expected: 200 OK with updated payment info
```

### Root Cause Analysis
Likely causes:
1. Update query missing WHERE clause or incorrect parameter binding
2. Field name mismatch between request and database schema
3. Trying to update non-existent record without checking existence first

### Recommended Fix

**File**: `/backend/src/services/vendorPayment.js`

```javascript
async updatePaymentInfo(vendorId, paymentData) {
  try {
    // First check if payment info exists
    const { data: existing } = await supabase
      .from('vendor_payment_info')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (!existing) {
      throw new Error('Payment info not found for this vendor');
    }

    const updateData = {
      ...paymentData,
      updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.vendor_id;
    delete updateData.created_at;
    delete updateData.is_deleted;

    const { data, error } = await supabase
      .from('vendor_payment_info')
      .update(updateData)
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      console.error('Update payment info error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Update payment info error:', error);
    throw error;
  }
}
```

**File**: `/backend/src/routes/vendorPayment.js`

```javascript
router.put('/:vendorId/payment-info', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const paymentInfo = await vendorPaymentService.updatePaymentInfo(vendorId, req.body);
    res.json(paymentInfo);
  } catch (error) {
    console.error('Update payment info route error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update payment info', details: error.message });
  }
});
```

### Test After Fix
```bash
curl -X PUT http://localhost:3001/api/vendors/4b6b0d30-2bf9-4ff4-bdb8-24f88357b0f2/payment-info \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bank_name": "Updated Bank",
    "account_number": "987654321"
  }'

# Expected: 200 OK with updated payment info
```

---

## MEDIUM: BUG-5 - Get Expired Documents Returns 500 Error

**Priority**: MEDIUM
**Endpoint**: `GET /api/vendors/{vendorId}/documents/expired`
**Current Status**: 500 Internal Server Error
**Impact**: Cannot view expired vendor documents for compliance tracking

### Error Details
```
Request: GET http://localhost:3001/api/vendors/4b6b0d30-2bf9-4ff4-bdb8-24f88357b0f2/documents/expired
Response: 500 Internal Server Error
Expected: 200 OK with array of expired documents
```

### Root Cause Analysis
Likely causes:
1. Date comparison logic error (expiration_date < current_date)
2. Attempting to access null expiration_date field
3. Timezone handling issue

### Recommended Fix

**File**: `/backend/src/services/vendorDocuments.js`

```javascript
async getExpiredDocuments(vendorId) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const { data, error } = await supabase
      .from('vendor_documents')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false)
      .not('expiration_date', 'is', null) // Exclude documents without expiration
      .lt('expiration_date', today) // Less than today = expired
      .order('expiration_date', { ascending: true });

    if (error) {
      console.error('Get expired documents error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data || []; // Return empty array if no results
  } catch (error) {
    console.error('Get expired documents error:', error);
    throw error;
  }
}
```

**File**: `/backend/src/routes/vendorDocuments.js`

```javascript
router.get('/:vendorId/documents/expired', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const documents = await vendorDocumentService.getExpiredDocuments(vendorId);
    res.json(documents);
  } catch (error) {
    console.error('Get expired documents route error:', error);
    res.status(500).json({ error: 'Failed to get expired documents', details: error.message });
  }
});
```

### Test After Fix
```bash
curl http://localhost:3001/api/vendors/4b6b0d30-2bf9-4ff4-bdb8-24f88357b0f2/documents/expired \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK with array of expired documents (may be empty)
```

---

## MEDIUM: BUG-6 - Get Expiring Soon Documents Returns 500 Error

**Priority**: MEDIUM
**Endpoint**: `GET /api/vendors/{vendorId}/documents/expiring-soon?days=30`
**Current Status**: 500 Internal Server Error
**Impact**: Cannot proactively monitor documents approaching expiration

### Error Details
```
Request: GET http://localhost:3001/api/vendors/4b6b0d30-2bf9-4ff4-bdb8-24f88357b0f2/documents/expiring-soon?days=30
Response: 500 Internal Server Error
Expected: 200 OK with array of documents expiring within specified days
```

### Root Cause Analysis
Similar to BUG-5: Date comparison logic and null handling issues.

### Recommended Fix

**File**: `/backend/src/services/vendorDocuments.js`

```javascript
async getExpiringSoonDocuments(vendorId, daysAhead = 30) {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(daysAhead));

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('vendor_documents')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false)
      .not('expiration_date', 'is', null)
      .gte('expiration_date', todayStr) // Greater than or equal to today (not expired yet)
      .lte('expiration_date', futureDateStr) // Less than or equal to future date
      .order('expiration_date', { ascending: true });

    if (error) {
      console.error('Get expiring soon documents error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Get expiring soon documents error:', error);
    throw error;
  }
}
```

**File**: `/backend/src/routes/vendorDocuments.js`

```javascript
router.get('/:vendorId/documents/expiring-soon', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const days = req.query.days || 30;

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({ error: 'Invalid days parameter. Must be between 1 and 365.' });
    }

    const documents = await vendorDocumentService.getExpiringSoonDocuments(vendorId, days);
    res.json(documents);
  } catch (error) {
    console.error('Get expiring soon documents route error:', error);
    res.status(500).json({ error: 'Failed to get expiring soon documents', details: error.message });
  }
});
```

### Test After Fix
```bash
curl 'http://localhost:3001/api/vendors/4b6b0d30-2bf9-4ff4-bdb8-24f88357b0f2/documents/expiring-soon?days=30' \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK with array of documents expiring within 30 days
```

---

## Fix Implementation Checklist

### Step 1: Environment Setup
- [ ] Ensure backend server is running locally
- [ ] Have database access for testing
- [ ] Have valid authentication token for API testing

### Step 2: Fix Critical Bugs (Order Matters)
- [ ] BUG-1: Create Vendor (BLOCKER)
- [ ] BUG-2: Get Primary Address
- [ ] BUG-3: Get Primary Contact
- [ ] BUG-4: Update Payment Info

### Step 3: Fix Medium Priority Bugs
- [ ] BUG-5: Get Expired Documents
- [ ] BUG-6: Get Expiring Soon Documents

### Step 4: Testing
- [ ] Test each endpoint manually with curl/Postman after fix
- [ ] Re-run full Postman collection
- [ ] Verify error logs are clean
- [ ] Check response times are acceptable

### Step 5: Documentation
- [ ] Update API documentation with correct error responses
- [ ] Document any breaking changes
- [ ] Update Postman collection with working examples

---

## Estimated Fix Time

| Bug | Priority | Estimated Time | Complexity |
|-----|----------|----------------|------------|
| BUG-1 | Critical | 45 min | Medium |
| BUG-2 | High | 20 min | Low |
| BUG-3 | High | 20 min | Low |
| BUG-4 | High | 30 min | Medium |
| BUG-5 | Medium | 25 min | Low |
| BUG-6 | Medium | 25 min | Low |
| **TOTAL** | | **2.5 hours** | |

Add 1 hour for testing and verification = **3.5 hours total**

---

## Success Criteria

After fixes are applied:
- [ ] All 6 endpoints return expected HTTP status codes (200, 201, 404)
- [ ] No 500 Internal Server Errors remain
- [ ] Error messages are clear and actionable
- [ ] Test pass rate increases from 70% to 90%+
- [ ] Backend logs show no unhandled exceptions
