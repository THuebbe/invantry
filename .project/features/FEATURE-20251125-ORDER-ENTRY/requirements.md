# Order Entry & Purchase Order Management - Requirements

**Feature ID**: FEATURE-20251125-ORDER-ENTRY
**Status**: Ready for Sprint Planning
**Last Updated**: 2025-11-25

---

## Executive Summary

Replace existing order entry screens with a split-view design featuring intelligent item search, smart PO consolidation, and sophisticated order-to-PO workflow tracking. The new interface will provide better UX for creating orders, converting to purchase orders, and managing vendor relationships.

---

## User Roles & Permissions

**Current State**: No RBAC implemented yet - anyone can access all features
**Future State** (to be implemented in separate RBAC feature):

| Role | Permissions |
|------|-------------|
| User (Basic Staff) | View orders, view inventory |
| Manager | Create Orders, view POs, edit orders |
| Admin (Owner/GM) | All Manager permissions + Submit POs, approve new items for library |

**Note**: For this feature, build without role restrictions. RBAC will be layered on later.

---

## Core Workflows

### Workflow 1: Create Order from Low Stock

**Actor**: Manager
**Trigger**: Inventory levels below par

1. Navigate to Orders → Create Order
2. Click "Populate Lines" button
3. System queries inventory where `current_qty < minimum_quantity`
4. System calculates needed quantity accounting for items already on open orders/POs
   - Example: Chicken is 15 lbs under par, but 10 lbs already on PO → suggest 5 lbs
5. System pre-fills order with suggested items and quantities
6. Manager reviews, adjusts quantities, adds/removes items
7. Manager saves as Draft or Submits order
8. Order moves to "Submitted" status

**Acceptance Criteria**:
- ✅ "Populate Lines" button visible and functional
- ✅ Correctly identifies low-stock items (current_qty < minimum_quantity)
- ✅ Accounts for quantities already on order (open POs)
- ✅ Suggests reorder quantity: `(minimum_quantity * 2) - current_quantity - quantity_on_order`
- ✅ Pre-fills line items with: item name, suggested qty, UOM, estimated cost, vendor
- ✅ Allows manual adjustment before saving
- ✅ Saves as draft or submitted status

---

### Workflow 2: Create Custom Order

**Actor**: Manager
**Trigger**: Special event, seasonal prep, or manual ordering need

1. Navigate to Orders → Create Order
2. Manually search and select items from ingredient library
3. Enter quantities for each item
4. Can create new items on-the-fly (requires Admin approval to add to library)
5. Save as Draft or Submit order

**Acceptance Criteria**:
- ✅ Type-to-search ingredient library (auto-suggest after 3 characters)
- ✅ Click to select item from dropdown
- ✅ Can add items not in library (shows "Create New Item" modal)
- ✅ New items flagged for Admin review before library addition
- ✅ UOM locked for library items, editable for new items
- ✅ Auto-calculates extended cost (qty × unit_cost)
- ✅ Supports multiple orders open simultaneously (tabbed interface)

---

### Workflow 3: Generate Purchase Orders from Orders

**Actor**: Admin
**Trigger**: Orders submitted and ready for vendor ordering

**Option A - Generate All POs at Once**:
1. Navigate to Purchase Orders → Create PO
2. Click "Populate Lines" (without selecting vendor)
3. System groups all open order items by vendor
4. Creates one PO tab for each vendor with items
5. Admin reviews each PO, makes adjustments
6. Submits POs to vendors (changes status to "Backordered")

**Option B - Generate PO for Single Vendor**:
1. Navigate to Purchase Orders → Create PO
2. Select vendor from dropdown
3. Click "Populate Lines"
4. System pulls all open order items for that vendor (across all orders)
5. If existing draft PO for vendor exists, adds to that PO instead of creating new
6. Admin reviews, adjusts, submits

**Acceptance Criteria**:
- ✅ "Populate Lines" with no vendor selected → generates PO for each vendor
- ✅ "Populate Lines" with vendor selected → populates only that vendor's items
- ✅ Smart PO merging: won't create duplicate POs for same vendor
- ✅ Consolidates items across multiple orders (e.g., Order #1 needs 5 lbs chicken + Order #2 needs 3 lbs → PO shows 8 lbs)
- ✅ Visually shows consolidated quantity, but tracks source orders internally
- ✅ PO line items link back to source order items (`source_order_item_id`)
- ✅ Each PO line can track multiple source orders (for consolidated items)
- ✅ Tabbed interface for multiple open POs (labeled by vendor name)
- ✅ Can save individual POs as draft, submit others
- ✅ Once all order items are on submitted POs, order status → "Open"

---

### Workflow 4: Receive Purchase Order

**Actor**: Manager/Admin
**Trigger**: Vendor delivery arrives

1. Navigate to Purchase Orders → View POs
2. Select PO to receive
3. Enter received quantities for each line item
4. If qty received < qty ordered → item stays open
5. Update inventory levels based on received quantities
6. When all items received in full → PO status "Complete"
7. When all POs for an order are complete → Order status "Complete"

**Acceptance Criteria**:
- ✅ Can receive partial quantities
- ✅ Order items remain "Open" until fully received across all POs
- ✅ Example: Order for 10 lbs chicken, received 8 lbs → order item shows 2 lbs still needed
- ✅ Inventory updated with received quantities
- ✅ PO marked complete only when all items received in full
- ✅ Order marked complete only when all linked POs complete

---

## Data Model

### Orders Table (`restaurant_orders`)

**Status**: Already exists
**Modifications Needed**: Add `order_purpose` field for tab labeling

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| restaurant_id | UUID | FK to restaurant |
| order_number | VARCHAR | Auto-generated (e.g., "ORD-2025-0015") |
| order_type | VARCHAR | 'quick' or 'custom' |
| order_purpose | VARCHAR | **NEW** - For tab labels (e.g., "Weekly Reorder", "Nov 25", "Holiday Prep") |
| status | VARCHAR | 'draft', 'submitted', 'open', 'complete', 'cancelled' |
| total_estimated_value | NUMERIC | Sum of all line items |
| notes | TEXT | Order-level notes |
| created_by | UUID | User who created |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last modified |

**New Status Flow**:
- `draft` → User working on order
- `submitted` → Order finalized, ready for PO generation
- `open` → All items assigned to submitted POs, awaiting delivery
- `complete` → All items received in full
- `cancelled` → Order cancelled

---

### Order Items Table (`restaurant_order_items`)

**Status**: Already exists
**Modifications Needed**: Add quantity tracking fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | FK to restaurant_orders |
| ingredient_id | UUID | FK to ingredient_library (nullable for new items) |
| item_name | VARCHAR | **NEW** - Item name (for non-library items) |
| item_number | VARCHAR | **NEW** - Vendor item number |
| upc | VARCHAR | **NEW** - Barcode/UPC |
| category | VARCHAR | **NEW** - Item category |
| quantity | NUMERIC | Quantity ordered |
| quantity_on_po | NUMERIC | **NEW** - Quantity assigned to POs |
| quantity_received | NUMERIC | **NEW** - Quantity received from POs |
| unit | VARCHAR | Unit of measure |
| estimated_unit_cost | NUMERIC | Estimated cost per unit |
| estimated_line_total | NUMERIC | qty × cost |
| preferred_vendor | VARCHAR | **NEW** - Preferred vendor for this item |
| notes | TEXT | Line-level notes |
| requires_approval | BOOLEAN | **NEW** - True if new item needs Admin approval |
| status | VARCHAR | 'pending', 'on_po', 'partially_received', 'received', 'cancelled' |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last modified |

**New Status Flow**:
- `pending` → Not yet on a PO
- `on_po` → Assigned to one or more POs
- `partially_received` → Some quantity received, still waiting for more
- `received` → Fully received
- `cancelled` → Line cancelled

---

### Purchase Orders Table (`purchase_orders`)

**Status**: Already exists
**Modifications Needed**: Add source order tracking

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| restaurant_id | UUID | FK to restaurant |
| order_number | VARCHAR | Auto-generated PO number |
| supplier_id | UUID | **MODIFY** - FK to vendors table (currently varchar) |
| supplier_name | VARCHAR | Vendor name (denormalized for display) |
| ship_to_address | JSONB | **NEW** - Shipping address object |
| bill_to_address | JSONB | **NEW** - Billing address object |
| order_date | DATE | Date PO created |
| expected_delivery_date | DATE | Required/expected delivery |
| actual_delivery_date | DATE | Actual delivery (when received) |
| status | VARCHAR | 'draft', 'submitted', 'backordered', 'complete', 'cancelled' |
| source_order_ids | UUID[] | Already exists - Array of source order IDs |
| subtotal | NUMERIC | Sum before tax |
| tax | NUMERIC | Tax amount |
| total | NUMERIC | Total with tax |
| notes | TEXT | PO notes |
| created_by | UUID | User who created |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last modified |

**New Status Flow**:
- `draft` → PO being created
- `submitted` → Sent to vendor (old: becomes "backordered")
- `backordered` → Submitted to vendor, awaiting delivery (replaces old "submitted")
- `complete` → All items received
- `cancelled` → PO cancelled

---

### PO Items Table (`purchase_order_items`)

**Status**: Already exists
**Modifications Needed**: Add source order item linking

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| purchase_order_id | UUID | FK to purchase_orders |
| source_order_item_ids | UUID[] | **NEW** - Array of source restaurant_order_items.id (for consolidated items) |
| ingredient_id | UUID | FK to ingredient_library (nullable) |
| item_name | VARCHAR | **NEW** - Item name |
| item_number | VARCHAR | **NEW** - Vendor item number |
| quantity_ordered | NUMERIC | Quantity on PO |
| quantity_received | NUMERIC | Quantity received |
| unit | VARCHAR | Unit of measure |
| unit_price | NUMERIC | Price per unit |
| line_total | NUMERIC | qty × price |
| expiration_date | DATE | Expiration (if applicable) |
| batch_number | VARCHAR | Batch/lot number |
| notes | TEXT | Line-level notes |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last modified |

---

### Vendors Table (NEW - Currently Missing)

**Status**: Does not exist (currently hardcoded by category)
**Action**: Create new table

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| restaurant_id | UUID | FK to restaurant |
| name | VARCHAR | Vendor/supplier name |
| contact_name | VARCHAR | Primary contact |
| phone | VARCHAR | Phone number |
| email | VARCHAR | Email address |
| address | JSONB | Full address object |
| payment_terms | VARCHAR | Net 30, COD, etc. |
| account_number | VARCHAR | Restaurant's account # with vendor |
| is_active | BOOLEAN | Active vendor |
| notes | TEXT | Vendor notes |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last modified |

---

### Ingredient-Vendor Mapping Table (NEW)

**Status**: Does not exist
**Action**: Create new table for many-to-many relationship

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| ingredient_id | UUID | FK to ingredient_library |
| vendor_id | UUID | FK to vendors |
| is_preferred | BOOLEAN | Is this the preferred vendor for this item |
| vendor_item_number | VARCHAR | Vendor's SKU/item number |
| unit_cost | NUMERIC | Cost from this vendor |
| lead_time_days | INTEGER | Typical delivery time |
| minimum_order_qty | NUMERIC | Minimum order quantity |
| notes | TEXT | Vendor-specific notes for item |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last modified |

---

## UI/UX Design Specifications

### Split-View Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Order Header Card                                          │
│  [Order #] [Date] [Order Taker] [Required Date] [Purpose]  │
│                                        [POPULATE LINES]     │
├───────────────────────────────┬─────────────────────────────┤
│                               │                             │
│  Line Items List (60%)        │  Item Details Panel (40%)   │
│  ┌─────────────────────────┐  │  ┌───────────────────────┐  │
│  │ ◆ 1 │ Item │ Qty │ ... │  │  │ Item Name             │  │
│  └─────────────────────────┘  │  │ Category: Meat        │  │
│  ┌─────────────────────────┐  │  │ Vendor: Sysco         │  │
│  │   2 │ Item │ Qty │ ... │  │  │ Pkg Info: ...         │  │
│  └─────────────────────────┘  │  │ Notes: _____________  │  │
│  [+ Add Line Item]            │  └───────────────────────┘  │
│                               │                             │
└───────────────────────────────┴─────────────────────────────┘
```

### Tabbed Interface for Multiple Orders/POs

**Orders Tabs**:
- Label format: Order purpose or date
- Examples: "Weekly Reorder" | "Nov 25" | "Holiday Prep"
- User can set purpose when creating order

**PO Tabs**:
- Label format: Vendor name
- Examples: "Sysco" | "Gordon Food Service" | "Local Farm Co"
- Auto-generated when using "Populate Lines"

**Tab Behavior**:
- Click tab to switch between open orders/POs
- Each tab maintains its own state
- "+" button to create new blank order/PO
- Close button (×) to discard draft

---

### Line Item Card (OrderLineItem Component)

**Layout**:
```
┌──────────────────────────────────────────────────────────┐
│ ◆ [#] │ [Item Name Search___] │ [Qty] │ [UOM 🔒] │ [$]  │
│         Category: Meat                  Ext: $47.98     │
└──────────────────────────────────────────────────────────┘
```

**Fields**:
- Line Number: Auto-assigned, sequential
- Selection Indicator: ◆ (green diamond) when selected, empty when not
- Item Name: Type-to-search input with auto-suggest dropdown
- Quantity: Numeric input
- UOM: Locked for library items (🔒 icon), dropdown for new items
- Unit Cost: Numeric input
- Extended Cost: Auto-calculated, read-only

**Interactions**:
- Click anywhere on card → select line (green border, diamond indicator)
- Type in Item Name → auto-suggest after 3 characters
- Select from dropdown → auto-fills category, UOM, cost, vendor
- Tab from Cost field → auto-add new blank line below
- Double-click Item Name → open full item search modal

**States**:
- Default: White background, gray border
- Selected: Green border (`border-green-500`), green background (`bg-green-50`), diamond indicator
- Error: Red border if validation fails

---

### Item Details Panel (ItemDetailsPanel Component)

**Sections**:

1. **Item Header**
   - Item name (large, bold)
   - Category badge

2. **Package Information**
   - Pkg Qty: [1] [Case]
   - Items per Pkg: [2] [5 lbs packages]
   - Item Qty: [10] [lbs total]
   - (Shows breakdown: "1 Case contains 2 packages of 5 lbs = 10 lbs total")

3. **Vendor Information**
   - Preferred Vendor: [Dropdown - editable]
   - Unit Cost: [$23.99]
   - Lead Time: [2-3 days]

4. **Order/PO Linkage** (if applicable)
   - Badge showing "On PO #12345" or "Order #ORD-2025-0015"
   - Qty on order: 5 lbs
   - Qty received: 3 lbs
   - Qty pending: 2 lbs

5. **Identifiers**
   - Item Number: 332845
   - UPC: 601089456780

6. **Notes**
   - Editable text area for line-level notes

**Behavior**:
- Shows details for currently selected line item
- Empty state when no line selected: "Select a line item to view details"
- Vendor dropdown allows changing preferred vendor
- Notes auto-save on blur

---

### Address Input Modal (AddressInputModal Component)

**Purpose**: Capture Ship To / Bill To addresses for Purchase Orders

**Fields**:
- Address Type: Ship To / Bill To (title)
- Street Address (text input)
- City (text input)
- State (dropdown)
- Zip Code (text input)
- Checkbox: "Same as [Ship To / Bill To]" (copies from other address)

**Actions**:
- Save: Saves address and closes modal
- Cancel: Closes without saving

---

### Create New Item Modal (CreateItemModal Component)

**Purpose**: Allow ad-hoc item creation during order entry

**Fields**:
- Item Name (required)
- Category (dropdown)
- Item Number (optional)
- UPC (optional)
- Unit of Measure (dropdown)
- Estimated Cost (numeric)
- Preferred Vendor (dropdown)
- Package info (Pkg Qty, Pkg UOM, Items/Pkg, Item Qty, Item UOM)
- Notes (text area)

**Behavior**:
- Red banner: "This item will require Admin approval before being added to ingredient library"
- Save: Creates order line item with `requires_approval = true`
- Item is usable immediately on the order
- Admin must review and approve before it's added to permanent library

---

## Business Logic & Calculations

### "Populate Lines" on Orders

**Query Logic**:
```sql
SELECT
  i.id,
  i.name,
  i.category,
  i.unit,
  inv.quantity as current_qty,
  inv.minimum_quantity as par_level,
  COALESCE(SUM(roi.quantity - roi.quantity_received), 0) as qty_on_order
FROM ingredient_library i
JOIN restaurant_inventory inv ON i.id = inv.ingredient_id
LEFT JOIN restaurant_order_items roi ON i.id = roi.ingredient_id
  AND roi.status IN ('on_po', 'partially_received')
WHERE inv.quantity < inv.minimum_quantity
  AND inv.restaurant_id = :restaurant_id
GROUP BY i.id, inv.quantity, inv.minimum_quantity
```

**Suggested Quantity Calculation**:
```
suggested_qty = (par_level * 2) - current_qty - qty_on_order
```

**Example**:
- Chicken Breast: par_level = 20 lbs, current_qty = 5 lbs, qty_on_order = 10 lbs
- Suggested: (20 * 2) - 5 - 10 = 25 lbs

---

### "Populate Lines" on POs (Vendor Selected)

**Query Logic**:
```sql
SELECT
  roi.id,
  roi.order_id,
  o.order_number,
  roi.ingredient_id,
  roi.item_name,
  roi.quantity - COALESCE(roi.quantity_on_po, 0) as available_qty,
  roi.unit,
  roi.estimated_unit_cost,
  roi.preferred_vendor
FROM restaurant_order_items roi
JOIN restaurant_orders o ON roi.order_id = o.id
WHERE roi.status IN ('pending', 'on_po')
  AND (roi.quantity - COALESCE(roi.quantity_on_po, 0)) > 0
  AND roi.preferred_vendor = :selected_vendor
  AND o.restaurant_id = :restaurant_id
ORDER BY o.created_at ASC, roi.created_at ASC
```

**PO Merging Logic**:
- Check if draft PO exists for selected vendor
- If yes: Add new lines to existing PO
- If no: Create new PO with vendor

---

### "Populate Lines" on POs (No Vendor Selected)

**Query Logic**:
```sql
SELECT
  roi.preferred_vendor,
  ARRAY_AGG(roi.id) as order_item_ids
FROM restaurant_order_items roi
JOIN restaurant_orders o ON roi.order_id = o.id
WHERE roi.status IN ('pending', 'on_po')
  AND (roi.quantity - COALESCE(roi.quantity_on_po, 0)) > 0
  AND o.restaurant_id = :restaurant_id
GROUP BY roi.preferred_vendor
```

**Multi-PO Generation**:
- For each vendor group:
  - Check if draft PO exists for vendor
  - If yes: Add lines to existing PO
  - If no: Create new PO tab with vendor name
- Create tabs for each vendor
- User can submit individually or all at once

---

### Item Consolidation on POs

**Scenario**: Order #1 needs 5 lbs chicken, Order #2 needs 3 lbs chicken, both from Sysco

**Display**: Single PO line showing 8 lbs Chicken Breast

**Data Storage**:
```json
purchase_order_items: {
  "ingredient_id": "chicken-breast-uuid",
  "quantity_ordered": 8,
  "unit": "lbs",
  "source_order_item_ids": ["order1-item-uuid", "order2-item-uuid"]
}
```

**Tracking**:
- PO line tracks total quantity (8 lbs)
- `source_order_item_ids` array maintains link to both source items
- When receiving, both order items get updated proportionally

---

### Partial Fulfillment Handling

**Scenario**: Ordered 10 lbs chicken, received 8 lbs

**Updates**:
1. PO Item: `quantity_received = 8`
2. PO Status: Stays "backordered" (not complete)
3. Order Item: `quantity_received = 8`, `quantity_on_po = 10`, status = "partially_received"
4. Order: Status stays "open"

**Next Order Cycle**:
- When running "Populate Lines" for new order:
  - qty_on_order = 10 - 8 = 2 lbs (still pending)
  - Suggested qty accounts for 2 lbs still coming

**Completion**:
- When remaining 2 lbs arrives:
  - PO Item: `quantity_received = 10` → PO → "complete"
  - Order Item: `quantity_received = 10` → status = "received"
  - If all order items received → Order → "complete"

---

## Non-Functional Requirements

### Performance
- Order list should load in < 2 seconds
- Type-to-search should respond in < 300ms
- "Populate Lines" should complete in < 5 seconds even with 100+ items

### Usability
- Mobile-first design (works on tablets in kitchen/receiving)
- Keyboard shortcuts for fast data entry (Tab to next field, Enter to add line)
- Auto-save drafts every 30 seconds

### Data Integrity
- Prevent duplicate orders for same items
- Warn if creating PO for vendor with existing draft PO
- Validate quantities (no negative numbers)
- Require vendor selection before PO submission

---

## Open Questions & Future Enhancements

### Phase 1 (This Feature)
- ✅ All requirements defined above

### Phase 2 (Future)
- **RBAC Implementation**: Enforce role-based permissions
- **Vendor Management UI**: Admin screens to add/edit vendors
- **Email POs to Vendors**: Auto-generate PDF and email
- **Barcode Scanning**: Use device camera for item lookup
- **Order Templates**: Save frequently-used order sets
- **Automated Reordering**: Schedule automatic order creation
- **Vendor Performance Tracking**: On-time delivery %, pricing trends
- **Multi-location Support**: If restaurant has multiple locations

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Order Creation Time | < 5 min for 20-item order | Track time from order start to submit |
| Inventory Accuracy | > 95% match between expected vs actual | Monthly inventory counts |
| Stockout Reduction | < 2 stockouts per month | Track "out of stock" incidents |
| PO Consolidation Rate | > 80% of orders use "Populate Lines" | Track manual vs auto-populated POs |
| Duplicate PO Prevention | 0 duplicate POs | Track PO merging instances |
| User Satisfaction | > 4/5 rating | Monthly user survey |

---

## Dependencies

### External
- Supabase database (already in use)
- Existing ingredient library
- Existing inventory tracking system

### Internal
- Dashboard routing (already exists)
- Authentication system (already exists)
- Inventory par level tracking (already exists)

### New Dependencies
- Vendor management system (to be built)
- Multi-tab state management (new pattern for app)
- Smart consolidation algorithm

---

## Acceptance Criteria Summary

This feature is complete when:

- [ ] Orders can be created with "Populate Lines" pulling low-stock items
- [ ] Custom orders can be created by searching ingredient library
- [ ] New items can be added ad-hoc with Admin approval requirement
- [ ] Multiple orders can be open simultaneously in tabbed interface
- [ ] POs can be generated from orders (all vendors at once OR single vendor)
- [ ] PO generation merges items across orders (smart consolidation)
- [ ] PO generation won't create duplicate POs for same vendor
- [ ] PO line items track source order items
- [ ] Partial fulfillment keeps order items open until fully received
- [ ] Split-view interface matches mockup design
- [ ] Tabbed interface uses hybrid labels (vendor for POs, date/purpose for orders)
- [ ] Item details panel shows full information and allows editing vendor/notes
- [ ] Address capture for Ship To / Bill To on POs
- [ ] Vendor management basic functionality (CRUD vendors)
- [ ] All order and PO statuses flow correctly through lifecycle

---

**Document Status**: Complete
**Ready for**: Sprint Planning
