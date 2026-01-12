# Vendor ERP Module - Comprehensive Testing Checklist

**Version:** 1.0
**Date:** January 7, 2026
**Module:** Vendor ERP (Phase 2 Complete)
**Tester:** ******\_******
**Date Tested:** ******\_******

---

## Testing Overview

This checklist covers all functionality in the Vendor ERP module including:

- Navigation and routing
- CRUD operations (Create, Read, Update, Delete)
- Search, filter, and sort
- Form validation
- Document upload
- Metrics and dashboard
- Edge cases and error handling
- UI/UX and accessibility

**Testing Instructions:**

- Mark each item as ✅ Pass, ❌ Fail, or ⚠️ Issue
- Note any bugs or issues in the "Notes" section
- Test in order (some tests depend on previous steps)

---

## 1. Navigation & Routing

### 1.1 Sidebar Navigation

- [x] Click "Vendors" in sidebar → Vendor list page loads
- [x] URL shows `/vendors`
- [x] No console errors
- [x] Page loads within 2 seconds

### 1.2 Vendor List to Detail

- [x] Click on any vendor card → Vendor detail page loads
- [x] URL shows `/vendors?vendorId={id}`
- [x] Correct vendor data displays
- [x] Back button works (returns to list)

### 1.3 Tab Navigation

- [x] Click Overview tab → Overview content loads
- [x] Click Addresses tab → Addresses list loads
- [x] Click Contacts tab → Contacts list loads
- [x] Click Payment tab → Payment info loads
- [x] Click Items tab → Items list loads

### 1.4 Tab Scroll Behavior

- [x] Scroll down in a tab
- [x] Click another tab → Automatically scrolls to top of new tab
- [x] Tab content area scrolls, header stays fixed

**Notes:**

```


```

---

## 2. Vendor CRUD Operations

### 2.1 Create Vendor

- [ ] Click "Add Vendor" button in VendorList
- [ ] VendorForm modal opens
- [ ] Fill required fields:
  - [ ] Name: "Test Vendor"
  - [ ] Vendor Code: "TEST-001"
  - [ ] Legal Name: "Test Vendor LLC"
  - [ ] Status: Active
- [ ] Click "Save"
- [ ] Success: Modal closes
- [ ] Success: New vendor appears in list
- [ ] Success: Can find new vendor by searching

### 2.2 Create Vendor - Validation

- [ ] Click "Add Vendor"
- [ ] Leave Name blank → Shows error "Name is required"
- [ ] Leave Vendor Code blank → Shows error "Vendor code is required"
- [ ] Enter duplicate vendor name → Shows error
- [ ] Fix errors → Can save successfully

### 2.3 Edit Vendor

- [ ] Hover over vendor card → Edit icon appears
- [ ] Click Edit icon → VendorForm opens with data
- [ ] Change name to "Test Vendor Updated"
- [ ] Click "Save"
- [ ] Success: Modal closes
- [ ] Success: Updated name shows in card
- [ ] Success: Changes persist after page refresh

### 2.4 Delete Vendor

- [ ] Hover over vendor card → Delete icon appears
- [ ] Click Delete icon → Confirmation modal opens
- [ ] Modal shows vendor name
- [ ] Click "Cancel" → Modal closes, vendor not deleted
- [ ] Click Delete again → Click "Delete" in modal
- [ ] Success: Modal closes
- [ ] Success: Vendor removed from list
- [ ] Success: Verify vendor gone after page refresh

### 2.5 Soft Delete (if applicable)

- [ ] Delete a vendor with purchase orders
- [ ] Vendor status changes to "Inactive" (not deleted)
- [ ] Vendor still appears in list with inactive badge
- [ ] Can reactivate by editing vendor

**Notes:**

```


```

---

## 3. Address CRUD Operations

### 3.1 View Addresses

- [ ] Navigate to vendor detail → Addresses tab
- [ ] All addresses display
- [ ] Address types show (Billing, Shipping, Remittance, Ship From)
- [ ] Primary addresses marked with badge
- [ ] Contact info displays (phone, email)

### 3.2 Add Address

- [ ] Click "Add Address" button
- [ ] AddressForm modal opens
- [ ] Fill required fields:
  - [ ] Address Type: Billing
  - [ ] Address Line 1: "123 Test St"
  - [ ] City: "Test City"
  - [ ] State: "CA"
  - [ ] Postal Code: "12345"
  - [ ] Country: "USA"
  - [ ] Phone: "555-0123"
  - [ ] Mark as Primary: Yes
- [ ] Click "Save"
- [ ] Success: Modal closes
- [ ] Success: New address appears in list
- [ ] Success: Shows as primary address

### 3.3 Edit Address

- [ ] Click Edit icon on address card
- [ ] AddressForm opens with existing data
- [ ] Change city to "Updated City"
- [ ] Click "Save"
- [ ] Success: Updated city displays
- [ ] Success: Changes persist

### 3.4 Delete Address

- [ ] Try to delete primary address
- [ ] Should show warning or prevent deletion
- [ ] Add a second address (non-primary)
- [ ] Delete the non-primary address
- [ ] Success: Confirmation modal appears
- [ ] Confirm deletion
- [ ] Success: Address removed

### 3.5 Primary Address Toggle

- [ ] Have 2 billing addresses
- [ ] Mark second one as primary
- [ ] First one automatically unmarked as primary
- [ ] Only one primary per address type

**Notes:**

```


```

---

## 4. Contact CRUD Operations

### 4.1 View Contacts

- [ ] Navigate to Contacts tab
- [ ] Primary contact displays separately at top
- [ ] Additional contacts display in grid
- [ ] Contact roles display (Account Manager, Sales Rep, etc.)
- [ ] Communication preferences show (Orders, Invoices)

### 4.2 Add Contact

- [ ] Click "Add Contact" button
- [ ] ContactForm modal opens
- [ ] Fill required fields:
  - [ ] First Name: "John"
  - [ ] Last Name: "Doe"
  - [ ] Title: "Account Manager"
  - [ ] Role: "Sales"
  - [ ] Email: "john@test.com"
  - [ ] Phone: "555-0456"
  - [ ] Mark as Primary: Yes
- [ ] Click "Save"
- [ ] Success: Contact appears as primary
- [ ] Success: Email and phone formatted correctly

### 4.3 Email/Phone Validation

- [ ] Try to add contact with invalid email: "notanemail"
- [ ] Should show error "Invalid email format"
- [ ] Try invalid phone: "123"
- [ ] Should show error "Invalid phone format"
- [ ] Fix errors → Save successfully

### 4.4 Edit Contact

- [ ] Click Edit on contact card
- [ ] Update phone number
- [ ] Click "Save"
- [ ] Success: Updated phone displays

### 4.5 Delete Contact

- [ ] Try to delete primary contact
- [ ] Should show warning or prevent deletion
- [ ] Add a second contact (non-primary)
- [ ] Delete the non-primary contact
- [ ] Success: Contact removed

**Notes:**

```


```

---

## 5. Payment Information

### 5.1 View Payment Info

- [ ] Navigate to Payment tab
- [ ] Payment terms display (Net 30, Net 45, etc.)
- [ ] Payment method displays (ACH, Check, Wire)
- [ ] Sensitive info is masked (account numbers show \*\*\*\*1234)
- [ ] Credit limit displays
- [ ] Current balance displays

### 5.2 Edit Payment Terms

- [ ] Click Edit on payment terms section
- [ ] PaymentTermsForm opens
- [ ] Change net days to 45
- [ ] Click "Save"
- [ ] Success: Updated terms display

### 5.3 Add Payment Method

- [ ] Click "Add Payment Method"
- [ ] PaymentMethodForm opens
- [ ] Fill details:
  - [ ] Payment Type: ACH
  - [ ] Account Number: "123456789"
  - [ ] Routing Number: "987654321"
  - [ ] Bank Name: "Test Bank"
- [ ] Click "Save"
- [ ] Success: Account number displays masked (\*\*\*\*6789)
- [ ] Success: Payment method appears in list

### 5.4 Payment Tab Error Handling

- [ ] Verify no 404 errors in console
- [ ] All data loads correctly
- [ ] No "Request failed" errors

**Notes:**

```


```

---

## 6. Document Upload & Management

### 6.1 View Documents

- [ ] Navigate to Documents tab
- [ ] Documents display in categories:
  - [ ] Expired (red)
  - [ ] Expiring Soon (yellow)
  - [ ] Current (green)
- [ ] Document types display (W9, Insurance, etc.)
- [ ] Expiration dates display
- [ ] File sizes display

### 6.2 Upload Document - PDF

- [ ] Click "Upload Document" button
- [ ] DocumentForm modal opens
- [ ] Drag a PDF file into drop zone
- [ ] File name displays
- [ ] Select document type: "W9 Tax Form"
- [ ] Add expiration date (future date)
- [ ] Add notes: "Test document"
- [ ] Click "Upload Document"
- [ ] Upload progress shows
- [ ] Success: Modal closes
- [ ] Success: Document appears in "Current" section
- [ ] Success: File uploaded to Supabase Storage

### 6.3 Upload Document - Image

- [ ] Click "Upload Document"
- [ ] Select a JPG/PNG image file
- [ ] Fill required fields
- [ ] Click "Upload Document"
- [ ] Success: Image uploads successfully

### 6.4 Upload Validation

- [ ] Try to upload a .txt file
- [ ] Should show error "Invalid file type"
- [ ] Try to upload file > 10MB
- [ ] Should show error "File too large"
- [ ] Upload valid file → Success

### 6.5 View Document

- [ ] Click Eye icon on document card
- [ ] Document opens in new tab
- [ ] Correct file displays

### 6.6 Download Document

- [ ] Click Download icon on document card
- [ ] File downloads to computer
- [ ] Downloaded file opens correctly

### 6.7 Delete Document

- [ ] Click Delete icon on document card
- [ ] Confirmation modal appears
- [ ] Shows warning "This action cannot be undone"
- [ ] Click "Delete"
- [ ] Success: Document removed from list
- [ ] Success: File removed from Supabase Storage

**Notes:**

```


```

---

## 7. Overview Tab Quick Actions

### 7.1 Add Contact Button

- [ ] Navigate to Overview tab
- [ ] Click "Add Contact" button
- [ ] ContactForm modal opens
- [ ] Add a contact
- [ ] Success: Returns to Overview tab
- [ ] Navigate to Contacts tab → New contact appears

### 7.2 Add Address Button

- [ ] On Overview tab
- [ ] Click "Add Address" button
- [ ] AddressForm modal opens
- [ ] Add an address
- [ ] Success: Can verify in Addresses tab

### 7.3 Upload Document Button

- [ ] On Overview tab
- [ ] Click "Upload Document" button
- [ ] DocumentForm modal opens
- [ ] Upload a document
- [ ] Success: Can verify in Documents tab

### 7.4 Create PO Button

- [ ] "Create PO" button is disabled or shows Phase 3 message
- [ ] Tooltip explains feature coming soon

**Notes:**

```


```

---

## 8. Performance Tab

### 8.1 View Performance Data

- [ ] Navigate to Performance tab
- [ ] Scorecards display (if vendor has scorecards)
- [ ] Quality score displays
- [ ] Delivery score displays
- [ ] Price score displays
- [ ] Service score displays
- [ ] Overall grade displays (A, B, C, D, F)
- [ ] Grade color-coded correctly

### 8.2 Performance Charts

- [ ] Charts render without errors
- [ ] Data displays correctly
- [ ] Charts are readable

### 8.3 No Scorecard State

- [ ] For vendor without scorecards
- [ ] Shows "No performance data" or similar message
- [ ] No errors

**Notes:**

```


```

---

## 9. Items Tab

### 9.1 View Items

- [ ] Navigate to Items tab
- [ ] Ingredient-vendor mappings display
- [ ] Item names display
- [ ] Vendor item codes display
- [ ] Prices display
- [ ] Package quantities display
- [ ] Lead times display
- [ ] Preferred items marked

### 9.2 Search Items

- [ ] Search by ingredient name
- [ ] Results filter correctly
- [ ] Search by vendor code
- [ ] Results filter correctly

### 9.3 Filter Items

- [ ] Filter by "Preferred Only"
- [ ] Only preferred items show
- [ ] Clear filter → All items show

### 9.4 Inline Editing (if implemented)

- [ ] Click Edit icon on item row
- [ ] Fields become editable
- [ ] Make changes
- [ ] Click Save → Shows success or Phase 3 message
- [ ] Click Cancel → Reverts changes

**Notes:**

```


```

---

## 10. Search, Filter, Sort (Vendor List)

### 10.1 Search Functionality

- [ ] In VendorList, type vendor name in search
- [ ] Results filter in real-time
- [ ] Search is case-insensitive
- [ ] Search by vendor code works
- [ ] Partial matches work ("Sys" finds "Sysco")
- [ ] Click X button → Search clears
- [ ] Result count updates ("5 vendors found")

### 10.2 Status Filter

- [ ] Select "Active" from status dropdown
- [ ] Only active vendors show
- [ ] Select "Inactive"
- [ ] Only inactive vendors show
- [ ] Select "All Status"
- [ ] All vendors show again

### 10.3 Grade Filter

- [ ] Select "Grade A" from grade dropdown
- [ ] Only A-grade vendors show
- [ ] Select "Grade B"
- [ ] Only B-grade vendors show
- [ ] Select "All Grades"
- [ ] All vendors show

### 10.4 Combined Filters

- [ ] Search for "Sys"
- [ ] Filter by Status: Active
- [ ] Filter by Grade: A
- [ ] Only matching vendors show
- [ ] Click "Clear Filters"
- [ ] All filters reset

### 10.5 Sort Functionality

- [ ] Sort by "Name (A-Z)"
- [ ] Vendors alphabetically sorted
- [ ] Sort by "Name (Z-A)"
- [ ] Vendors reverse sorted
- [ ] Sort by "Vendor Code (A-Z)"
- [ ] Sorted by code
- [ ] Sort by "Grade (Best First)"
- [ ] A grades appear first, F grades last

### 10.6 Persistence

- [ ] Set search term and filters
- [ ] Refresh the page
- [ ] Search and filters persist (saved in localStorage)

**Notes:**

```


```

---

## 11. Metrics & Dashboard

### 11.1 Vendor Metrics (Right Sidebar)

- [ ] Navigate to Vendors section
- [ ] Right sidebar shows 4 metrics:
  - [ ] Active Vendors count (matches actual count)
  - [ ] Avg Lead Time (realistic number)
  - [ ] Documents Expiring Soon (matches actual count)
  - [ ] Grade A Vendors (matches actual count)

### 11.2 Metrics Accuracy

- [ ] Create a new vendor
- [ ] Active Vendors count increases by 1
- [ ] Upload a document with expiration in 15 days
- [ ] Documents Expiring increases by 1
- [ ] Verify all metrics reflect real data

### 11.3 Metrics Refresh

- [ ] Metrics update automatically after changes
- [ ] No need to manually refresh page
- [ ] React Query cache working correctly

**Notes:**

```


```

---

## 12. Form Validation

### 12.1 Required Fields

- [ ] VendorForm: Name is required
- [ ] VendorForm: Vendor code is required
- [ ] AddressForm: Address line 1 is required
- [ ] AddressForm: City is required
- [ ] AddressForm: State is required
- [ ] AddressForm: Postal code is required
- [ ] ContactForm: First name is required
- [ ] ContactForm: Last name is required
- [ ] ContactForm: Email is required
- [ ] DocumentForm: File is required
- [ ] DocumentForm: Document type is required

### 12.2 Format Validation

- [ ] Email must be valid format (user@domain.com)
- [ ] Phone must be valid format
- [ ] Postal code must be valid format
- [ ] Vendor code must be unique

### 12.3 Field-Specific Errors

- [ ] Errors display next to fields (not just at top)
- [ ] Error messages are clear and helpful
- [ ] Errors clear when field is corrected

**Notes:**

```


```

---

## 13. Error Handling

### 13.1 Network Errors

- [ ] Stop backend server
- [ ] Try to load vendors
- [ ] Shows error message: "Failed to load vendors"
- [ ] Shows "Retry" button
- [ ] Restart backend → Click Retry → Data loads

### 13.2 404 Not Found

- [ ] Navigate to vendor that doesn't exist
- [ ] Shows "Vendor not found" message
- [ ] Shows "Back to Vendors" button
- [ ] Click button → Returns to list

### 13.3 500 Server Error

- [ ] If server error occurs
- [ ] Shows friendly error message (not technical error)
- [ ] Doesn't crash the app
- [ ] Can recover by refreshing

### 13.4 Validation Errors

- [ ] Submit form with invalid data
- [ ] Shows clear validation errors
- [ ] Can fix errors and resubmit
- [ ] Form doesn't submit with errors

### 13.5 Upload Errors

- [ ] Try to upload invalid file type
- [ ] Shows error: "File type not allowed"
- [ ] Try to upload file too large
- [ ] Shows error: "File too large (max 10MB)"

**Notes:**

```


```

---

## 14. Loading States

### 14.1 Data Loading

- [ ] When loading vendors → Shows spinner
- [ ] When loading vendor detail → Shows skeleton/spinner
- [ ] When loading addresses → Shows loading indicator
- [ ] When loading contacts → Shows loading indicator
- [ ] When loading documents → Shows loading indicator

### 14.2 Mutation Loading

- [ ] Click "Save" on form → Button shows "Saving..."
- [ ] Button is disabled during save
- [ ] Click "Delete" → Button shows "Deleting..."
- [ ] Upload document → Shows progress indicator

### 14.3 No Infinite Loading

- [ ] Loading states resolve (don't spin forever)
- [ ] If error occurs, loading state clears
- [ ] Shows error instead of infinite loading

**Notes:**

```


```

---

## 15. Empty States

### 15.1 No Vendors

- [ ] If no vendors exist
- [ ] Shows helpful empty state message
- [ ] Shows "Add Vendor" button
- [ ] Message encourages creating first vendor

### 15.2 No Addresses

- [ ] Vendor with no addresses
- [ ] Shows "No addresses yet" message
- [ ] Shows "Add Address" button

### 15.3 No Contacts

- [ ] Vendor with no contacts
- [ ] Shows "No contacts yet" message
- [ ] Shows "Add Contact" button

### 15.4 No Documents

- [ ] Vendor with no documents
- [ ] Shows "No documents yet" message
- [ ] Shows "Upload Document" button

### 15.5 No Search Results

- [ ] Search for non-existent vendor
- [ ] Shows "No vendors found"
- [ ] Shows "Try adjusting your search or filters"

**Notes:**

```


```

---

## 16. UI/UX Quality

### 16.1 Responsive Design

- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768px width)
- [ ] Test on mobile (375px width)
- [ ] All features accessible on mobile
- [ ] No horizontal scrolling
- [ ] Buttons tappable on mobile

### 16.2 Visual Consistency

- [ ] Colors match app theme
- [ ] Fonts consistent throughout
- [ ] Button styles consistent
- [ ] Card styles consistent
- [ ] Icons consistent (from lucide-react)

### 16.3 Interactions

- [ ] Hover states work on buttons
- [ ] Hover states work on cards
- [ ] Click feedback (buttons darken slightly)
- [ ] Smooth transitions
- [ ] No janky animations

### 16.4 Data Formatting

- [ ] Dates formatted correctly (Jan 5, 2026)
- [ ] Phone numbers formatted (555-0123)
- [ ] Currency formatted ($1,234.56)
- [ ] Addresses formatted properly
- [ ] File sizes formatted (5.2 MB)

### 16.5 Condensed Spacing

- [ ] Vendor module uses tighter spacing than other sections
- [ ] More data fits on screen
- [ ] Still readable and not cramped
- [ ] Icons are smaller (w-4 h-4)
- [ ] Padding is p-4 instead of p-6

**Notes:**

```


```

---

## 17. Accessibility

### 17.1 Keyboard Navigation

- [ ] Can tab through all interactive elements
- [ ] Tab order is logical
- [ ] Can open modals with Enter key
- [ ] Can close modals with Esc key
- [ ] Focus indicators visible

### 17.2 Screen Reader Support

- [ ] Buttons have aria-labels
- [ ] Forms have proper labels
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Images have alt text

### 17.3 Color Contrast

- [ ] Text is readable against background
- [ ] Buttons have sufficient contrast
- [ ] Links are distinguishable
- [ ] Meets WCAG AA standards

**Notes:**

```


```

---

## 18. Performance

### 18.1 Page Load Speed

- [ ] Vendor list loads in < 2 seconds
- [ ] Vendor detail loads in < 1 second
- [ ] Tab switching is instant
- [ ] No lag when typing in search

### 18.2 Large Datasets

- [ ] Test with 100+ vendors (if possible)
- [ ] Search still fast
- [ ] Filtering still fast
- [ ] Sorting still fast
- [ ] No noticeable lag

### 18.3 React Query Caching

- [ ] Navigate away from vendor detail
- [ ] Navigate back to same vendor
- [ ] Data loads instantly from cache
- [ ] No unnecessary API calls
- [ ] Cache invalidates after updates

**Notes:**

```


```

---

## 19. Data Integrity

### 19.1 Create Operations

- [ ] Created vendors appear immediately
- [ ] Created addresses appear immediately
- [ ] Created contacts appear immediately
- [ ] Created documents appear immediately
- [ ] All data persists after page refresh

### 19.2 Update Operations

- [ ] Updates reflect immediately in UI
- [ ] Updates persist after page refresh
- [ ] Updates visible in all relevant places
- [ ] No stale data shown

### 19.3 Delete Operations

- [ ] Deleted items removed immediately
- [ ] Deletions persist after page refresh
- [ ] Related data handled correctly
- [ ] No orphaned records

### 19.4 Relationships

- [ ] Addresses correctly linked to vendors
- [ ] Contacts correctly linked to vendors
- [ ] Documents correctly linked to vendors
- [ ] Items correctly linked to vendors
- [ ] No foreign key violations

**Notes:**

```


```

---

## 20. Browser Compatibility

### 20.1 Chrome

- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

### 20.2 Firefox

- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

### 20.3 Safari

- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

### 20.4 Mobile Safari (iOS)

- [ ] All features work
- [ ] Touch interactions work
- [ ] UI renders correctly

### 20.5 Chrome Mobile (Android)

- [ ] All features work
- [ ] Touch interactions work
- [ ] UI renders correctly

**Notes:**

```


```

---

## 21. Edge Cases & Stress Tests

### 21.1 Concurrent Operations

- [ ] Open vendor in two tabs
- [ ] Edit in tab 1
- [ ] Edit in tab 2
- [ ] Both updates save correctly
- [ ] No data loss

### 21.2 Special Characters

- [ ] Create vendor with name: "Test & Co., Ltd. (2025)"
- [ ] Name displays correctly
- [ ] Search works with special characters
- [ ] No encoding issues

### 21.3 Long Data

- [ ] Create vendor with 100+ character name
- [ ] UI doesn't break
- [ ] Text truncates or wraps gracefully
- [ ] Full text visible on detail page

### 21.4 Rapid Clicking

- [ ] Click "Save" button rapidly (5x fast)
- [ ] Only one save operation occurs
- [ ] Button disables during save
- [ ] No duplicate records created

### 21.5 Session Timeout

- [ ] Let session expire (or logout)
- [ ] Try to perform operation
- [ ] Redirects to login
- [ ] Returns to correct page after login

**Notes:**

```


```

---

## 22. Console & Network

### 22.1 Console Errors

- [ ] Open browser DevTools → Console
- [ ] Navigate through entire vendor module
- [ ] Perform all CRUD operations
- [ ] No errors in console
- [ ] No warnings in console

### 22.2 Network Requests

- [ ] Open DevTools → Network tab
- [ ] Monitor API calls
- [ ] No failed requests (red)
- [ ] No excessive requests
- [ ] Authentication headers present

### 22.3 React Query DevTools

- [ ] Check React Query cache
- [ ] Queries cached correctly
- [ ] Cache invalidated after mutations
- [ ] Stale time working correctly

**Notes:**

```


```

---

## Summary & Sign-Off

### Test Results Summary

**Total Tests:** ~250
**Tests Passed:** **\_** / 250
**Tests Failed:** **\_**
**Tests Skipped:** **\_**
**Pass Rate:** **\_**%

### Critical Issues Found

```
1.
2.
3.
```

### Minor Issues Found

```
1.
2.
3.
```

### Recommendations

```


```

### Overall Assessment

- [ ] **PASS** - Ready for production
- [ ] **CONDITIONAL PASS** - Minor issues to fix
- [ ] **FAIL** - Critical issues require fixing

### Sign-Off

**Tester Name:** **********\_**********
**Date:** **********\_**********
**Signature:** **********\_**********

---

## Appendix: Test Data

### Sample Vendors for Testing

1. **Sysco Foods** - Grade A, Active, 15+ items
2. **Harbor Seafood** - Grade A, Active, seafood items
3. **Local Farm Fresh** - Grade B, Active, produce items
4. **Prime Meats** - Grade B, Active, expired insurance
5. **ChefWare Supply** - Grade D, Inactive, no items

### Sample Files for Upload

- **PDF:** < 5MB, valid W9 form
- **Image:** < 5MB, JPG or PNG
- **Invalid:** .txt file (should reject)
- **Large:** > 10MB file (should reject)

### Test Account

- **Restaurant ID:** `1e9c773e-913f-4a9b-b812-5ee2b5a4b15a`
- **User:** Your test account
- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173

---

**End of Testing Checklist**
