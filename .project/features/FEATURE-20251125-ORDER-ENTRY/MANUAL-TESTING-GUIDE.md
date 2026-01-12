# Manual Testing Guide - Order Entry & PO Split-View

**Test Date:** 2025-11-27
**Feature:** Order Entry & Purchase Order Management
**Sprint:** SPRINT-ORDER-ENTRY-SPLITVIEW

---

## Prerequisites

Before starting testing, ensure:

1. **Backend running:** `cd backend && npm run dev` (Port 3001)
2. **Frontend running:** `cd frontend && npm run dev` (Port 5173)
3. **Database migrations complete** ✅
4. **Vendors seeded** ✅ (Sysco, US Foods)
5. **Test user account** created and can login
6. **Test data setup:**
   - At least 5-10 ingredients in ingredient_library
   - Par levels set for ingredients
   - Current inventory below par for some items
   - At least one existing order (optional)

---

## Test Scenario 1: Create Order with "Populate Lines"

**Objective:** Verify low-stock items are populated correctly with qty_on_order calculation

### Setup:
1. Ensure you have ingredients with:
   - Par level set (e.g., par = 10)
   - Current inventory below par (e.g., current = 3)
   - Some items with existing open POs (optional)

### Steps:

1. Login to the application
2. Navigate to **Dashboard → Orders → Create Quick Order**
3. **Expected:** You should see the split-view interface:
   - Left panel (60%): Order line items list
   - Right panel (40%): Item details panel
4. Click the **"Populate Lines"** button
5. **Expected:**
   - Loading indicator appears
   - Low-stock items populate in the left panel
   - Each item shows:
     - Ingredient name
     - Current quantity
     - Par level
     - Suggested quantity = (par × 2) - current - qty_on_order
6. **Verify quantities are correct:**
   - If item has par=10, current=3, no POs → suggested should be 17
   - If item has par=10, current=3, qty_on_order=5 → suggested should be 12
7. **Adjust a quantity** in one of the line items
8. **Expected:** Extended cost updates automatically
9. **Select an item** by clicking on it
10. **Expected:** Right panel shows item details (name, category, vendor, pricing)
11. Click **"Save Order"** button
12. **Expected:**
    - Success message appears
    - Order is created in database
    - Redirected to ViewOrders or see order in list

### Pass Criteria:
- [ ] Split-view layout displays correctly (60/40)
- [ ] "Populate Lines" fetches low-stock items
- [ ] Suggested quantities account for qty_on_order
- [ ] Item selection updates details panel
- [ ] Quantity changes update extended cost
- [ ] Order saves successfully
- [ ] No console errors

---

## Test Scenario 2: Create Custom Order with New Item

**Objective:** Verify new item creation and requires_approval flag

### Steps:

1. Navigate to **Dashboard → Orders → Create Custom Order**
2. In the item search field, type a **non-existent item name** (e.g., "Test New Ingredient XYZ")
3. **Expected:** No results found, "Create New Item" button appears
4. Click **"Create New Item"** button
5. **Expected:** CreateItemModal opens with form fields:
   - Item Name
   - Item Number
   - UPC/Barcode
   - Category dropdown
   - Preferred Vendor dropdown
   - Price
6. Fill out the form:
   - Name: "Test Ingredient XYZ"
   - Number: "TEST-123"
   - UPC: "1234567890"
   - Category: Select one
   - Vendor: Select one
   - Price: 25.00
7. Click **"Add Item"**
8. **Expected:**
   - Modal closes
   - Item appears in order line items
   - Item has requires_approval flag set (look for badge/indicator)
   - Quantity field is editable
9. Set quantity to 5
10. Save the order
11. **Expected:**
    - Order saves with approval requirement noted
    - Admin users see approval indicator

### Pass Criteria:
- [ ] Search shows "Create New Item" for non-existent items
- [ ] CreateItemModal opens and displays correctly
- [ ] Form validates required fields
- [ ] New item added to order line items
- [ ] requires_approval flag is visible
- [ ] Order saves with new item
- [ ] No console errors

---

## Test Scenario 3: Generate POs (All Vendors)

**Objective:** Verify multi-vendor PO generation with consolidation

### Setup:
1. Create 2-3 orders with items from different vendors:
   - Order 1: 5 lbs Chicken (Sysco), 3 lbs Beef (US Foods)
   - Order 2: 3 lbs Chicken (Sysco), 2 lbs Pork (Sysco)
   - Order 3: 4 lbs Beef (US Foods)

### Steps:

1. Navigate to **Dashboard → Purchase Orders → Create Quick POs**
2. **Leave vendor dropdown blank** (all vendors mode)
3. Click **"Populate Lines"** button
4. **Expected:**
   - Tabbed interface appears
   - One tab created for each vendor with open items
   - Tab labels show vendor names (e.g., "Sysco", "US Foods")
   - Each tab shows items for that vendor only
5. **Click on Sysco tab**
6. **Expected:** Should see:
   - Chicken: 8 lbs (consolidated from Order 1: 5 lbs + Order 2: 3 lbs)
   - Pork: 2 lbs
7. **Click on US Foods tab**
8. **Expected:** Should see:
   - Beef: 7 lbs (consolidated from Order 1: 3 lbs + Order 3: 4 lbs)
9. **Verify consolidation:**
   - Consolidated quantities are correct sums
   - Source tracking preserved (internal, not visible in UI)
10. **Fill in shipping address** (if required)
11. Click **"Submit PO"** on Sysco tab
12. **Expected:**
    - PO submitted successfully
    - Order items status updated to 'on_po'
    - Order status transitions if all items on PO
13. Repeat for US Foods tab

### Pass Criteria:
- [ ] Tabs created for each vendor
- [ ] Tab labels show vendor names
- [ ] Items consolidated correctly (quantities summed)
- [ ] Each tab shows only that vendor's items
- [ ] PO submission works
- [ ] Order item statuses update
- [ ] Order status transitions correctly
- [ ] No duplicate POs created
- [ ] No console errors

---

## Test Scenario 4: Generate PO (Single Vendor)

**Objective:** Verify single-vendor PO generation and draft merging

### Setup:
1. Ensure you have orders with items from Sysco
2. Optionally create a draft PO for Sysco

### Steps:

1. Navigate to **Dashboard → Purchase Orders → Create Quick POs**
2. **Select "Sysco"** from vendor dropdown
3. Click **"Populate Lines"**
4. **Expected:**
   - Only Sysco items appear
   - Items from US Foods or other vendors NOT shown
5. Review the populated items
6. Click **"Save as Draft"**
7. **Expected:** PO saved as draft (status = 'draft')
8. **Create another PO for Sysco:**
   - Navigate back to Create Quick POs
   - Select "Sysco" again
   - Click "Populate Lines"
9. **Expected:**
   - Warning message appears: "Draft PO already exists for Sysco"
   - Options presented:
     - "Merge with existing draft"
     - "Create new PO"
10. **Test merge option:**
    - Click "Merge with existing draft"
    - **Expected:** Existing draft opens with new items added
11. **Test create new option:**
    - Go back and select "Create new PO"
    - **Expected:** New separate PO created

### Pass Criteria:
- [ ] Vendor filter works correctly
- [ ] Only selected vendor's items show
- [ ] Draft PO saves correctly
- [ ] Duplicate detection works
- [ ] Merge warning appears
- [ ] Merge option combines items
- [ ] Create new option makes separate PO
- [ ] No console errors

---

## Test Scenario 5: Receive PO (Partial)

**Objective:** Verify partial fulfillment tracking

### Setup:
1. Submit a PO with 3-5 items
2. PO status should be 'backordered'

### Steps:

1. Navigate to **Dashboard → Purchase Orders → View Purchase Orders**
2. **Expected:** List of POs shown with status badges
3. Click on a backordered PO
4. **Expected:** PO details shown in split-view
5. Click **"Receive"** button
6. **Expected:** Receiving interface appears with:
   - List of PO items (left panel)
   - Receiving form (right panel)
7. **For each item, enter partial quantities:**
   - Ordered: 10 lbs
   - Received: 6 lbs (60%)
8. **Expected:** Form validates:
   - Can't receive more than ordered
   - Can't receive negative quantities
   - Remaining qty shown
9. Click **"Receive Items"**
10. **Expected:**
    - Success message
    - PO items updated with received quantities
    - Source order items updated proportionally
    - PO status remains 'backordered' (not complete)
    - Order status remains open
    - Inventory increased by received qty
11. **View the PO again**
12. **Expected:**
    - Received quantities displayed
    - Remaining quantities shown
    - Can receive remaining amount

### Pass Criteria:
- [ ] PO list displays correctly
- [ ] Receiving interface appears
- [ ] Partial quantities accepted
- [ ] Validation works (can't over-receive)
- [ ] PO items track received qty
- [ ] Order items updated proportionally
- [ ] PO stays 'backordered'
- [ ] Order stays open
- [ ] Inventory updated
- [ ] No console errors

---

## Test Scenario 6: Receive PO (Complete)

**Objective:** Verify full fulfillment and status transitions

### Setup:
1. Have a partially received PO (from Scenario 5)
   OR a new backordered PO

### Steps:

1. Navigate to **Dashboard → Purchase Orders → View Purchase Orders**
2. Open the backordered PO
3. Click **"Receive"**
4. **Enter remaining quantities** (or full if first receive):
   - If partial before: Ordered 10, received 6, now receive 4
   - If first receive: Receive full ordered quantity
5. Click **"Receive Items"**
6. **Expected:**
    - Success message
    - All items fully received
    - **PO status changes to 'complete'**
    - Source order items fully received
7. **Check the source order status:**
   - If this was the last pending PO for the order:
     - **Order status should change to 'complete'**
   - If other POs still pending:
     - Order status stays open
8. **Verify inventory:**
   - Inventory increased by full received amount
   - Check inventory page to confirm

### Pass Criteria:
- [ ] Full quantities accepted
- [ ] PO status changes to 'complete'
- [ ] All PO items marked received
- [ ] Order items completed
- [ ] Order status transitions when all POs complete
- [ ] Inventory fully updated
- [ ] Completed PO no longer editable
- [ ] No console errors

---

## Edge Cases to Test

### Edge Case 1: Empty Results
- [ ] "Populate Lines" with no low-stock items → Shows "No items found" message
- [ ] Generate POs with no open order items → Shows appropriate message
- [ ] Search for ingredient that doesn't exist → Shows "Create New Item"

### Edge Case 2: Data Validation
- [ ] Enter negative quantity → Prevented or shows error
- [ ] Receive qty > ordered qty → Shows validation error
- [ ] Submit order with no items → Prevented or shows error
- [ ] Leave required fields blank → Shows validation messages

### Edge Case 3: Tab Management
- [ ] Create multiple tabs (5+) → All render correctly
- [ ] Close tab with unsaved changes → Confirmation dialog appears
- [ ] Switch between tabs → State preserved for each tab
- [ ] Close all tabs → Can create new tabs

### Edge Case 4: Mobile Responsiveness
- [ ] Open on mobile viewport → Split-view stacks vertically
- [ ] Tabbed interface usable on mobile
- [ ] Buttons accessible and tappable
- [ ] Forms fit within viewport
- [ ] No horizontal scrolling

### Edge Case 5: Accessibility
- [ ] Tab navigation works (Tab key)
- [ ] Enter key submits forms
- [ ] Escape key closes modals
- [ ] Focus indicators visible
- [ ] Screen reader announces changes

---

## Performance Checks

Use browser DevTools Network tab and Performance tab:

- [ ] Order list loads in < 2 seconds (with 100+ orders)
- [ ] "Populate Lines" completes in < 3 seconds
- [ ] PO generation for 5 vendors in < 5 seconds
- [ ] API endpoints respond in < 500ms
- [ ] No memory leaks (check with 10+ tab operations)
- [ ] Smooth scrolling with 50+ line items

---

## Browser Compatibility (Optional)

Test in multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Bug Tracking Template

For any bugs found, document:

```markdown
## Bug #X: [Short Description]

**Severity:** Critical / High / Medium / Low
**Component:** Frontend / Backend / Database
**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**


**Actual Result:**


**Screenshots:** (if applicable)

**Console Errors:** (if any)

**Additional Notes:**
```

---

## Test Completion Checklist

- [ ] All 6 main scenarios tested
- [ ] All edge cases tested
- [ ] Performance benchmarks measured
- [ ] Mobile responsiveness verified
- [ ] Accessibility basics checked
- [ ] All bugs documented
- [ ] Test results logged in PHASE3-TEST-PLAN.md

---

## Next Steps After Testing

1. Document all bugs found
2. Prioritize bugs (P0/P1/P2)
3. Move to TASK-3.2 (Bug Fixes)
4. Create performance optimization report for TASK-3.3
5. Compile documentation for TASK-3.4

---

**Happy Testing! 🚀**
