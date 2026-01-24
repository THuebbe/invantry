# Bug Fix: Item Names Displaying Wrong Data in PO Tabs

**Status**: FIXED
**Priority**: CRITICAL
**Component**: CreateQuickPOs.jsx + OrderLineItem.jsx
**Fixed By**: Scrum Master
**Date**: 2025-11-30

---

## Problem Summary

When creating Purchase Orders with multiple vendor tabs, the frontend was displaying incorrect item names in the line items. The quantities and prices were correct, but the item names were showing items from a different vendor's tab.

### Evidence from Logs

**Backend (CORRECT)**:
```
📦 Vendor: Gordon Food Service
  - White Rice (Long Grain): 42 lbs @ $28/lbs
  - Panko Bread Crumbs: 28 lbs @ $18/lbs
  - Salt (Kosher): 14 lbs @ $8/lbs
  - Black Pepper (Ground): 14 oz @ $14/oz
```

**Frontend Display (WRONG)**:
- Line 1: Chicken Breast - 42 lbs @ 28/lb = $1,176  ❌
- Line 2: Salmon Fillets - 28 lbs @ 18/lb = $504  ❌
- Line 3: Pork Chops - 14 lbs @ 8/lb = $112  ❌
- Line 4: Coffee Beans - 14 oz @ 14/oz = $196  ❌

**But Item Details Panel showed CORRECT item** (Salt when clicked on line 3)

---

## Root Cause Analysis

### The Bug

The bug was in **`OrderLineItem.jsx`** (NOT in CreateQuickPOs.jsx as initially suspected).

**Location**: `/frontend/src/components/orders/OrderLineItem.jsx`
**Lines**: 28, 184

**Problematic Code**:
```javascript
// Line 28
const [searchQuery, setSearchQuery] = useState(item?.itemName || "");

// Line 184
<input
  type="text"
  value={searchQuery}  // ← This displays the WRONG value!
  onChange={(e) => {
    setSearchQuery(e.target.value);
    handleFieldChange("itemName", e.target.value);
  }}
  placeholder="Search or enter item..."
/>
```

### Why It Failed

1. **React Component State Issue**: The `OrderLineItem` component has local state (`searchQuery`) that's initialized from the `item.itemName` prop
2. **Stale State**: When the parent component switches vendor tabs, it passes a NEW `item` prop to `OrderLineItem`
3. **No Re-Sync**: The `searchQuery` state was NOT updated to reflect the new `item.itemName` value
4. **Visual Bug**: The input displays `searchQuery` (old value) instead of `item.itemName` (correct value)

### Why Quantities/Prices Were Correct

The quantity and cost fields were reading directly from the `item` prop:

```javascript
// These work correctly because they read from props, not local state
value={item?.qty || ""}
value={item?.cost || ""}
```

But the item name field was reading from local state (`searchQuery`) which wasn't updated when props changed.

### Why Item Details Panel Was Correct

The Item Details Panel receives the `selectedItem` directly from the parent component's state, which has the correct data. It doesn't use the `OrderLineItem`'s local `searchQuery` state.

---

## The Fix

**File**: `/frontend/src/components/orders/OrderLineItem.jsx`
**Lines**: 36-39 (added)

```javascript
// Sync searchQuery with item.itemName when item prop changes
useEffect(() => {
  setSearchQuery(item?.itemName || "");
}, [item?.itemName]);
```

### How It Works

1. When the `item` prop changes (e.g., user switches tabs)
2. The `useEffect` detects that `item.itemName` has changed
3. It updates the local `searchQuery` state to match the new `item.itemName`
4. The input field re-renders with the correct item name

---

## Testing Instructions

1. Navigate to Orders > Create Quick POs
2. Click "Populate Lines" (without selecting a vendor)
3. Verify multiple vendor tabs appear (Sysco, Gordon, US Foods, etc.)
4. Click on the **Gordon Food Service** tab
5. Verify the line items show:
   - White Rice (Long Grain) - 42 lbs @ $28
   - Panko Bread Crumbs - 28 lbs @ $18
   - Salt (Kosher) - 14 lbs @ $8
   - Black Pepper (Ground) - 14 oz @ $14
6. Switch to **Sysco Corporation** tab
7. Verify the line items change to Sysco's items (Chicken Breast, Salmon, etc.)
8. Switch back to **Gordon Food Service** tab
9. Verify items still show Gordon's items (not Sysco's)

**Expected Result**: Each tab displays its own vendor's items correctly.

---

## Diagnostic Logging Added

To help debug this issue, extensive console logging was added to `CreateQuickPOs.jsx`:

### In `handlePopulateLines` (lines 305-378):
- Logs each vendor being processed
- Logs each item being mapped to a line item
- Logs the `emptyLine.itemName` vs `item.ingredient_name` vs `lineItem.itemName`
- Logs the final tab state before rendering

### In render section (lines 694-703):
- Logs the active tab name
- Logs all displayLineItems for the current tab
- Shows exactly what data is being passed to OrderLineItem components

### Recommendation:
These logs can be **removed** after verification that the fix works, OR kept for future debugging.

---

## Files Modified

1. `/frontend/src/components/orders/OrderLineItem.jsx`
   - Added `useEffect` to sync `searchQuery` with `item.itemName` prop changes

2. `/frontend/src/components/dashboard/content/orders/CreateQuickPOs.jsx`
   - Added extensive diagnostic logging (can be removed later)

---

## Impact

- **Severity**: CRITICAL (data display bug affecting PO creation)
- **User Impact**: Users were seeing wrong item names, potentially creating POs with incorrect items
- **Business Risk**: HIGH - Could lead to ordering wrong products, financial loss
- **Fix Complexity**: Low (5-line fix)
- **Testing Required**: Manual UI testing with multi-vendor PO creation

---

## Lessons Learned

1. **React State vs Props**: Be careful when using local state to mirror props - always sync state when props change
2. **Component Design**: Consider whether local state is necessary, or if component can be fully controlled by props
3. **Testing**: Tab-switching and dynamic data scenarios need thorough testing
4. **Logging**: Detailed logging at state transitions helps identify where data diverges

---

## Follow-Up Actions

- [ ] User to test the fix with real PO creation workflow
- [ ] Verify no other components have similar state-sync issues
- [ ] Consider refactoring `OrderLineItem` to be a fully controlled component (remove local state)
- [ ] Review other form components for similar patterns
- [ ] Clean up diagnostic console.log statements after verification

---

**Fix Verified**: ⏳ Awaiting user confirmation
**Ready for Testing**: ✅ Yes
