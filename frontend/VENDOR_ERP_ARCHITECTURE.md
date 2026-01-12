# Vendor ERP Module Architecture

## Component Hierarchy

```
Dashboard (existing)
│
└── MainContent.jsx (modified)
    │
    └── VendorsContent.jsx (NEW - Router)
        │
        ├── VendorList.jsx (/vendors)
        │   └── VendorCard.jsx × N
        │
        ├── VendorDetail.jsx (/vendors/detail?vendorId=X)
        │   ├── VendorInfoForm.jsx (FIXED - Always visible)
        │   ├── VendorTabs.jsx (FIXED - Always visible)
        │   ├── Tab Content (SCROLLABLE)
        │   │   ├── OverviewTab.jsx
        │   │   ├── AddressesTab.jsx
        │   │   │   └── AddressCard.jsx × N
        │   │   ├── ContactsTab.jsx
        │   │   │   └── ContactCard.jsx × N
        │   │   ├── PaymentTab.jsx
        │   │   ├── DocumentsTab.jsx
        │   │   │   └── DocumentCard.jsx × N
        │   │   ├── PerformanceTab.jsx
        │   │   │   └── BarChart (existing component)
        │   │   └── ItemsTab.jsx
        │   └── VendorMetricsSidebar.jsx (FIXED - Right sidebar)
        │       └── VendorKPICard.jsx × 8
        │
        ├── VendorMetricsDashboard.jsx (/vendors/metrics)
        │
        └── VendorForm.jsx (/vendors/add or /vendors/edit)
            (Placeholder - Phase 2)
```

---

## Layout Structure

### VendorDetail.jsx Layout (3-Column)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Vendors | Vendor Details                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ ┌─────────────────┐│
│ │ VendorInfoForm (FIXED - Always visible)         │ │ VendorMetrics   ││
│ │ - Vendor Code, Name, Legal Name, Trade Name     │ │ Sidebar (FIXED) ││
│ │ - Website, Status, Notes                        │ │                 ││
│ │ - Save Changes button                           │ │ ┌─────────────┐ ││
│ └─────────────────────────────────────────────────┘ │ │ Performance │ ││
│                                                      │ │ Grade: A    │ ││
│ ┌─────────────────────────────────────────────────┐ │ └─────────────┘ ││
│ │ VendorTabs (FIXED - Always visible)             │ │                 ││
│ │ ┌──────┬──────┬──────┬──────┬──────┬──────┬────┐│ │ ┌─────────────┐ ││
│ │ │Overv│Addr  │Cont  │Paym  │Docs  │Perf  │Item││ │ │ Total Items │ ││
│ │ └──────┴──────┴──────┴──────┴──────┴──────┴────┘│ │ │ 42          │ ││
│ └─────────────────────────────────────────────────┘ │ └─────────────┘ ││
│                                                      │                 ││
│ ┌─────────────────────────────────────────────────┐ │ ┌─────────────┐ ││
│ │ Tab Content (SCROLLABLE ↕)                      │ │ │ YTD Spend   │ ││
│ │                                                  │ │ │ $125,450    │ ││
│ │ • Overview: Basic info, notes, quick actions    │ │ └─────────────┘ ││
│ │ • Addresses: Billing, remittance, ship-from     │ │                 ││
│ │ • Contacts: Contact persons with roles          │ │ ┌─────────────┐ ││
│ │ • Payment: Payment terms, masked bank info      │ │ │ On-Time     │ ││
│ │ • Documents: W9s, contracts, certs w/ expiry    │ │ │ Delivery    │ ││
│ │ • Performance: Scorecard metrics with charts    │ │ │ 95.5%       │ ││
│ │ • Items: Ingredient-vendor mapping table        │ │ └─────────────┘ ││
│ │                                                  │ │                 ││
│ │ (Content scrolls while vendor info stays fixed) │ │ (8 KPI cards)   ││
│ └─────────────────────────────────────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Phase 1 (Current - Mock Data)

```
Component Request
     │
     ├──> mockData.js
     │      │
     │      ├──> MOCK_VENDORS (array)
     │      ├──> MOCK_VENDOR_DETAILS (object)
     │      ├──> MOCK_ADDRESSES (object by vendor ID)
     │      ├──> MOCK_CONTACTS (object by vendor ID)
     │      ├──> MOCK_PAYMENT_INFO (object by vendor ID)
     │      ├──> MOCK_DOCUMENTS (object by vendor ID)
     │      ├──> MOCK_SCORECARDS (object by vendor ID)
     │      ├──> MOCK_VENDOR_ITEMS (object by vendor ID)
     │      └──> MOCK_VENDOR_METRICS (object by vendor ID)
     │
     └──> Component renders with mock data
```

### Phase 2 (Future - Backend API)

```
Component Request
     │
     ├──> useQuery(['vendors'])
     │      │
     │      └──> GET /api/vendors
     │             │
     │             └──> vendorService.getVendors()
     │                    │
     │                    └──> Supabase query
     │                           │
     │                           └──> Returns vendor data
     │
     └──> Component renders with real data
```

---

## Routing Structure

```
/vendors                           → VendorsContent → VendorList
/vendors/list                      → VendorsContent → VendorList
/vendors/detail?vendorId=1         → VendorsContent → VendorDetail
/vendors/metrics                   → VendorsContent → VendorMetricsDashboard
/vendors/add                       → VendorsContent → VendorForm (mode: add)
/vendors/edit?vendorId=1           → VendorsContent → VendorForm (mode: edit)
```

---

## Tab Navigation

### 7 Tabs in VendorDetail

| Tab | ID | Icon | Description |
|-----|-----|------|-------------|
| **Overview** | `overview` | FileText | Basic info, notes, metadata, quick actions |
| **Addresses** | `addresses` | MapPin | Billing, remittance, ship-from addresses |
| **Contacts** | `contacts` | Users | Contact persons with roles and comm prefs |
| **Payment** | `payment` | CreditCard | Payment terms, masked bank account info |
| **Documents** | `documents` | FileCheck | W9s, contracts, certs with expiry status |
| **Performance** | `performance` | TrendingUp | Scorecard metrics with charts |
| **Items** | `items` | Package | Ingredient-vendor mapping table |

---

## Mock Data Entities

### 1. Vendors (6 vendors)
```javascript
{
  id: "1",
  vendor_code: "SYS001",
  name: "Sysco Foods",
  legal_name: "Sysco Corporation",
  trade_name: "Sysco",
  is_active: true,
  itemCount: 42,
  last_order_date: "2026-01-01",
  performance_grade: "A"
}
```

### 2. Addresses (3 per vendor)
```javascript
{
  id: "addr-1-1",
  vendor_id: "1",
  address_type: "billing", // billing, remittance, ship_from, shipping
  is_primary: true,
  address_line1: "1390 Enclave Parkway",
  city: "Houston",
  state: "TX",
  postal_code: "77077",
  country: "US",
  phone: "281-584-1390",
  email: "billing@sysco.com"
}
```

### 3. Contacts (3 per vendor)
```javascript
{
  id: "cont-1-1",
  vendor_id: "1",
  first_name: "John",
  last_name: "Smith",
  title: "Account Manager",
  role: "Account Manager",
  email: "john.smith@sysco.com",
  phone: "281-584-1500",
  mobile: "713-555-0100",
  is_primary: true,
  receive_orders: true,
  receive_invoices: false
}
```

### 4. Payment Info (1 per vendor)
```javascript
{
  vendor_id: "1",
  payment_term: "Net 30",
  tax_id_type: "EIN",
  tax_id_number: "12-3456789", // Masked in UI
  payment_method: "ACH",
  bank_name: "JPMorgan Chase Bank",
  bank_account_number: "1234567890123456", // Masked in UI
  credit_limit: 50000.00,
  current_balance: 12450.00
}
```

### 5. Documents (4 per vendor)
```javascript
{
  id: "doc-1-1",
  vendor_id: "1",
  document_type: "W9", // W9, insurance_certificate, contract, food_safety_cert
  document_name: "2025 W9 Tax Form",
  file_path: "/documents/sysco_w9_2025.pdf",
  file_size: 245000,
  uploaded_at: "2025-01-05T10:00:00Z",
  expiration_date: "2025-12-31", // Used for expiry logic
  is_current: true
}
```

### 6. Scorecards (5 metrics per vendor)
```javascript
{
  id: "sc-1-1",
  vendor_id: "1",
  metric_name: "on_time_delivery_pct",
  metric_label: "On-Time Delivery",
  metric_value: 95.5,
  score: 95,
  period_start: "2025-12-01",
  period_end: "2025-12-31",
  data_points_count: 42,
  trend: "up" // up, down, stable
}
```

### 7. Vendor Items (5 items per vendor)
```javascript
{
  id: "item-1-1",
  vendor_id: "1",
  ingredient_id: "ing-101",
  ingredient_name: "Tomatoes, Roma",
  vendor_item_code: "TOM-001",
  pack_size: 25,
  pack_unit: "lb",
  price_per_pack: 42.50,
  lead_time_days: 2,
  minimum_order_qty: 1,
  is_preferred: true
}
```

### 8. Vendor Metrics (1 per vendor)
```javascript
{
  vendor_id: "1",
  is_active: true,
  total_items: 42,
  avg_lead_time_days: 2.5,
  last_order_date: "2026-01-01",
  performance_grade: "A",
  total_spend_ytd: 125450.00,
  total_orders_ytd: 156,
  avg_order_value: 804.17,
  on_time_delivery_pct: 95.5,
  order_accuracy_pct: 98.2
}
```

---

## Design System Specs

### Condensed Spacing (Key Differentiator)

| Element | Standard (Other Modules) | Vendor ERP (Condensed) |
|---------|-------------------------|------------------------|
| Card Padding | `p-6` | `p-4` |
| Icon Size | `w-5 h-5` | `w-4 h-4` |
| Text Size | `text-base` | `text-sm` |
| Card Gap | `gap-6` | `gap-3` or `gap-4` |
| Header Text | `text-2xl` | `text-xl` |

### Color System

| Purpose | Tailwind Class | Hex Code |
|---------|---------------|----------|
| Primary (Actions) | `bg-green-600` | #059669 |
| Success | `bg-green-50` | #F0FDF4 |
| Warning | `bg-yellow-50` | #FEFCE8 |
| Error | `bg-red-50` | #FEF2F2 |
| Info | `bg-blue-50` | #EFF6FF |

### Button Styles

```css
/* Primary Button */
className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 text-sm rounded"

/* Secondary Button */
className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 text-sm rounded"

/* Danger Button */
className="bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 text-sm rounded"
```

### Badge Styles

```css
/* Active Badge */
className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs"

/* Inactive Badge */
className="bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-xs"

/* Primary Badge */
className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-xs"
```

---

## Special Features

### 1. Document Expiry Logic

```javascript
function getDocumentStatus(expirationDate) {
  if (!expirationDate) return { status: "none", label: "No Expiration", badgeClass: "bg-gray-50..." };

  const today = new Date();
  const expiry = new Date(expirationDate);
  const daysUntil = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return { status: "expired", label: "Expired", badgeClass: "bg-red-50 text-red-700..." };
  }
  if (daysUntil <= 30) {
    return { status: "expiring", label: `Expires in ${daysUntil} days`, badgeClass: "bg-yellow-50..." };
  }
  return { status: "current", label: "Current", badgeClass: "bg-green-50..." };
}
```

### 2. Sensitive Data Masking

```javascript
// Tax ID: 12-3456789 → XX-XXXX789
function maskTaxId(taxId) {
  const cleanId = taxId.replace(/[^0-9]/g, "");
  const last4 = cleanId.slice(-4);
  return `XX-XXXX${last4}`;
}

// Bank Account: 1234567890123456 → ************3456
function maskAccountNumber(accountNumber) {
  const last4 = accountNumber.slice(-4);
  return `${"*".repeat(accountNumber.length - 4)}${last4}`;
}
```

### 3. Performance Grading

```javascript
function getGradeFromScore(score) {
  if (score >= 90) return "A"; // Green
  if (score >= 80) return "B"; // Blue
  if (score >= 70) return "C"; // Yellow
  if (score >= 60) return "D"; // Orange
  return "F"; // Red
}
```

---

## Accessibility Implementation

### ARIA Labels
```jsx
<button aria-label="Edit address" onClick={handleEdit}>
  <Edit className="w-4 h-4" />
</button>

<button aria-label="Delete contact" onClick={handleDelete}>
  <Trash2 className="w-4 h-4" />
</button>
```

### Keyboard Navigation
```jsx
<button
  onClick={handleAction}
  onKeyDown={(e) => e.key === 'Enter' && handleAction()}
  tabIndex={0}
>
  Action
</button>
```

### Screen Reader Support
```jsx
<div role="region" aria-label="Vendor metrics">
  <h3 id="metrics-title">Key Metrics</h3>
  <div aria-labelledby="metrics-title">
    {/* Metrics content */}
  </div>
</div>
```

### Focus Indicators
```css
focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
```

---

## File Manifest

### Created Files (23)

**Core:**
- `/frontend/src/components/vendor-erp/mockData.js`
- `/frontend/src/components/vendor-erp/VendorsContent.jsx`
- `/frontend/src/components/vendor-erp/VendorList.jsx`
- `/frontend/src/components/vendor-erp/VendorDetail.jsx`
- `/frontend/src/components/vendor-erp/VendorInfoForm.jsx`
- `/frontend/src/components/vendor-erp/VendorTabs.jsx`
- `/frontend/src/components/vendor-erp/VendorMetricsSidebar.jsx`
- `/frontend/src/components/vendor-erp/VendorMetricsDashboard.jsx`
- `/frontend/src/components/vendor-erp/VendorForm.jsx`

**Tabs:**
- `/frontend/src/components/vendor-erp/tabs/OverviewTab.jsx`
- `/frontend/src/components/vendor-erp/tabs/AddressesTab.jsx`
- `/frontend/src/components/vendor-erp/tabs/ContactsTab.jsx`
- `/frontend/src/components/vendor-erp/tabs/PaymentTab.jsx`
- `/frontend/src/components/vendor-erp/tabs/DocumentsTab.jsx`
- `/frontend/src/components/vendor-erp/tabs/PerformanceTab.jsx`
- `/frontend/src/components/vendor-erp/tabs/ItemsTab.jsx`

**Components:**
- `/frontend/src/components/vendor-erp/components/VendorCard.jsx`
- `/frontend/src/components/vendor-erp/components/VendorKPICard.jsx`
- `/frontend/src/components/vendor-erp/components/AddressCard.jsx`
- `/frontend/src/components/vendor-erp/components/ContactCard.jsx`
- `/frontend/src/components/vendor-erp/components/DocumentCard.jsx`

**Modified:**
- `/frontend/src/config/menuItems.js` (Added Vendors menu)
- `/frontend/src/components/dashboard/MainContent.jsx` (Added vendors routing)

---

## Quick Start Guide

### 1. Navigate to Vendors
```
Click "Vendors" in sidebar → See vendor list
```

### 2. View Vendor Details
```
Click any vendor card → See detail page with 7 tabs
```

### 3. Explore Tabs
```
Overview   → Basic info, notes, quick actions
Addresses  → Billing, remittance, ship-from addresses
Contacts   → Contact persons with roles
Payment    → Payment terms, masked bank info
Documents  → W9s, contracts, certs with expiry status
Performance → Scorecard metrics with charts
Items      → Ingredient-vendor mapping table
```

### 4. View Metrics Dashboard
```
Click "Vendor Metrics" submenu → See aggregate metrics and top performers
```

---

## Phase 2 Integration Checklist

### Replace Mock Data (Week 1)
- [ ] Import `useQuery` from TanStack Query
- [ ] Create `vendorService.js` with API wrappers
- [ ] Replace `getMockVendorById()` → `useQuery(['vendor', id])`
- [ ] Replace all mock getters with query hooks

### Add Mutations (Week 2)
- [ ] Create vendor: `useMutation(createVendor)`
- [ ] Update vendor: `useMutation(updateVendor)`
- [ ] Delete vendor: `useMutation(deleteVendor)`
- [ ] Wire up form submissions

### Add Loading/Error States (Week 3)
- [ ] Skeleton screens for loading
- [ ] Error boundaries for API failures
- [ ] Retry logic for failed requests
- [ ] Success/error toast notifications

### Implement Advanced Features (Week 4)
- [ ] File upload for documents
- [ ] Form validation with Zod
- [ ] Optimistic UI updates
- [ ] Cache invalidation strategies

---

**Phase 1 Status:** ✅ COMPLETE
**Ready for:** Phase 2 Backend Integration
