# Sprint: Order Entry & PO Split-View Implementation

**Sprint ID**: SPRINT-ORDER-ENTRY-SPLITVIEW
**Feature ID**: FEATURE-20251125-ORDER-ENTRY
**Duration:** 2 weeks (approximately 50-60 developer hours)
**Sprint Start**: 2025-11-25
**Sprint End**: 2025-12-09

---

## Sprint Goals

1. Replace existing order entry screens with split-view design from mockups
2. Implement smart PO consolidation and quantity-on-order tracking
3. Create tabbed interface for managing multiple orders/POs simultaneously
4. Enable partial fulfillment tracking through order lifecycle
5. Build vendor management foundation for dynamic vendor assignment

---

## Phase 1: Foundation & Data Layer

**Duration:** Days 1-4 (Nov 25-28)
**Objective:** Establish database schema, vendor management system, and core business logic for quantity tracking

### Tasks

#### TASK-1.1: Database Schema Extension
**Agent:** technical-architect
**Estimated Time:** 4 hours
**Description:** Extend existing tables with new fields and create vendor management tables

**Deliverables:**
- Migration script for `restaurant_orders` table (add `order_purpose` field)
- Migration script for `restaurant_order_items` table (add `item_name`, `item_number`, `upc`, `category`, `preferred_vendor`, `quantity_on_po`, `quantity_received`, `requires_approval`)
- Migration script for `purchase_orders` table (add `ship_to_address`, `bill_to_address` JSONB fields, modify `supplier_id` to UUID)
- Migration script for `purchase_order_items` table (add `source_order_item_ids` UUID[], `item_name`, `item_number`)
- Create `vendors` table with all fields
- Create `ingredient_vendor_mapping` table for many-to-many relationships
- Update status enums for order and PO lifecycles

**Success Criteria:**
- [ ] All migration scripts execute without errors
- [ ] New fields have appropriate constraints and indexes
- [ ] Foreign key relationships properly defined
- [ ] Existing data preserved and compatible

---

#### TASK-1.2: Vendor Management Backend Service
**Agent:** backend-specialist
**Estimated Time:** 5 hours
**Description:** Create vendor management API and replace hardcoded vendor mappings

**Deliverables:**
- `/backend/src/routes/vendors.js` with CRUD endpoints
- `/backend/src/services/vendors.js` with business logic
- Replace hardcoded vendor mapping in `restaurantOrders.js` (lines 359-371)
- Implement `getPreferredVendorForIngredient(ingredientId)` function
- API endpoints:
  - GET `/api/vendors` - List all vendors
  - POST `/api/vendors` - Create vendor
  - PUT `/api/vendors/:id` - Update vendor
  - DELETE `/api/vendors/:id` - Soft delete (set is_active=false)
  - GET `/api/vendors/for-ingredient/:ingredientId` - Get preferred vendor

**Success Criteria:**
- [ ] All vendor endpoints functional and tested
- [ ] Hardcoded vendor mapping removed
- [ ] Returns appropriate error codes (404, 400, 500)
- [ ] Vendor CRUD operations work correctly

---

#### TASK-1.3: Quantity Tracking Business Logic
**Agent:** backend-specialist
**Estimated Time:** 6 hours
**Description:** Implement quantity-on-order tracking and smart reorder calculations

**Deliverables:**
- Update `restaurantOrders.js` service:
  - Modify `createQuickOrder()` to calculate `qty_on_order`
  - Add `calculateQuantityOnOrder(ingredientId, restaurantId)` helper
  - Update suggested quantity formula: `(par * 2) - current - qty_on_order`
- Add new endpoint: GET `/api/orders/quantity-on-order/:ingredientId`
- Database function for efficient qty_on_order calculation
- Update order item creation to track `quantity_on_po` and `quantity_received`

**Success Criteria:**
- [ ] Qty_on_order accurately reflects items on open POs
- [ ] Suggested quantities account for pending orders
- [ ] Performance acceptable (< 500ms for 100+ items)
- [ ] Edge cases handled (no POs, partial fulfillment, cancelled items)

---

### Phase 1 Success Criteria

- [ ] All database migrations applied successfully
- [ ] Vendor management system operational
- [ ] Quantity tracking logic tested and accurate
- [ ] No breaking changes to existing order functionality
- [ ] Code reviewed and approved by technical lead

---

## Phase 2: Core Implementation

**Duration:** Days 5-9 (Nov 29 - Dec 5)
**Objective:** Implement backend API endpoints, frontend split-view components, and tabbed interface

### Tasks

#### TASK-2.1: PO Generation & Consolidation Backend
**Agent:** backend-specialist
**Estimated Time:** 7 hours
**Description:** Implement smart PO generation, line consolidation, and duplicate prevention

**Deliverables:**
- Update `/backend/src/services/orders.js`:
  - Add `populatePOLines(restaurantId, vendorId?)` function
  - Add `consolidateLineItems(orderItems)` for smart consolidation
  - Add `findExistingDraftPO(restaurantId, vendorId)` for duplicate prevention
  - Update `createPOFromOrderItems()` to link source_order_item_ids
- New API endpoints:
  - POST `/api/orders/populate-po-lines` - Get order items grouped by vendor
  - POST `/api/orders/generate-pos` - Create multiple POs from orders (enhanced)
- Update order_items when added to PO:
  - Set `quantity_on_po`
  - Update status to 'on_po'
- Update order status when all items on submitted POs

**Success Criteria:**
- [ ] PO generation groups items correctly by vendor
- [ ] Line consolidation tracks source_order_item_ids accurately
- [ ] No duplicate POs created for same vendor
- [ ] Order status transitions work correctly
- [ ] Edge cases handled (empty vendor, no open items, etc.)

---

#### TASK-2.2: Receiving Workflow Backend
**Agent:** backend-specialist
**Estimated Time:** 5 hours
**Description:** Implement PO receiving logic with partial fulfillment support

**Deliverables:**
- Add to `/backend/src/services/orders.js`:
  - `receivePOItems(poId, receivedItems[])` function
  - Update `quantity_received` on PO items
  - Calculate remaining qty and update PO status
  - Update source order_items.quantity_received
  - Transition order status to 'complete' when fully received
- New API endpoint:
  - POST `/api/orders/receive-po/:id` - Receive PO (partial or full)
- Handle partial fulfillment logic (keep items open until fully received)

**Success Criteria:**
- [ ] Partial receiving updates quantities correctly
- [ ] PO stays 'backordered' until all items received
- [ ] Order items track received quantities accurately
- [ ] Order completes only when all linked POs complete
- [ ] Inventory updated on receiving (integration with existing system)

---

#### TASK-2.3: Frontend Core Components Migration
**Agent:** frontend-specialist
**Estimated Time:** 8 hours
**Description:** Move mockup components to proper locations and wire up with backend APIs

**Deliverables:**
- Move components from `.order_screens_examples/` to proper locations:
  - `OrderLineItem.jsx` → `frontend/src/components/orders/OrderLineItem.jsx`
  - `ItemDetailsPanel.jsx` → `frontend/src/components/orders/ItemDetailsPanel.jsx`
  - `AddressInputModal.jsx` → `frontend/src/components/orders/AddressInputModal.jsx`
  - `CreateItemModal.jsx` → `frontend/src/components/orders/CreateItemModal.jsx`
- Update import paths and ensure proper integration with existing codebase
- Wire up components with API service layer
- Replace mock data with actual API calls
- Ensure styling consistency with existing app (Tailwind classes, HeroUI patterns)

**Success Criteria:**
- [ ] All components render correctly in new locations
- [ ] No import errors or broken references
- [ ] Mock data replaced with real API integration
- [ ] Components match design mockup styling
- [ ] Responsive on mobile and desktop

---

#### TASK-2.4: Tabbed Interface Component
**Agent:** frontend-specialist
**Estimated Time:** 6 hours
**Description:** Create tabbed interface for managing multiple orders/POs simultaneously

**Deliverables:**
- New component: `frontend/src/components/orders/TabbedOrderInterface.jsx`
- Features:
  - Tab creation, switching, and closing
  - State management for each tab (React context or local state)
  - Hybrid labeling: vendor name for POs, date/purpose for orders
  - "+" button to add new tab
  - "×" button to close tab with unsaved changes confirmation
  - Active tab highlighting
- Integration with OrdersContent and PurchaseOrderContent components

**Success Criteria:**
- [ ] Can create multiple tabs (orders or POs)
- [ ] Each tab maintains independent state
- [ ] Tab switching preserves unsaved changes
- [ ] Close confirmation prevents accidental data loss
- [ ] Labels update dynamically (vendor for POs, purpose for orders)
- [ ] Performance acceptable with 5+ open tabs

---

#### TASK-2.5: Replace Order Entry Screens
**Agent:** frontend-specialist
**Estimated Time:** 9 hours
**Description:** Replace existing order content components with split-view design

**Deliverables:**
- Replace `frontend/src/components/dashboard/content/orders/ViewOrders.jsx`
  - Implement split-view layout
  - Integrate OrderLineItem + ItemDetailsPanel
  - Add "Populate Lines" button functionality
  - Wire up to updated backend endpoints

- Replace `frontend/src/components/dashboard/content/orders/CreateQuickOrder.jsx`
  - Use split-view layout with tabbed interface
  - Call `/api/orders/populate-lines` for low-stock items
  - Allow quantity adjustments before saving

- Replace `frontend/src/components/dashboard/content/orders/CreateCustomOrder.jsx`
  - Manual entry with item search
  - Show CreateItemModal for new items
  - Track `requires_approval` flag

**Success Criteria:**
- [ ] Split-view layout matches design mockups (60/40 split)
- [ ] "Populate Lines" fetches and displays low-stock items correctly
- [ ] Item search and selection works with auto-suggest
- [ ] New item creation shows approval requirement
- [ ] All interactions smooth and responsive
- [ ] No regressions in existing functionality

---

#### TASK-2.6: Replace PO Entry Screens
**Agent:** frontend-specialist
**Estimated Time:** 8 hours
**Description:** Replace existing PO content components with split-view design

**Deliverables:**
- Replace `frontend/src/components/dashboard/content/orders/ViewPurchaseOrders.jsx`
  - Split-view layout for PO viewing
  - Receiving interface with partial quantity entry
  - Show source order linkage

- Replace `frontend/src/components/dashboard/content/orders/CreateQuickPOs.jsx`
  - Vendor dropdown (optional)
  - "Populate Lines" button with two modes:
    - No vendor: Create tabs for all vendors with open items
    - Vendor selected: Show items for that vendor only
  - Warning if draft PO exists (merge vs create new)
  - Consolidation display (show combined qty, track sources internally)

- Replace `frontend/src/components/dashboard/content/orders/CreateCustomPO.jsx`
  - Manual PO entry with split-view
  - Address input modals for Ship To / Bill To
  - Item search and manual entry

**Success Criteria:**
- [ ] PO generation creates tabs for each vendor
- [ ] Vendor-specific PO population works correctly
- [ ] Consolidation shows combined quantities properly
- [ ] Address modals capture shipping/billing info
- [ ] Receiving interface updates quantities and statuses
- [ ] All PO workflows functional end-to-end

---

### Phase 2 Success Criteria

- [ ] All backend endpoints implemented and tested
- [ ] All frontend components replaced with split-view design
- [ ] Tabbed interface fully functional
- [ ] Core workflows operational (create order, generate PO, receive)
- [ ] No critical bugs or regressions
- [ ] Code review completed

---

## Phase 3: Integration, Testing & Polish

**Duration:** Days 10-14 (Dec 6-9)
**Objective:** End-to-end testing, bug fixes, performance optimization, and documentation

### Tasks

#### TASK-3.1: End-to-End Workflow Testing
**Agent:** qa-specialist
**Estimated Time:** 6 hours
**Description:** Comprehensive testing of all order and PO workflows

**Test Scenarios:**
1. Create order with "Populate Lines" (low-stock)
   - Verify qty_on_order calculation
   - Verify suggested quantities
   - Test with/without existing POs

2. Create custom order with new item
   - Verify requires_approval flag
   - Test item creation modal
   - Verify line item populated correctly

3. Generate POs (all vendors at once)
   - Verify tabs created for each vendor
   - Verify item consolidation across orders
   - Verify source_order_item_ids tracking

4. Generate PO (single vendor)
   - Verify only that vendor's items shown
   - Verify merge with existing draft PO

5. Receive PO (partial)
   - Verify quantities updated
   - Verify order stays open
   - Verify inventory updated

6. Receive PO (complete)
   - Verify PO marked complete
   - Verify order marked complete when all POs done

**Deliverables:**
- Test plan document
- Test results report
- Bug tracker with all issues found
- Regression test suite

**Success Criteria:**
- [ ] All workflows pass without critical errors
- [ ] Edge cases handled gracefully
- [ ] User experience smooth and intuitive
- [ ] Performance meets targets (< 2s page load, < 500ms API calls)

---

#### TASK-3.2: Bug Fixes & Refinements
**Agent:** backend-specialist + frontend-specialist (parallel)
**Estimated Time:** 6 hours (3 hours each)
**Description:** Fix bugs identified during testing and polish UI/UX

**Backend:**
- Fix any API errors or edge cases
- Optimize database queries if needed
- Add missing validation or error handling
- Improve error messages

**Frontend:**
- Fix UI bugs (layout, styling, interactions)
- Improve loading states and error messages
- Refine mobile responsiveness
- Polish animations and transitions
- Accessibility improvements (keyboard nav, ARIA labels)

**Success Criteria:**
- [ ] All P0/P1 bugs fixed
- [ ] P2 bugs documented for future sprints
- [ ] UI polished and consistent with design system
- [ ] Accessibility audit passed (basic WCAG 2.1 Level A)

---

#### TASK-3.3: Performance Optimization
**Agent:** backend-specialist
**Estimated Time:** 3 hours
**Description:** Optimize critical paths for performance

**Focus Areas:**
- Database query optimization (indexes, query structure)
- Reduce N+1 queries on order/PO listing
- Optimize "Populate Lines" calculation (bulk operations)
- Frontend bundle size (code splitting if needed)
- Caching strategy for vendor/ingredient lookups

**Success Criteria:**
- [ ] Order list loads in < 2 seconds (100+ orders)
- [ ] "Populate Lines" completes in < 3 seconds
- [ ] PO generation for 5 vendors in < 5 seconds
- [ ] No performance regressions vs current system

---

#### TASK-3.4: Documentation & Knowledge Transfer
**Agent:** scrum-master (self-assigned)
**Estimated Time:** 4 hours
**Description:** Create comprehensive documentation for feature

**Deliverables:**
- Update API documentation with new endpoints
- User guide: How to create orders and POs with new interface
- Developer guide: Architecture decisions and data flow
- Database schema documentation update
- Sprint retrospective document

**Success Criteria:**
- [ ] All documentation complete and accurate
- [ ] User guide reviewed by stakeholder
- [ ] Developer guide includes diagrams and examples
- [ ] Sprint retrospective captures lessons learned

---

### Phase 3 Success Criteria

- [ ] All critical bugs fixed
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Feature ready for production release
- [ ] Stakeholder sign-off received

---

## Sprint Metrics

**Total Estimated Hours:** 56 hours
**Agents Involved:**
- technical-architect (1 task, 4 hours)
- backend-specialist (6 tasks, 27 hours)
- frontend-specialist (4 tasks, 31 hours)
- qa-specialist (1 task, 6 hours)
- scrum-master (1 task, 4 hours)

**Critical Path:**
```
TASK-1.1 (Schema) → TASK-1.2 (Vendors) → TASK-1.3 (Qty Tracking)
                                        ↓
                           TASK-2.1 (PO Backend) → TASK-2.2 (Receiving)
                                        ↓
                           TASK-2.3 (Frontend Core) → TASK-2.4 (Tabs) → TASK-2.5/2.6 (Screens)
                                        ↓
                           TASK-3.1 (Testing) → TASK-3.2 (Bugs) → TASK-3.3 (Performance) → TASK-3.4 (Docs)
```

**Parallelization Opportunities:**
- Phase 1: Tasks 1.2 and 1.3 can run in parallel after 1.1 completes
- Phase 2: Frontend tasks (2.3, 2.4, 2.5, 2.6) can partially overlap with backend tasks (2.1, 2.2)
- Phase 3: Bug fixes (3.2) can run in parallel for backend and frontend

---

## Risks & Mitigations

### Risk 1: Database Migration Complexity
**Impact:** High
**Probability:** Medium
**Mitigation:**
- Test migrations on copy of production data first
- Create rollback scripts for each migration
- Have database backup before running migrations

### Risk 2: Existing Order Data Compatibility
**Impact:** High
**Probability:** Low
**Mitigation:**
- Add default values for new fields (nullable where appropriate)
- Run data validation script before and after migration
- Keep old order screens accessible during transition period

### Risk 3: Frontend Component Integration Issues
**Impact:** Medium
**Probability:** Medium
**Mitigation:**
- Start with component migration early (Phase 2)
- Test each component in isolation before integration
- Have fallback plan to keep old screens if needed

### Risk 4: Performance Degradation
**Impact:** Medium
**Probability:** Medium
**Mitigation:**
- Monitor query performance during development
- Load test with realistic data volumes
- Add database indexes proactively
- Phase 3 dedicated to performance optimization

### Risk 5: Scope Creep
**Impact:** Medium
**Probability:** High
**Mitigation:**
- Clearly defined acceptance criteria
- Scrum Master enforces scope boundaries
- Document "nice to haves" for future sprints
- Daily progress tracking with TodoWrite

---

## Definition of Done

A task is considered "done" when:
- [ ] Code written and tested locally
- [ ] Unit tests written (80%+ coverage for business logic)
- [ ] Code reviewed by peer or lead
- [ ] Integration tested with dependent components
- [ ] No known critical or high-priority bugs
- [ ] Documentation updated (code comments, API docs)
- [ ] Acceptance criteria met
- [ ] Deployed to staging environment (if applicable)

The sprint is considered "done" when:
- [ ] All tasks marked complete
- [ ] All acceptance criteria met
- [ ] End-to-end testing passed
- [ ] Performance targets achieved
- [ ] Documentation complete
- [ ] Stakeholder demo completed and approved
- [ ] Code merged to main branch
- [ ] Sprint retrospective completed

---

## Daily Standup Format

**What did you complete yesterday?**
- [Agent name]: Task X.Y completed / in progress

**What are you working on today?**
- [Agent name]: Starting Task X.Y

**Any blockers?**
- [Agent name]: Blocked by... / No blockers

**Updated ETA:**
- [X hours remaining in current phase]

---

## Sprint Retrospective Template

To be completed at sprint end:

**What went well?**
- [Successes and wins]

**What could be improved?**
- [Challenges and pain points]

**Action items for next sprint:**
- [Concrete improvements to implement]

**Velocity:**
- Planned: 56 hours
- Actual: [X hours]
- Variance: [X%]

---

**Sprint Status:** Ready to Begin
**Next Action:** Delegate TASK-1.1 to technical-architect

