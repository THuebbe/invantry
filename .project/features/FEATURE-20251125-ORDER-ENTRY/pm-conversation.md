# Product Manager Conversation Log
## Feature: Order Entry & Purchase Order Management

**Feature ID**: FEATURE-20251125-ORDER-ENTRY
**Status**: Exploration
**Initiated**: 2025-11-25

---

## Initial Context

User has provided:
- Complete design mockups in `.order_screens_examples/` folder
- Design summary document (ORDERS_DESIGN_SUMMARY.md)
- Component files ready for integration:
  - OrderLineItem.jsx
  - ItemDetailsPanel.jsx
  - AddressInputModal.jsx
  - CreateItemModal.jsx
  - OrdersContent.jsx
  - PurchaseOrderContent.jsx

### Design Overview from Summary

**Layout Pattern**: Split-view with line items list on left, item details panel on right

**Key Components**:
1. Order Header (Order #, Date, Taker, Required Date)
2. Line Items List (searchable, auto-add new lines)
3. Item Details Panel (shows extended info for selected item)
4. Modals for address input and item creation

**Core Interactions**:
- Type-to-search for items from ingredient library
- Auto-suggest after 3+ characters
- Click to select line item, shows details in right panel
- UOM locked for library items, editable for new items
- Auto-add new line on completion (Tab/Enter from Cost field)

**Data Architecture Question**:
- Need to decide: Separate tables (orders + purchase_orders) vs. Single table with nullable PO ID
- Orders = internal wishlist/requisition
- Purchase Orders = vendor-specific orders with shipping/billing info

---

## Conversation Log

### [2025-11-25 17:08] - Feature Initialization

**PM**: Feature initialized. Reading design summary to understand the vision...

