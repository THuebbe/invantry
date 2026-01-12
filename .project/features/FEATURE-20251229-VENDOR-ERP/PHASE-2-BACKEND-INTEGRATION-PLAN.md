# Vendor ERP UI - Phase 2: Backend Integration Plan

## Executive Summary

**Status:** Phase 1 (Layout) COMPLETE ✅
**Goal:** Connect UI to backend (42 API endpoints, all services/hooks ready)
**Scope:** Replace mock data, add CRUD, validation, uploads, search/filter
**Timeline:** 4-5 weeks (~50 hours)

---

## Phase 1 Completion Summary

✅ **Completed:**
- 23 UI components built and styled
- 7 tabs fully functional (Overview, Addresses, Contacts, Payment, Documents, Performance, Items)
- Navigation integration (sidebar menu)
- Metrics integration (right sidebar)
- Inline editing UI in Items tab
- Scroll-to-top on tab change
- Condensed spacing throughout
- All mock data, zero API calls

---

## Available Infrastructure (Already Complete)

### Backend API Endpoints (42 total)
- **Vendors**: GET, POST, PUT, DELETE /api/vendors
- **Addresses**: GET, POST, PUT, DELETE /api/vendor-addresses
- **Contacts**: GET, POST, PUT, DELETE /api/vendor-contacts
- **Payment Terms**: GET, POST, PUT, DELETE /api/payment-terms
- **Documents**: GET, POST, PUT, DELETE /api/vendor-documents (with file upload)
- **Scorecards**: GET, POST, PUT /api/vendor-scorecards
- **Payment Methods**: GET, POST, PUT, DELETE /api/vendor-payment

### Service Layer (Complete)
- `backend/src/services/vendors.js`
- `backend/src/services/vendorAddresses.js`
- `backend/src/services/vendorContacts.js`
- `backend/src/services/paymentTerms.js`
- `backend/src/services/vendorDocuments.js`
- `backend/src/services/vendorScorecards.js`
- `backend/src/services/vendorPayment.js`

### Frontend Hooks (Complete)
- `useVendors()` - List, create, update, delete
- `useVendorDetail(id)` - Single vendor
- `useVendorAddresses(vendorId)` - CRUD addresses
- `useVendorContacts(vendorId)` - CRUD contacts
- `usePaymentTerms(vendorId)` - CRUD payment terms
- `useVendorDocuments(vendorId)` - CRUD documents + upload
- `useVendorScorecards(vendorId)` - Get/update scorecards
- `useVendorPayment(vendorId)` - CRUD payment methods

### Validators (Complete)
- `frontend/src/utils/vendorValidators.js` - All validation rules

### Formatters (Complete)
- `frontend/src/utils/vendorFormatters.js` - Data formatting utilities

---

## Phase 2 Implementation Checklist

### 1. Replace Mock Data with Real API Calls (12 hours)

#### VendorList.jsx
- [ ] Replace `getMockVendors()` with `useVendors()` hook
- [ ] Add loading state (skeleton cards)
- [ ] Add error state (error message)
- [ ] Add empty state (no vendors yet)
- [ ] Display real vendor count

#### VendorDetail.jsx
- [ ] Replace `getMockVendorDetail()` with `useVendorDetail(vendorId)` hook
- [ ] Add loading state (skeleton layout)
- [ ] Add error state (vendor not found)
- [ ] Handle vendor deletion (redirect to list)

#### Tab Components
- [ ] **AddressesTab**: Replace `getMockAddresses()` with `useVendorAddresses(vendorId)`
- [ ] **ContactsTab**: Replace `getMockContacts()` with `useVendorContacts(vendorId)`
- [ ] **PaymentTab**: Replace `getMockPaymentTerms()` with `usePaymentTerms(vendorId)` and `useVendorPayment(vendorId)`
- [ ] **DocumentsTab**: Replace `getMockDocuments()` with `useVendorDocuments(vendorId)`
- [ ] **PerformanceTab**: Replace `getMockScorecards()` with `useVendorScorecards(vendorId)`
- [ ] **ItemsTab**: Replace `getMockVendorItems()` with `useVendorItems(vendorId)` (from ingredient-vendor mapping)

---

### 2. Connect Forms to Mutations (10 hours)

#### VendorForm.jsx (Add/Edit Modal)
- [ ] Build modal component with form fields
- [ ] Use `useVendors()` create/update mutations
- [ ] Add form validation using `validateVendor()`
- [ ] Add loading state during submission
- [ ] Show success/error messages
- [ ] Reset form on success
- [ ] Close modal on success

#### AddressForm Component
- [ ] Build add/edit form for addresses
- [ ] Use `useVendorAddresses()` mutations
- [ ] Add validation using `validateAddress()`
- [ ] Handle is_primary toggle logic
- [ ] Success/error handling

#### ContactForm Component
- [ ] Build add/edit form for contacts
- [ ] Use `useVendorContacts()` mutations
- [ ] Add validation using `validateContact()`
- [ ] Success/error handling

#### PaymentForm Component
- [ ] Build payment terms form
- [ ] Build payment method form
- [ ] Use appropriate mutations
- [ ] Add validation
- [ ] Success/error handling

#### DocumentForm Component
- [ ] Build document upload form
- [ ] Use `useVendorDocuments()` mutations
- [ ] Implement file upload logic
- [ ] Add file type validation
- [ ] Show upload progress
- [ ] Success/error handling

---

### 3. Add Delete Functionality (6 hours)

#### Delete Confirmations
- [ ] Create reusable DeleteConfirmationModal component
- [ ] Vendor deletion (with cascade warning)
- [ ] Address deletion
- [ ] Contact deletion
- [ ] Payment term deletion
- [ ] Payment method deletion
- [ ] Document deletion
- [ ] Show confirmation message
- [ ] Handle errors

---

### 4. Items Tab Inline Editing (4 hours)

#### Connect to Backend
- [ ] Wire save button to `useVendorItems()` update mutation
- [ ] Add validation before save
- [ ] Show loading state during save
- [ ] Show success message on save
- [ ] Show error message on failure
- [ ] Revert to view mode on success
- [ ] Update local cache (React Query)

---

### 5. Search, Filter, Sort in VendorList (6 hours)

#### Search Bar
- [ ] Add search input (filter by name, code, legal_name)
- [ ] Debounce search input
- [ ] Highlight matching text

#### Filters
- [ ] Filter by status (Active/Inactive)
- [ ] Filter by vendor type (if applicable)
- [ ] Filter by performance grade (A, B, C, D, F)
- [ ] Clear all filters button

#### Sort
- [ ] Sort by name (A-Z, Z-A)
- [ ] Sort by vendor_code
- [ ] Sort by performance grade
- [ ] Sort by total items
- [ ] Sort by last order date

---

### 6. Document Upload Implementation (4 hours)

#### File Upload Flow
- [ ] Add file input with drag-and-drop
- [ ] Validate file type (PDF, images)
- [ ] Validate file size (max 10MB)
- [ ] Show file preview before upload
- [ ] Upload to backend with FormData
- [ ] Show progress bar
- [ ] Handle upload errors
- [ ] Display uploaded file (download link)

---

### 7. Update Metrics to Real Data (3 hours)

#### MetricsColumn Integration
- [ ] Remove mock data from `useMetrics.js` for vendors section
- [ ] Create `/api/metrics/vendors` endpoint in backend
- [ ] Calculate metrics from database:
  - Active vendors count
  - Average lead time
  - Documents expiring soon (< 30 days)
  - Grade A vendors count
- [ ] Update `useMetrics()` to fetch real data
- [ ] Add loading state for metrics
- [ ] Add error fallback

---

### 8. Error Handling & Loading States (5 hours)

#### Loading States
- [ ] Skeleton loaders for list view
- [ ] Skeleton loaders for detail view
- [ ] Spinner for mutations
- [ ] Disabled buttons during loading
- [ ] Progress indicators for uploads

#### Error States
- [ ] Network error handling
- [ ] 404 Not Found (vendor doesn't exist)
- [ ] 500 Server Error
- [ ] Validation errors (show field-specific messages)
- [ ] Permission errors (403 Forbidden)
- [ ] Display user-friendly error messages
- [ ] Retry buttons where applicable

---

## Implementation Sequence

### Week 1: Data Connectivity (12 hours)
1. Replace all mock data with real hooks
2. Add loading/error states to all components
3. Test data fetching for all tabs

**Deliverable:** All tabs display real backend data

---

### Week 2: CRUD Operations Part 1 (12 hours)
1. Build VendorForm modal (add/edit vendor)
2. Build AddressForm component
3. Build ContactForm component
4. Wire up all mutations

**Deliverable:** Can create/edit vendors, addresses, contacts

---

### Week 3: CRUD Operations Part 2 (10 hours)
1. Build PaymentForm components
2. Build DocumentForm with upload
3. Add delete confirmations for all entities
4. Wire Items tab inline editing to backend

**Deliverable:** Full CRUD for all entities

---

### Week 4: Search/Filter & Polish (10 hours)
1. Add search bar to VendorList
2. Add filters (status, grade)
3. Add sorting options
4. Update metrics to real data
5. Comprehensive error handling

**Deliverable:** Production-ready with search/filter

---

### Week 5: Testing & QA (6 hours)
1. End-to-end testing of all CRUD operations
2. Error scenario testing
3. Performance testing (large datasets)
4. Accessibility audit
5. Browser compatibility testing
6. Bug fixes

**Deliverable:** Fully tested, production-ready

---

## Component Updates Summary

### Files to Modify

1. **VendorsContent.jsx** - Add search/filter state management
2. **VendorList.jsx** - Replace mock data, add search/filter UI
3. **VendorDetail.jsx** - Replace mock data with useVendorDetail
4. **VendorForm.jsx** - Build add/edit modal with validation
5. **tabs/OverviewTab.jsx** - Connect to real vendor data
6. **tabs/AddressesTab.jsx** - Replace mock, add AddressForm, delete
7. **tabs/ContactsTab.jsx** - Replace mock, add ContactForm, delete
8. **tabs/PaymentTab.jsx** - Replace mock, add PaymentForm, delete
9. **tabs/DocumentsTab.jsx** - Replace mock, add DocumentForm with upload, delete
10. **tabs/PerformanceTab.jsx** - Replace mock scorecards
11. **tabs/ItemsTab.jsx** - Wire inline editing to backend
12. **hooks/useMetrics.js** - Remove mock data for vendors
13. **mockData.js** - DELETE (no longer needed)

### Files to Create

1. **components/vendor-erp/forms/VendorForm.jsx** - Add/edit vendor modal
2. **components/vendor-erp/forms/AddressForm.jsx** - Add/edit address
3. **components/vendor-erp/forms/ContactForm.jsx** - Add/edit contact
4. **components/vendor-erp/forms/PaymentTermsForm.jsx** - Payment terms form
5. **components/vendor-erp/forms/PaymentMethodForm.jsx** - Payment method form
6. **components/vendor-erp/forms/DocumentForm.jsx** - Document upload form
7. **components/vendor-erp/components/DeleteConfirmationModal.jsx** - Reusable delete modal
8. **components/vendor-erp/components/SearchBar.jsx** - Search input component
9. **components/vendor-erp/components/FilterPanel.jsx** - Filter UI
10. **backend/src/routes/metrics.js** - Add vendors metrics endpoint (if not exists)

---

## Success Criteria

- [ ] All mock data replaced with real API calls
- [ ] All CRUD operations working (Create, Read, Update, Delete)
- [ ] Validation working on all forms
- [ ] Error messages display correctly
- [ ] Loading states display correctly
- [ ] Document upload/download working
- [ ] Search filters vendors correctly
- [ ] Sort changes vendor order
- [ ] Metrics display real data
- [ ] Items tab save/edit working with backend
- [ ] No console errors
- [ ] All existing Phase 1 functionality preserved
- [ ] Performance acceptable (< 2s load times)

---

## Testing Checklist

### Vendor CRUD
- [ ] Create new vendor (valid data)
- [ ] Create new vendor (invalid data shows errors)
- [ ] Edit existing vendor
- [ ] Delete vendor (with confirmation)
- [ ] View vendor detail

### Addresses CRUD
- [ ] Add billing address
- [ ] Add shipping address
- [ ] Edit address
- [ ] Delete address
- [ ] Toggle primary address

### Contacts CRUD
- [ ] Add contact
- [ ] Edit contact
- [ ] Delete contact
- [ ] Validate email format
- [ ] Validate phone format

### Payment CRUD
- [ ] Add payment terms
- [ ] Edit payment terms
- [ ] Add payment method
- [ ] Edit payment method
- [ ] Delete payment records

### Documents
- [ ] Upload PDF document
- [ ] Upload image document
- [ ] Download document
- [ ] Delete document
- [ ] Reject invalid file types
- [ ] Reject files > 10MB

### Items Tab
- [ ] Edit item inline
- [ ] Save changes
- [ ] Cancel changes
- [ ] Validation on save

### Search/Filter
- [ ] Search by vendor name
- [ ] Filter by active status
- [ ] Filter by grade
- [ ] Sort by name
- [ ] Clear filters

### Error Scenarios
- [ ] Network offline
- [ ] 404 vendor not found
- [ ] 500 server error
- [ ] Validation errors
- [ ] Upload failures

---

## Technical Notes

### React Query Cache Invalidation
After mutations, invalidate relevant queries:
```javascript
// After vendor update
queryClient.invalidateQueries(['vendors']);
queryClient.invalidateQueries(['vendor', vendorId]);

// After address create
queryClient.invalidateQueries(['vendorAddresses', vendorId]);

// After document upload
queryClient.invalidateQueries(['vendorDocuments', vendorId]);
```

### File Upload Pattern
```javascript
const formData = new FormData();
formData.append('document', file);
formData.append('document_type', documentType);
formData.append('expiration_date', expirationDate);

const { mutate: uploadDocument } = useVendorDocuments(vendorId);
uploadDocument({ formData });
```

### Validation Pattern
```javascript
import { validateVendor } from '../utils/vendorValidators';

const handleSubmit = (data) => {
  const { isValid, errors } = validateVendor(data);
  if (!isValid) {
    setFormErrors(errors);
    return;
  }
  createVendor(data);
};
```

### Error Display Pattern
```javascript
if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-sm text-red-800">
        {error.message || 'An error occurred. Please try again.'}
      </p>
      <button onClick={refetch} className="text-sm text-red-600 underline mt-2">
        Retry
      </button>
    </div>
  );
}
```

---

## Phase 2 Completion Definition

Phase 2 is complete when:
1. ✅ All components use real backend data (zero mock data)
2. ✅ All CRUD operations functional and tested
3. ✅ All forms validated
4. ✅ Document upload working
5. ✅ Search/filter/sort working
6. ✅ Error handling comprehensive
7. ✅ Loading states polished
8. ✅ No console errors or warnings
9. ✅ User can perform all vendor management tasks without leaving UI
10. ✅ Ready for production deployment

---

## Next Steps After Phase 2

**Phase 3 (Future):**
- Advanced reporting and analytics
- Bulk operations (import/export vendors)
- Vendor portal (external vendor access)
- Email notifications for expiring documents
- Advanced scorecard customization
- Integration with purchase order system

---

## Risk Mitigation

**Potential Issues:**
1. **File upload size limits** - Backend configured for 10MB max
2. **CORS issues** - Already configured in backend
3. **Authentication errors** - JWT tokens already working
4. **Cache invalidation** - Use React Query's invalidateQueries
5. **Race conditions** - Use optimistic updates where appropriate

**Mitigation:**
- Comprehensive error handling
- Loading states prevent double-clicks
- Form validation before submission
- Backend validation as backup
- Proper React Query configuration

---

## Agent Delegation

**Frontend Specialist** will handle all implementation work:
- Replace mock data with hooks
- Build all forms and modals
- Connect mutations
- Add validation
- Implement search/filter
- Add error handling
- Test all operations

**QA Specialist** will verify:
- All CRUD operations working
- Validation functioning correctly
- Error handling comprehensive
- Loading states appropriate
- No regressions from Phase 1
