# CRITICAL BUG FIX: PO Deletion Preventing Future PO Generation

## Issue Summary
**Severity:** CRITICAL
**Status:** FIXED
**Date:** 2025-11-30
**Component:** Purchase Order Deletion API
**File:** `backend/src/routes/orders.js`

## Problem Description

When a user deleted a Purchase Order (PO), they could no longer generate new POs. The system returned "No open order items found" even though there was an active order with status "OPEN" that should have items available for PO generation.

## Root Cause Analysis

The DELETE endpoint for purchase orders (`DELETE /api/orders/purchase-orders/:id`) contained TWO critical bugs on lines 601-602:

### Bug #1: Wrong Table Name
```javascript
// INCORRECT - Line 601
.from("order_items")

// CORRECT
.from("restaurant_order_items")
```

The code was attempting to update the wrong table. `order_items` is a different table (possibly legacy or from a different part of the application). The correct table for restaurant order items is `restaurant_order_items`.

### Bug #2: Wrong Field Name
```javascript
// INCORRECT - Line 602
.update({ po_status: "pending" })

// CORRECT
.update({
    status: "pending",
    po_id: null,
    po_number: null,
    quantity_on_po: 0,
    updated_at: new Date().toISOString(),
})
```

The field name `po_status` does not exist in the `restaurant_order_items` table. According to the database schema (migration-002-extend-order-items.sql), the correct field is `status`.

## Why This Caused the Bug

### The Workflow:

1. **User deletes PO**
2. **Delete endpoint attempts to reset items** in wrong table with wrong field
3. **Items in `restaurant_order_items` are NEVER reset**
   - Still have `status: "on_po"`
   - Still have `quantity_on_po` set to ordered quantity
   - Still have `po_id` and `po_number` referencing deleted PO
4. **User tries to populate PO lines**
5. **Populate query runs** (line 644 of `orders.js`):
   ```javascript
   .in('status', ['pending', 'on_po'])
   ```
   This DOES find the items (because status is still "on_po")
6. **Filter is applied** (lines 651-655):
   ```javascript
   const availableItems = orderItems.filter(item => {
       const quantity = parseFloat(item.quantity || 0);
       const qtyOnPO = parseFloat(item.quantity_on_po || 0);
       return (quantity - qtyOnPO) > 0;  // This returns FALSE!
   });
   ```
7. **Result:** NO ITEMS because `quantity_on_po >= quantity`
8. **Error:** "No open order items found"

## The Fix

### Changed Code (lines 599-610):

**BEFORE:**
```javascript
if (allSourceItemIds.length > 0) {
    await supabase
        .from("order_items")  // WRONG TABLE
        .update({ po_status: "pending" })  // WRONG FIELD
        .in("id", allSourceItemIds);
}
```

**AFTER:**
```javascript
if (allSourceItemIds.length > 0) {
    await supabase
        .from("restaurant_order_items")  // CORRECT TABLE
        .update({
            status: "pending",              // Reset status to pending
            po_id: null,                    // Clear PO reference
            po_number: null,                // Clear PO number
            quantity_on_po: 0,              // Reset quantity on PO
            updated_at: new Date().toISOString(),
        })
        .in("id", allSourceItemIds);
}
```

## Database Schema Reference

From `migration-002-extend-order-items.sql`:

```sql
-- Correct table: restaurant_order_items

-- Correct status field with valid values:
ALTER TABLE restaurant_order_items
ADD CONSTRAINT restaurant_order_items_status_check
CHECK (status IN ('pending', 'on_po', 'partially_received', 'received', 'cancelled'));

-- Quantity tracking fields:
ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS quantity_on_po NUMERIC(10,2) DEFAULT 0;

ALTER TABLE restaurant_order_items
ADD COLUMN IF NOT EXISTS quantity_received NUMERIC(10,2) DEFAULT 0;
```

## Verification

### Related Code Checked:

1. **Cancel PO endpoint** (lines 521-545): ALREADY CORRECT ✓
   - Uses `restaurant_order_items` table
   - Updates `status`, `po_id`, `po_number`, `quantity_on_po` fields correctly

2. **Other occurrences of `po_status`:** NONE FOUND ✓

3. **Other occurrences of `order_items` table:** NONE FOUND ✓

## Testing Steps

To verify the fix:

1. Create a Quick Order with items
2. Generate a PO from the order items
3. Verify items appear on PO
4. **Delete the PO**
5. Try to populate PO lines again
6. **EXPECTED:** Items should appear as available for new PO
7. Generate a new PO successfully

## Impact

**Before Fix:**
- Deleting ANY PO would permanently block those order items from future PO generation
- Required manual database intervention to fix
- Severe workflow disruption

**After Fix:**
- Deleting a PO properly resets all order items to "pending" status
- Items can be immediately added to new POs
- Workflow functions correctly

## Files Changed

- `backend/src/routes/orders.js` (lines 599-610, 613-624)

## Additional Enhancement

While fixing the primary bug, also enhanced the "safety net" update (lines 613-624) to properly reset ALL fields instead of just `po_id`. This catches any edge cases where items might reference the PO but weren't tracked in `source_order_item_ids`.

## Related Functions Working Correctly

- `createPOFromOrderItems()` - Line 140: Sets `status: "on_po"` ✓
- `updateOrderItemsStatus()` - Line 839: Sets `status: "on_po"` ✓
- `populatePOLines()` - Line 644: Checks `status IN ['pending', 'on_po']` ✓
- `updateOrderItemReceived()` - Line 938-943: Updates `status` correctly ✓

## Conclusion

This was a critical bug caused by referencing the wrong table and wrong field name when attempting to reset order items after PO deletion. The fix ensures that when a PO is deleted, all associated order items are properly reset to "pending" status with all PO references cleared, allowing them to be included in future PO generation.
