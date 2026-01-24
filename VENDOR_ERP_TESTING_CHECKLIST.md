# Vendor ERP Module - Testing Checklist (Round 2)

**Version:** 2.0
**Date:** January 19, 2026
**Previous Round:** See `VENDOR_ERP_TESTING_ROUND1_ARCHIVE.md` for Round 1 notes

---

## Round 1 Summary

**Passed:** Navigation, Search/Filter/Sort, Empty States, Error Handling (basic), Data Integrity
**Fixed Since Round 1:** Document Upload, Address/Contact Delete, Phone Formatting, ESC Key Modals, Tab Loading, Rapid Click Protection, Skeleton Loader, Create PO Button

---

## Known Issues to Fix

These issues were identified in Round 1 and need fixes before testing:

| #   | Issue                                                | Priority | Status |
| --- | ---------------------------------------------------- | -------- | ------ |
| 1   | Vendor Edit 500 Error - 'website' column not found   | P1       | To Fix |
| 2   | Soft delete erases all data (should only deactivate) | P2       | To Fix |
| 3   | Payment Tab Edit shows "Phase 2" placeholder         | P2       | To Fix |
| 4   | Items Tab Save shows "Phase 2" message               | P2       | To Fix |
| 5   | Items Tab missing Cancel button                      | P3       | To Fix |
| 6   | Vendor Code should be required                       | P3       | To Fix |

---

## 1. Vendor CRUD (Re-test After Fixes)

### 1.1 Edit Vendor

- [x] Click Edit icon on vendor card → VendorForm opens with data
- [x] Change vendor name
- [x] Click "Save"
- [Success, but no modal or toast - prefer success toast] Success: Modal closes (no 500 error)
- [x] Success: Updated name shows in card
- [x] Success: Changes persist after refresh

### 1.2 Create Vendor - Validation

- [x] Leave Vendor Code blank → Shows error "Vendor code is required"
- [No error on duplicate vendor code - allowed creation but no vendor code value saved] Enter duplicate vendor code → Shows appropriate error
- [ ] Fix errors → Can save successfully

### 1.3 Delete Vendor (Soft Delete)

- [x] Delete a vendor
- [x] Vendor status changes to "Inactive" (not hard deleted)
- [x] Vendor data preserved (name, addresses, contacts still visible)
- [x] Vendor appears in list with inactive badge
- [After reactivation, vendor still showed inactive in main list card, but shows active inside details] Can reactivate by editing vendor

---

## 2. Document Upload (Verify Fix)

### 2.1 Upload PDF

- [x] Click "Upload Document"
- [x] Drag PDF into drop zone
- [x] Select type: "Insurance Certificate"
- [x] Add expiration date
- [x] Click "Upload"
- [x] Success: No errors (was 400, then 500)
- [x] Success: Document appears in list
- [x] Success: File in Supabase Storage

### 2.2 Upload Image

- [x] Upload JPG/PNG image
- [x] Success: Image uploads without error

### 2.3 View/Download Document

- [x] Click Eye icon → Document opens in new tab
- [Nothing happens on download] Click Download icon → File downloads
- [ ] Downloaded file opens correctly

### 2.4 Delete Document

- [x] Click Delete icon → Confirmation modal
- [x] Click Delete → Document removed
- [x] File removed from Supabase Storage

---

## 3. Payment Tab (Implement & Test)

### 3.1 View Payment Info

- [x] Navigate to Payment tab
- [Showed N/A, tried to edit, nothing in Terms list] Payment terms display (Net 30, etc.) - not "N/A"
- [List in details populated, but not showing] Payment method displays
- [x] Credit limit displays
- [ ] Current balance displays

### 3.2 Edit Payment Info

- [x] Click Edit button
- [x] PaymentInfoForm modal opens (not "Phase 2" alert)
- [*] Change payment terms
- [ ] Click Save
- [ ] Success: Updated terms display
- [ ] Success: Changes persist

* Nothing in list for Payment Terms

---

## 4. Items Tab (Implement & Test)

### 4.1 Inline Edit - Save

- [x] Click Edit icon on item row
- [x] Fields become editable
- [x] Change price or lead time
- [x] Click Save
- [x] Success: Data actually saves (not "Phase 2" message)
- [x] Success: Changes persist after refresh

### 4.2 Inline Edit - Cancel

- [x] Click Edit on item row
- [x] Make changes
- [x] Click Cancel button (should exist)
- [x] Changes revert to original values
- [x] Row returns to view mode

---

## 5. Address CRUD (Verify Fixes)

### 5.1 Add Multiple Same-Type Addresses

- [x] Add a Billing address
- [x] Add another Billing address
- [*] Success: Both addresses saved (no duplicate type error)

* "Error creating vendor address: {
  code: '23505',
  details: 'Key (vendor_id, address_type)=(781c235c-bbb5-44b5-9f54-e4a842802148, ship_from) already exists.',
  hint: null,
  message: 'duplicate key value violates unique constraint "idx_vendor_addresses_vendor_type_unique"'
  }
  Error creating vendor address: {
  code: '23505',
  details: 'Key (vendor_id, address_type)=(781c235c-bbb5-44b5-9f54-e4a842802148, ship_from) already exists.',
  hint: null,
  message: 'duplicate key value violates unique constraint "idx_vendor_addresses_vendor_type_unique"'
  }"

### 5.2 Delete Address

- [x] Click Delete on non-primary address
- [x] Confirmation modal appears
- [x] Click Delete
- [x] Success: Address removed (no UUID error)

### 5.3 Primary Address Toggle

- [* Can't make second Billing address] Have 2 billing addresses
- [ ] Mark second as primary
- [ ] First automatically unmarked
- [ ] Only one primary per type

* "Error creating vendor address: {
  code: '23505',
  details: 'Key (vendor_id, address_type)=(dedc77bd-3cf7-4f23-9c27-6aa65076d315, billing) already exists.',
  hint: null,
  message: 'duplicate key value violates unique constraint "idx_vendor_addresses_vendor_type_unique"'
  }
  Error creating vendor address: {
  code: '23505',
  details: 'Key (vendor_id, address_type)=(dedc77bd-3cf7-4f23-9c27-6aa65076d315, billing) already exists.',
  hint: null,
  message: 'duplicate key value violates unique constraint "idx_vendor_addresses_vendor_type_unique"'
  }"

---

## 6. Contact CRUD (Verify Fixes)

### 6.1 Add Contact with All Roles

Test each role in dropdown:

- [x] Sales Rep
- [x] Account Manager
- [x] Billing Contact
- [*] AR Specialist
- [**] AP Specialist
- [x] Customer Service
- [x] Delivery Coordinator
- [***] Territory Manager
- [x] Other

* "Error creating vendor contact: {
  code: '23514',
  details: 'Failing row contains (699b23e7-8756-4179-8a71-a33a5583ef75, dedc77bd-3cf7-4f23-9c27-6aa65076d315, 1e9c773e-913f-4a9b-b812-5ee2b5a4b15a, AR, Spec, AR Specialist, AR Specialist, ar@fake.net, 5557419510, 5557537410, f, f, t, null, 2026-01-20 02:21:24.203698+00, 2026-01-20 02:21:24.203698+00).',
  hint: null,
  message: 'new row for relation "vendor_contacts" violates check constraint "vendor_contacts_role_check"'
  }
  Error creating vendor contact: {
  code: '23514',
  details: 'Failing row contains (699b23e7-8756-4179-8a71-a33a5583ef75, dedc77bd-3cf7-4f23-9c27-6aa65076d315, 1e9c773e-913f-4a9b-b812-5ee2b5a4b15a, AR, Spec, AR Specialist, AR Specialist, ar@fake.net, 5557419510, 5557537410, f, f, t, null, 2026-01-20 02:21:24.203698+00, 2026-01-20 02:21:24.203698+00).',
  hint: null,
  message: 'new row for relation "vendor_contacts" violates check constraint "vendor_contacts_role_check"'
  }"
  ** "Error creating vendor contact: {
  code: '23514',
  details: 'Failing row contains (2c05b97d-ea6c-49f3-b4cc-5cfda6b647df, dedc77bd-3cf7-4f23-9c27-6aa65076d315, 1e9c773e-913f-4a9b-b812-5ee2b5a4b15a, AP, Spec, AP Specialist, AP Specialist, ap@fake.net, 5557419510, 5557537410, f, f, f, null, 2026-01-20 02:22:41.004752+00, 2026-01-20 02:22:41.004752+00).',
  hint: null,
  message: 'new row for relation "vendor_contacts" violates check constraint "vendor_contacts_role_check"'
  }
  Error creating vendor contact: {
  code: '23514',
  details: 'Failing row contains (2c05b97d-ea6c-49f3-b4cc-5cfda6b647df, dedc77bd-3cf7-4f23-9c27-6aa65076d315, 1e9c773e-913f-4a9b-b812-5ee2b5a4b15a, AP, Spec, AP Specialist, AP Specialist, ap@fake.net, 5557419510, 5557537410, f, f, f, null, 2026-01-20 02:22:41.004752+00, 2026-01-20 02:22:41.004752+00).',
  hint: null,
  message: 'new row for relation "vendor_contacts" violates check constraint "vendor_contacts_role_check"'
  }" \*** "Error creating vendor contact: {
  code: '23514',
  details: 'Failing row contains (5a64be32-d61c-421f-b12e-155e65f1984e, dedc77bd-3cf7-4f23-9c27-6aa65076d315, 1e9c773e-913f-4a9b-b812-5ee2b5a4b15a, Terry, Mann, Territory Mgr, Territory Manager, terr.mgr@fake.net, 5555555555, 5555555550, f, t, t, null, 2026-01-20 02:25:56.117692+00, 2026-01-20 02:25:56.117692+00).',
  hint: null,
  message: 'new row for relation "vendor_contacts" violates check constraint "vendor_contacts_role_check"'
  }
  Error creating vendor contact: {
  code: '23514',
  details: 'Failing row contains (5a64be32-d61c-421f-b12e-155e65f1984e, dedc77bd-3cf7-4f23-9c27-6aa65076d315, 1e9c773e-913f-4a9b-b812-5ee2b5a4b15a, Terry, Mann, Territory Mgr, Territory Manager, terr.mgr@fake.net, 5555555555, 5555555550, f, t, t, null, 2026-01-20 02:25:56.117692+00, 2026-01-20 02:25:56.117692+00).',
  hint: null,
  message: 'new row for relation "vendor_contacts" violates check constraint "vendor_contacts_role_check"'
  }"

### 6.2 Delete Contact

- [x] Click Delete on non-primary contact
- [x] Confirmation modal appears
- [x] Click Delete
- [x] Success: Contact removed (no UUID error)

### 6.3 Phone Number Formatting

- [x] Add contact with phone: 5550123456
- [x] Displays as: (555) 012-3456

---

## 7. UI/UX Quality

### 7.1 Loading States

- [x] Save button shows "Saving..." during save
- [x] Save button disabled during mutation
- [shows nothing] Delete button shows "Deleting..."
- [Not true progress - always goes straight to about 2/3 complete, doesn't move until finished] Upload shows progress indicator

### 7.2 Skeleton Loader

- [x] When loading vendor detail → Shows skeleton (not spinner)

### 7.3 Modal ESC Key

- [x] Open any modal
- [x] Press ESC key
- [x] Modal closes

### 7.4 Rapid Click Protection

- [x] Click Save button rapidly (5x)
- [x] Only one save operation occurs
- [x] No duplicate records

---

## 8. Performance Tab (If Data Exists)

### 8.1 With Scorecard Data

- [ ] Quality score displays
- [ ] Delivery score displays
- [ ] Overall grade displays
- [ ] Grade color-coded

* "No performance data"

### 8.2 Without Scorecard Data

- [x] Shows "No performance data" message
- [x] No errors

---

## 9. Create PO Button

- [x] Click "Create Purchase Order" on Overview tab
- [x] Navigates to /orders/create-quick-order
- [*] Vendor info passed to page

* Just noticed in Order Entry menu, nowhere does it say which vendor the order is for.

---

## 10. Responsive Design (Quick Check)

- [x] Desktop (1920px) - All features work
- [ ] Tablet (768px) - Layout adapts
- [ ] Mobile (375px) - All features accessible

---

## Summary

**Tests Passed:** **_ / _**
**Tests Failed:** **_
**Pass Rate:** _**%

### Issues Found This Round

```
1.
2.
3.
```

### Sign-Off

**Tester:** ******\_\_\_******
**Date:** ******\_\_\_******
**Status:** [ ] PASS [ ] CONDITIONAL [ ] FAIL

---

**End of Round 2 Checklist**
