# Vendor ERP Module - Comprehensive Testing Checklist

**Version:** 1.0
**Date:** January 7, 2026
**Module:** Vendor ERP (Phase 2 Complete)
**Tester:** **\*\***\_**\*\***
**Date Tested:** **\*\***\_**\*\***

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

- [x] Click "Add Vendor" button in VendorList
- [x] VendorForm modal opens
- [x] Fill required fields:
  - [x] Name: "Test Vendor"
  - [x] Vendor Code: "TEST-001"
  - [x] Legal Name: "Test Vendor LLC"
  - [x] Status: Active
- [x] Click "Save"
- [x] Success: Modal closes
- [x] Success: New vendor appears in list
- [x] Success: Can find new vendor by searching

### 2.2 Create Vendor - Validation

- [x] Click "Add Vendor"
- [x] Leave Name blank → Shows error "Name is required"
- [ Didn't Require ] Leave Vendor Code blank → Shows error "Vendor code is required"
- [ 409 Status Code - Error in Terminal ] Enter duplicate vendor name → Shows error
- [ ] Fix errors → Can save successfully

### 2.3 Edit Vendor

- [x] Hover over vendor card → Edit icon appears
- [x] Click Edit icon → VendorForm opens with data
- [x] Change name to "Test Vendor Updated"
- [x] Click "Save"
- [] Success: Modal closes
- [] Success: Updated name shows in card
- [ ] Success: Changes persist after page refresh
- TERMINAL ERROR MESSAGE ON SAVE: "Error updating vendor: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'website' column of 'vendors' in the schema cache""
- CONSOLE ERROR MESSAGE ON SAVE: "Failed to load resource: the server responded with a status of 500 (Internal Server Error)
  vendorService.js:74 PUT http://localhost:3001/api/vendors/23012e6d-e53d-4a6f-9bdf-60fec292f2d6 500 (Internal Server Error)
  dispatchXhrRequest @ xhr.js:198
  xhr @ xhr.js:15
  dispatchRequest @ dispatchRequest.js:51
  Promise.then
  \_request @ Axios.js:163
  request @ Axios.js:40
  httpMethod @ Axios.js:224
  wrap @ bind.js:5
  updateVendor @ vendorService.js:74
  mutationFn @ useVendors.js:91
  fn @ mutation.ts:190
  run @ retryer.ts:155
  start @ retryer.ts:221
  execute @ mutation.ts:233
  await in execute
  mutate @ mutationObserver.ts:142
  (anonymous) @ useMutation.ts:56
  handleSubmit @ VendorForm.jsx:59
  executeDispatch @ react-dom-client.development.js:19116
  runWithFiberInDEV @ react-dom-client.development.js:871
  processDispatchQueue @ react-dom-client.development.js:19166
  (anonymous) @ react-dom-client.development.js:19767
  batchedUpdates$1 @ react-dom-client.development.js:3255
  dispatchEventForPluginEventSystem @ react-dom-client.development.js:19320
  dispatchEvent @ react-dom-client.development.js:23585
  dispatchDiscreteEvent @ react-dom-client.development.js:23553"

### 2.4 Delete Vendor

- [x] Hover over vendor card → Delete icon appears
- [x] Click Delete icon → Confirmation modal opens
- [x] Modal shows vendor name
- [x] Click "Cancel" → Modal closes, vendor not deleted
- [x] Click Delete again → Click "Delete" in modal
- [x] Success: Modal closes
- [ "soft" deleted ] Success: Vendor removed from list
- [ still in list - set to inactive and all info except name removed ] Success: Verify vendor gone after page refresh

### 2.5 Soft Delete (if applicable)

- [ ] Delete a vendor with purchase orders
- [ ] Vendor status changes to "Inactive" (not deleted)
- [ ] Vendor still appears in list with inactive badge
- [ ] Can reactivate by editing vendor

**Notes:**

```
Editing vendor is broken.  Cannot find website column in table schema, so save fails.

Deleting a vendor defaults to a soft save, including those that don't have POs. I created a new vendor for testing, then tried to delete it right after and it was only soft deleted.  Soft deleting erased all data from the form except the name and set it to inactive.

```

---

## 3. Address CRUD Operations

### 3.1 View Addresses

- [x] Navigate to vendor detail → Addresses tab
- [x] All addresses display
- [x] Address types show (Billing, Shipping, Remittance, Ship From)
- [x] Primary addresses marked with badge
- [x] Contact info displays (phone, email)

### 3.2 Add Address

- [x] Click "Add Address" button
- [x] AddressForm modal opens
- [x] Fill required fields:
  - [x] Address Type: Billing
  - [x] Address Line 1: "123 Test St"
  - [x] City: "Test City"
  - [x] State: "CA"
  - [x] Postal Code: "12345"
  - [x] Country: "USA"
  - [x] Phone: "555-0123"
  - [x] Mark as Primary: Yes
- [x] Click "Save"
- [ ] Success: Modal closes
- [ ] Success: New address appears in list
- [ ] Success: Shows as primary address
- TERMINAL ERROR ON SAVE: "Error creating vendor address: Error: An address with type 'ship_from' already exists for this vendor
  at createVendorAddress (file:///C:/Users/thueb/OneDrive/Desktop/Website%20Projects/Invantry/invantry-app/backend/src/services/vendorAddresses.js:162:11)
  at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
  at async file:///C:/Users/thueb/OneDrive/Desktop/Website%20Projects/Invantry/invantry-app/backend/src/routes/vendorAddresses.js:65:19"
- NOTE: Tried a type that didn't have an address and creation worked. Need to allow multiple addresses of a type.

### 3.3 Edit Address

- [x] Click Edit icon on address card
- [x] AddressForm opens with existing data
- [x] Change city to "Updated City"
- [x] Click "Save"
- [x] Success: Updated city displays
- [x] Success: Changes persist

### 3.4 Delete Address

- [x] Try to delete primary address
- [x] Should show warning or prevent deletion
- [ ] Add a second address (non-primary)
- [ ] Delete the non-primary address
- [ ] Success: Confirmation modal appears
- [ ] Confirm deletion
- [ ] Success: Address removed
- TERMINAL ERROR ON DELETE: "Error deleting vendor address: {
  code: '22P02',
  details: null,
  hint: null,
  message: 'invalid input syntax for type uuid: "undefined"'
  }"
- CONSOLE ERROR ON DELETE: "vendorAddressService.js:86

DELETE http://localhost:3001/api/vendors/undefined/addresses/undefined 500 (Internal Server Error)
Promise.then
deleteVendorAddress @ vendorAddressService.js:86
mutationFn @ useVendorAddresses.js:116
await in execute
handleDeleteConfirm @ AddressCard.jsx:22
installHook.js:1
Failed to delete address:
AxiosError {message: 'Request failed with status code 500', name: 'AxiosError', code: 'ERR_BAD_RESPONSE', config: {…}, request: XMLHttpRequest, …}
overrideMethod @ installHook.js:1
onError @ AddressCard.jsx:28
await in execute
handleDeleteConfirm @ AddressCard.jsx:22
﻿"

### 3.5 Primary Address Toggle

- [ ] Have 2 billing addresses
- [ ] Mark second one as primary
- [ ] First one automatically unmarked as primary
- [ ] Only one primary per address type

**Notes:**

```
Cannot currently have two address of the same type.  Need to fix that.

Currently unable to delete address due to error.  Find error and fix.

```

---

## 4. Contact CRUD Operations

### 4.1 View Contacts

- [x] Navigate to Contacts tab
- [x] Primary contact displays separately at top
- [x] Additional contacts display in grid
- [x] Contact roles display (Account Manager, Sales Rep, etc.)
- [x] Communication preferences show (Orders, Invoices)

### 4.2 Add Contact

- [x] Click "Add Contact" button
- [x] ContactForm modal opens
- [x] Fill required fields:
  - [x] First Name: "John"
  - [x] Last Name: "Doe"
  - [x] Title: "Account Manager"
  - [x] Role: "Sales"
  - [x] Email: "john@test.com"
  - [x] Phone: "555-0456"
  - [x] Mark as Primary: Yes
- [x] Click "Save"
- [x] Success: Contact appears as primary
- [ ] Success: Email and phone formatted correctly

### 4.3 Email/Phone Validation

- [x] Try to add contact with invalid email: "notanemail"
- [x] Should show error "Invalid email format"
- [x] Try invalid phone: "123"
- [x] Should show error "Invalid phone format"
- [x] Fix errors → Save successfully

### 4.4 Edit Contact

- [x] Click Edit on contact card
- [x] Update phone number
- [x] Click "Save"
- [x] Success: Updated phone displays

### 4.5 Delete Contact

- [x] Try to delete primary contact
- [ No delete option for Primary Contact ] Should show warning or prevent deletion
- [x] Add a second contact (non-primary)
- [x] Delete the non-primary contact
- [ ] Success: Contact removed
- TERMINAL ERROR ON DELETE: "Error deleting vendor contact: {
  code: '22P02',
  details: null,
  hint: null,
  message: 'invalid input syntax for type uuid: "undefined"'
  }"
- POPUP ERROR ON DELETE: "Failed to delete contact: Request failed with status code 500"
- CONSOLE ERROR ON DELETE: "Failed to load resource: the server responded with a status of 500 (Internal Server Error)
  installHook.js:1 Failed to delete contact: AxiosError
  overrideMethod @ installHook.js:1"

**Notes:**

```
Phone numbers, in all cases, should always display in the format of (555) 555-0123.  Need to apply or create formatting util function.

```

---

## 5. Payment Information

### 5.1 View Payment Info

- [x] Navigate to Payment tab
- [ Displays "N/A" ] Payment terms display (Net 30, Net 45, etc.)
- [x] Payment method displays (ACH, Check, Wire)
- [x] Sensitive info is masked (account numbers show \*\*\*\*1234)
- [x] Credit limit displays
- [x] Current balance displays

### 5.2 Edit Payment Terms

- [x] Click Edit on payment terms section
- [ ] PaymentTermsForm opens
- [ ] Change net days to 45
- [ ] Click "Save"
- [ ] Success: Updated terms display
- POPUP MESSAGE ON EDIT: "Edit payment info functionality will be implemented in Phase 2"

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
- NOTE: No "Add Payment Method" button exists. Console only says "Edit payment info clicked".

### 5.4 Payment Tab Error Handling

- [ ] Verify no 404 errors in console
- [ ] All data loads correctly
- [ ] No "Request failed" errors

**Notes:**

```
Need to finish Payment tab before testing can be done.

```

---

## 6. Document Upload & Management

### 6.1 View Documents

- [x] Navigate to Documents tab
- [ No documents found for any vendor ] Documents display in categories:
  - [ ] Expired (red)
  - [ ] Expiring Soon (yellow)
  - [ ] Current (green)
- [ ] Document types display (W9, Insurance, etc.)
- [ ] Expiration dates display
- [ ] File sizes display

### 6.2 Upload Document - PDF

- [x] Click "Upload Document" button
- [x] DocumentForm modal opens
- [x] Drag a PDF file into drop zone
- [x] File name displays
- [x] Select document type: "W9 Tax Form"
- [x] Add expiration date (future date)
- [x] Add notes: "Test document"
- [x] Click "Upload Document"
- [x] Upload progress shows
- [ ] Success: Modal closes
- [ ] Success: Document appears in "Current" section
- [ ] Success: File uploaded to Supabase Storage
- ERROR MESSAGE ON UPLOAD: "Request failed with status code 400"
- CONSOLE ERROR ON UPLOAD: "Failed to load resource: the server responded with a status of 400 (Bad Request)"

### 6.3 Upload Document - Image

- [x] Click "Upload Document"
- [x] Select a JPG/PNG image file
- [x] Fill required fields
- [x] Click "Upload Document"
- [ ] Success: Image uploads successfully
- ERROR MESSAGE ON UPLOAD: "Request failed with status code 400"
- CONSOLE ERROR ON UPLOAD: "vendorDocumentService.js:36

POST http://localhost:3001/api/vendors/990602e1-a4e8-49ca-99e7-af7244e3b7ae/documents 400 (Bad Request)
Promise.then
createVendorDocument @ vendorDocumentService.js:36
mutationFn @ useVendorDocuments.js:78
await in execute
handleSubmit @ DocumentForm.jsx:122
﻿"

### 6.4 Upload Validation

- [x] Try to upload a .txt file
- [x] Should show error "Invalid file type"
- [x] Try to upload file > 10MB
- [x] Should show error "File too large"
- [x] Upload valid file → Success

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
Need to fix upload functionality to continue testing

```

---

## 7. Overview Tab Quick Actions

### 7.1 Add Contact Button

- [x] Navigate to Overview tab
- [x] Click "Add Contact" button
- [x] ContactForm modal opens
- [x] Add a contact
- [x] Success: Returns to Overview tab
- [x] Navigate to Contacts tab → New contact appears
- NOTE: Tried to create new contact with role of "AR Specialist" and got a 400 error, and terminal error of: "Error creating vendor contact: Error: Invalid role. Must be one of: Sales Rep, Account Manager, Billing Contact, Customer Service, Delivery Coordinator, Other
  at createVendorContact (file:///C:/Users/thueb/OneDrive/Desktop/Website%20Projects/Invantry/invantry-app/backend/src/services/vendorContacts.js:136:11)
  at file:///C:/Users/thueb/OneDrive/Desktop/Website%20Projects/Invantry/invantry-app/backend/src/routes/vendorContacts.js:65:25
  at process.processTicksAndRejections (node:internal/process/task_queues:105:5)". Appears to be a mismatch of roles in dropdown and roles enumrated in table column.

### 7.2 Add Address Button

- [x] On Overview tab
- [x] Click "Add Address" button
- [x] AddressForm modal opens
- [x] Add an address
- [x] Success: Can verify in Addresses tab

### 7.3 Upload Document Button

- [x] On Overview tab
- [x] Click "Upload Document" button
- [x] DocumentForm modal opens
- [x] Upload a document
- [ ] Success: Can verify in Documents tab
- NOTE: Same error on upload as in 6.2

### 7.4 Create PO Button

- [ ] "Create PO" button is disabled or shows Phase 3 message
- [ ] Tooltip explains feature coming soon
- NOTE: Just need to make this navigate to URL 'http://localhost:5173/orders/create-quick-order'

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
Database table "vendor_scorecards" is empty with no data.  No vendor has anything showing up in Performance tab.  No way to test this.

```

---

## 9. Items Tab

### 9.1 View Items

- [x] Navigate to Items tab
- [x] Ingredient-vendor mappings display
- [x] Item names display
- [x] Vendor item codes display
- [x] Prices display
- [x] Package quantities display
- [x] Lead times display
- [x] Preferred items marked

### 9.2 Search Items

- [x] Search by ingredient name
- [x] Results filter correctly
- [x] Search by vendor code
- [x] Results filter correctly

### 9.3 Filter Items

- [x] Filter by "Preferred Only"
- [x] Only preferred items show
- [x] Clear filter → All items show

### 9.4 Inline Editing (if implemented)

- [x] Click Edit icon on item row
- [x] Fields become editable
- [x] Make changes
- [ Message: "Changes will be saved in Phase 2" ] Click Save → Shows success or Phase 3 message
- [ No Cancel option, only save ] Click Cancel → Reverts changes

**Notes:**

```
Need to actually PATCH data and save changes.

Need to add a cancel button that shows up and disappears the same as the save button.

```

---

## 10. Search, Filter, Sort (Vendor List)

### 10.1 Search Functionality

- [x] In VendorList, type vendor name in search
- [x] Results filter in real-time
- [x] Search is case-insensitive
- [x] Search by vendor code works
- [x] Partial matches work ("Sys" finds "Sysco")
- [x] Click X button → Search clears
- [x] Result count updates ("5 vendors found")

### 10.2 Status Filter

- [x] Select "Active" from status dropdown
- [x] Only active vendors show
- [x] Select "Inactive"
- [x] Only inactive vendors show
- [x] Select "All Status"
- [x] All vendors show again

### 10.3 Grade Filter

- [ ] Select "Grade A" from grade dropdown
- [ ] Only A-grade vendors show
- [ ] Select "Grade B"
- [ ] Only B-grade vendors show
- [ ] Select "All Grades"
- [ ] All vendors show
- NOTE: Performance not funtional yet. Will test after that's live.

### 10.4 Combined Filters

- [x] Search for "Sys"
- [x] Filter by Status: Active
- [x] Filter by Grade: A
- [x] Only matching vendors show
- [x] Click "Clear Filters"
- [x] All filters reset

### 10.5 Sort Functionality

- [x] Sort by "Name (A-Z)"
- [x] Vendors alphabetically sorted
- [x] Sort by "Name (Z-A)"
- [x] Vendors reverse sorted
- [x] Sort by "Vendor Code (A-Z)"
- [x] Sorted by code
- [ ] Sort by "Grade (Best First)"
- [ ] A grades appear first, F grades last

### 10.6 Persistence

- [x] Set search term and filters
- [x] Refresh the page
- [x] Search and filters persist (saved in localStorage)

**Notes:**

```


```

---

## 11. Metrics & Dashboard

### 11.1 Vendor Metrics (Right Sidebar)

- [x] Navigate to Vendors section
- [x] Right sidebar shows 4 metrics:
  - [x] Active Vendors count (matches actual count)
  - [x] Avg Lead Time (realistic number)
  - [x] Documents Expiring Soon (matches actual count)
  - [x] Grade A Vendors (matches actual count)

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
Need to fix other funcionalities before this can be tested.

```

---

## 12. Form Validation

### 12.1 Required Fields

- [x] VendorForm: Name is required
- [ Only Vendor Name is required ] VendorForm: Vendor code is required
- [x] AddressForm: Address line 1 is required
- [x] AddressForm: City is required
- [x] AddressForm: State is required
- [x] AddressForm: Postal code is required
- [x] ContactForm: First name is required
- [x] ContactForm: Last name is required
- [ Save was allowed with only first and last name ] ContactForm: Email is required
- [x] DocumentForm: File is required
- [x] DocumentForm: Document type is required

### 12.2 Format Validation

- [x] Email must be valid format (user@domain.com)
- [x] Phone must be valid format
- [x] Postal code must be valid format
- [x] Vendor code must be unique

### 12.3 Field-Specific Errors

- [x] Errors display next to fields (not just at top)
- [x] Error messages are clear and helpful
- [x] Errors clear when field is corrected

**Notes:**

```


```

---

## 13. Error Handling

### 13.1 Network Errors

- [x] Stop backend server
- [x] Try to load vendors
- [x] Shows error message: "Failed to load vendors"
- [x] Shows "Retry" button
- [x] Restart backend → Click Retry → Data loads

### 13.2 404 Not Found

- [x] Navigate to vendor that doesn't exist
- [ "Request failed with status code 404" ] Shows "Vendor not found" message
- [x] Shows "Back to Vendors" button
- [x] Click button → Returns to list

### 13.3 500 Server Error

- [x] If server error occurs
- [ Usually shows 400 or 500 status code ] Shows friendly error message (not technical error)
- [x] Doesn't crash the app
- [x] Can recover by refreshing

### 13.4 Validation Errors

- [x] Submit form with invalid data
- [x] Shows clear validation errors
- [x] Can fix errors and resubmit
- [x] Form doesn't submit with errors

### 13.5 Upload Errors

- [x] Try to upload invalid file type
- [x] Shows error: "File type not allowed"
- [x] Try to upload file too large
- [x] Shows error: "File too large (max 10MB)"

**Notes:**

```


```

---

## 14. Loading States

### 14.1 Data Loading

- [x] When loading vendors → Shows spinner
- [ Shows spinner - fix to skeleton ] When loading vendor detail → Shows skeleton/spinner
- [x] When loading addresses → Shows loading indicator
- [x] When loading contacts → Shows loading indicator
- [x] When loading documents → Shows loading indicator

### 14.2 Mutation Loading

- [ No message ] Click "Save" on form → Button shows "Saving..."
- [ Button still active - need to disable ] Button is disabled during save
- [ Deleting needs to be fixed first ] Click "Delete" → Button shows "Deleting..."
- [ Uploading needs to be fixed first ] Upload document → Shows progress indicator

### 14.3 No Infinite Loading

- [x] Loading states resolve (don't spin forever)
- [x] If error occurs, loading state clears
- [x] Shows error instead of infinite loading

**Notes:**

```


```

---

## 15. Empty States

### 15.1 No Vendors

- [x] If no vendors exist
- [x] Shows helpful empty state message
- [x] Shows "Add Vendor" button
- [x] Message encourages creating first vendor

### 15.2 No Addresses

- [x] Vendor with no addresses
- [x] Shows "No addresses yet" message
- [x] Shows "Add Address" button

### 15.3 No Contacts

- [x] Vendor with no contacts
- [x] Shows "No contacts yet" message
- [x] Shows "Add Contact" button

### 15.4 No Documents

- [x] Vendor with no documents
- [x] Shows "No documents yet" message
- [x] Shows "Upload Document" button

### 15.5 No Search Results

- [x] Search for non-existent vendor
- [x] Shows "No vendors found"
- [x] Shows "Try adjusting your search or filters"

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
- [ ] Phone numbers formatted (555-0123) NOTE: Change to format style "(555) 555-0123"
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

- [x] Can tab through all interactive elements
- [x] Tab order is logical
- [x] Can open modals with Enter key
- [ No ] Can close modals with Esc key
- [x] Focus indicators visible

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

- [x] Vendor list loads in < 2 seconds
- [x] Vendor detail loads in < 1 second
- [ After inital tab load, subsequent switch is instant - first is delayed - should load all info when clicking into vendor details ] Tab switching is instant
- [x] No lag when typing in search

### 18.2 Large Datasets

- [ ] Test with 100+ vendors (if possible)
- [ ] Search still fast
- [ ] Filtering still fast
- [ ] Sorting still fast
- [ ] No noticeable lag

### 18.3 React Query Caching

- [x] Navigate away from vendor detail
- [x] Navigate back to same vendor
- [x] Data loads instantly from cache
- [x] No unnecessary API calls
- [x] Cache invalidates after updates

**Notes:**

```


```

---

## 19. Data Integrity

### 19.1 Create Operations

- [x] Created vendors appear immediately
- [x] Created addresses appear immediately
- [x] Created contacts appear immediately
- [x] Created documents appear immediately
- [x] All data persists after page refresh

### 19.2 Update Operations

- [x] Updates reflect immediately in UI
- [x] Updates persist after page refresh
- [x] Updates visible in all relevant places
- [x] No stale data shown

### 19.3 Delete Operations

- [x] Deleted items removed immediately
- [x] Deletions persist after page refresh
- [x] Related data handled correctly
- [x] No orphaned records

### 19.4 Relationships

- [x] Addresses correctly linked to vendors
- [x] Contacts correctly linked to vendors
- [ ] Documents correctly linked to vendors
- [x] Items correctly linked to vendors
- [x] No foreign key violations

**Notes:**

```


```

---

## 20. Browser Compatibility

### 20.1 Chrome

- [x] All features work
- [x] No console errors
- [x] UI renders correctly

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

- [x] Open vendor in two tabs
- [x] Edit in tab 1
- [x] Edit in tab 2
- [x] Both updates save correctly
- [x] No data loss

### 21.2 Special Characters

- [x] Create vendor with name: "Test & Co., Ltd. (2025)"
- [x] Name displays correctly
- [x] Search works with special characters
- [x] No encoding issues

### 21.3 Long Data

- [x] Create vendor with 100+ character name
- [x] UI doesn't break
- [x] Text truncates or wraps gracefully
- [x] Full text visible on detail page

### 21.4 Rapid Clicking

- [x] Click "Save" button rapidly (5x fast)
- [ Each clicked caused a save ] Only one save operation occurs
- [ No disabling ] Button disables during save
- [x] No duplicate records created

### 21.5 Session Timeout

- [x] Let session expire (or logout)
- [x] Try to perform operation
- [x] Redirects to login
- [ Returns to main dashboard ] Returns to correct page after login

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

**Tester Name:** ****\*\*****\_****\*\*****
**Date:** ****\*\*****\_****\*\*****
**Signature:** ****\*\*****\_****\*\*****

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
