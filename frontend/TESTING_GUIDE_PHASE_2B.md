# Phase 2B CRUD Operations - Testing Guide

**Quick Start Guide for Testing All CRUD Functionality**

---

## Prerequisites

1. **Backend server running** on port 3001
2. **Frontend dev server running** on port 5173
3. **Valid test vendor data** in database
4. **Authentication token** ready (logged in user)

---

## Quick Test Commands

```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm run dev

# Terminal 3 - Open Browser
# Navigate to http://localhost:5173
# Login and go to Vendors section
```

---

## Test Sequence (15-minute full validation)

### 1. Vendor CRUD (3 minutes)

**CREATE:**
1. Navigate to `/vendors` (VendorList page)
2. Click green "Add Vendor" button (top right)
3. Fill form:
   - Name: "Test Vendor CRUD"
   - Vendor Code: "TEST-001"
   - Legal Name: "Test Vendor Legal LLC"
   - Status: Active
4. Click "Create Vendor"
5. ✅ **Verify:** Vendor appears in list immediately

**UPDATE:**
1. Hover over newly created vendor card
2. Click blue Edit button (appears on hover)
3. Change name to "Test Vendor UPDATED"
4. Click "Update Vendor"
5. ✅ **Verify:** Name changes in card immediately

**DELETE:**
1. Hover over vendor card
2. Click red Delete button
3. ✅ **Verify:** Confirmation modal appears with vendor name
4. Click "Delete"
5. ✅ **Verify:** Vendor removed from list (soft delete)

---

### 2. Address CRUD (3 minutes)

**Navigate to vendor detail and open Addresses tab**

**CREATE:**
1. Click green "Add Address" button
2. Fill form:
   - Type: Billing
   - Address Line 1: "123 Test St"
   - City: "Test City"
   - State: "CA"
   - Postal Code: "90210"
   - Country: US
   - Mark as Primary: ✓
3. Click "Add Address"
4. ✅ **Verify:** Address appears in grid with blue "Billing" badge and yellow "Primary" star

**UPDATE:**
1. Click Edit button on address card (gray icon)
2. Change City to "Updated City"
3. Click "Update Address"
4. ✅ **Verify:** City updates immediately

**DELETE (with protection test):**
1. Try to delete primary address
2. ✅ **Verify:** Delete button disabled OR warning shown
3. Add second address (not primary)
4. Click Delete on non-primary address
5. ✅ **Verify:** Confirmation modal appears
6. Click "Delete"
7. ✅ **Verify:** Address removed from grid

---

### 3. Contact CRUD (3 minutes)

**Open Contacts tab on same vendor**

**CREATE:**
1. Click green "Add Contact" button
2. Fill form:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john@test.com"
   - Phone: "555-1234"
   - Mark as Primary: ✓
   - Receive Orders: ✓
   - Receive Invoices: ✓
3. Click "Add Contact"
4. ✅ **Verify:** Contact appears in "Primary Contact" section with green "Orders" and purple "Invoices" badges

**UPDATE:**
1. Click Edit button on contact card
2. Change Last Name to "Smith"
3. Click "Update Contact"
4. ✅ **Verify:** Name updates to "John Smith"

**DELETE (with protection test):**
1. Try to delete primary contact
2. ✅ **Verify:** Delete button disabled OR warning shown
3. Add second contact (not primary)
4. Click Delete on non-primary contact
5. ✅ **Verify:** Contact removed

---

### 4. Document Upload/Delete (3 minutes)

**Open Documents tab on same vendor**

**UPLOAD:**
1. Click green "Upload Document" button
2. Drag and drop a PDF file OR click to browse
3. Fill form:
   - Document Type: W9
   - Document Name: "Test W9 Form"
   - Expiration Date: (30 days from now)
   - Notes: "Test upload"
4. Click "Upload Document"
5. ✅ **Verify:** Document appears in "Expiring Soon" section with yellow badge showing "Expires in X days"

**VIEW:**
1. Click Eye icon on document card
2. ✅ **Verify:** Document opens in new browser tab

**DOWNLOAD:**
1. Click Download icon on document card
2. ✅ **Verify:** File downloads to your Downloads folder

**DELETE:**
1. Click red Trash icon on document card
2. ✅ **Verify:** Confirmation modal appears with "permanent deletion" warning
3. Click "Delete"
4. ✅ **Verify:** Document removed from list

---

## Network Tab Validation (Advanced)

Open Chrome DevTools → Network tab while testing:

### Create Operations (POST requests)
- **POST /api/vendors** → 201 Created
- **POST /api/vendor-addresses** → 201 Created
- **POST /api/vendor-contacts** → 201 Created
- **POST /api/vendor-documents** → 201 Created

### Update Operations (PATCH requests)
- **PATCH /api/vendors/:id** → 200 OK
- **PATCH /api/vendor-addresses/:id** → 200 OK
- **PATCH /api/vendor-contacts/:id** → 200 OK

### Delete Operations (DELETE requests)
- **DELETE /api/vendors/:id** → 200 OK (soft delete)
- **DELETE /api/vendor-addresses/:id** → 200 OK
- **DELETE /api/vendor-contacts/:id** → 200 OK
- **DELETE /api/vendor-documents/:id** → 200 OK

### React Query Cache Invalidation
After each mutation, you should see:
1. Mutation request (POST/PATCH/DELETE)
2. Automatic refetch request (GET) to update list
3. UI updates without page reload

---

## Error Handling Validation

### Test Network Errors
1. Stop backend server
2. Try to create a vendor
3. ✅ **Verify:** Error alert appears with friendly message
4. ✅ **Verify:** Form stays open for retry
5. Restart backend and retry
6. ✅ **Verify:** Operation succeeds

### Test Validation Errors
1. Try to create vendor with empty name
2. ✅ **Verify:** Validation error shows below field
3. ✅ **Verify:** Submit button disabled until valid

### Test Duplicate Code Errors (if backend enforces)
1. Create vendor with code "TEST-001"
2. Try to create another with same code
3. ✅ **Verify:** Backend error message displayed

---

## Accessibility Testing

### Keyboard Navigation
1. Use Tab key to navigate through vendor list
2. ✅ **Verify:** Focus indicators visible on all cards
3. Press Tab to "Add Vendor" button
4. Press Enter to open modal
5. ✅ **Verify:** Focus moves to first form field
6. Use Tab to navigate form, Shift+Tab to go back
7. Press Escape to close modal
8. ✅ **Verify:** Modal closes and focus returns

### Screen Reader Testing (if available)
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate to vendor card
3. ✅ **Verify:** Screen reader announces vendor name and status
4. Tab to Edit button
5. ✅ **Verify:** Screen reader announces "Edit vendor"

---

## Performance Testing

### Large List Rendering
1. Navigate to VendorList with 50+ vendors
2. ✅ **Verify:** List renders quickly (< 1 second)
3. Scroll through list
4. ✅ **Verify:** Smooth scrolling, no lag

### Rapid Mutations
1. Create 5 addresses in quick succession
2. ✅ **Verify:** All appear without errors
3. ✅ **Verify:** No duplicate entries
4. ✅ **Verify:** React Query batches requests appropriately

---

## Known Issues to Watch For

### Issue: mockData.js Import Errors
**Components Affected:**
- OverviewTab
- ItemsTab
- VendorMetricsDashboard

**Symptoms:**
- Console error: "Cannot find module './mockData'"
- Tabs showing empty or error state

**Resolution:**
- These tabs are NOT part of Phase 2B
- Will be addressed in future phase
- Do NOT test these tabs until backend support confirmed

### Issue: Primary Item Protection
**Expected Behavior:**
- Primary addresses CANNOT be deleted
- Primary contacts CANNOT be deleted
- Delete button should be disabled with tooltip OR show warning

**If Not Working:**
- Check `is_primary` field in database
- Verify delete button conditional rendering
- Check DeleteConfirmationModal warningMessage prop

---

## Success Criteria

Phase 2B CRUD wiring is considered successful if:

✅ All vendor CRUD operations work without errors
✅ All address CRUD operations work without errors
✅ All contact CRUD operations work without errors
✅ All document upload/delete operations work without errors
✅ Lists update in real-time after mutations
✅ No page reload required for any operation
✅ Delete confirmations appear for all delete actions
✅ Primary items are protected from deletion
✅ Error handling shows user-friendly messages
✅ Keyboard navigation works correctly
✅ No console errors during normal operation

---

## Reporting Issues

If you encounter issues during testing:

1. **Capture the error:**
   - Open DevTools Console
   - Screenshot the error
   - Note the exact steps to reproduce

2. **Check Network tab:**
   - What was the request?
   - What was the response status?
   - What was the response body?

3. **Report format:**
   ```
   Component: VendorCard
   Operation: Delete
   Steps: 1. Hover over card, 2. Click delete, 3. Confirm
   Expected: Vendor removed from list
   Actual: Error alert appears
   Console Error: [paste error]
   Network Response: [paste response]
   ```

---

## Next Phase Preview

After successful Phase 2B testing, the next phases will address:

**Phase 3:** OverviewTab, ItemsTab, VendorMetricsDashboard migration
**Phase 4:** Enhanced search/filter/sort functionality
**Phase 5:** Optimistic updates and performance improvements

---

**Testing Time Estimate:** 15-20 minutes for full validation
**Last Updated:** 2026-01-02
**Frontend Specialist:** Ready for QA validation
