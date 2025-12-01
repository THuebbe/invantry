# Orders & Purchase Orders UI/UX Design Summary

## Overview

This design package contains the UI components for the Orders and Purchase Orders screens in the Invantry restaurant inventory management system. The design follows your existing patterns (white cards, gray borders, green-600 primary actions) while implementing the split-view layout shown in your wireframes.

---

## Files Created

### Core Components

| File | Purpose |
|------|---------|
| `OrderLineItem.jsx` | Reusable line item card with smart search, UOM handling, and auto-calculation |
| `ItemDetailsPanel.jsx` | Right-side detail panel showing extended item info |
| `AddressInputModal.jsx` | Modal for Ship To / Bill To address entry with "Same as" option |
| `CreateItemModal.jsx` | Modal for creating new items in the ingredient library |

### Content Components

| File | Purpose |
|------|---------|
| `OrdersContent.jsx` | Main Orders screen (replaces current placeholder) |
| `PurchaseOrderContent.jsx` | Main Purchase Order screen |

### Preview Files

| File | Purpose |
|------|---------|
| `OrdersPreview.jsx` | Standalone preview component for testing |
| `OrdersScreenPreview.jsx` | Compact preview for visual reference |

---

## Design Patterns

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Order Header Card                                               │
│  [Order #] [Order Date] [Order Taker] [Required Date]           │
│                                          [POPULATE LINES]        │
├──────────────────────────────────────────┬───────────────────────┤
│                                          │                       │
│  Line Items List                         │  Item Details Panel   │
│  ┌────────────────────────────────────┐  │  ┌─────────────────┐  │
│  │ ◆ 1 │ Item Name │ Qty │ UOM │ ... │  │  │ Item Name       │  │
│  └────────────────────────────────────┘  │  │ Category: Meat  │  │
│  ┌────────────────────────────────────┐  │  │ Pkg Qty: 1      │  │
│  │   2 │ Item Name │ Qty │ UOM │ ... │  │  │ Vendor: Sysco   │  │
│  └────────────────────────────────────┘  │  │ ...             │  │
│                                          │  │ Notes: ________ │  │
│  [+ Add Line Item]                       │  └─────────────────┘  │
│                                          │                       │
└──────────────────────────────────────────┴───────────────────────┘
```

### Component Hierarchy

```
OrdersContent / PurchaseOrderContent
├── Order Header Card
│   ├── Header Fields (Order #, Date, etc.)
│   └── Populate Lines Button
├── Line Items List
│   └── OrderLineItem (repeated)
│       ├── Line Number + Selection Indicator
│       ├── Item Name Search Input
│       ├── Qty Input
│       ├── UOM Dropdown/Lock
│       ├── Cost Input
│       └── Ext Cost (calculated)
└── ItemDetailsPanel
    ├── Item Name Header
    ├── Package Info Section
    ├── Vendor Section (editable)
    ├── Order/PO Linkage Badge
    ├── Identifiers Section
    └── Notes Section (editable)
```

---

## Key Interactions

### Item Search (OrderLineItem)

1. **Type to search**: Start typing in Item Name field
2. **Auto-suggest**: After 3+ characters, matching items appear
3. **Select item**: Click to populate all fields from library
4. **Create new**: If no match, click "Create New Item" button
5. **Double-click**: Opens search modal for browsing

### UOM Behavior

- **Library items**: UOM is locked (shows lock icon)
- **New items**: UOM is editable dropdown
- **Smart combo**: Can type custom UOM for new items

### Line Completion Flow

1. User fills Item Name, Qty, UOM, Cost
2. User presses Tab from Cost field (or Enter)
3. New blank line is auto-added
4. Focus moves to new line's Item Name field

### Selection & Details

- Click anywhere on line item card to select
- Selected line shows green border + diamond indicator (◆)
- Details panel updates to show selected item
- Panel fields are editable (Vendor, Notes)

---

## Data Flow

### Orders Screen

```
Order Header
├── orderNumber (auto-generated on submit)
├── orderDate
├── orderTaker
└── requiredDate

Line Items[]
├── ingredientId (if from library)
├── itemName
├── itemNumber
├── upc
├── qty
├── uom
├── cost
├── category
├── vendor (auto-filled, editable)
├── pkgQty / pkgUom / itemsPerPkg / itemQty / itemUom
├── notes
└── purchaseOrderNumber (set when assigned to PO)
```

### Purchase Order Screen

```
PO Header
├── poNumber (auto-generated on submit)
├── vendorId
├── shipTo (full address object)
├── billTo (full address object)
├── orderDate
└── requiredDate

Line Items[]
├── (same as Orders)
├── sourceOrderNumber (links to originating Order)
├── quoteNumber
└── invoiceNumber (filled at receiving)
```

---

## Styling Reference

### Colors
- Primary: `green-600` (#16a34a)
- Primary Hover: `green-700` (#15803d)
- Selected Border: `green-500` (#22c55e)
- Selected Background: `green-50` (#f0fdf4)
- Card Border: `gray-200` (#e5e7eb)
- Label Text: `gray-500` (#6b7280) uppercase

### Components
- Cards: `bg-white border border-gray-200 rounded-lg p-4/p-6`
- Inputs: `border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500`
- Primary Button: `bg-green-600 text-white rounded-lg hover:bg-green-700`
- Secondary Button: `border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50`
- Disabled Input: `border-gray-200 bg-gray-50 text-gray-400`

### Typography
- Labels: `text-xs font-medium text-gray-500 uppercase tracking-wide`
- Field Values: `text-sm text-gray-900`
- Headings: `text-lg font-bold text-gray-900`

---

## Integration Notes

### Replacing Current OrdersContent

The new `OrdersContent.jsx` is a drop-in replacement for your current placeholder. It expects to be rendered in the same context as your other content components.

### Layout Adjustment

The Orders/PO screens use a different layout than the standard Dashboard (they span both MainContent and MetricsColumn areas). You'll need to:

1. Create a route-specific layout check, OR
2. Create separate `OrdersPage.jsx` and `PurchaseOrderPage.jsx` files that use `Layout` directly with their own content structure

### Mock Data

The components include mock data for:
- `availableItems` - Simulated ingredient library items
- `openOrderItems` - Simulated open order items for PO population

Replace these with actual API calls using your existing hooks pattern (like `useMenuItems`).

### Database Consideration

You mentioned needing to think through the Orders vs Purchase Orders table structure. The components are designed to work with either:

**Option A - Separate Tables:**
- `orders` + `order_items` (internal wishlist)
- `purchase_orders` + `purchase_order_items` (vendor orders)
- Link: `order_items.purchase_order_id` references PO

**Option B - Single Table:**
- `purchase_order_items` with nullable `purchase_order_id`
- Items without PO = open order items
- Items with PO = assigned to vendor order

---

## Next Steps

1. **Review the design** - Let me know if any adjustments needed
2. **Decide on database structure** - Option A or B
3. **Create the API endpoints** - GET/POST for orders, PO population
4. **Wire up the components** - Replace mock data with real API calls
5. **Handle layout** - Integrate with your Dashboard routing

---

Questions? Just ask!
