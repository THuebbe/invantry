# TASK-REMOVE-ORDER-TYPES

## Task Overview

Remove the distinction between "quick" and "custom" order types throughout the application. Simplify to have just "Orders" and "Purchase Orders" without type differentiation.

## Background

Currently the system has:
- **Orders**: "quick" vs "custom" types
- **Purchase Orders**: Different handling based on order type

User feedback indicates this distinction is unnecessary and adds complexity. The UI and workflow already provide all needed functionality without requiring different order types.

## Objectives

1. Remove order type requirement from database schema
2. Update backend APIs to not require/validate order types
3. Update frontend to remove order type selection
4. Simplify UI to show "Orders" instead of "Quick Orders" / "Custom Orders"
5. Update all documentation and comments

## Scope

### Backend Changes
- Database: Remove `order_type` requirement from `restaurant_orders` table (make nullable or remove)
- API: Remove validation that requires order_type to be 'quick' or 'custom'
- Services: Simplify order creation logic
- Routes: Update endpoints to not expect order_type

### Frontend Changes
- Remove order type selection UI
- Simplify order creation forms (merge CreateQuickOrder and CreateCustomOrder if separate)
- Update labels from "Quick Order" / "Custom Order" to just "Order"
- Remove any conditional logic based on order type

### Testing
- Verify order creation works without type specification
- Test order submission flow
- Test PO generation from orders
- Verify existing orders still work

## Current Error

When submitting order: **"Order type is required and must be 'quick' or 'custom'"**

This is the blocker preventing order submission.

## Expected Deliverables

1. Updated database migration (if needed)
2. Updated backend services and routes
3. Updated frontend components
4. Working order submission flow
5. Brief summary of changes made

## Definition of Done

- [ ] Orders can be created and submitted without specifying type
- [ ] No validation errors about order_type
- [ ] UI shows "Orders" instead of type-specific names
- [ ] PO generation still works correctly
- [ ] No breaking changes to existing data

## Estimated Effort

2-3 hours

## Dependencies

None - this task can proceed immediately

## Notes

- Keep this simple - just remove the unnecessary distinction
- Don't break existing order data in the database
- Focus on making it work first, cleanup can come later
