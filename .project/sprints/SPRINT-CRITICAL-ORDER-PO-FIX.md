# Sprint: Critical Order-to-PO Linking Fix

**Duration:** 1 day (approximately 8 hours)
**Status:** In Progress
**Goal:** Fix broken order-to-PO linking workflow to prevent duplicate ordering

## Critical Problem Statement

Orders and POs aren't properly linked, causing:
- Quick orders stay in "draft" status instead of auto-submitting
- Items appear in multiple "needs ordering" lists simultaneously
- Duplicate ordering possibilities due to broken workflow
- Lack of proper audit trail between orders and POs

## Phase 1: Backend Service Fixes

**Duration:** Hours 1-4
**Objective:** Fix core backend logic for order-PO linking workflow
**Assigned Agents:** backend-specialist

### Tasks
- TASK-1: Fix Quick Order Auto-Submit (est. 1 hour)
  - Modify `createQuickOrder()` in restaurantOrders.js to set status to "submitted"
  - Update route in restaurantOrders.js POST /quick-order to ensure immediate submission
- TASK-2: Improve Order Item PO Linking (est. 2 hours)  
  - Enhance PO creation to properly update source order items
  - Ensure `po_id`, `po_number`, and `status` fields are updated consistently
  - Add error handling for failed linking operations
- TASK-3: Fix Status-Based Queries (est. 1 hour)
  - Modify `getOrdersPendingPOs()` to exclude items already assigned to POs
  - Update query logic to prevent duplicate ordering scenarios

### Dependencies
- None (standalone backend fixes)

### Success Criteria
- [ ] Quick orders automatically set to "submitted" status
- [ ] PO creation properly links back to source order items
- [ ] Pending PO queries exclude already-linked items
- [ ] No duplicates in ordering workflows

---

## Phase 2: Frontend Integration Updates

**Duration:** Hours 3-6 (parallel with Phase 1)
**Objective:** Update frontend to handle corrected workflow
**Assigned Agents:** frontend-specialist

### Tasks
- TASK-4: Update Quick PO Creation Flow (est. 2 hours)
  - Ensure CreateQuickPOs.jsx properly handles PO-to-order linking
  - Add error handling for linking operations
  - Refresh order status after successful PO creation
- TASK-5: Order Status UI Updates (est. 1 hour)
  - Update order lists to reflect proper status changes
  - Ensure items disappear from quick order list after submission

### Dependencies
- Requires Phase 1 backend fixes to be implemented

### Success Criteria
- [ ] Quick PO creation properly links items
- [ ] Order status updates reflected in UI immediately
- [ ] Proper error handling and user feedback
- [ ] No stale data in order lists

---

## Phase 3: End-to-End Testing

**Duration:** Hours 5-8
**Objective:** Comprehensive workflow testing and validation
**Assigned Agents:** qa-specialist

### Tasks
- TASK-6: Complete Workflow Testing (est. 3 hours)
  - Test: Create Quick Order → Verify immediate "submitted" status
  - Test: Quick Order items disappear from creation list
  - Test: Submit order → Appears in pending PO list  
  - Test: Create PO → Order items get properly linked
  - Test: Linked items disappear from pending lists
  - Test: View orders → Shows proper PO numbers for linked items

### Dependencies
- Requires Phase 1 and Phase 2 completion

### Success Criteria
- [ ] Complete audit trail: Order → Order Items → PO → PO Items
- [ ] No duplicate ordering possibilities
- [ ] All workflow transitions work correctly
- [ ] Data integrity maintained throughout process

---

## Sprint Metrics

**Total Estimate:** 8 hours
**Agents Involved:** backend-specialist, frontend-specialist, qa-specialist
**Critical Path:** Phase 1 must complete before Phase 2 can finish
**Risk Factors:** Database consistency during PO linking operations

## Key Files to Modify

### Backend
- `backend/src/services/restaurantOrders.js` (createQuickOrder, getOrdersPendingPOs)
- `backend/src/services/orders.js` (createPurchaseOrder linking)
- `backend/src/routes/restaurantOrders.js` (POST /quick-order, PO generation)

### Frontend  
- `frontend/src/components/dashboard/content/orders/CreateQuickPOs.jsx`
- Related order management components for status handling

## Success Definition

This sprint is complete when:
1. Quick orders automatically become "submitted" and disappear from quick order creation list
2. PO creation establishes proper bidirectional links with source order items
3. Items never appear in multiple "needs ordering" lists simultaneously  
4. Complete audit trail exists from Order → Order Items → PO → PO Items
5. All workflow transitions tested and validated end-to-end

## Priority: CRITICAL
This sprint addresses data integrity issues that can lead to duplicate orders and inventory management failures.