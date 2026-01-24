# Vendor Metrics API - Quick Reference

## Endpoint

```
GET /api/metrics/vendors
```

**Authentication:** Required (JWT Bearer token)

---

## Response Format

```json
{
  "activeVendorsCount": 8,
  "avgLeadTimeDays": 2.5,
  "documentsExpiringSoon": 2,
  "gradeAVendorsCount": 3
}
```

---

## Metrics Calculations

### 1. Active Vendors Count

**SQL Query:**
```sql
SELECT COUNT(*)
FROM vendors
WHERE restaurant_id = $1
  AND is_active = true;
```

**Returns:** Integer count of active vendors

**Edge Cases:**
- No vendors: Returns 0
- All inactive: Returns 0

---

### 2. Average Lead Time Days

**SQL Query:**
```sql
SELECT vpd.lead_time_days
FROM vendor_purchasing_data vpd
INNER JOIN vendors v ON vpd.vendor_id = v.id
WHERE vpd.restaurant_id = $1
  AND vpd.lead_time_days IS NOT NULL
  AND v.is_active = true;
```

**Calculation:** `AVG(lead_time_days)` rounded to 1 decimal place

**Returns:** Decimal number (e.g., 2.5)

**Edge Cases:**
- No purchasing data: Returns 0
- All lead times null: Returns 0
- No active vendors: Returns 0

---

### 3. Documents Expiring Soon

**SQL Query:**
```sql
SELECT COUNT(*)
FROM vendor_documents
WHERE restaurant_id = $1
  AND expiration_date >= CURRENT_DATE
  AND expiration_date <= CURRENT_DATE + INTERVAL '30 days';
```

**Returns:** Integer count of documents expiring in next 30 days

**Edge Cases:**
- No documents: Returns 0
- All documents have null expiration: Returns 0
- All documents already expired: Returns 0

---

### 4. Grade A Vendors Count

**SQL Query:**
```sql
SELECT DISTINCT vendor_id
FROM vendor_scorecards
WHERE restaurant_id = $1
  AND metric_name = 'overall_satisfaction_score'
  AND score >= 90;
```

**Calculation:** Count of unique vendor_ids

**Returns:** Integer count of Grade A vendors

**Grade Scale:**
- Grade A: score >= 90
- Grade B: score >= 80 and < 90
- Grade C: score >= 70 and < 80
- Grade D: score < 70

**Edge Cases:**
- No scorecards: Returns 0
- No vendors meet threshold: Returns 0
- Duplicate scorecard entries: De-duplicated by vendor_id

---

## Testing

### cURL Example

```bash
curl -X GET http://localhost:3001/api/metrics/vendors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Node.js Test

```javascript
import { getVendorMetrics } from './src/services/metrics.js';

const restaurantId = 'your-restaurant-uuid';
const metrics = await getVendorMetrics(restaurantId);
console.log(metrics);
```

### Expected Test Results

**With Sample Data:**
```json
{
  "activeVendorsCount": 8,
  "avgLeadTimeDays": 2.5,
  "documentsExpiringSoon": 2,
  "gradeAVendorsCount": 3
}
```

**Empty Database:**
```json
{
  "activeVendorsCount": 0,
  "avgLeadTimeDays": 0,
  "documentsExpiringSoon": 0,
  "gradeAVendorsCount": 0
}
```

---

## Performance

- **Response Time:** < 100ms (typical)
- **Database Queries:** 4 queries
- **Optimization:** Uses indexes on restaurant_id
- **Caching:** Frontend caches for 2 minutes
- **Auto-Refresh:** Every 5 minutes

---

## Error Responses

### 404 - Restaurant Not Found
```json
{
  "error": "No restaurant found for this business. Please contact support."
}
```

### 401 - Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 500 - Server Error
```json
{
  "error": "Failed to get vendor metrics: <detailed error message>"
}
```

---

## Database Tables Used

1. **vendors** - Active vendor count
   - Columns: `id`, `restaurant_id`, `is_active`

2. **vendor_purchasing_data** - Lead time calculation
   - Columns: `vendor_id`, `restaurant_id`, `lead_time_days`

3. **vendor_documents** - Expiring documents
   - Columns: `restaurant_id`, `expiration_date`

4. **vendor_scorecards** - Performance grading
   - Columns: `vendor_id`, `restaurant_id`, `metric_name`, `score`

---

## Frontend Integration

### React Hook Usage

```javascript
import { useMetrics } from '@/hooks/useMetrics';

function VendorDashboard() {
  const { data: metrics, isLoading, error } = useMetrics();

  if (isLoading) return <Loader />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <MetricCard
        label="Active Vendors"
        value={metrics.activeVendorsCount}
      />
      <MetricCard
        label="Avg Lead Time"
        value={metrics.avgLeadTimeDays}
        suffix=" days"
      />
      <MetricCard
        label="Docs Expiring"
        value={metrics.documentsExpiringSoon}
      />
      <MetricCard
        label="Grade A Vendors"
        value={metrics.gradeAVendorsCount}
      />
    </div>
  );
}
```

---

## Future Enhancements (Not Implemented)

These metrics are placeholders and need backend implementation:

1. **Top Vendor by Spend**
   - Requires: SUM(purchase_orders.total) grouped by vendor
   - Format: "Sysco ($12,500)"

2. **YTD Total Spend**
   - Requires: SUM(purchase_orders.total) for current year
   - Format: "$156,750"

3. **Avg On-Time Delivery %**
   - Requires: Compare actual_delivery_date vs expected_delivery_date
   - Format: "95.0%"

4. **Avg Order Accuracy %**
   - Requires: Compare quantity_received vs quantity_ordered
   - Format: "97.5%"

---

## Changelog

**2026-01-05** - Initial implementation
- Added getVendorMetrics service function
- Added GET /api/metrics/vendors endpoint
- Removed frontend mock data
- Created test suite
- All 4 metrics implemented and tested

---

## Support

For issues or questions:
- Check error logs in browser console (frontend)
- Check server logs with `console.error` (backend)
- Run test script: `node backend/scripts/test-vendor-metrics.js`
- Verify database has vendor data for your restaurant

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-01-05
**Version:** 1.0.0
