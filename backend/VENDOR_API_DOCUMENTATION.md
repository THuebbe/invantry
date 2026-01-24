# Vendor Management API Documentation

## Overview

The Vendor Management API provides comprehensive vendor and ingredient-vendor mapping functionality, replacing the previous hardcoded vendor mapping system with a dynamic database-driven solution.

## Base URL
```
http://localhost:3001/api/vendors
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer {token}
```

---

## Vendor CRUD Endpoints

### 1. GET /api/vendors
**List all vendors for the authenticated restaurant**

**Query Parameters:**
- `is_active` (optional): Filter by active status (true/false)

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "restaurant_id": "uuid",
    "name": "Sysco Foods",
    "contact_name": "John Smith",
    "phone": "555-1234",
    "email": "john@sysco.com",
    "address": "123 Main St, City, State 12345",
    "payment_terms": "Net 30",
    "account_number": "ACC-12345",
    "notes": "Primary protein supplier",
    "is_active": true,
    "created_by": "uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

**Headers:**
- `X-Total-Count`: Number of vendors returned

**Errors:**
- 401 Unauthorized: Invalid or missing token
- 500 Internal Server Error: Database error

---

### 2. POST /api/vendors
**Create a new vendor**

**Request Body:**
```json
{
  "name": "Local Produce Co",
  "contact_name": "Jane Doe",
  "phone": "555-5678",
  "email": "jane@localproduce.com",
  "address": "456 Farm Rd, City, State 12345",
  "payment_terms": "Net 15",
  "account_number": "ACC-67890",
  "notes": "Organic produce supplier"
}
```

**Required Fields:**
- `name` (string, max 255 chars)

**Optional Fields:**
- `contact_name` (string)
- `phone` (string)
- `email` (string, valid email format)
- `address` (string)
- `payment_terms` (string, max 100 chars)
- `account_number` (string)
- `notes` (text)

**Response (201 Created):**
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "name": "Local Produce Co",
  "contact_name": "Jane Doe",
  "phone": "555-5678",
  "email": "jane@localproduce.com",
  "address": "456 Farm Rd, City, State 12345",
  "payment_terms": "Net 15",
  "account_number": "ACC-67890",
  "notes": "Organic produce supplier",
  "is_active": true,
  "created_by": "uuid",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Errors:**
- 400 Bad Request: Missing required fields or invalid data
- 409 Conflict: Vendor with same name already exists
- 500 Internal Server Error: Database error

---

### 3. GET /api/vendors/:id
**Get specific vendor by ID with statistics**

**Response (200 OK):**
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "name": "Sysco Foods",
  "contact_name": "John Smith",
  "phone": "555-1234",
  "email": "john@sysco.com",
  "address": "123 Main St, City, State 12345",
  "payment_terms": "Net 30",
  "account_number": "ACC-12345",
  "notes": "Primary protein supplier",
  "is_active": true,
  "created_by": "uuid",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "stats": {
    "ingredient_count": 25,
    "po_count": 0,
    "total_spend": 0
  }
}
```

**Errors:**
- 404 Not Found: Vendor not found or belongs to different restaurant
- 500 Internal Server Error: Database error

---

### 4. PUT /api/vendors/:id
**Update vendor information**

**Request Body:**
```json
{
  "name": "Sysco Foods Inc",
  "contact_name": "John Smith Jr",
  "phone": "555-9999",
  "payment_terms": "Net 45"
}
```

**Notes:**
- Only provided fields will be updated
- Cannot change `restaurant_id`, `created_by`, or `created_at`
- Will validate for duplicate vendor names

**Response (200 OK):**
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "name": "Sysco Foods Inc",
  "contact_name": "John Smith Jr",
  "phone": "555-9999",
  "email": "john@sysco.com",
  "address": "123 Main St, City, State 12345",
  "payment_terms": "Net 45",
  "account_number": "ACC-12345",
  "notes": "Primary protein supplier",
  "is_active": true,
  "created_by": "uuid",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T00:00:00Z"
}
```

**Errors:**
- 400 Bad Request: Invalid data
- 404 Not Found: Vendor not found
- 409 Conflict: Vendor name already exists
- 500 Internal Server Error: Database error

---

### 5. DELETE /api/vendors/:id
**Soft delete vendor (sets is_active = false)**

**Response (200 OK):**
```json
{
  "message": "Vendor deleted successfully"
}
```

**Errors:**
- 404 Not Found: Vendor not found
- 409 Conflict: Cannot delete vendor with open purchase orders
- 500 Internal Server Error: Database error

---

## Ingredient-Vendor Mapping Endpoints

### 6. GET /api/vendors/for-ingredient/:ingredientId
**Get all vendors for a specific ingredient**

**Response (200 OK):**
```json
[
  {
    "id": "vendor-uuid",
    "restaurant_id": "uuid",
    "name": "Sysco Foods",
    "contact_name": "John Smith",
    "phone": "555-1234",
    "email": "john@sysco.com",
    "is_active": true,
    "mapping_info": {
      "is_preferred": true,
      "vendor_item_number": "BEEF-001",
      "unit_cost": 12.50,
      "lead_time_days": 2,
      "minimum_order_qty": 10,
      "notes": "Premium grade beef"
    }
  },
  {
    "id": "vendor-uuid-2",
    "restaurant_id": "uuid",
    "name": "Restaurant Depot",
    "contact_name": "Bob Jones",
    "phone": "555-4321",
    "email": "bob@depot.com",
    "is_active": true,
    "mapping_info": {
      "is_preferred": false,
      "vendor_item_number": "BEEF-STD",
      "unit_cost": 10.00,
      "lead_time_days": 1,
      "minimum_order_qty": 20,
      "notes": "Standard grade beef"
    }
  }
]
```

**Errors:**
- 500 Internal Server Error: Database error

---

### 7. GET /api/vendors/preferred-for-ingredient/:ingredientId
**Get the preferred vendor for a specific ingredient**

**Response (200 OK):**
```json
{
  "id": "vendor-uuid",
  "restaurant_id": "uuid",
  "name": "Sysco Foods",
  "contact_name": "John Smith",
  "phone": "555-1234",
  "email": "john@sysco.com",
  "is_active": true,
  "mapping_info": {
    "is_preferred": true,
    "vendor_item_number": "BEEF-001",
    "unit_cost": 12.50,
    "lead_time_days": 2,
    "minimum_order_qty": 10,
    "notes": "Premium grade beef"
  }
}
```

**Errors:**
- 404 Not Found: No preferred vendor found for this ingredient
- 500 Internal Server Error: Database error

---

### 8. POST /api/vendors/:vendorId/ingredients/:ingredientId
**Create ingredient-vendor mapping**

**Request Body:**
```json
{
  "is_preferred": true,
  "vendor_item_number": "BEEF-001",
  "unit_cost": 12.50,
  "lead_time_days": 2,
  "minimum_order_qty": 10,
  "notes": "Premium grade beef"
}
```

**All Fields Optional:**
- `is_preferred` (boolean, default: false)
- `vendor_item_number` (string)
- `unit_cost` (number, must be positive)
- `lead_time_days` (integer, must be positive)
- `minimum_order_qty` (number, must be positive)
- `notes` (text)

**Behavior:**
- If `is_preferred` is true, automatically unsets other preferred vendors for this ingredient

**Response (201 Created):**
```json
{
  "id": "uuid",
  "vendor_id": "vendor-uuid",
  "ingredient_id": "ingredient-uuid",
  "is_preferred": true,
  "vendor_item_number": "BEEF-001",
  "unit_cost": 12.50,
  "lead_time_days": 2,
  "minimum_order_qty": 10,
  "notes": "Premium grade beef",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Errors:**
- 400 Bad Request: Invalid data (negative costs, invalid lead time)
- 404 Not Found: Vendor or ingredient not found
- 409 Conflict: Mapping already exists
- 500 Internal Server Error: Database error

---

### 9. PUT /api/vendors/:vendorId/ingredients/:ingredientId
**Update ingredient-vendor mapping**

**Request Body:**
```json
{
  "is_preferred": false,
  "unit_cost": 13.00,
  "lead_time_days": 3
}
```

**Notes:**
- Only provided fields will be updated
- If changing `is_preferred` to true, automatically unsets other preferred vendors

**Response (200 OK):**
```json
{
  "id": "uuid",
  "vendor_id": "vendor-uuid",
  "ingredient_id": "ingredient-uuid",
  "is_preferred": false,
  "vendor_item_number": "BEEF-001",
  "unit_cost": 13.00,
  "lead_time_days": 3,
  "minimum_order_qty": 10,
  "notes": "Premium grade beef",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Errors:**
- 400 Bad Request: Invalid data
- 404 Not Found: Mapping, vendor, or ingredient not found
- 500 Internal Server Error: Database error

---

### 10. DELETE /api/vendors/:vendorId/ingredients/:ingredientId
**Remove ingredient-vendor mapping**

**Response (200 OK):**
```json
{
  "message": "Ingredient-vendor mapping deleted successfully"
}
```

**Errors:**
- 404 Not Found: Vendor not found or belongs to different restaurant
- 500 Internal Server Error: Database error

---

## Integration with Order System

The vendor management system is now integrated with the order and purchase order generation workflow:

### Order Pending POs Endpoint
**GET /api/orders/pending-for-pos**

This endpoint now uses the vendor service to determine suppliers:

**Before (Hardcoded):**
```javascript
supplier_name: getSupplierForIngredient(category) // Hardcoded mapping
```

**After (Database-Driven):**
```javascript
const preferredVendor = await getPreferredVendorForIngredient(ingredientId, restaurantId);
supplier_name: preferredVendor?.name || "General Supplier"; // Dynamic lookup
```

**Response:**
```json
[
  {
    "id": "order-uuid",
    "order_number": "ORD-001",
    "status": "submitted",
    "items": [
      {
        "ingredient_id": "uuid",
        "ingredient_name": "Ground Beef",
        "category": "protein",
        "quantity": 20,
        "unit": "lbs",
        "estimated_unit_cost": 12.50,
        "supplier_name": "Sysco Foods"  // From preferred vendor mapping
      }
    ]
  }
]
```

---

## Example Workflow: Setting Up Vendor Management

### Step 1: Create Vendors
```bash
# Create primary protein supplier
POST /api/vendors
{
  "name": "Sysco Foods",
  "contact_name": "John Smith",
  "email": "john@sysco.com",
  "payment_terms": "Net 30"
}

# Create produce supplier
POST /api/vendors
{
  "name": "Local Produce Co",
  "contact_name": "Jane Doe",
  "email": "jane@localproduce.com",
  "payment_terms": "Net 15"
}
```

### Step 2: Map Ingredients to Vendors
```bash
# Map ground beef to Sysco as preferred vendor
POST /api/vendors/{sysco-id}/ingredients/{beef-id}
{
  "is_preferred": true,
  "vendor_item_number": "BEEF-001",
  "unit_cost": 12.50,
  "lead_time_days": 2,
  "minimum_order_qty": 10
}

# Map tomatoes to Local Produce as preferred vendor
POST /api/vendors/{produce-id}/ingredients/{tomato-id}
{
  "is_preferred": true,
  "unit_cost": 2.50,
  "lead_time_days": 1
}
```

### Step 3: Create Orders
When creating quick orders or custom orders, the system will automatically:
1. Look up the preferred vendor for each ingredient
2. Group items by vendor when generating POs
3. Use vendor-specific pricing from the mapping

---

## Migration Notes

### Removed Hardcoded Function
The following function has been removed from `restaurantOrders.js`:

```javascript
// OLD - REMOVED
function getSupplierForIngredient(category) {
  const supplierMap = {
    "protein": "Sysco Foods",
    "produce": "Local Produce Co",
    "dairy": "Dairy Fresh",
    "dry goods": "Restaurant Depot",
    "alcohol": "Wine & Spirits Co",
    "beverages": "Beverage Supply",
    "supplies": "Restaurant Supply Co",
  };
  return supplierMap[category] || "General Supplier";
}
```

### New Dynamic Approach
```javascript
// NEW - Database-driven
const preferredVendor = await getPreferredVendorForIngredient(
  ingredientId,
  restaurantId
);
const vendorName = preferredVendor?.name || "General Supplier";
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- 200 OK: Successful GET, PUT, DELETE
- 201 Created: Successful POST
- 400 Bad Request: Invalid input data
- 401 Unauthorized: Missing or invalid authentication
- 403 Forbidden: Access denied to resource
- 404 Not Found: Resource not found
- 409 Conflict: Duplicate resource or constraint violation
- 500 Internal Server Error: Database or server error

---

## Testing Recommendations

### Manual Testing Scenarios

1. **Vendor CRUD Operations**
   - Create vendors with all fields
   - Create vendor with only required fields (name)
   - Update vendor information
   - Attempt to create duplicate vendor (should fail)
   - Soft delete vendor
   - List active vendors only

2. **Ingredient-Vendor Mapping**
   - Map ingredient to vendor without preference
   - Map ingredient to vendor as preferred
   - Map same ingredient to multiple vendors
   - Set new preferred vendor (should unset previous)
   - Update mapping pricing information
   - Delete mapping

3. **Order Integration**
   - Create order with items that have preferred vendors
   - Create order with items without preferred vendors
   - Generate POs and verify vendor grouping
   - Verify vendor names appear in pending POs

4. **Permission Validation**
   - Attempt to access another restaurant's vendors (should fail)
   - Verify restaurant scoping on all endpoints

5. **Error Scenarios**
   - Invalid email format
   - Negative unit costs
   - Invalid vendor/ingredient IDs
   - Missing authentication token

---

## Performance Considerations

- Vendor lookups are cached at the ingredient level during order processing
- Preferred vendor queries use database indexes for fast retrieval
- Batch processing for multiple ingredient lookups in order workflows
- Fallback to "General Supplier" when no preferred vendor is set

---

## Future Enhancements

Planned features for vendor management:

1. **Purchase Order Integration**
   - Track PO count per vendor
   - Calculate total spend per vendor
   - Block deletion of vendors with open POs

2. **Vendor Performance Metrics**
   - On-time delivery tracking
   - Quality ratings
   - Price variance analysis

3. **Bulk Operations**
   - Import vendors from CSV
   - Bulk ingredient-vendor mapping
   - Export vendor catalog

4. **Advanced Features**
   - Vendor tiering (primary, secondary, backup)
   - Automatic vendor selection based on price/availability
   - Contract management and renewal tracking
