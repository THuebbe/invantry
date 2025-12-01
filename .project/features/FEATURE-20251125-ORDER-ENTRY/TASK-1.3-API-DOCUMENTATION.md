# TASK-1.3: Quantity Tracking API Documentation

## Overview
API endpoints for quantity-on-order tracking and smart reorder calculations.

---

## Endpoints

### 1. Populate Order Lines

**Endpoint:** `POST /api/orders/populate-lines`

**Description:** Get suggested order lines from low stock items with smart quantity calculations that account for items already on order.

**Authentication:** Required (JWT)

**Request:**
```json
{}
```
*Restaurant ID extracted from authenticated user's business*

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 3,
  "items": [
    {
      "ingredient_id": "550e8400-e29b-41d4-a716-446655440000",
      "ingredient_name": "Chicken Breast",
      "category": "Meat",
      "current_qty": 5,
      "par_level": 20,
      "qty_on_order": 0,
      "suggested_qty": 35,
      "unit": "lbs",
      "estimated_unit_cost": 3.99,
      "preferred_vendor": "Sysco Foods"
    },
    {
      "ingredient_id": "660e8400-e29b-41d4-a716-446655440001",
      "ingredient_name": "Ground Beef",
      "category": "Meat",
      "current_qty": 10,
      "par_level": 30,
      "qty_on_order": 15,
      "suggested_qty": 35,
      "unit": "lbs",
      "estimated_unit_cost": 4.50,
      "preferred_vendor": "US Foods"
    }
  ]
}
```

**Use Case:**
- "Populate Lines" button in order creation form
- Auto-generate order items based on inventory needs
- Display suggested quantities in UI

**Business Logic:**
```
suggested_qty = (par_level * 2) - current_qty - qty_on_order

Where qty_on_order = SUM of unfulfilled quantities from open POs
```

---

### 2. Get Quantity on Order

**Endpoint:** `GET /api/orders/quantity-on-order/:ingredientId`

**Description:** Get the total quantity currently on order for a specific ingredient across all open purchase orders.

**Authentication:** Required (JWT)

**Parameters:**
- `ingredientId` (path) - UUID of the ingredient

**Response:** `200 OK`
```json
{
  "success": true,
  "ingredient_id": "550e8400-e29b-41d4-a716-446655440000",
  "ingredient_name": "Tomatoes",
  "quantity_on_order": 15,
  "unit": "lbs"
}
```

**Error Responses:**

`400 Bad Request` - Invalid UUID format
```json
{
  "error": "Invalid ingredient ID format"
}
```

`404 Not Found` - Ingredient doesn't exist
```json
{
  "error": "Ingredient not found"
}
```

**Use Case:**
- Display current on-order quantity in inventory views
- Show real-time order status
- Prevent over-ordering

**Calculation:**
```sql
SELECT SUM(quantity - COALESCE(quantity_received, 0))
FROM restaurant_order_items
WHERE ingredient_id = :id
  AND status IN ('on_po', 'partially_received')
```

---

### 3. Get Suggested Reorder Quantity

**Endpoint:** `GET /api/orders/suggested-reorder/:ingredientId`

**Description:** Get the suggested reorder quantity for a specific ingredient with full breakdown of calculation.

**Authentication:** Required (JWT)

**Parameters:**
- `ingredientId` (path) - UUID of the ingredient

**Response:** `200 OK`
```json
{
  "success": true,
  "ingredient_name": "Ground Beef",
  "ingredient_id": "550e8400-e29b-41d4-a716-446655440000",
  "suggested_qty": 35,
  "current_qty": 10,
  "par_level": 30,
  "qty_on_order": 15,
  "unit": "lbs"
}
```

**Error Responses:**

`400 Bad Request` - Invalid UUID format
```json
{
  "error": "Invalid ingredient ID format"
}
```

`404 Not Found` - Ingredient doesn't exist
```json
{
  "error": "Ingredient not found"
}
```

**Use Case:**
- Individual ingredient reorder suggestions
- Show calculation breakdown to users
- Manual order creation assistance

**Formula:**
```
suggested_qty = (par_level * 2) - current_qty - qty_on_order

If result < 0, return 0
If par_level is NULL, return 0
```

---

### 4. Receive Purchase Order Items

**Endpoint:** `POST /api/orders/purchase-orders/:id/receive`

**Description:** Receive items for a purchase order (supports partial and full receiving). Updates quantity tracking and order item statuses.

**Authentication:** Required (JWT)

**Parameters:**
- `id` (path) - UUID of the purchase order

**Request:**
```json
{
  "items": [
    {
      "item_id": "770e8400-e29b-41d4-a716-446655440000",
      "quantity_received": 30,
      "expiration_date": "2025-12-31",
      "batch_number": "BATCH-001"
    },
    {
      "item_id": "880e8400-e29b-41d4-a716-446655440001",
      "quantity_received": 50
    }
  ]
}
```

**Field Descriptions:**
- `item_id` (required) - UUID of the purchase_order_item
- `quantity_received` (required) - Quantity being received (number > 0)
- `expiration_date` (optional) - ISO date string
- `batch_number` (optional) - String identifier

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Items received successfully",
  "purchaseOrder": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "order_number": "PO-2025-001",
    "status": "backordered",
    "supplier_name": "Sysco Foods",
    "purchase_order_items": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "ingredient_id": "550e8400-e29b-41d4-a716-446655440000",
        "quantity_ordered": 50,
        "quantity_received": 30,
        "unit": "lbs",
        "unit_price": 3.99,
        "ingredient": {
          "name": "Chicken Breast",
          "category": "Meat"
        }
      }
    ]
  }
}
```

**Error Responses:**

`400 Bad Request` - Validation error
```json
{
  "error": "Each item must have a positive quantity_received"
}
```

`403 Forbidden` - PO doesn't belong to user's restaurant
```json
{
  "error": "Access denied"
}
```

`404 Not Found` - PO doesn't exist
```json
{
  "error": "Purchase order not found"
}
```

**Status Updates:**

The endpoint automatically updates statuses:

**For PO Items:**
- Increases `quantity_received` by amount received
- Triggers database function to update PO status

**For Restaurant Order Items:**
- Updates `quantity_received` field
- Status transitions:
  - `on_po` → `partially_received` (when qty > 0 but < qty_on_po)
  - `partially_received` → `received` (when qty >= qty_on_po)

**Use Case:**
- Receiving workflow in PO management
- Partial shipment tracking
- Inventory reconciliation

---

## Database Functions Used

### 1. `get_ingredient_quantity_on_order(ingredient_id, restaurant_id)`
- Returns: NUMERIC
- Purpose: Sum unfulfilled quantities from open orders/POs
- Used by: quantity-on-order endpoint

### 2. `calculate_suggested_reorder_quantity(ingredient_id, restaurant_id)`
- Returns: NUMERIC
- Purpose: Calculate smart reorder quantity
- Formula: (par * 2) - current - on_order
- Used by: suggested-reorder endpoint

### 3. `get_low_stock_items(restaurant_id)`
- Returns: TABLE with ingredient details, quantities, vendor info
- Purpose: Get all low stock items with suggestions
- Used by: populate-lines endpoint

---

## Integration Examples

### Frontend: Populate Order Lines

```javascript
async function populateOrderLines() {
  try {
    const response = await fetch('/api/orders/populate-lines', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      // Populate order form with suggested items
      data.items.forEach(item => {
        addOrderLine({
          ingredientId: item.ingredient_id,
          name: item.ingredient_name,
          quantity: item.suggested_qty,
          unit: item.unit,
          cost: item.estimated_unit_cost
        });
      });
    }
  } catch (error) {
    console.error('Failed to populate lines:', error);
  }
}
```

### Frontend: Check Quantity on Order

```javascript
async function checkQuantityOnOrder(ingredientId) {
  try {
    const response = await fetch(
      `/api/orders/quantity-on-order/${ingredientId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (data.success) {
      displayTooltip(`${data.quantity_on_order} ${data.unit} on order`);
    }
  } catch (error) {
    console.error('Failed to fetch quantity:', error);
  }
}
```

### Frontend: Receive PO Items

```javascript
async function receivePOItems(poId, receivedItems) {
  try {
    const response = await fetch(
      `/api/orders/purchase-orders/${poId}/receive`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: receivedItems })
      }
    );

    const data = await response.json();

    if (data.success) {
      showNotification('Items received successfully');
      refreshPOView(data.purchaseOrder);
    }
  } catch (error) {
    console.error('Failed to receive items:', error);
  }
}

// Example usage
receivePOItems('po-uuid', [
  {
    item_id: 'item-uuid-1',
    quantity_received: 30,
    expiration_date: '2025-12-31',
    batch_number: 'BATCH-001'
  }
]);
```

---

## Performance Considerations

### Caching Strategy
- `quantity-on-order`: Can be cached for 5 minutes (frequently changing)
- `suggested-reorder`: Can be cached for 15 minutes (less critical)
- `populate-lines`: Should not be cached (real-time data)

### Rate Limiting
Recommended limits:
- `populate-lines`: 10 requests/minute per user
- `quantity-on-order`: 60 requests/minute per user
- `suggested-reorder`: 60 requests/minute per user
- `receive`: 20 requests/minute per user

### Database Performance
- All endpoints use indexed queries
- Database functions marked as STABLE
- Expected response times:
  - populate-lines: 200-300ms (100+ items)
  - quantity-on-order: < 100ms
  - suggested-reorder: < 150ms
  - receive: 200-500ms (depends on item count)

---

## Security Notes

### Authentication
- All endpoints require valid JWT token
- Token must contain valid businessId
- Restaurant ownership verified for all operations

### Authorization
- Users can only access their restaurant's data
- PO receiving validates ownership before processing
- Ingredient lookups scoped to restaurant

### Data Validation
- UUID format validation on all ID parameters
- Positive number validation on quantities
- Array length validation (not empty)
- SQL injection prevention via parameterized queries

---

## Migration Requirements

Before using these endpoints, ensure:

1. Database migration-008 has been applied
2. Database functions exist and are accessible
3. Tables have new columns:
   - `restaurant_order_items.quantity_on_po`
   - `restaurant_order_items.quantity_received`
4. Status enum includes: 'on_po', 'partially_received', 'received'

---

## Testing Checklist

- [ ] Test populate-lines with 0 low stock items
- [ ] Test populate-lines with 50+ low stock items
- [ ] Test quantity-on-order with no orders
- [ ] Test quantity-on-order with multiple POs
- [ ] Test suggested-reorder with no par level
- [ ] Test suggested-reorder with negative result
- [ ] Test receive with partial quantities
- [ ] Test receive with full quantities
- [ ] Test receive with invalid item IDs
- [ ] Test all endpoints with invalid authentication
- [ ] Test all endpoints with wrong restaurant access

---

**Document Version:** 1.0
**Last Updated:** 2025-11-25
**Author:** backend-specialist
