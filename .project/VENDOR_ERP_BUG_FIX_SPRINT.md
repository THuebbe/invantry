# Vendor ERP - Bug Fix Sprint

**Created:** January 11, 2026
**Status:** In Progress
**Sprint Goal:** Fix all critical and high-priority bugs found in testing

---

## Issues Summary

**Total Issues Found:** 18
**Critical (P1):** 4
**High (P2):** 4
**Medium (P3):** 6
**Low (P4):** 4

---

## Priority 1 - Critical (Blocking Testing)

### 🔴 Issue #1: Vendor Edit - 500 Error
**Severity:** Critical
**Component:** Backend
**File:** `backend/src/services/vendors.js`
**Error:** "Could not find the 'website' column of 'vendors' in the schema cache"

**Description:**
When editing a vendor, the backend tries to update a 'website' column that doesn't exist in the vendors table, causing a 500 error.

**Fix Required:**
- Remove 'website' field from vendor UPDATE query
- Or add 'website' column to vendors table if needed

---

### 🔴 Issue #2: Document Upload - 400 Error
**Severity:** Critical
**Component:** Backend/Frontend
**File:** `backend/src/routes/vendorDocuments.js`
**Error:** "Request failed with status code 400"

**Description:**
Document upload fails with 400 error. Need to check backend validation and FormData structure.

**Fix Required:**
- Investigate backend validation rules
- Check FormData construction in frontend
- Ensure all required fields are present

---

### 🔴 Issue #3: Address Delete - UUID Error
**Severity:** Critical
**Component:** Frontend
**File:** `frontend/src/components/vendor-erp/components/AddressCard.jsx`
**Error:** "invalid input syntax for type uuid: 'undefined'"

**Description:**
When deleting an address, vendorId and addressId are undefined, causing the API call to fail.

**Fix Required:**
- Pass vendorId and addressId correctly to delete mutation
- Ensure AddressCard receives these props from parent

---

### 🔴 Issue #4: Contact Delete - UUID Error
**Severity:** Critical
**Component:** Frontend
**File:** `frontend/src/components/vendor-erp/components/ContactCard.jsx`
**Error:** "invalid input syntax for type uuid: 'undefined'"

**Description:**
Same as address delete - vendorId and contactId are undefined.

**Fix Required:**
- Pass vendorId and contactId correctly to delete mutation
- Ensure ContactCard receives these props from parent

---

## Priority 2 - High (Major Functionality)

### 🟠 Issue #5: Vendor Delete - Soft Delete Issues
**Severity:** High
**Component:** Backend
**File:** `backend/src/services/vendors.js`

**Description:**
Soft delete erases all vendor data except name and sets to inactive. This behavior is inconsistent - either hard delete or preserve all data.

**Fix Required:**
- Option A: Change soft delete to only set is_active = false, preserve all data
- Option B: Implement true hard delete for vendors without POs
- Option C: Add flag to control delete behavior

**Recommendation:** Option A - preserve all data on soft delete

---

### 🟠 Issue #6: Address Create - Duplicate Type Error
**Severity:** High
**Component:** Backend
**File:** `backend/src/services/vendorAddresses.js`
**Error:** "An address with type 'ship_from' already exists for this vendor"

**Description:**
Backend prevents multiple addresses of the same type, but vendors often need multiple billing or shipping addresses.

**Fix Required:**
- Remove uniqueness constraint on (vendor_id, address_type)
- Allow multiple addresses of the same type
- Keep is_primary toggle to designate main address per type

---

### 🟠 Issue #7: Contact Role Mismatch
**Severity:** High
**Component:** Backend/Frontend
**Files:**
- `backend/src/services/vendorContacts.js` (validation)
- `frontend/src/components/vendor-erp/forms/ContactForm.jsx` (dropdown)

**Description:**
Frontend dropdown includes "AR Specialist" but backend only accepts: Sales Rep, Account Manager, Billing Contact, Customer Service, Delivery Coordinator, Other

**Fix Required:**
- Align frontend dropdown options with backend validation
- Or update backend to accept additional roles

---

### 🟠 Issue #8: Payment Tab Not Implemented
**Severity:** High
**Component:** Frontend
**File:** `frontend/src/components/vendor-erp/tabs/PaymentTab.jsx`

**Description:**
Payment tab shows "Phase 2" placeholder messages. No edit or add functionality.

**Fix Required:**
- Wire Edit button to PaymentTermsForm
- Add "Add Payment Method" button
- Wire to mutations
- Remove placeholder messages

---

## Priority 3 - Medium (Enhancements)

### 🟡 Issue #9: Phone Number Formatting
**Severity:** Medium
**Component:** Frontend
**Files:** All components displaying phone numbers

**Description:**
Phone numbers should display as (555) 555-0123 but currently show as 555-0123 or unformatted.

**Fix Required:**
- Create formatPhoneNumber() utility in `frontend/src/utils/vendorFormatters.js`
- Apply to all phone displays: VendorCard, AddressCard, ContactCard, etc.

---

### 🟡 Issue #10: Items Tab Save Not Wired
**Severity:** Medium
**Component:** Frontend
**File:** `frontend/src/components/vendor-erp/tabs/ItemsTab.jsx`

**Description:**
Inline edit shows "Changes will be saved in Phase 2" instead of actually saving.

**Fix Required:**
- Wire save button to updateIngredientVendorMapping mutation
- Add validation
- Show success/error messages
- Invalidate cache on success

---

### 🟡 Issue #11: Items Tab Missing Cancel Button
**Severity:** Medium
**Component:** Frontend
**File:** `frontend/src/components/vendor-erp/tabs/ItemsTab.jsx`

**Description:**
When editing inline, there's no way to cancel changes. Only save button exists.

**Fix Required:**
- Show X/Cancel icon when in edit mode with no changes
- Show Check/Save icon when changes detected
- Cancel should revert to original values

---

### 🟡 Issue #12: Loading States Not Clear
**Severity:** Medium
**Component:** Frontend
**Files:** All form components

**Description:**
- Save buttons don't show "Saving..." text
- Buttons not disabled during save
- Can click multiple times

**Fix Required:**
- Show loading text on buttons during mutation
- Disable buttons while isPending/isLoading
- Add disabled styling

---

### 🟡 Issue #13: Vendor Detail Shows Spinner Not Skeleton
**Severity:** Medium
**Component:** Frontend
**File:** `frontend/src/components/vendor-erp/VendorDetail.jsx`

**Description:**
Loading state shows spinner instead of skeleton layout. Skeleton is better UX.

**Fix Required:**
- Create skeleton component mimicking vendor detail layout
- Show skeleton instead of spinner during load

---

### 🟡 Issue #14: Vendor Code Not Required
**Severity:** Medium
**Component:** Frontend
**File:** `frontend/src/components/vendor-erp/forms/VendorForm.jsx`

**Description:**
Vendor code field allows empty values but should be required.

**Fix Required:**
- Add validation: vendor_code is required
- Show error if left blank

---

## Priority 4 - Low (Polish)

### 🔵 Issue #15: Create PO Button Not Wired
**Severity:** Low
**Component:** Frontend
**File:** `frontend/src/components/vendor-erp/tabs/OverviewTab.jsx`

**Description:**
Create PO button is disabled. Should navigate to create quick order page.

**Fix Required:**
- Remove disabled state
- Navigate to: /orders/create-quick-order
- Pass vendor info as route state

---

### 🔵 Issue #16: Modals Don't Close with ESC
**Severity:** Low
**Component:** Frontend
**Files:** All modal components

**Description:**
Accessibility issue - modals should close when ESC key is pressed.

**Fix Required:**
- Add useEffect with ESC key listener
- Call onClose() when ESC pressed
- Clean up listener on unmount

---

### 🔵 Issue #17: First Tab Load Delayed
**Severity:** Low
**Component:** Backend/Frontend
**File:** `frontend/src/components/vendor-erp/VendorDetail.jsx`

**Description:**
First tab click has delay. Subsequent tabs load instantly. Should load all tab data when vendor detail opens.

**Fix Required:**
- useVendorSummary already fetches all data
- Ensure all tabs use the summary data (no additional API calls)
- Check if any tabs are making redundant API calls

---

### 🔵 Issue #18: Button Not Disabled on Rapid Click
**Severity:** Low
**Component:** Frontend
**Files:** All form components

**Description:**
Rapid clicking Save button causes multiple save operations.

**Fix Required:**
- Disable button immediately on first click
- Keep disabled while isPending
- Re-enable only after success/error

---

## Implementation Plan

### Sprint 1: Critical Fixes (P1)
**Estimated Time:** 4-6 hours
**Blockers:** None
**Assigned:** Backend Specialist + Frontend Specialist

1. Fix vendor edit 500 error
2. Fix document upload 400 error
3. Fix address delete UUID error
4. Fix contact delete UUID error

**Success Criteria:** All CRUD operations work without errors

---

### Sprint 2: High Priority Fixes (P2)
**Estimated Time:** 6-8 hours
**Blockers:** Sprint 1 complete
**Assigned:** Backend Specialist + Frontend Specialist

5. Fix vendor soft delete behavior
6. Allow multiple addresses per type
7. Fix contact role mismatch
8. Implement payment tab edit/add

**Success Criteria:** All major functionality complete

---

### Sprint 3: Medium Priority Enhancements (P3)
**Estimated Time:** 4-6 hours
**Blockers:** Sprint 2 complete
**Assigned:** Frontend Specialist

9. Add phone formatting
10. Wire items tab save
11. Add items tab cancel
12. Improve loading states
13. Add skeleton loader
14. Require vendor code

**Success Criteria:** All enhancements complete, better UX

---

### Sprint 4: Low Priority Polish (P4)
**Estimated Time:** 2-3 hours
**Blockers:** Sprint 3 complete
**Assigned:** Frontend Specialist

15. Wire Create PO navigation
16. Add ESC key to modals
17. Optimize tab loading
18. Fix rapid click protection

**Success Criteria:** All polish items complete

---

## Total Estimated Time: 16-23 hours

---

## Testing After Fixes

After each sprint, re-run relevant sections of VENDOR_ERP_TESTING_CHECKLIST.md:

**After Sprint 1:**
- Section 2: Vendor CRUD
- Section 3: Address CRUD
- Section 4: Contact CRUD
- Section 6: Document Upload

**After Sprint 2:**
- Section 2.4-2.5: Vendor Delete
- Section 3.2, 3.5: Multiple Addresses
- Section 4.2: Contact Roles
- Section 5: Payment Tab

**After Sprint 3:**
- Section 9.4: Items Tab
- Section 14: Loading States
- Section 16.4: Data Formatting

**After Sprint 4:**
- Section 7.4: Create PO
- Section 17.1: Keyboard Navigation
- Section 18.1: Performance

---

## Notes

- All fixes must preserve existing functionality
- No breaking changes to data structures
- All mutations must invalidate relevant React Query caches
- Error messages must be user-friendly
- Loading states must be clear
- Console must be error-free after fixes

---

**End of Bug Fix Sprint Plan**
