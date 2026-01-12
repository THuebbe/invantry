# Phase 3 Testing Plan - Order Entry & PO Split-View

**Test Date:** 2025-11-27
**Tester:** QA Specialist (Claude)
**Sprint:** SPRINT-ORDER-ENTRY-SPLITVIEW
**Feature:** FEATURE-20251125-ORDER-ENTRY

---

## Test Environment

- **Backend:** Running on http://localhost:3001
- **Database:** Supabase (migrations complete ✅)
- **Vendors:** Seeded with Sysco and US Foods ✅
- **Test User:** Will use existing test account

---

## Test Scenarios (from Sprint Plan)

### Scenario 1: Create Order with "Populate Lines" (Low-Stock)
**Objective:** Verify qty_on_order calculation and suggested quantities

**Test Steps:**
1. Navigate to Orders → Create Quick Order
2. Click "Populate Lines" button
3. Verify low-stock items appear with correct suggested quantities
4. Verify qty_on_order calculation: `(par * 2) - current - qty_on_order`
5. Test with existing POs and without
6. Adjust quantities and save order
7. Verify order saved successfully

**Expected Results:**
- [ ] Low-stock items populated correctly
- [ ] Suggested quantities accurate
- [ ] Qty_on_order reflects pending POs
- [ ] Order saves without errors
- [ ] Order appears in ViewOrders list

**Test Data Needed:**
- Ingredients with par levels set
- Some items below par level
- Some items with existing open POs

---

### Scenario 2: Create Custom Order with New Item
**Objective:** Verify requires_approval flag and new item creation

**Test Steps:**
1. Navigate to Orders → Create Custom Order
2. Search for a non-existent item
3. Click "Create New Item" in CreateItemModal
4. Fill in item details (name, number, UPC, category, vendor)
5. Verify requires_approval flag is set
6. Add item to order
7. Save order
8. Verify order shows approval requirement

**Expected Results:**
- [ ] CreateItemModal opens for new items
- [ ] Item creation form validates properly
- [ ] requires_approval flag set to true
- [ ] Item appears in order line items
- [ ] Order saves with approval flag
- [ ] Admin can see approval requirement

**Test Data:**
- Unique item name/number not in system

---

### Scenario 3: Generate POs (All Vendors at Once)
**Objective:** Verify tabs created for each vendor with item consolidation

**Test Steps:**
1. Create multiple orders with items from different vendors
2. Navigate to POs → Create Quick POs
3. Leave vendor dropdown blank (all vendors)
4. Click "Populate Lines"
5. Verify tabs created for each vendor with open items
6. Verify item consolidation (same items combined)
7. Verify source_order_item_ids tracking
8. Submit all POs

**Expected Results:**
- [ ] One tab per vendor with open items
- [ ] Items consolidated correctly (qty summed)
- [ ] source_order_item_ids array populated
- [ ] Tab labels show vendor names
- [ ] PO submission updates order item statuses
- [ ] Order status transitions correctly

**Test Data:**
- 3-5 orders with items from Sysco and US Foods
- Some orders with duplicate items

---

### Scenario 4: Generate PO (Single Vendor)
**Objective:** Verify single-vendor PO generation and draft merging

**Test Steps:**
1. Create orders with items from specific vendor
2. Navigate to POs → Create Quick POs
3. Select specific vendor from dropdown
4. Click "Populate Lines"
5. Verify only that vendor's items shown
6. Save as draft
7. Create another PO for same vendor
8. Verify merge warning appears
9. Test merge vs create new

**Expected Results:**
- [ ] Only selected vendor's items appear
- [ ] Draft PO saved correctly
- [ ] Duplicate detection works
- [ ] Merge option presented
- [ ] Merge combines line items correctly
- [ ] Create new option creates separate PO

**Test Data:**
- Orders with Sysco items
- Draft PO for Sysco already exists

---

### Scenario 5: Receive PO (Partial)
**Objective:** Verify partial fulfillment tracking

**Test Steps:**
1. Open backordered PO
2. Navigate to POs → View Purchase Orders → Receive
3. Enter partial quantities (less than ordered)
4. Click "Receive Items"
5. Verify quantity_received updated on PO items
6. Verify order items quantity_received updated proportionally
7. Verify PO stays 'backordered'
8. Verify order stays open
9. Verify inventory updated

**Expected Results:**
- [ ] Partial quantities accepted
- [ ] PO items track received quantities
- [ ] Source order items updated proportionally
- [ ] PO status remains 'backordered'
- [ ] Order status remains open
- [ ] Inventory increased by received qty
- [ ] Remaining qty calculated correctly

**Test Data:**
- Backordered PO with 3-5 items
- Order 10 lbs, receive 6 lbs (60%)

---

### Scenario 6: Receive PO (Complete)
**Objective:** Verify full fulfillment and status transitions

**Test Steps:**
1. Open backordered PO
2. Receive remaining quantities (or full if first receive)
3. Verify all items fully received
4. Verify PO status changes to 'complete'
5. Verify source order items fully received
6. Verify order status changes to 'complete' when all linked POs done
7. Verify inventory fully updated

**Expected Results:**
- [ ] Full quantities accepted
- [ ] PO status changes to 'complete'
- [ ] All PO items marked received
- [ ] Source order items completed
- [ ] Order completes when all POs complete
- [ ] Inventory fully updated
- [ ] Audit trail preserved

**Test Data:**
- Backordered PO ready for completion
- Order linked to single PO (or multiple POs all complete)

---

## Edge Cases to Test

### Edge Case 1: Empty Results
- [ ] "Populate Lines" with no low-stock items
- [ ] Generate POs with no open order items
- [ ] Search for ingredient with no results

### Edge Case 2: Data Validation
- [ ] Negative quantities
- [ ] Quantities exceeding order amount
- [ ] Duplicate item addition
- [ ] Missing required fields

### Edge Case 3: Concurrent Operations
- [ ] Multiple users editing same order
- [ ] Receiving PO while another user views it
- [ ] Deleting order with pending PO

### Edge Case 4: Status Transitions
- [ ] Cancelling order with items on PO
- [ ] Cancelling PO with partial receive
- [ ] Reopening completed order

---

## Performance Benchmarks

**From Sprint Plan Success Criteria:**

- [ ] Order list loads in < 2 seconds (100+ orders)
- [ ] "Populate Lines" completes in < 3 seconds
- [ ] PO generation for 5 vendors in < 5 seconds
- [ ] API endpoints respond in < 500ms

**Measurement Tools:**
- Browser DevTools Network tab
- Backend response time logging
- Database query execution time

---

## Accessibility Checks

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader compatibility (ARIA labels)
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG 2.1 Level A
- [ ] Form error messages announced

---

## Mobile Responsiveness

- [ ] Split-view stacks vertically on mobile
- [ ] Buttons accessible on small screens
- [ ] Tabbed interface usable on mobile
- [ ] Forms fit within viewport
- [ ] No horizontal scrolling

---

## Test Results Summary

**Total Test Cases:** 6 main scenarios + edge cases
**Test Status:** In Progress

### Scenario Results
1. ⏳ Create Order with "Populate Lines" - Not Started
2. ⏳ Create Custom Order with New Item - Not Started
3. ⏳ Generate POs (All Vendors) - Not Started
4. ⏳ Generate PO (Single Vendor) - Not Started
5. ⏳ Receive PO (Partial) - Not Started
6. ⏳ Receive PO (Complete) - Not Started

### Bugs Found
*Will be documented as testing progresses*

---

## Test Data Setup Required

Before testing, need to ensure:
1. ✅ Database migrations applied
2. ✅ Vendors seeded (Sysco, US Foods)
3. ⏳ Test ingredients with par levels
4. ⏳ Test orders in various states
5. ⏳ Test POs in backordered state
6. ⏳ Current inventory levels below par for some items

---

## Next Steps

1. Set up test data (ingredients, inventory levels, par levels)
2. Execute Scenario 1 (Populate Lines)
3. Document results and any bugs
4. Continue through remaining scenarios
5. Compile bug report for TASK-3.2
6. Create performance report for TASK-3.3
