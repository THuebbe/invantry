# PO Receiving Workflow API Documentation

## Overview

The PO Receiving Workflow enables restaurant staff to receive purchase order deliveries with support for:

- **Full Receipt**: Receive all ordered items at once
- **Partial Receipt**: Receive subset of ordered items
- **Multiple Partial Receipts**: Cumulative receiving over multiple deliveries
- **Proportional Distribution**: Automatically distribute received quantities to source order items
- **Over-Receive Prevention**: Validation to prevent receiving more than ordered
- **Status Tracking**: Automatic status updates for POs, PO items, orders, and order items
- **Inventory Integration**: Automatic inventory updates with received quantities

---

## API Endpoints

### 1. Receive PO Items

**Endpoint:** `POST /api/orders/purchase-orders/:id/receive`

**Description:** Receive items for a purchase order with partial fulfillment support.

**Authentication:** Required (JWT token)

**Request Parameters:**

- `id` (path parameter) - Purchase Order UUID

**Request Body:**

```json
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
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| items | Array | Yes | Array of items being received |
| items[].po_item_id | UUID | Yes | PO line item UUID from purchase_order_items table |
| items[].quantity_received | Number | Yes | Quantity being received in this delivery (must be > 0) |
| items[].expiration_date | Date | No | Expiration date for perishable items (YYYY-MM-DD) |
| items[].batch_number | String | No | Batch/lot number for traceability |

**Validation Rules:**

- `quantity_received` must be greater than 0
- Cannot receive more than ordered (cumulative validation)
- PO must not be in "cancelled" status
- PO must belong to authenticated user's restaurant

**Success Response (200):**

```json
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

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Operation success indicator |
| po_id | UUID | Purchase Order ID |
| po_number | String | Purchase Order number (e.g., PO-2025-0001) |
| status | String | Updated PO status: "backordered" or "complete" |
| items_received | Array | Details of each received item |
| items_received[].status | String | Item status: "partial" or "complete" |
| items_received[].remaining | Number | Quantity still pending (ordered - received) |
| orders_updated | Array | Source orders that were completed by this receipt |
| inventory_updated | Boolean | Whether inventory was successfully updated |

**Error Responses:**

**400 Bad Request - Invalid Input:**
```json
{
  "success": false,
  "error": "Items array is required and must not be empty"
}
```

**400 Bad Request - Over-Receiving:**
```json
{
  "success": false,
  "error": "Cannot receive 15 lbs - only 10 lbs remaining to receive"
}
```

**400 Bad Request - Cannot Receive on Cancelled PO:**
```json
{
  "success": false,
  "error": "Cannot receive items on cancelled PO"
}
```

**403 Forbidden - Restaurant Mismatch:**
```json
{
  "success": false,
  "error": "Purchase order does not belong to this restaurant"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Purchase order not found"
}
```

**Example Usage:**

```javascript
// Full receipt - receive all items
const fullReceipt = await fetch('/api/orders/purchase-orders/po-uuid/receive', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [
      { po_item_id: 'item1-uuid', quantity_received: 10 },
      { po_item_id: 'item2-uuid', quantity_received: 5 }
    ]
  })
});

// Partial receipt with expiration tracking
const partialReceipt = await fetch('/api/orders/purchase-orders/po-uuid/receive', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [
      {
        po_item_id: 'item1-uuid',
        quantity_received: 6.5,
        expiration_date: '2025-12-31',
        batch_number: 'BATCH-001'
      }
    ]
  })
});
```

---

### 2. Get Receiving Status

**Endpoint:** `GET /api/orders/purchase-orders/:id/receiving-status`

**Description:** Get current receiving progress for a purchase order.

**Authentication:** Required (JWT token)

**Request Parameters:**

- `id` (path parameter) - Purchase Order UUID

**Success Response (200):**

```json
{
  "po_id": "uuid",
  "po_number": "PO-2025-0001",
  "status": "backordered",
  "order_date": "2025-11-26T10:00:00Z",
  "expected_delivery": "2025-11-28",
  "items": [
    {
      "po_item_id": "uuid",
      "item_name": "Chicken Breast",
      "quantity_ordered": 10,
      "quantity_received": 6.5,
      "remaining": 3.5,
      "percent_complete": 65
    }
  ],
  "overall_percent_complete": 65
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| po_id | UUID | Purchase Order ID |
| po_number | String | Purchase Order number |
| status | String | Current PO status |
| order_date | ISO 8601 | When PO was created |
| expected_delivery | Date | Expected delivery date |
| items | Array | Status of each line item |
| items[].percent_complete | Integer | Percentage received (0-100) |
| overall_percent_complete | Integer | Overall PO completion percentage |

**Error Response:**

**404 Not Found:**
```json
{
  "error": "Purchase order not found"
}
```

**Example Usage:**

```javascript
const status = await fetch('/api/orders/purchase-orders/po-uuid/receiving-status', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await status.json();
console.log(`Overall completion: ${data.overall_percent_complete}%`);
```

---

### 3. Update PO Status Manually

**Endpoint:** `PUT /api/orders/purchase-orders/:id/status`

**Description:** Manually update purchase order status (for cancellations).

**Authentication:** Required (JWT token)

**Request Parameters:**

- `id` (path parameter) - Purchase Order UUID

**Request Body:**

```json
{
  "status": "cancelled",
  "notes": "Supplier unable to fulfill order"
}
```

**Valid Statuses:**

- `draft` - Initial state before sending to vendor
- `backordered` - Partially received or sent to vendor
- `complete` - All items fully received
- `cancelled` - Order cancelled

**Success Response (200):**

```json
{
  "success": true,
  "message": "PO status updated to cancelled",
  "purchaseOrder": {
    "id": "uuid",
    "order_number": "PO-2025-0001",
    "status": "cancelled",
    "notes": "Supplier unable to fulfill order",
    "updated_at": "2025-11-26T10:30:00Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "Invalid status. Must be one of: draft, backordered, complete, cancelled"
}
```

**404 Not Found:**
```json
{
  "error": "Purchase order not found"
}
```

**Example Usage:**

```javascript
// Cancel a PO
const cancelPO = await fetch('/api/orders/purchase-orders/po-uuid/status', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'cancelled',
    notes: 'Vendor out of stock'
  })
});
```

---

## Business Logic Details

### Proportional Distribution Algorithm

When a PO line item consolidates multiple source order items, received quantities are distributed proportionally:

**Example:**

- **Order A** needs 6 lbs chicken
- **Order B** needs 4 lbs chicken
- **PO Line** consolidates to 10 lbs total

**Receiving 8 lbs:**

- Order A receives: (6/10) × 8 = **4.8 lbs**
- Order B receives: (4/10) × 8 = **3.2 lbs**

**Implementation:**

```javascript
const totalOrdered = sourceItems.reduce((sum, item) => sum + item.quantity_on_po, 0);

for (const sourceItem of sourceItems) {
  const proportion = sourceItem.quantity_on_po / totalOrdered;
  const distributedQty = receivedQty * proportion;

  // Update source order item
  await updateOrderItemReceived(sourceItem.id, distributedQty);
}
```

### Status Transition Rules

**PO Status:**

- `draft` → `backordered` (on first receipt)
- `backordered` → `complete` (when all items fully received)
- Any status → `cancelled` (manual cancellation)

**PO Item Status:**

- Not explicitly tracked (uses quantity_received vs quantity_ordered)
- `partial`: 0 < quantity_received < quantity_ordered
- `complete`: quantity_received >= quantity_ordered

**Order Item Status:**

- `pending` → `on_po` (when added to PO)
- `on_po` → `partially_received` (0 < quantity_received < quantity_on_po)
- `partially_received` → `received` (quantity_received >= quantity_on_po)

**Order Status:**

- `submitted` → `open` (when all items added to POs)
- `open` → `complete` (when all items fully received)

### Inventory Updates

Received items automatically update restaurant_inventory:

```javascript
// If inventory item exists
const newQuantity = existing.quantity + receivedQty;
UPDATE restaurant_inventory
SET quantity = newQuantity,
    last_restocked = NOW(),
    expiration_date = received.expiration_date

// If inventory item doesn't exist
INSERT INTO restaurant_inventory (
  restaurant_id, ingredient_id, quantity, unit, expiration_date
)
```

### Validation Rules

**1. Quantity Validation:**

```javascript
const currentReceived = parseFloat(poItem.quantity_received || 0);
const newTotalReceived = currentReceived + receivedQty;
const quantityOrdered = parseFloat(poItem.quantity_ordered);

if (newTotalReceived > quantityOrdered) {
  throw new Error(`Cannot receive ${receivedQty} - only ${quantityOrdered - currentReceived} remaining`);
}
```

**2. Status Validation:**

```javascript
if (po.status === 'cancelled') {
  throw new Error('Cannot receive items on cancelled PO');
}

if (po.status === 'complete') {
  throw new Error('PO is already complete - all items received');
}
```

**3. Restaurant Ownership:**

```javascript
if (po.restaurant_id !== authenticatedRestaurantId) {
  throw new Error('Purchase order does not belong to this restaurant');
}
```

---

## Database Schema

### Tables Involved

**purchase_orders:**
```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  supplier_name VARCHAR(255),
  order_date TIMESTAMP,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  subtotal NUMERIC(10, 2),
  tax NUMERIC(10, 2),
  total NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**purchase_order_items:**
```sql
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY,
  purchase_order_id UUID REFERENCES purchase_orders(id),
  ingredient_id UUID REFERENCES ingredient_library(id),
  item_name VARCHAR(255),
  quantity_ordered NUMERIC(10, 4) NOT NULL,
  quantity_received NUMERIC(10, 4) DEFAULT 0,
  unit VARCHAR(50),
  unit_price NUMERIC(10, 2),
  line_total NUMERIC(10, 2),
  expiration_date DATE,
  batch_number VARCHAR(100),
  source_order_item_ids UUID[] DEFAULT ARRAY[]::UUID[]
);

CREATE INDEX idx_po_items_source_order_items
ON purchase_order_items USING GIN(source_order_item_ids);
```

**restaurant_order_items:**
```sql
CREATE TABLE restaurant_order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES restaurant_orders(id),
  ingredient_id UUID,
  item_name VARCHAR(255),
  quantity NUMERIC(10, 4),
  quantity_on_po NUMERIC(10, 4) DEFAULT 0,
  quantity_received NUMERIC(10, 4) DEFAULT 0,
  unit VARCHAR(50),
  estimated_unit_cost NUMERIC(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  po_id UUID REFERENCES purchase_orders(id),
  po_number VARCHAR(50)
);
```

---

## Performance Considerations

### Optimizations Implemented

1. **GIN Index on source_order_item_ids**: Fast array lookups for consolidated items
2. **Batch Updates**: Single transaction for all status updates
3. **Selective Field Updates**: Only update changed fields
4. **Connection Pooling**: Efficient database connection management

### Performance Targets

| Operation | Items | Target Time |
|-----------|-------|-------------|
| Receive 10 items | 10 | < 2 seconds |
| Receive 50 items | 50 | < 5 seconds |
| Receive 100 items | 100 | < 10 seconds |

### Scaling Considerations

- For high-volume operations, consider batch receiving API
- Use queue system for inventory updates if processing > 100 items
- Implement pagination for receiving status endpoint with large POs

---

## Error Handling

### Common Errors and Solutions

**Error:** "Cannot receive X units - only Y units remaining"

- **Cause:** Attempting to receive more than ordered
- **Solution:** Check current received quantity and adjust input

**Error:** "Purchase order does not belong to this restaurant"

- **Cause:** PO belongs to different restaurant
- **Solution:** Verify authenticated user's restaurant ID matches PO

**Error:** "Cannot receive items on cancelled PO"

- **Cause:** PO was cancelled
- **Solution:** Update PO status back to 'draft' or 'backordered' before receiving

**Error:** "PO item not found"

- **Cause:** Invalid po_item_id in request
- **Solution:** Verify po_item_id exists and belongs to specified PO

---

## Testing

### Test Scenarios

Run the comprehensive test suite:

```bash
cd backend
node src/tests/receiving-workflow.test.js
```

**Test Coverage:**

1. ✅ Full receipt (all items at once)
2. ✅ Partial receipt (some items)
3. ✅ Multiple partial receipts (cumulative)
4. ✅ Consolidated item distribution (proportional)
5. ✅ Over-receive prevention (validation error)
6. ✅ Status transitions (all states)
7. ✅ Inventory updates (quantities verified)
8. ✅ Zero quantity items (skipped)

### Manual Testing

**Test 1: Full Receipt**

```bash
curl -X POST http://localhost:3001/api/orders/purchase-orders/{po-id}/receive \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"po_item_id": "uuid", "quantity_received": 10}
    ]
  }'
```

**Test 2: Partial Receipt**

```bash
curl -X POST http://localhost:3001/api/orders/purchase-orders/{po-id}/receive \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"po_item_id": "uuid", "quantity_received": 6.5}
    ]
  }'
```

**Test 3: Check Status**

```bash
curl http://localhost:3001/api/orders/purchase-orders/{po-id}/receiving-status \
  -H "Authorization: Bearer {token}"
```

---

## Integration Guide

### Frontend Integration

**Step 1: Fetch PO Details**

```javascript
const po = await api.get(`/orders/purchase-orders/${poId}`);
```

**Step 2: Display Receiving Form**

```jsx
<ReceivingForm>
  {po.items.map(item => (
    <ItemRow key={item.id}>
      <span>{item.ingredient_name}</span>
      <input
        type="number"
        max={item.quantity_ordered - item.quantity_received}
        placeholder="Qty Received"
      />
      <input type="date" placeholder="Expiration" />
    </ItemRow>
  ))}
  <button onClick={handleReceive}>Receive Items</button>
</ReceivingForm>
```

**Step 3: Submit Receiving**

```javascript
async function handleReceive(receivedItems) {
  try {
    const result = await api.post(
      `/orders/purchase-orders/${poId}/receive`,
      { items: receivedItems }
    );

    if (result.status === 'complete') {
      showNotification('PO fully received!');
    } else {
      showNotification(`Received ${result.items_received.length} items`);
    }
  } catch (error) {
    showError(error.message);
  }
}
```

---

## Changelog

### Version 1.0 (2025-11-26)

- ✅ Initial implementation of receiving workflow
- ✅ Proportional distribution for consolidated items
- ✅ Status tracking for POs, items, and orders
- ✅ Automatic inventory updates
- ✅ Over-receive prevention
- ✅ Multiple partial receipt support
- ✅ Expiration date and batch number tracking
- ✅ Comprehensive test suite
- ✅ API documentation

---

## Support

For issues or questions:

- Check the test suite for example usage
- Review error messages for specific validation failures
- Verify database schema matches expected structure
- Ensure migrations are applied correctly

---

## License

Internal use only - Invantry Restaurant Inventory System
