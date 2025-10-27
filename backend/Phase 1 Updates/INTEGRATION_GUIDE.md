# Phase 1 Endpoints - Integration Guide (Updated)

## Files Created

1. **backend/src/routes/metrics.js** - Metrics routes (dashboard & inventory)
2. **backend/src/services/metrics.js** - Metrics business logic
3. **backend/src/routes/inventory.js** - Updated inventory routes (includes new remove endpoint)
4. **backend/src/services/inventory.js** - Updated inventory service (includes removeInventory)

---

## ⚠️ Important: Pattern Corrections

After reviewing your full backend, I've updated the Phase 1 code to **match your existing patterns**:

### Your Auth Middleware Provides:
- `req.user` - Supabase auth user
- `req.userDetails` - User from users table
- `req.businessId` - User's business UUID
- `req.userRole` - User's role

### Your Auth Middleware Does NOT Provide:
- ❌ `req.restaurantId` 

### Your Existing Pattern (dashboard.js, inventory.js):
Each route handler fetches restaurant_id separately:
```javascript
const { data: restaurant, error: restaurantError } = await supabase
  .from("restaurants")
  .select("id")
  .eq("business_id", req.businessId)
  .single();

const restaurant_id = restaurant.id;
```

### My Updated Code:
✅ Now follows this exact pattern - **no changes needed to auth middleware**

---

## Integration Steps

### Step 1: Add Routes to Main App

Update your `backend/src/index.js` to include the new routes:

```javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import existing routes
import authRoutes from "./routes/auth.js";
import businessRoutes from "./routes/business.js";
import dashboardRoutes from "./routes/dashboard.js";
import inventoryRoutes from "./routes/inventory.js";

// Import NEW routes
import metricsRoutes from "./routes/metrics.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Existing routes
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/dashboard", dashboardRoutes);

// NEW metrics routes
app.use("/api/metrics", metricsRoutes);

// REPLACE old inventory routes with new one (includes remove endpoint)
app.use("/api/inventory", inventoryRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
```

**Important:** Replace your old `inventory.js` route with the new one, or it won't have the `/remove` endpoint.

---

## 🐛 Bugs Found in Your Existing Code

### Bug #1: Typo in auth.js route (Line 73)
**File:** `backend/src/routes/auth.js`

```javascript
// CURRENT (WRONG):
res.json({
  user: req.use,  // ❌ Typo!
  userDetails: req.userDetails,
  businessId: req.businessId,
  role: req.userRole,
});

// FIX:
res.json({
  user: req.user,  // ✅ Fixed
  userDetails: req.userDetails,
  businessId: req.businessId,
  role: req.userRole,
});
```

### Bug #2: Syntax error in inventory.js route (Line ~35)
**File:** `backend/src/routes/inventory.js`

```javascript
// CURRENT (WRONG):
const { restaurant_id } = restaurant.id;  // ❌ Destructuring a string doesn't work

// FIX:
const restaurant_id = restaurant.id;  // ✅ Just assign it
```

### Bug #3: Missing status code in auth.js route (Line 108)
**File:** `backend/src/routes/auth.js`

```javascript
// CURRENT (WRONG):
res.status().json({ error: error.message });  // ❌ No status code

// FIX:
res.status(500).json({ error: error.message });  // ✅ Added 500
```

---

## Testing the New Endpoints

### 1. Dashboard Metrics

```bash
GET http://localhost:3001/api/metrics/dashboard
Authorization: Bearer {your_token}
```

**Expected Response:**

```json
{
  "lowStockCount": 5,
  "expiringItemsCount": 3,
  "openOrdersCount": 2,
  "weeklyFoodCostPercent": 28.5
}
```

### 2. Inventory Metrics

```bash
GET http://localhost:3001/api/metrics/inventory
Authorization: Bearer {your_token}
```

**Expected Response:**

```json
{
  "belowReorderCount": 5,
  "expiringThisWeek": 3,
  "topUsedIngredient": "Chicken Breast",
  "inventoryTurnoverRate": 2.3
}
```

### 3. Remove Inventory

```bash
POST http://localhost:3001/api/inventory/remove
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "items": [
    {
      "ingredientId": "6f88aae2-9c09-45ec-8b34-0500ed7a5aab",
      "quantity": 5,
      "unit": "lbs",
      "reason": "spoilage",
      "notes": "Freezer malfunction - items thawed"
    }
  ]
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Removed 1 items from inventory",
  "items": [
    {
      "id": "1b0e8b71-f0e8-4a45-b093-cc7f84b03a39",
      "ingredient_id": "6f88aae2-9c09-45ec-8b34-0500ed7a5aab",
      "new_quantity": 45,
      "removed_quantity": 5,
      "reason": "spoilage",
      "notes": "Freezer malfunction - items thawed"
    }
  ]
}
```

---

## Database Schema Notes

The metrics queries assume:

1. `restaurant_inventory` table has:
   - `restaurant_id` (UUID)
   - `quantity` (numeric)
   - `minimum_quantity` (numeric)
   - `expiration_date` (date)
2. `purchase_orders` table has:
   - `restaurant_id` (UUID)
   - `status` (text: 'draft', 'ordered', 'received', 'stocked')
3. `ingredient_library` table has:
   - `id` (UUID)
   - `name` (text)
   - `barcode` (text)

---

## What's Next?

After Phase 1 is working, you can move to:

**Phase 2:**
- GET /api/metrics/orders
- POST /api/orders (create purchase order)
- GET /api/metrics/receiving

**Phase 3:**
- GET /api/metrics/reports
- POST /api/recipes (add recipe)

Let me know if you need help with those!

---

## Troubleshooting

**Problem:** "No restaurant found for this business"  
**Solution:** Make sure your test user has a `businessId` and that a restaurant exists in the `restaurants` table with matching `business_id`

**Problem:** "Ingredient not found" on lookup  
**Solution:** Verify barcode exists in `ingredient_library` table

**Problem:** "Cannot remove X - only Y available"  
**Solution:** This is correct behavior - you're trying to remove more than exists

**Problem:** Metrics showing 0 for everything  
**Solution:** Check that your test data has the correct `restaurant_id` values
