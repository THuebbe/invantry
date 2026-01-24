# Critical Fixes Required Before API Testing

**Status:** BLOCKING ISSUES
**Estimated Fix Time:** 30-45 minutes
**Priority:** URGENT

---

## Fix #1: Function Name Mismatches (4 files)

### vendorAddresses.js

**File:** `/backend/src/routes/vendorAddresses.js`

**Line 8 - Change import:**
```javascript
// BEFORE (WRONG):
import {
  getVendorAddresses,
  getVendorAddressById,  // ❌ Wrong name
  createVendorAddress,
  // ...
}

// AFTER (CORRECT):
import {
  getVendorAddresses,
  getVendorAddress,  // ✅ Correct name (remove "ById")
  createVendorAddress,
  // ...
}
```

**Line 103 - Update function call:**
```javascript
// BEFORE (WRONG):
const address = await getVendorAddressById(id, vendorId, restaurantId);

// AFTER (CORRECT):
const address = await getVendorAddress(id, vendorId, restaurantId);
```

---

### vendorContacts.js

**File:** `/backend/src/routes/vendorContacts.js`

**Line 8 - Change import:**
```javascript
// BEFORE (WRONG):
import {
  getVendorContacts,
  getVendorContactById,  // ❌ Wrong name
  createVendorContact,
  // ...
}

// AFTER (CORRECT):
import {
  getVendorContacts,
  getVendorContact,  // ✅ Correct name (remove "ById")
  createVendorContact,
  // ...
}
```

**Line 97 - Update function call:**
```javascript
// BEFORE (WRONG):
const contact = await getVendorContactById(id, vendorId, restaurantId);

// AFTER (CORRECT):
const contact = await getVendorContact(id, vendorId, restaurantId);
```

---

### vendorDocuments.js

**File:** `/backend/src/routes/vendorDocuments.js`

**Line 8 - Change import:**
```javascript
// BEFORE (WRONG):
import {
  getVendorDocuments,
  getVendorDocumentById,  // ❌ Wrong name
  createVendorDocument,
  // ...
}

// AFTER (CORRECT):
import {
  getVendorDocuments,
  getVendorDocument,  // ✅ Correct name (remove "ById")
  createVendorDocument,
  // ...
}
```

**Line 98 - Update function call:**
```javascript
// BEFORE (WRONG):
const document = await getVendorDocumentById(id, vendorId, restaurantId);

// AFTER (CORRECT):
const document = await getVendorDocument(id, vendorId, restaurantId);
```

---

### vendorScorecards.js

**File:** `/backend/src/routes/vendorScorecards.js`

**Line 8 - Change import:**
```javascript
// BEFORE (WRONG):
import {
  getVendorScorecards,
  getVendorScorecardById,  // ❌ Wrong name
  createVendorScorecard,
  // ...
}

// AFTER (CORRECT):
import {
  getVendorScorecards,
  getVendorScorecard,  // ✅ Correct name (remove "ById")
  createVendorScorecard,
  // ...
}
```

**Line 96-99 - Update function call:**
```javascript
// BEFORE (WRONG):
const scorecard = await getVendorScorecardById(
  id,
  vendorId,
  restaurantId
);

// AFTER (CORRECT):
const scorecard = await getVendorScorecard(
  id,
  vendorId,
  restaurantId
);
```

---

## Fix #2: Parameter Order Mismatches (6 functions across 4 files)

### vendorAddresses.js

**File:** `/backend/src/routes/vendorAddresses.js`

**Lines 65-69 - Fix createVendorAddress call:**
```javascript
// BEFORE (WRONG):
const address = await createVendorAddress(
  vendorId,       // ❌ Wrong order
  addressData,
  restaurantId
);

// AFTER (CORRECT):
const address = await createVendorAddress(
  addressData,    // ✅ Data comes first
  vendorId,
  restaurantId
);
```

---

### vendorContacts.js

**File:** `/backend/src/routes/vendorContacts.js`

**Lines 65-69 - Fix createVendorContact call:**
```javascript
// BEFORE (WRONG):
const contact = await createVendorContact(
  vendorId,       // ❌ Wrong order
  contactData,
  restaurantId
);

// AFTER (CORRECT):
const contact = await createVendorContact(
  contactData,    // ✅ Data comes first
  vendorId,
  restaurantId
);
```

---

### vendorPayment.js

**File:** `/backend/src/routes/vendorPayment.js`

**Lines 74-78 - Fix createVendorPaymentInfo call:**
```javascript
// BEFORE (WRONG):
const paymentInfo = await createVendorPaymentInfo(
  vendorId,       // ❌ Wrong order
  paymentData,
  restaurantId
);

// AFTER (CORRECT):
const paymentInfo = await createVendorPaymentInfo(
  paymentData,    // ✅ Data comes first
  vendorId,
  restaurantId
);
```

**Lines 110-114 - Fix updateVendorPaymentInfo call:**
```javascript
// BEFORE (WRONG):
const paymentInfo = await updateVendorPaymentInfo(
  vendorId,       // ❌ Wrong order
  updates,
  restaurantId
);

// AFTER (CORRECT):
const paymentInfo = await updateVendorPaymentInfo(
  updates,        // ✅ Updates come first
  vendorId,
  restaurantId
);
```

---

### vendorDocuments.js

**File:** `/backend/src/routes/vendorDocuments.js`

**Lines 65-70 - Fix createVendorDocument call:**
```javascript
// BEFORE (WRONG):
const document = await createVendorDocument(
  vendorId,       // ❌ Wrong order
  documentData,
  restaurantId,
  req.user.id
);

// AFTER (CORRECT):
const document = await createVendorDocument(
  documentData,   // ✅ Data comes first
  vendorId,
  restaurantId
);
```

**Note:** The service function doesn't accept `req.user.id` as a parameter. Remove the 4th argument.

---

### vendorScorecards.js

**File:** `/backend/src/routes/vendorScorecards.js`

**Lines 64-68 - Fix createVendorScorecard call:**
```javascript
// BEFORE (WRONG):
const scorecard = await createVendorScorecard(
  vendorId,       // ❌ Wrong order
  scorecardData,
  restaurantId
);

// AFTER (CORRECT):
const scorecard = await createVendorScorecard(
  scorecardData,  // ✅ Data comes first
  vendorId,
  restaurantId
);
```

---

## Summary of Changes

### Files to Modify: 4
1. `/backend/src/routes/vendorAddresses.js`
2. `/backend/src/routes/vendorContacts.js`
3. `/backend/src/routes/vendorPayment.js`
4. `/backend/src/routes/vendorDocuments.js`
5. `/backend/src/routes/vendorScorecards.js`

### Total Changes: 10
- 4 import statement fixes (remove "ById" suffix)
- 4 function call name fixes (remove "ById" suffix)
- 6 parameter order fixes

---

## Verification After Fixes

After applying all fixes, verify with:

```bash
# Check imports are correct
grep -n "getVendor.*ById" backend/src/routes/vendor*.js
# Should return NO results

# Start the backend server
cd backend
npm run dev

# Test a sample endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/payment-terms
```

---

## Pattern to Remember

**Service Function Signature Pattern:**
```javascript
// CREATE functions:
create*(data, vendorId, restaurantId)

// UPDATE functions:
update*(id, updates, vendorId, restaurantId)
// OR
update*(updates, vendorId, restaurantId)  // For 1:1 relationships

// GET/DELETE functions:
get*(id, vendorId, restaurantId)
delete*(id, vendorId, restaurantId)
```

**Rule:** Data/updates parameter always comes FIRST, then vendorId, then restaurantId.
