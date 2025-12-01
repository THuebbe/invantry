# Order Components Migration - Testing Guide

## Overview
This document outlines the testing procedures for the newly migrated order entry and purchase order components.

## Components Migrated

### 1. Core Order Components (in `/frontend/src/components/orders/`)
- ✅ `OrderLineItem.jsx` - Line item row with smart search
- ✅ `ItemDetailsPanel.jsx` - Right-side detail panel
- ✅ `AddressInputModal.jsx` - Address entry modal
- ✅ `CreateItemModal.jsx` - New ingredient creation modal

### 2. Service Layer (in `/frontend/src/services/`)
- ✅ `ordersService.js` - Complete API service layer for orders, POs, vendors, and ingredients

### 3. Custom Hooks (in `/frontend/src/hooks/`)
- ✅ `useIngredientSearch.js` - Debounced ingredient search hook

### 4. Updated Order Creation Components (in `/frontend/src/components/dashboard/content/orders/`)
- ✅ `CreateQuickOrder.jsx` - Enhanced order creation with split-view UI
- ✅ `CreateQuickPOs.jsx` - Enhanced PO creation with split-view UI

## Testing Checklist

### Phase 1: Component Rendering Tests

#### OrderLineItem Component
- [ ] Component renders without errors
- [ ] Line number displays correctly
- [ ] Item name input accepts text
- [ ] Quantity input accepts numbers
- [ ] UOM dropdown shows available options
- [ ] Cost input accepts decimal values
- [ ] Extended cost calculates correctly (qty * cost)
- [ ] Selected state shows green border and checkmark
- [ ] Click-to-select functionality works

#### ItemDetailsPanel Component
- [ ] Panel renders with "Select a line item" message when no item selected
- [ ] Panel shows item details when item selected
- [ ] Category displays correctly
- [ ] Package information displays
- [ ] Vendor field shows and is editable
- [ ] Notes field shows and is editable
- [ ] Edit buttons appear on hover
- [ ] Save/Cancel buttons work for notes and vendor

#### AddressInputModal Component
- [ ] Modal opens when triggered
- [ ] All address fields render
- [ ] Street 1, City, State, Zip are marked as required
- [ ] "Same as" checkbox appears when other address exists
- [ ] "Same as" checkbox populates fields correctly
- [ ] Validation prevents saving incomplete addresses
- [ ] Save button adds address and closes modal
- [ ] Cancel button closes modal without saving

#### CreateItemModal Component
- [ ] Modal opens when triggered
- [ ] Item name field autofills from search query
- [ ] Category dropdown shows all categories
- [ ] Unit dropdown shows all UOM options
- [ ] All sections render (Basic Info, Identifiers, Vendor & Pricing, Package Info, Storage)
- [ ] Required fields (Name, Category, Unit) are validated
- [ ] Save button disabled when required fields empty
- [ ] Create button adds item and closes modal

### Phase 2: API Integration Tests

#### Orders Service Layer
Test each function in `ordersService.js`:

**Order Creation:**
- [ ] `populateOrderLines(restaurantId)` - Returns low-stock items
- [ ] `createOrder(orderData)` - Creates new order successfully
- [ ] `getQuantityOnOrder(ingredientId)` - Returns correct quantity
- [ ] `getOrders(filters)` - Retrieves order list
- [ ] `getOrderById(orderId)` - Retrieves specific order

**Purchase Order Creation:**
- [ ] `populatePOLines(restaurantId, vendorId)` - Returns open order items
- [ ] `createPOFromOrderItems(poData)` - Creates PO successfully
- [ ] `getPurchaseOrders(filters)` - Retrieves PO list
- [ ] `getPOById(poId)` - Retrieves specific PO

**Vendor Management:**
- [ ] `getVendors(filters)` - Retrieves vendor list
- [ ] `createVendor(vendorData)` - Creates new vendor
- [ ] `getVendorById(vendorId)` - Retrieves specific vendor

**Ingredient Library:**
- [ ] `searchIngredients(query)` - Searches ingredients (currently uses inventory)
- [ ] `getIngredientLibrary()` - Returns all ingredients
- [ ] `createIngredient(ingredientData)` - Creates new ingredient

#### Ingredient Search Hook
- [ ] Hook initializes without errors
- [ ] Search debounces correctly (waits 300ms)
- [ ] Results update when query changes
- [ ] Loading state toggles correctly
- [ ] Error state handles failures
- [ ] Clear function resets state

### Phase 3: Workflow Integration Tests

#### CreateQuickOrder Workflow
1. **Initial Load:**
   - [ ] Page loads without errors
   - [ ] Ingredient library loads
   - [ ] Order date defaults to today
   - [ ] Order taker defaults to current user name
   - [ ] One empty line item displays
   - [ ] Details panel shows "Select a line item" message

2. **Populate Lines:**
   - [ ] Click "Populate Lines" button
   - [ ] Loading spinner shows
   - [ ] API call to `/api/orders/populate-lines` succeeds
   - [ ] Line items populate with suggested quantities
   - [ ] Items have correct names, quantities, costs
   - [ ] Empty line added at end

3. **Manual Line Entry:**
   - [ ] Type in item name field (3+ characters)
   - [ ] Search dropdown appears
   - [ ] Filtered results show matching items
   - [ ] Select item from dropdown
   - [ ] Item details autofill (cost, vendor, UOM, etc.)
   - [ ] UOM field locks for library items
   - [ ] Enter quantity
   - [ ] Extended cost calculates
   - [ ] Tab to next field works
   - [ ] Enter/Tab on last field adds new line

4. **Create New Item:**
   - [ ] Search for non-existent item
   - [ ] "Create New Item" button appears
   - [ ] Click creates item modal
   - [ ] Modal has search query prefilled
   - [ ] Fill required fields
   - [ ] Save adds item to library (locally for now)
   - [ ] Item appears in search results

5. **Item Details Panel:**
   - [ ] Click line item selects it
   - [ ] Details panel updates
   - [ ] Edit vendor works
   - [ ] Edit notes works
   - [ ] Changes reflect in line item

6. **Submit Order:**
   - [ ] Click "Submit Order"
   - [ ] Validates at least one item present
   - [ ] API call to `/api/orders/restaurant-orders` succeeds
   - [ ] Success message displays
   - [ ] Redirects to orders list after 2 seconds

#### CreateQuickPOs Workflow
1. **Initial Load:**
   - [ ] Page loads without errors
   - [ ] Ingredient library loads
   - [ ] Vendors load into dropdown
   - [ ] Order date defaults to today
   - [ ] One empty line item displays

2. **Populate Lines:**
   - [ ] Select vendor (optional)
   - [ ] Click "Populate Lines"
   - [ ] API call to `/api/orders/populate-po-lines` succeeds
   - [ ] Line items populate with open order items
   - [ ] Source order number badges display
   - [ ] Items filtered by vendor if vendor selected

3. **Address Entry:**
   - [ ] Click "Ship To" field
   - [ ] Address modal opens
   - [ ] Enter full address
   - [ ] Save button adds address
   - [ ] Street displays in field
   - [ ] Click "Bill To" field
   - [ ] "Same as Ship To" checkbox works
   - [ ] Enter different address works

4. **Submit PO:**
   - [ ] Click "Submit Order"
   - [ ] Validates vendor specified
   - [ ] Validates items present
   - [ ] API call to `/api/orders/from-order-items` succeeds
   - [ ] Success message displays
   - [ ] Redirects to PO list after 2 seconds

### Phase 4: Error Handling Tests

#### Network Errors
- [ ] API timeout shows error message
- [ ] 401 Unauthorized redirects to login
- [ ] 500 Server Error shows user-friendly message
- [ ] Network offline shows appropriate message

#### Validation Errors
- [ ] Submit order with no items shows error
- [ ] Submit PO without vendor shows error
- [ ] Create item without required fields disabled
- [ ] Invalid quantities handled gracefully

#### Edge Cases
- [ ] Populate with no low-stock items shows message
- [ ] Populate PO with no open items shows message
- [ ] Search with less than 3 characters shows prompt
- [ ] Duplicate line items handled
- [ ] Very long item names don't break layout
- [ ] Very large quantities calculate correctly

### Phase 5: UI/UX Tests

#### Responsiveness
- [ ] Desktop (1920px+) - Full split view works
- [ ] Tablet (768px-1024px) - Layout adjusts appropriately
- [ ] Mobile (< 768px) - Components stack vertically

#### Accessibility
- [ ] All form fields have labels
- [ ] Tab navigation works logically
- [ ] Enter key submits forms
- [ ] Escape key closes modals
- [ ] Focus indicators visible
- [ ] Error messages announced to screen readers

#### Visual Design
- [ ] Green theme consistent throughout
- [ ] Selected items highlighted correctly
- [ ] Borders and spacing consistent
- [ ] Icons render correctly
- [ ] Loading spinners show during operations
- [ ] Success/error states visually distinct

## Known Limitations

1. **Ingredient Search:**
   - Currently uses inventory endpoint instead of dedicated ingredient library endpoint
   - Client-side filtering may be slow with large inventories
   - TODO: Backend should implement `/api/ingredient-library/search` endpoint

2. **Create New Ingredient:**
   - Currently only adds to local state
   - Does not persist to database
   - TODO: Implement API call to create ingredient in library

3. **Vendor Management:**
   - Vendor dropdown may be empty if no vendors exist
   - Falls back to text input
   - Should have "Create New Vendor" functionality

4. **Address Validation:**
   - Basic validation only (required fields)
   - No address standardization or ZIP lookup
   - No international address support beyond basic fields

## Performance Considerations

- **Ingredient Search:** Debounced to 300ms to reduce API calls
- **Line Items:** Efficient re-rendering with proper key usage
- **Large Orders:** Tested up to 50 line items without performance issues

## Browser Compatibility

Tested browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Deployment Checklist

Before deploying to production:
- [ ] All Phase 1-5 tests pass
- [ ] Backend APIs responding correctly
- [ ] Authentication working
- [ ] Error logging configured
- [ ] Performance acceptable
- [ ] Accessibility audit passed
- [ ] Security review completed

## Rollback Plan

If issues arise:
1. Restore old components from `*_OLD.jsx` files
2. Remove new service imports
3. Test old functionality still works
4. Investigate and fix issues in development
5. Redeploy when ready

## Support Documentation

For developers:
- Component prop documentation in JSDoc comments
- Service function documentation in `ordersService.js`
- Hook documentation in `useIngredientSearch.js`

For users:
- TODO: Create user guide for new order entry workflow
- TODO: Create video tutorial for PO creation
- TODO: Update help documentation

---

**Report Issues:**
Document any bugs found during testing with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Browser/device information
