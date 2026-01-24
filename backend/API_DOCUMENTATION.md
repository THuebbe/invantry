# Invantry Backend API Documentation

## Base URL
- Development: `http://localhost:3001`
- Production: TBD

## Authentication
All API endpoints (except `/api/auth/*`) require authentication using Bearer tokens.

### Headers
```
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

---

## Reports API Endpoints

### 1. Waste Summary Report
**GET** `/api/reports/waste/summary`

Get overall waste summary with optional period comparison.

**Query Parameters:**
- `period` (optional): Time period - `today`, `week`, `month`, `quarter`, `year` (default: `week`)
- `compare` (optional): Enable comparison - `true` or `false` (default: `false`)
- `start` (optional): Custom start date in format `YYYY-MM-DD`
- `end` (optional): Custom end date in format `YYYY-MM-DD`

**Example Request:**
```bash
GET /api/reports/waste/summary?period=month&compare=true
```

**Response:**
```json
{
  "period": {
    "type": "month",
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-23T23:59:59.999Z"
  },
  "waste": {
    "total_value": 1250.50,
    "total_count": 42,
    "avg_per_incident": 29.77
  },
  "all_reductions": {
    "total_value": 1350.75
  },
  "comparison": {
    "previous_period": {
      "start": "2025-10-01T00:00:00.000Z",
      "end": "2025-10-31T23:59:59.999Z",
      "total_value": 980.25
    },
    "change": {
      "value": 270.25,
      "percent": 27.6,
      "direction": "increased"
    }
  }
}
```

---

### 2. Waste by Category
**GET** `/api/reports/waste/by-category`

Get waste breakdown by ingredient category (produce, protein, dairy, etc.).

**Query Parameters:**
- `period` (optional): Time period - `today`, `week`, `month`, `quarter`, `year` (default: `week`)
- `start` (optional): Custom start date in format `YYYY-MM-DD`
- `end` (optional): Custom end date in format `YYYY-MM-DD`

**Example Request:**
```bash
GET /api/reports/waste/by-category?period=week
```

**Response:**
```json
{
  "period": {
    "type": "week",
    "start": "2025-11-17T00:00:00.000Z",
    "end": "2025-11-23T23:59:59.999Z"
  },
  "total_waste": 1250.50,
  "categories": [
    {
      "category": "produce",
      "total_value": 500.25,
      "count": 15
    },
    {
      "category": "protein",
      "total_value": 425.75,
      "count": 12
    },
    {
      "category": "dairy",
      "total_value": 324.50,
      "count": 15
    }
  ]
}
```

---

### 3. Waste by Reason
**GET** `/api/reports/waste/by-reason`

Get waste breakdown by reason (spoilage, expired, damaged, etc.).

**Query Parameters:**
- `period` (optional): Time period - `today`, `week`, `month`, `quarter`, `year` (default: `week`)
- `start` (optional): Custom start date
- `end` (optional): Custom end date

**Example Request:**
```bash
GET /api/reports/waste/by-reason?period=month
```

**Response:**
```json
{
  "period": {
    "type": "month",
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-23T23:59:59.999Z"
  },
  "total_waste": 1250.50,
  "reasons": [
    {
      "reason": "expired",
      "total_value": 600.25,
      "count": 20
    },
    {
      "reason": "spoilage",
      "total_value": 400.00,
      "count": 12
    },
    {
      "reason": "damaged",
      "total_value": 250.25,
      "count": 10
    }
  ]
}
```

---

### 4. Waste by Item (Top Wasted Items)
**GET** `/api/reports/waste/by-item`

Get top wasted items ranked by total value.

**Query Parameters:**
- `period` (optional): Time period - `today`, `week`, `month`, `quarter`, `year` (default: `week`)
- `limit` (optional): Number of items to return (default: `20`)
- `start` (optional): Custom start date
- `end` (optional): Custom end date

**Example Request:**
```bash
GET /api/reports/waste/by-item?period=month&limit=10
```

**Response:**
```json
{
  "period": {
    "type": "month",
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-23T23:59:59.999Z"
  },
  "items": [
    {
      "ingredient_id": "uuid-123",
      "ingredient_name": "Romaine Lettuce",
      "category": "produce",
      "total_quantity": 25.50,
      "total_value": 150.75,
      "count": 8,
      "unit": "lb"
    },
    {
      "ingredient_id": "uuid-456",
      "ingredient_name": "Ground Beef",
      "category": "protein",
      "total_quantity": 10.00,
      "total_value": 120.00,
      "count": 5,
      "unit": "lb"
    }
  ]
}
```

---

### 5. Waste Trends
**GET** `/api/reports/waste/trends`

Get historical waste trends for charts.

**Query Parameters:**
- `period` (optional): Time period - `month`, `quarter`, `year` (default: `month`)
- `groupBy` (optional): Grouping interval - `day`, `week`, `month` (default: `day`)
- `start` (optional): Custom start date
- `end` (optional): Custom end date

**Example Request:**
```bash
GET /api/reports/waste/trends?period=month&groupBy=day
```

**Response:**
```json
{
  "period": {
    "type": "month",
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-23T23:59:59.999Z"
  },
  "group_by": "day",
  "trends": [
    {
      "date": "2025-11-01",
      "total_value": 45.50,
      "count": 3
    },
    {
      "date": "2025-11-02",
      "total_value": 62.25,
      "count": 5
    },
    {
      "date": "2025-11-03",
      "total_value": 38.00,
      "count": 2
    }
  ]
}
```

---

### 6. Food Cost Report
**GET** `/api/reports/food-cost`

Get detailed food cost analysis including inventory value and waste percentage.

**Query Parameters:**
- `period` (optional): Time period - `today`, `week`, `month`, `quarter`, `year` (default: `month`)
- `compare` (optional): Enable comparison - `true` or `false` (default: `false`)
- `start` (optional): Custom start date
- `end` (optional): Custom end date

**Example Request:**
```bash
GET /api/reports/food-cost?period=month&compare=true
```

**Response:**
```json
{
  "period": {
    "type": "month",
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-23T23:59:59.999Z"
  },
  "waste_cost": 1250.50,
  "total_inventory_value": 15000.00,
  "waste_percentage": 8.34,
  "note": "Food cost % calculation requires sales data (coming in future release)",
  "comparison": {
    "previous_period": {
      "start": "2025-10-01T00:00:00.000Z",
      "end": "2025-10-31T23:59:59.999Z",
      "waste_cost": 980.25
    },
    "change": {
      "value": 270.25,
      "percent": 27.6,
      "direction": "increased"
    }
  }
}
```

---

## Metrics API Endpoints

### 7. Waste Metrics (Dashboard Widget)
**GET** `/api/metrics/waste`

Get high-level waste metrics for dashboard widget.

**Query Parameters:**
- `period` (optional): Time period - `today`, `week`, `month` (default: `week`)

**Example Request:**
```bash
GET /api/metrics/waste?period=week
```

**Response:**
```json
{
  "period": "week",
  "totalWasteValue": 450.75,
  "wasteIncidentCount": 18,
  "topWasteReason": "expired",
  "avgWastePerIncident": 25.04
}
```

---

### 8. Reports Metrics (Dashboard Overview)
**GET** `/api/metrics/reports`

Get high-level metrics for reports dashboard with trending alerts.

**Query Parameters:**
- `period` (optional): Time period - `today`, `week`, `month`, `quarter`, `year` (default: `week`)

**Example Request:**
```bash
GET /api/metrics/reports?period=month
```

**Response:**
```json
{
  "period": "month",
  "waste_count": 42,
  "waste_value": 1250.50,
  "top_waste_reason": "expired",
  "trending": true,
  "trending_alert": {
    "message": "Waste is trending upward in the last 3 days",
    "severity": "warning"
  }
}
```

---

## Inventory API Endpoints

### 9. Get Inventory List
**GET** `/api/inventory`

Get all inventory items with expiration dates and stock levels.

**No Query Parameters**

**Example Request:**
```bash
GET /api/inventory
```

**Response:**
```json
[
  {
    "id": "uuid-123",
    "ingredient_id": "uuid-456",
    "ingredient_name": "Romaine Lettuce",
    "category": "produce",
    "quantity": 25.5,
    "unit": "lb",
    "minimum_quantity": 10,
    "cost_per_unit": 2.50,
    "location": "Walk-in Cooler",
    "expiration_date": "2025-11-30",
    "last_restocked": "2025-11-20T10:30:00.000Z"
  }
]
```

---

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid period parameter. Must be one of: today, week, month, quarter, year"
}
```

**401 Unauthorized:**
```json
{
  "error": "Access token required"
}
```

**404 Not Found:**
```json
{
  "error": "No restaurant found for this business. Please contact support."
}
```

**500 Internal Server Error:**
```json
{
  "error": "Database query failed: [error details]"
}
```

---

## Date Formats

- All timestamps use **ISO 8601 format**: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Date-only parameters use format: `YYYY-MM-DD`

## Numeric Formats

- Currency values: Numbers with 2 decimal places (e.g., `1250.50`)
- Percentages: Numbers with 1-2 decimal places (e.g., `27.6`)
- Counts: Integers (e.g., `42`)

---

## Testing

All endpoints require authentication. To test:

1. Login via `/api/auth/login` to get an access token
2. Include the token in all subsequent requests:
   ```
   Authorization: Bearer <your-token>
   ```

### Example Login:
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "user": { ... },
  "businessId": "uuid-123"
}
```

---

## CORS Configuration

The backend allows requests from:
- `http://localhost:5173` (Frontend dev server)
- `http://localhost:5174` (Alternative port)
- `https://pantrypro-six.vercel.app` (Production)

---

## Summary of All Report Endpoints

| Endpoint | Purpose | Key Parameters |
|----------|---------|----------------|
| `/api/reports/waste/summary` | Overall waste summary | `period`, `compare` |
| `/api/reports/waste/by-category` | Waste by category | `period` |
| `/api/reports/waste/by-reason` | Waste by reason | `period` |
| `/api/reports/waste/by-item` | Top wasted items | `period`, `limit` |
| `/api/reports/waste/trends` | Historical trends | `period`, `groupBy` |
| `/api/reports/food-cost` | Food cost analysis | `period`, `compare` |
| `/api/metrics/waste` | Dashboard widget | `period` |
| `/api/metrics/reports` | Reports overview | `period` |
| `/api/inventory` | Inventory list | none |

All endpoints support custom date ranges using `start` and `end` parameters.
