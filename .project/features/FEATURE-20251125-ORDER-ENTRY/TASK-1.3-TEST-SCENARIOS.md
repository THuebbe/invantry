# TASK-1.3: Quantity Tracking Business Logic - Test Scenarios

## Overview
Test scenarios for the quantity-on-order tracking system and smart reorder calculation logic.

## Test Scenario 1: Simple Low Stock (No Items on Order)

**Setup:**
- Ingredient: Chicken Breast
- Current quantity: 5 lbs
- Par level (minimum_quantity): 20 lbs
- Quantity on order: 0 lbs

**Expected Result:**
```
Suggested quantity = (20 * 2) - 5 - 0 = 35 lbs
```

**API Call:**
```bash
GET /api/orders/suggested-reorder/{ingredientId}
```

**Expected Response:**
```json
{
  "success": true,
  "ingredient_name": "Chicken Breast",
  "ingredient_id": "uuid",
  "suggested_qty": 35,
  "current_qty": 5,
  "par_level": 20,
  "qty_on_order": 0,
  "unit": "lbs"
}
```

---

## Test Scenario 2: Items Already on Order

**Setup:**
- Ingredient: Tomatoes
- Current quantity: 10 lbs
- Par level: 30 lbs
- Quantity on existing PO: 15 lbs (not yet received)

**Expected Result:**
```
Suggested quantity = (30 * 2) - 10 - 15 = 35 lbs
```

**API Call:**
```bash
GET /api/orders/quantity-on-order/{ingredientId}
```

**Expected Response:**
```json
{
  "success": true,
  "ingredient_id": "uuid",
  "ingredient_name": "Tomatoes",
  "quantity_on_order": 15,
  "unit": "lbs"
}
```

---

## Test Scenario 3: Partial Fulfillment

**Setup:**
- Ingredient: Ground Beef
- Ordered: 50 lbs on PO
- Received so far: 30 lbs
- Outstanding: 20 lbs
- Current inventory: 25 lbs
- Par level: 40 lbs

**Expected Result:**
```
qty_on_order = 50 - 30 = 20 lbs (unfulfilled)
suggested_qty = (40 * 2) - 25 - 20 = 35 lbs
```

**Workflow:**
1. Create order item with 50 lbs
2. Assign to PO (quantity_on_po = 50)
3. Receive 30 lbs (quantity_received = 30, status = "partially_received")
4. Check quantity on order (should be 20 lbs)

---

## Test Scenario 4: Multiple Open Orders

**Setup:**
- Ingredient: Lettuce
- Order 1: 10 lbs (status: on_po, received: 0)
- Order 2: 15 lbs (status: on_po, received: 5)
- Current inventory: 8 lbs
- Par level: 25 lbs

**Expected Result:**
```
qty_on_order = (10 - 0) + (15 - 5) = 20 lbs
suggested_qty = (25 * 2) - 8 - 20 = 22 lbs
```

**Database Query:**
```sql
SELECT SUM(quantity - COALESCE(quantity_received, 0))
FROM restaurant_order_items
WHERE ingredient_id = :ingredient_id
  AND restaurant_id = :restaurant_id
  AND status IN ('on_po', 'partially_received')
```

---

## Test Scenario 5: Fully Received PO

**Setup:**
- Ingredient: Onions
- PO quantity: 40 lbs
- Received: 40 lbs (fully received)
- Current inventory: 35 lbs
- Par level: 30 lbs

**Expected Result:**
```
qty_on_order = 0 (all received)
suggested_qty = (30 * 2) - 35 - 0 = 25 lbs
```

**Status Updates:**
- When quantity_received >= quantity_on_po: status = "received"
- qty_on_order calculation excludes items with status "received"

---

## Test Scenario 6: No Par Level Set

**Setup:**
- Ingredient: New Item
- Current quantity: 5 units
- Par level: NULL (not set)

**Expected Result:**
```
suggested_qty = 0 (ingredient skipped in populate-lines)
```

**API Call:**
```bash
POST /api/orders/populate-lines
```

**Expected Behavior:**
- Ingredient should NOT appear in suggested lines
- Database function returns 0 and filters it out

---

## Test Scenario 7: Populate Lines Endpoint

**Setup:**
Multiple ingredients with various stock levels:
1. Chicken: current=5, par=20, on_order=0 → suggest 35
2. Beef: current=10, par=30, on_order=15 → suggest 35
3. Lettuce: current=25, par=20, on_order=0 → suggest 15
4. Tomatoes: current=30, par=25, on_order=10 → suggest 10

**API Call:**
```bash
POST /api/orders/populate-lines
```

**Expected Response:**
```json
{
  "success": true,
  "count": 4,
  "items": [
    {
      "ingredient_id": "uuid-1",
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
      "ingredient_id": "uuid-2",
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

---

## Test Scenario 8: Order Item Status Lifecycle

**Workflow:**
1. Create restaurant order with items
   - Status: "pending"
   - quantity_on_po: NULL
   - quantity_received: NULL

2. Assign items to PO
   - Status: "on_po"
   - quantity_on_po: quantity (from order)
   - po_id: PO UUID

3. Partial receive (30 of 50 lbs)
   - Status: "partially_received"
   - quantity_received: 30

4. Full receive (remaining 20 lbs)
   - Status: "received"
   - quantity_received: 50

**API Calls:**
```bash
# Create PO from order items
POST /api/orders/from-order-items
Body: {
  "supplierName": "Sysco Foods",
  "orderItemIds": ["item-uuid-1", "item-uuid-2"]
}

# Receive partial
POST /api/orders/purchase-orders/{po_id}/receive
Body: {
  "items": [
    {"item_id": "po-item-uuid", "quantity_received": 30}
  ]
}

# Receive remaining
POST /api/orders/purchase-orders/{po_id}/receive
Body: {
  "items": [
    {"item_id": "po-item-uuid", "quantity_received": 20}
  ]
}
```

---

## Test Scenario 9: Quick Order Creation with Smart Quantities

**Setup:**
- 5 low stock ingredients
- Some have qty on order, others don't

**API Call:**
```bash
POST /api/orders/quick-order
Body: {
  "notes": "Test quick order"
}
```

**Expected Behavior:**
1. Calls `get_low_stock_items(restaurant_id)` function
2. Returns items with suggested_qty that accounts for qty_on_order
3. Creates order with smart quantities
4. Order status: "submitted"

**Verification:**
- Order items should match suggested quantities from populate-lines
- No manual calculation in application code

---

## Test Scenario 10: Edge Cases

### Case A: Negative Suggested Quantity
- Current qty: 100 lbs
- Par level: 20 lbs
- Qty on order: 0
- Expected: suggested_qty = 0 (not negative)

### Case B: Zero Par Level
- Par level: 0
- Expected: suggested_qty = 0, item skipped

### Case C: Division by Zero Prevention
- Handled by database function returning 0

### Case D: Invalid Ingredient ID
```bash
GET /api/orders/quantity-on-order/invalid-uuid
```
Expected: 400 Bad Request

### Case E: Ingredient Not in Inventory
- Ingredient exists in library but not in restaurant_inventory
- Expected: Returns 0 or skips in populate-lines

---

## Performance Benchmarks

### Target Performance:
- populate-lines with 100+ ingredients: < 500ms
- quantity-on-order lookup: < 100ms
- suggested-reorder calculation: < 150ms

### Database Function Optimization:
- Uses indexed columns (ingredient_id, restaurant_id, status)
- STABLE function marking for query planner optimization
- Single query execution (no N+1 queries)

---

## Integration Tests

### Test 1: Full Order-to-PO-to-Receive Workflow
1. Create quick order → verify qty_on_order increases
2. Generate PO from order → verify order items linked
3. Partial receive → verify qty_on_order decreases
4. Full receive → verify qty_on_order = 0
5. Create new quick order → verify suggestions account for received items

### Test 2: Multiple Vendors, Same Ingredient
- Ingredient on PO with Vendor A: 20 lbs
- Ingredient on PO with Vendor B: 15 lbs
- Total qty_on_order: 35 lbs
- Verify populate-lines accounts for both

### Test 3: Cancelled Orders
- Create order with items
- Assign to PO
- Cancel order (status = "cancelled")
- Verify qty_on_order excludes cancelled items

---

## Manual Testing Checklist

- [ ] Create order with 3+ low stock items
- [ ] Verify populate-lines returns correct suggestions
- [ ] Assign items to PO, verify status = "on_po"
- [ ] Check qty_on_order endpoint returns correct value
- [ ] Partial receive, verify status = "partially_received"
- [ ] Full receive, verify status = "received"
- [ ] Create new order, verify qty_on_order excludes received items
- [ ] Test with no low stock items (should return empty array)
- [ ] Test with ingredient without par level (should skip)
- [ ] Test suggested-reorder for single ingredient

---

## Success Criteria Validation

✓ populate-lines endpoint returns accurate low-stock items
✓ Suggested quantities account for qty_on_order
✓ Individual ingredient quantity lookup works
✓ Suggested reorder calculation correct
✓ Order item tracking updates when added to PO
✓ Receiving updates quantity_received correctly
✓ Quick order creation uses new logic
✓ All edge cases handled gracefully
✓ Performance acceptable (< 500ms for 100+ items)
✓ No breaking changes to existing workflows
