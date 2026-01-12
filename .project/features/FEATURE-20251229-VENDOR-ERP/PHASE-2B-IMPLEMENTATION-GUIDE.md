# Phase 2B - Full CRUD Implementation Guide

**Status:** Forms Complete - Wiring Needed
**Date:** 2026-01-02
**Agent:** Frontend Specialist

---

## Completed Work ✅

### 1. All Form Components Created (6/6)

**Created in:** `frontend/src/components/vendor-erp/forms/`

1. **VendorForm.jsx** ✅
   - Add/Edit vendor modal
   - Fields: name, vendor_code, legal_name, trade_name, status, notes, website
   - Validation: required name, vendor code format
   - Uses: `useCreateVendor()`, `useUpdateVendor()`

2. **AddressForm.jsx** ✅
   - Add/Edit address modal
   - Fields: address_type, address_line1-2, city, state, postal_code, country, phone, email, is_primary
   - Validation: required address fields, zip code, email, phone
   - Uses: `useCreateVendorAddress()`, `useUpdateVendorAddress()`

3. **ContactForm.jsx** ✅
   - Add/Edit contact modal
   - Fields: first_name, last_name, title, role, email, phone, mobile, is_primary, receive_orders, receive_invoices, notes
   - Validation: required names, email, phone
   - Uses: `useCreateVendorContact()`, `useUpdateVendorContact()`

4. **DocumentForm.jsx** ✅
   - Upload document modal
   - File upload with drag-and-drop
   - Fields: file (required), document_type, expiration_date, notes
   - Validation: file type (PDF, images), file size (< 10MB)
   - Uses: `useVendorDocuments().upload`
   - FormData upload pattern

5. **DeleteConfirmationModal.jsx** ✅ (Reusable)
   - Generic delete confirmation
   - Props: isOpen, onClose, onConfirm, title, message, itemName, isDeleting
   - Warning message support
   - Consistent UX across all deletes

---

## Wiring Instructions (To Be Completed)

### Step 1: Update VendorList.jsx

**Add state:**
```javascript
const [showVendorForm, setShowVendorForm] = useState(false);
```

**Import:**
```javascript
import VendorForm from './forms/VendorForm';
```

**Update "Add Vendor" button:**
```javascript
<button onClick={() => setShowVendorForm(true)}>
  Add Vendor
</button>
```

**Add modal at end of component:**
```javascript
{showVendorForm && (
  <VendorForm
    onClose={() => setShowVendorForm(false)}
    onSuccess={() => {
      setShowVendorForm(false);
      // React Query will auto-refetch vendors list
    }}
  />
)}
```

---

### Step 2: Update VendorCard.jsx

**Add state and handlers:**
```javascript
import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useDeleteVendor } from '../../../hooks/useVendors';
import VendorForm from '../forms/VendorForm';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const [showEditForm, setShowEditForm] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);

const { mutate: deleteVendor, isLoading: isDeleting } = useDeleteVendor();

const handleDelete = () => {
  deleteVendor(vendor.id, {
    onSuccess: () => {
      setShowDeleteModal(false);
      // React Query auto-refetches
    },
    onError: (error) => {
      alert(error.message || 'Failed to delete vendor');
    }
  });
};
```

**Add action buttons** (prevent navigation onClick):
```javascript
{/* Action Buttons - add before closing button tag */}
<div className="flex gap-2 mt-3 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
  <button
    onClick={() => setShowEditForm(true)}
    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
  >
    <Edit2 className="w-4 h-4" />
    Edit
  </button>
  <button
    onClick={() => setShowDeleteModal(true)}
    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-red-700 bg-red-50 rounded hover:bg-red-100"
  >
    <Trash2 className="w-4 h-4" />
    Delete
  </button>
</div>

{/* Modals */}
{showEditForm && (
  <VendorForm
    vendor={vendor}
    onClose={() => setShowEditForm(false)}
    onSuccess={() => setShowEditForm(false)}
  />
)}

{showDeleteModal && (
  <DeleteConfirmationModal
    isOpen={showDeleteModal}
    onClose={() => setShowDeleteModal(false)}
    onConfirm={handleDelete}
    title="Delete Vendor"
    message="Are you sure you want to delete"
    itemName={vendor.name}
    isDeleting={isDeleting}
    warningMessage="All associated data (addresses, contacts, documents) will also be deleted."
  />
)}
```

---

### Step 3: Update AddressesTab.jsx

**Add state:**
```javascript
import { useState } from 'react';
import AddressForm from '../forms/AddressForm';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { useDeleteVendorAddress } from '../../../hooks/useVendorAddresses';

const [showAddForm, setShowAddForm] = useState(false);
const [editingAddress, setEditingAddress] = useState(null);
const [deletingAddress, setDeletingAddress] = useState(null);

const { mutate: deleteAddress, isLoading: isDeleting } = useDeleteVendorAddress();
```

**Update "Add Address" button:**
```javascript
<button onClick={() => setShowAddForm(true)}>
  <Plus className="w-4 h-4" />
  Add Address
</button>
```

**Add modals at end:**
```javascript
{showAddForm && (
  <AddressForm
    vendorId={vendorId}
    onClose={() => setShowAddForm(false)}
    onSuccess={() => setShowAddForm(false)}
  />
)}

{editingAddress && (
  <AddressForm
    vendorId={vendorId}
    address={editingAddress}
    onClose={() => setEditingAddress(null)}
    onSuccess={() => setEditingAddress(null)}
  />
)}

{deletingAddress && (
  <DeleteConfirmationModal
    isOpen={!!deletingAddress}
    onClose={() => setDeletingAddress(null)}
    onConfirm={() => {
      deleteAddress({ vendorId, addressId: deletingAddress.id }, {
        onSuccess: () => setDeletingAddress(null)
      });
    }}
    title="Delete Address"
    message="Are you sure you want to delete this"
    itemName={`${deletingAddress.address_type} address`}
    isDeleting={isDeleting}
  />
)}
```

**Update AddressCard** to accept onEdit and onDelete props:
```javascript
// In AddressCard component
<button onClick={() => onEdit?.(address)}>
  <Edit2 className="w-4 h-4" />
</button>
<button onClick={() => onDelete?.(address)}>
  <Trash2 className="w-4 h-4" />
</button>

// In AddressesTab where AddressCard is used
<AddressCard
  key={address.id}
  address={address}
  onEdit={(addr) => setEditingAddress(addr)}
  onDelete={(addr) => setDeletingAddress(addr)}
/>
```

---

### Step 4: Update ContactsTab.jsx

Same pattern as AddressesTab:

```javascript
const [showAddForm, setShowAddForm] = useState(false);
const [editingContact, setEditingContact] = useState(null);
const [deletingContact, setDeletingContact] = useState(null);

const { mutate: deleteContact, isLoading: isDeleting } = useDeleteVendorContact();

// Same modal structure as AddressesTab but with ContactForm
```

---

### Step 5: Update DocumentsTab.jsx

```javascript
const [showUploadForm, setShowUploadForm] = useState(false);
const [deletingDoc, setDeletingDoc] = useState(null);

const { mutate: deleteDocument, isLoading: isDeleting } = useVendorDocuments(vendorId).delete;

// Upload button
<button onClick={() => setShowUploadForm(true)}>
  <Plus className="w-4 h-4" />
  Upload Document
</button>

// Modals
{showUploadForm && (
  <DocumentForm
    vendorId={vendorId}
    onClose={() => setShowUploadForm(false)}
    onSuccess={() => setShowUploadForm(false)}
  />
)}

{deletingDoc && (
  <DeleteConfirmationModal
    isOpen={!!deletingDoc}
    onClose={() => setDeletingDoc(null)}
    onConfirm={() => {
      deleteDocument({ vendorId, documentId: deletingDoc.id }, {
        onSuccess: () => setDeletingDoc(null)
      });
    }}
    title="Delete Document"
    message="Are you sure you want to delete"
    itemName={deletingDoc.document_name}
    isDeleting={isDeleting}
  />
)}

// Update DocumentCard to accept onDelete prop
<DocumentCard
  document={doc}
  onDelete={(doc) => setDeletingDoc(doc)}
  onDownload={(doc) => window.open(doc.file_url, '_blank')}
/>
```

---

## Testing Checklist

Once wiring is complete, test:

### Vendor CRUD
- [ ] Click "Add Vendor" → Form opens
- [ ] Fill valid data → Saves successfully, list updates
- [ ] Fill invalid data → Shows validation errors
- [ ] Click "Edit" on vendor → Form opens with data
- [ ] Update vendor → Saves, card updates
- [ ] Click "Delete" → Confirmation appears
- [ ] Confirm delete → Vendor removed from list
- [ ] Cancel delete → Nothing happens

### Address CRUD
- [ ] Add address → Success
- [ ] Edit address → Updates
- [ ] Delete address → Confirmation and delete
- [ ] Toggle primary → Only one primary per type

### Contact CRUD
- [ ] Add contact → Success
- [ ] Edit contact → Updates
- [ ] Delete contact → Confirmation and delete
- [ ] Invalid email → Validation error
- [ ] Invalid phone → Validation error

### Document Operations
- [ ] Upload PDF → Success
- [ ] Upload image → Success
- [ ] Upload invalid type → Error
- [ ] Upload > 10MB → Error
- [ ] Download document → Opens file
- [ ] Delete document → Confirmation and delete

### Error Scenarios
- [ ] Network offline → Shows error
- [ ] Invalid data → Validation errors
- [ ] Server error → Friendly error message
- [ ] Retry works after error

---

## Files Created

1. `/frontend/src/components/vendor-erp/forms/VendorForm.jsx`
2. `/frontend/src/components/vendor-erp/forms/AddressForm.jsx`
3. `/frontend/src/components/vendor-erp/forms/ContactForm.jsx`
4. `/frontend/src/components/vendor-erp/forms/DocumentForm.jsx`
5. `/frontend/src/components/vendor-erp/components/DeleteConfirmationModal.jsx`

---

## Files That Need Wiring

1. `/frontend/src/components/vendor-erp/VendorList.jsx` - Add Create
2. `/frontend/src/components/vendor-erp/components/VendorCard.jsx` - Add Edit/Delete
3. `/frontend/src/components/vendor-erp/tabs/AddressesTab.jsx` - Add CRUD
4. `/frontend/src/components/vendor-erp/components/AddressCard.jsx` - Add Edit/Delete buttons
5. `/frontend/src/components/vendor-erp/tabs/ContactsTab.jsx` - Add CRUD
6. `/frontend/src/components/vendor-erp/components/ContactCard.jsx` - Add Edit/Delete buttons
7. `/frontend/src/components/vendor-erp/tabs/DocumentsTab.jsx` - Add Upload/Delete
8. `/frontend/src/components/vendor-erp/components/DocumentCard.jsx` - Add Delete/Download buttons

---

## Next Steps

1. Wire up all CRUD operations following the patterns above
2. Test each operation thoroughly
3. Add search/filter/sort to VendorList (already partially implemented)
4. Investigate ItemsTab requirements
5. Update metrics to real data
6. Delete mockData.js
7. Create final completion report

---

## Status Summary

**Forms:** 100% Complete (6/6 + DeleteModal)
**Wiring:** 0% Complete (needs implementation)
**Testing:** Pending
**Phase 2B Progress:** ~40% (forms done, wiring and testing remain)

---

## Estimated Time Remaining

- Wiring CRUD operations: 3-4 hours
- Testing all operations: 2-3 hours
- Search/filter polish: 1 hour
- ItemsTab investigation: 1-2 hours
- Final testing and cleanup: 1-2 hours

**Total:** 8-12 hours remaining

---

**Next Action:** Begin wiring CRUD operations in VendorList, VendorCard, and all tab components following the patterns documented above.
