# PO Receiving Workflow - Visual Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PO RECEIVING WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

  Frontend                API                Service Layer        Database
     │                     │                      │                  │
     │  POST /receive      │                      │                  │
     ├────────────────────>│                      │                  │
     │                     │  Validate Request    │                  │
     │                     ├─────────────────────>│                  │
     │                     │                      │                  │
     │                     │                      │  Get PO          │
     │                     │                      ├─────────────────>│
     │                     │                      │<─────────────────┤
     │                     │                      │                  │
     │                     │                      │  Validate Status │
     │                     │                      │  & Ownership     │
     │                     │                      │                  │
     │                     │                      │  Update PO Items │
     │                     │                      ├─────────────────>│
     │                     │                      │                  │
     │                     │  Distribute to       │                  │
     │                     │  Source Order Items  │                  │
     │                     │                      ├───┐              │
     │                     │                      │   │ Calculate    │
     │                     │                      │   │ Proportional │
     │                     │                      │<──┘ Distribution │
     │                     │                      │                  │
     │                     │                      │  Update Order    │
     │                     │                      │  Items           │
     │                     │                      ├─────────────────>│
     │                     │                      │                  │
     │                     │                      │  Check Status    │
     │                     │                      │  Transitions     │
     │                     │                      │                  │
     │                     │                      │  Update PO       │
     │                     │                      │  Status          │
     │                     │                      ├─────────────────>│
     │                     │                      │                  │
     │                     │                      │  Update Inventory│
     │                     │                      ├─────────────────>│
     │                     │                      │                  │
     │                     │<─────────────────────┤                  │
     │<────────────────────┤                      │                  │
     │  Result with        │                      │                  │
     │  Status             │                      │                  │
     │                     │                      │                  │
```

---

## Proportional Distribution Algorithm

```
┌───────────────────────────────────────────────────────────────┐
│              PROPORTIONAL DISTRIBUTION                        │
└───────────────────────────────────────────────────────────────┘

Example: PO consolidates 2 orders for the same ingredient

Order A needs:  6 lbs  ─┐
Order B needs:  4 lbs  ─┼──> PO Line: 10 lbs total
                        └─────────────────────────┐
                                                  │
                        Delivery arrives: 8 lbs  │
                                                  │
                                                  ▼
                        ┌─────────────────────────────┐
                        │  Calculate Proportions      │
                        │                             │
                        │  Order A: 6/10 = 60%        │
                        │  Order B: 4/10 = 40%        │
                        └─────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │  Distribute Received        │
                        │                             │
                        │  Order A: 60% × 8 = 4.8 lbs │
                        │  Order B: 40% × 8 = 3.2 lbs │
                        └─────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │  Update Order Items         │
                        │                             │
                        │  Order A: 4.8/6 = 80% done  │
                        │  Order B: 3.2/4 = 80% done  │
                        │                             │
                        │  Both: partially_received   │
                        └─────────────────────────────┘
```

---

## Status Transition Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                  PO STATUS TRANSITIONS                        │
└───────────────────────────────────────────────────────────────┘

     ┌──────────┐
     │  draft   │  Initial state
     └────┬─────┘
          │ First receipt
          ▼
   ┌─────────────┐
   │ backordered │  Partial or sent to vendor
   └─────┬───────┘
         │ All items received
         ▼
    ┌──────────┐
    │ complete │  Fully received
    └──────────┘

         ┌──────────────┐
         │  cancelled   │  Manual cancellation (from any state)
         └──────────────┘


┌───────────────────────────────────────────────────────────────┐
│                ORDER ITEM STATUS TRANSITIONS                  │
└───────────────────────────────────────────────────────────────┘

   ┌─────────┐
   │ pending │  Initial state
   └────┬────┘
        │ Added to PO
        ▼
    ┌──────┐
    │ on_po│
    └───┬──┘
        │ First receipt (qty_received > 0)
        ▼
┌─────────────────────┐
│ partially_received  │
└──────────┬──────────┘
           │ Full receipt (qty_received >= qty_on_po)
           ▼
      ┌──────────┐
      │ received │
      └──────────┘


┌───────────────────────────────────────────────────────────────┐
│                  ORDER STATUS TRANSITIONS                     │
└───────────────────────────────────────────────────────────────┘

   ┌───────────┐
   │ submitted │  Initial state
   └─────┬─────┘
         │ All items on PO
         ▼
     ┌──────┐
     │ open │
     └───┬──┘
         │ All items received
         ▼
   ┌──────────┐
   │ complete │
   └──────────┘
```

---

## Full vs Partial vs Multiple Receipts

```
┌───────────────────────────────────────────────────────────────┐
│                    FULL RECEIPT                               │
└───────────────────────────────────────────────────────────────┘

PO: 10 units ordered
      │
      │ Receive: 10 units (100%)
      ▼
   Result:
   ✓ quantity_ordered: 10
   ✓ quantity_received: 10
   ✓ remaining: 0
   ✓ status: complete


┌───────────────────────────────────────────────────────────────┐
│                   PARTIAL RECEIPT                             │
└───────────────────────────────────────────────────────────────┘

PO: 20 units ordered
      │
      │ Receive: 12 units (60%)
      ▼
   Result:
   ✓ quantity_ordered: 20
   ✓ quantity_received: 12
   ✓ remaining: 8
   ✓ status: backordered


┌───────────────────────────────────────────────────────────────┐
│              MULTIPLE PARTIAL RECEIPTS                        │
└───────────────────────────────────────────────────────────────┘

PO: 30 units ordered
      │
      │ Receipt #1: 10 units
      ├─────────────────────> quantity_received: 10, remaining: 20
      │
      │ Receipt #2: 15 units
      ├─────────────────────> quantity_received: 25, remaining: 5
      │                        (cumulative: 10 + 15)
      │
      │ Receipt #3: 5 units
      └─────────────────────> quantity_received: 30, remaining: 0
                               status: complete
```

---

## Database Update Flow

```
┌───────────────────────────────────────────────────────────────┐
│              DATABASE UPDATES ON RECEIVING                    │
└───────────────────────────────────────────────────────────────┘

1. purchase_order_items
   ├─ quantity_received ← ADD received amount (cumulative)
   ├─ expiration_date ← SET from input
   ├─ batch_number ← SET from input
   └─ updated_at ← NOW()

2. restaurant_order_items (for each source item)
   ├─ quantity_received ← ADD proportional amount
   ├─ status ← CALC (on_po → partially_received → received)
   └─ updated_at ← NOW()

3. purchase_orders (if all items received)
   ├─ status ← 'complete'
   ├─ actual_delivery_date ← TODAY()
   └─ updated_at ← NOW()

4. restaurant_orders (if all items received)
   ├─ status ← 'complete'
   └─ updated_at ← NOW()

5. restaurant_inventory
   ├─ quantity ← ADD received amount
   ├─ last_restocked ← NOW()
   ├─ expiration_date ← SET from PO item
   └─ updated_at ← NOW()
```

---

## Error Handling Flow

```
┌───────────────────────────────────────────────────────────────┐
│                    ERROR VALIDATION                           │
└───────────────────────────────────────────────────────────────┘

Request Input
     │
     ├─> Validate: Items array not empty?
     │      NO → 400: "Items array is required"
     │      YES ↓
     │
     ├─> Validate: Each item has po_item_id?
     │      NO → 400: "Each item must have po_item_id"
     │      YES ↓
     │
     ├─> Validate: quantity_received > 0?
     │      NO → 400: "Quantity must be positive"
     │      YES ↓
     │
     ├─> Validate: PO exists?
     │      NO → 404: "Purchase order not found"
     │      YES ↓
     │
     ├─> Validate: PO belongs to restaurant?
     │      NO → 403: "Does not belong to restaurant"
     │      YES ↓
     │
     ├─> Validate: PO not cancelled?
     │      NO → 400: "Cannot receive on cancelled PO"
     │      YES ↓
     │
     ├─> Validate: Not over-receiving?
     │      NO → 400: "Cannot receive X - only Y remaining"
     │      YES ↓
     │
     └─> Process receiving ✓
```

---

## API Request/Response Flow

```
┌───────────────────────────────────────────────────────────────┐
│                 API REQUEST/RESPONSE                          │
└───────────────────────────────────────────────────────────────┘

REQUEST:
POST /api/orders/purchase-orders/:id/receive

{
  "items": [
    {
      "po_item_id": "uuid",
      "quantity_received": 8.5,
      "expiration_date": "2025-12-31",
      "batch_number": "LOT-123"
    }
  ]
}
     │
     │ Process receiving
     ▼

RESPONSE (200 OK):
{
  "success": true,
  "po_id": "uuid",
  "po_number": "PO-2025-0001",
  "status": "backordered",
  "items_received": [
    {
      "po_item_id": "uuid",
      "item_name": "Chicken Breast",
      "quantity_ordered": 10,
      "quantity_received": 8.5,
      "remaining": 1.5,
      "status": "partial"
    }
  ],
  "orders_updated": [
    {
      "order_id": "uuid",
      "order_number": "ORD-001",
      "status": "complete"
    }
  ],
  "inventory_updated": true
}
```

---

## Integration Points

```
┌───────────────────────────────────────────────────────────────┐
│                  SYSTEM INTEGRATION                           │
└───────────────────────────────────────────────────────────────┘

Frontend UI
    │
    ├─> Receiving Form Component
    │   ├─ Display PO items
    │   ├─ Input received quantities
    │   ├─ Input expiration dates
    │   └─ Submit receiving
    │
    ├─> PO List View
    │   ├─ Show receiving status
    │   └─ Filter by completion
    │
    └─> Inventory View
        └─ Show updated quantities
            │
            ▼
Backend API
    │
    ├─> POST /receive
    │   └─ Process receiving
    │
    ├─> GET /receiving-status
    │   └─ Return progress
    │
    └─> PUT /status
        └─ Manual updates
            │
            ▼
Database
    │
    ├─> purchase_orders
    ├─> purchase_order_items
    ├─> restaurant_order_items
    ├─> restaurant_orders
    └─> restaurant_inventory
```

---

## Key Points Summary

1. **Proportional Distribution** - Automatically splits received quantities based on original order proportions
2. **Cumulative Tracking** - Multiple receipts add to total received (not replace)
3. **Status Automation** - PO, items, and orders update automatically
4. **Over-Receive Prevention** - Validation prevents receiving more than ordered
5. **Inventory Integration** - Quantities update automatically with timestamps
6. **Audit Trail** - All updates logged with timestamps and user IDs

---

**Generated by:** backend-specialist
**Date:** 2025-11-26
