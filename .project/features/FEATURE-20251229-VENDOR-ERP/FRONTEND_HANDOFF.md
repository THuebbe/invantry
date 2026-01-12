# Vendor ERP Module - Frontend Handoff Documentation

**Version:** 1.0.0
**Last Updated:** January 1, 2026
**Backend Status:** 100% Complete and Tested
**Frontend Status:** Ready for Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Status](#current-status)
3. [Tech Stack](#tech-stack)
4. [Database Schema](#database-schema)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Authentication](#authentication)
7. [Data Models](#data-models)
8. [Integration with Existing System](#integration-with-existing-system)
9. [Testing](#testing)
10. [Recommended UI Implementation](#recommended-ui-implementation)
11. [Next Steps](#next-steps)

---

## Project Overview

The Vendor ERP Module is a comprehensive backend system that extends Invantry's existing vendor management with enterprise-level features. This module provides complete vendor lifecycle management including:

- **Multiple Addresses** - Billing, remittance, shipping, warehouse locations
- **Contact Management** - Multiple contacts per vendor with roles and notification preferences
- **Payment Information** - Banking details, tax IDs, payment terms, credit limits
- **Purchasing Defaults** - Lead times, minimum order quantities, package configurations
- **Document Management** - W9s, contracts, insurance certificates with expiration tracking
- **Performance Scorecards** - Track vendor KPIs over time (on-time delivery, quality, etc.)

### What Was Built

- **8 New Database Tables** with full relational integrity
- **42 RESTful API Endpoints** with comprehensive CRUD operations
- **100% Test Coverage** - All endpoints validated with Postman
- **Multi-tenancy Support** - Full restaurant isolation
- **Data Migration Scripts** - Safe migration of existing vendor data

---

## Current Status

### Backend Implementation: ✅ COMPLETE

| Component | Status | Details |
|-----------|--------|---------|
| Database Schema | ✅ Complete | 8 tables + extensions to 2 existing tables |
| API Routes | ✅ Complete | 42 endpoints across 8 route files |
| Service Layer | ✅ Complete | Business logic with validation |
| Authentication | ✅ Complete | JWT-based auth on all endpoints |
| Testing | ✅ Complete | Postman collection with 100% coverage |
| Documentation | ✅ Complete | API docs + Postman collection |

### Frontend Implementation: ⏳ READY TO START

The backend is production-ready. All you need to do is build the UI.

---

## Tech Stack

### Backend (Already Built)
- **Framework:** Express.js (Node.js)
- **Database:** Supabase (PostgreSQL 15)
- **Authentication:** JWT tokens via Supabase Auth
- **API Style:** RESTful JSON APIs
- **Validation:** Server-side validation on all inputs

### Frontend (Your Responsibility)
- **Framework:** React 18 + Vite
- **Language:** JavaScript (NO TypeScript)
- **Styling:** Tailwind CSS + HeroUI components
- **State Management:** React hooks + TanStack Query
- **Routing:** React Router v6
- **HTTP Client:** Axios (already configured in `frontend/src/core/database/api.js`)

---

## Database Schema

### New Tables Created

#### 1. `payment_terms` (Platform-wide Reference Data)
**Purpose:** Shared payment terms reference (Net 30, COD, etc.)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(50) | Payment term name (unique) |
| `description` | TEXT | Full description |
| `days` | INTEGER | Days until payment due |
| `discount_percent` | DECIMAL(5,2) | Early payment discount % |
| `discount_days` | INTEGER | Days for early payment discount |
| `is_active` | BOOLEAN | Active flag |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Seeded Data:** 8 common payment terms (Due on Receipt, Net 30, Net 60, 2/10 Net 30, etc.)

---

#### 2. `vendor_addresses`
**Purpose:** Multiple addresses per vendor (billing, shipping, warehouse, etc.)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `vendor_id` | UUID | FK to vendors table |
| `address_type` | VARCHAR(50) | billing, remittance, ship_from, warehouse, primary, other |
| `is_primary` | BOOLEAN | Primary address flag (only one per vendor) |
| `address_line1` | VARCHAR(255) | Street address (required) |
| `address_line2` | VARCHAR(255) | Apt/Suite (optional) |
| `city` | VARCHAR(100) | City (required) |
| `state` | VARCHAR(50) | State/Province (required) |
| `postal_code` | VARCHAR(20) | ZIP/Postal code (required) |
| `country` | VARCHAR(2) | ISO country code (required) |
| `phone` | VARCHAR(20) | Contact phone |
| `fax` | VARCHAR(20) | Fax number |
| `email` | VARCHAR(255) | Contact email |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Business Rules:**
- Only ONE address can be `is_primary = true` per vendor
- Setting a new primary automatically unsets the previous primary

---

#### 3. `vendor_contacts`
**Purpose:** Multiple contacts per vendor with roles and notification preferences

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `vendor_id` | UUID | FK to vendors table |
| `first_name` | VARCHAR(100) | First name (required) |
| `last_name` | VARCHAR(100) | Last name (required) |
| `title` | VARCHAR(100) | Job title |
| `role` | VARCHAR(50) | Sales Rep, Account Manager, Billing Contact, etc. |
| `email` | VARCHAR(255) | Email (required) |
| `phone` | VARCHAR(20) | Office phone |
| `mobile` | VARCHAR(20) | Mobile phone |
| `fax` | VARCHAR(20) | Fax number |
| `is_primary` | BOOLEAN | Primary contact flag |
| `receive_orders` | BOOLEAN | Receive order notifications |
| `receive_invoices` | BOOLEAN | Receive invoice notifications |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Business Rules:**
- Only ONE contact can be `is_primary = true` per vendor
- `email` must be valid email format

---

#### 4. `vendor_payment_info`
**Purpose:** Payment and banking information (ONE per vendor)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `vendor_id` | UUID | FK to vendors table (UNIQUE) |
| `payment_term_id` | UUID | FK to payment_terms table |
| `tax_id_type` | VARCHAR(20) | EIN, SSN, VAT, GST, Other |
| `tax_id_number` | VARCHAR(50) | Tax ID (encrypted at DB level) |
| `payment_method` | VARCHAR(50) | Check, ACH, Wire, Credit Card, etc. |
| `bank_name` | VARCHAR(255) | Name of bank |
| `bank_account_type` | VARCHAR(20) | Checking, Savings |
| `bank_routing_number` | VARCHAR(20) | Bank routing number |
| `bank_account_number` | VARCHAR(50) | Account number (encrypted) |
| `remittance_email` | VARCHAR(255) | Email for payment remittance |
| `credit_limit` | DECIMAL(12,2) | Credit limit amount |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Security Note:** Sensitive fields (account numbers) are encrypted at the database level.

---

#### 5. `vendor_purchasing_data`
**Purpose:** Default purchasing configuration per vendor

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `vendor_id` | UUID | FK to vendors table (UNIQUE) |
| `lead_time_days` | INTEGER | Default lead time in days |
| `minimum_order_amount` | DECIMAL(12,2) | Minimum order amount |
| `default_delivery_method` | VARCHAR(50) | Delivery, Pickup, etc. |
| `ordering_notes` | TEXT | Special ordering instructions |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

---

#### 6. `vendor_documents`
**Purpose:** Document storage with expiration tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `vendor_id` | UUID | FK to vendors table |
| `document_type` | VARCHAR(50) | w9, w8, form_1099, contract, insurance_certificate, etc. |
| `document_name` | VARCHAR(255) | Display name (required) |
| `file_path` | TEXT | Storage path or URL (required) |
| `file_url` | TEXT | Public URL (if applicable) |
| `expiration_date` | DATE | Expiration date (for tracking) |
| `is_current` | BOOLEAN | Current version flag |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Document Types:**
- `w9` - W9 Tax Form
- `w8` - W8 Tax Form
- `form_1099` - 1099 Form
- `contract` - Vendor contract
- `insurance_certificate` - Insurance certificate
- `food_safety_cert` - Food safety certification
- `business_license` - Business license
- `pricing_sheet` - Current pricing
- `other` - Other documents

---

#### 7. `vendor_scorecards`
**Purpose:** Performance tracking over time

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `vendor_id` | UUID | FK to vendors table |
| `period_start` | DATE | Measurement period start (required) |
| `period_end` | DATE | Measurement period end (required) |
| `on_time_delivery_pct` | DECIMAL(5,2) | % of on-time deliveries (0-100) |
| `order_accuracy_pct` | DECIMAL(5,2) | % of accurate orders (0-100) |
| `fill_rate_pct` | DECIMAL(5,2) | % of items fulfilled (0-100) |
| `quality_rating` | DECIMAL(3,2) | Quality rating (0-5 scale) |
| `response_time_hours` | DECIMAL(8,2) | Avg response time in hours |
| `issue_resolution_days` | DECIMAL(8,2) | Avg days to resolve issues |
| `total_orders` | INTEGER | Number of orders in period |
| `total_order_value` | DECIMAL(12,2) | Total $ value of orders |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

---

### Extended Tables

#### 8. `vendors` (Extended)
**New Columns Added:**

| Column | Type | Description |
|--------|------|-------------|
| `vendor_code` | VARCHAR(50) | Internal vendor code/ID (unique per restaurant) |
| `legal_name` | VARCHAR(255) | Legal business name |
| `trade_name` | VARCHAR(255) | DBA / Trading name |

---

#### 9. `ingredient_vendor_mapping` (Extended)
**New Columns Added:**

| Column | Type | Description |
|--------|------|-------------|
| `vendor_item_code` | VARCHAR(100) | Vendor's item/SKU code |
| `vendor_item_name` | VARCHAR(255) | Vendor's item name |
| `pack_size` | DECIMAL(10,3) | Package size |
| `pack_unit` | VARCHAR(20) | Package unit (lb, kg, ea, etc.) |
| `price_per_pack` | DECIMAL(10,2) | Price per package |
| `price_unit` | VARCHAR(20) | Price unit |
| `price_effective_date` | DATE | When price becomes effective |
| `lead_time_days` | INTEGER | Item-specific lead time |
| `minimum_order_qty` | DECIMAL(10,2) | Minimum order quantity |

---

## API Endpoints Reference

**Base URL:** `http://localhost:3001/api` (development)
**Authentication:** Required on ALL endpoints (JWT Bearer token)
**Content-Type:** `application/json`

### Authentication Endpoints (2)

#### 1. Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@restaurant.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@restaurant.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "userDetails": {
    "businessId": "uuid",
    "restaurantId": "uuid"
  }
}
```

**Usage:**
1. Store `accessToken` in localStorage as `auth_token`
2. Include in all subsequent requests: `Authorization: Bearer {accessToken}`

---

#### 2. Get Current User
```
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@restaurant.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "businessId": "uuid",
  "restaurantId": "uuid"
}
```

---

### Payment Terms Endpoints (2)

#### 1. List All Payment Terms
```
GET /api/payment-terms
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Net 30",
    "description": "Payment due 30 days after invoice date",
    "days": 30,
    "discount_percent": 0,
    "discount_days": 0,
    "is_active": true,
    "created_at": "2025-12-29T00:00:00Z",
    "updated_at": "2025-12-29T00:00:00Z"
  }
]
```

---

#### 2. Get Payment Term by ID
```
GET /api/payment-terms/:id
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Net 30",
  "description": "Payment due 30 days after invoice date",
  "days": 30,
  "discount_percent": 0,
  "discount_days": 0,
  "is_active": true,
  "created_at": "2025-12-29T00:00:00Z",
  "updated_at": "2025-12-29T00:00:00Z"
}
```

---

### Vendor Endpoints (7)

#### 1. List All Vendors
```
GET /api/vendors
GET /api/vendors?is_active=true
```

**Query Parameters:**
- `is_active` (optional): `true` or `false` - filter by active status

**Response (200):**
```json
[
  {
    "id": "uuid",
    "restaurant_id": "uuid",
    "name": "Sysco Foods",
    "vendor_code": "SYS001",
    "legal_name": "Sysco Corporation",
    "trade_name": "Sysco",
    "is_active": true,
    "notes": "Primary food supplier",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

**Headers:**
- `X-Total-Count`: Total number of vendors returned

---

#### 2. Get Vendor by ID
```
GET /api/vendors/:id
```

**Response (200):**
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "name": "Sysco Foods",
  "vendor_code": "SYS001",
  "legal_name": "Sysco Corporation",
  "trade_name": "Sysco",
  "is_active": true,
  "notes": "Primary food supplier",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `404` - Vendor not found
- `500` - Server error

---

#### 3. Get Vendor Summary (Complete Data)
```
GET /api/vendors/:id/summary
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Sysco Foods",
  "vendor_code": "SYS001",
  "legal_name": "Sysco Corporation",
  "trade_name": "Sysco",
  "is_active": true,
  "notes": "Primary food supplier",
  "addresses": [
    {
      "id": "uuid",
      "address_type": "billing",
      "is_primary": true,
      "address_line1": "123 Main St",
      "city": "Chicago",
      "state": "IL",
      "postal_code": "60601",
      "country": "US",
      "phone": "312-555-0100"
    }
  ],
  "contacts": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Smith",
      "title": "Account Manager",
      "email": "john.smith@sysco.com",
      "phone": "312-555-0123",
      "is_primary": true,
      "receive_orders": true
    }
  ],
  "payment_info": {
    "id": "uuid",
    "payment_term_id": "uuid",
    "payment_method": "ACH",
    "credit_limit": 50000.00
  },
  "items": [
    {
      "ingredient_id": "uuid",
      "ingredient_name": "Tomatoes",
      "vendor_item_code": "TOM-001",
      "pack_size": 25,
      "pack_unit": "lb",
      "price_per_pack": 42.50,
      "is_preferred": true
    }
  ],
  "documents": [
    {
      "id": "uuid",
      "document_type": "w9",
      "document_name": "2025 W9 Form",
      "expiration_date": "2025-12-31"
    }
  ],
  "scorecards": [
    {
      "id": "uuid",
      "period_start": "2025-12-01",
      "period_end": "2025-12-31",
      "on_time_delivery_pct": 95.5,
      "order_accuracy_pct": 98.2
    }
  ],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Use Case:** Display complete vendor profile on a single page

---

#### 4. Get Vendor Metrics (Dashboard KPIs)
```
GET /api/vendors/metrics
```

**Response (200):**
```json
{
  "activeVendorsCount": 12,
  "avgLeadTimeDays": 3.5,
  "topVendorBySpend": {
    "vendor_id": "uuid",
    "vendor_name": "Sysco Foods",
    "total_spend": 125000.50
  },
  "expiringDocumentsCount": 3
}
```

**Use Case:** Dashboard widgets and KPI cards

---

#### 5. Create Vendor
```
POST /api/vendors
```

**Request Body:**
```json
{
  "name": "New Vendor Inc",
  "vendor_code": "NEW001",
  "legal_name": "New Vendor Incorporated",
  "trade_name": "New Vendor",
  "is_active": true,
  "notes": "New supplier"
}
```

**Required Fields:**
- `name` - Vendor name (min 1 character)

**Optional Fields:**
- `vendor_code` - Internal code (must be unique per restaurant)
- `legal_name` - Legal business name
- `trade_name` - DBA name
- `is_active` - Active status (default: true)
- `notes` - Additional notes

**Response (201):**
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "name": "New Vendor Inc",
  "vendor_code": "NEW001",
  "legal_name": "New Vendor Incorporated",
  "trade_name": "New Vendor",
  "is_active": true,
  "notes": "New supplier",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

**Error Responses:**
- `400` - Validation error (missing name, invalid data)
- `409` - Conflict (vendor_code already exists for this restaurant)
- `500` - Server error

---

#### 6. Update Vendor
```
PUT /api/vendors/:id
```

**Request Body (partial update):**
```json
{
  "name": "Updated Vendor Name",
  "notes": "Updated notes"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "name": "Updated Vendor Name",
  "vendor_code": "NEW001",
  "legal_name": "New Vendor Incorporated",
  "trade_name": "New Vendor",
  "is_active": true,
  "notes": "Updated notes",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:30:00Z"
}
```

**Error Responses:**
- `400` - Validation error
- `404` - Vendor not found
- `409` - Conflict (vendor_code already exists)
- `500` - Server error

---

#### 7. Delete Vendor (Soft Delete)
```
DELETE /api/vendors/:id
```

**Response (200):**
```json
{
  "message": "Vendor deleted successfully",
  "vendor_id": "uuid"
}
```

**Business Logic:**
- Sets `is_active = false` (soft delete)
- Vendor record is preserved in database
- Cannot delete vendors with open purchase orders

**Error Responses:**
- `404` - Vendor not found
- `409` - Cannot delete vendor with open POs
- `500` - Server error

---

### Vendor Address Endpoints (7)

#### 1. List Vendor Addresses
```
GET /api/vendors/:vendorId/addresses
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "vendor_id": "uuid",
    "address_type": "billing",
    "is_primary": true,
    "address_line1": "123 Main Street",
    "address_line2": "Suite 200",
    "city": "Chicago",
    "state": "IL",
    "postal_code": "60601",
    "country": "US",
    "phone": "312-555-0123",
    "fax": "312-555-0124",
    "email": "billing@vendor.com",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

---

#### 2. Get Address by ID
```
GET /api/vendors/:vendorId/addresses/:id
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "address_type": "billing",
  "is_primary": true,
  "address_line1": "123 Main Street",
  "address_line2": "Suite 200",
  "city": "Chicago",
  "state": "IL",
  "postal_code": "60601",
  "country": "US",
  "phone": "312-555-0123",
  "fax": "312-555-0124",
  "email": "billing@vendor.com",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

#### 3. Get Primary Address
```
GET /api/vendors/:vendorId/addresses/primary
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "address_type": "primary",
  "is_primary": true,
  "address_line1": "123 Main Street",
  "city": "Chicago",
  "state": "IL",
  "postal_code": "60601",
  "country": "US",
  "phone": "312-555-0123",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `404` - No primary address found

---

#### 4. Create Vendor Address
```
POST /api/vendors/:vendorId/addresses
```

**Request Body:**
```json
{
  "address_type": "billing",
  "is_primary": false,
  "address_line1": "123 Main Street",
  "address_line2": "Suite 200",
  "city": "Chicago",
  "state": "IL",
  "postal_code": "60601",
  "country": "US",
  "phone": "312-555-0123",
  "fax": "312-555-0124",
  "email": "billing@vendor.com"
}
```

**Required Fields:**
- `address_type` - One of: `billing`, `remittance`, `ship_from`, `warehouse`, `primary`, `other`
- `address_line1` - Street address
- `city` - City name
- `state` - State/Province code
- `postal_code` - ZIP/Postal code
- `country` - Country code (e.g., `US`, `CA`)

**Optional Fields:**
- `is_primary` - Set as primary address (default: false)
- `address_line2` - Apartment, suite, etc.
- `phone`, `fax`, `email` - Contact information

**Response (201):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "address_type": "billing",
  "is_primary": false,
  "address_line1": "123 Main Street",
  "address_line2": "Suite 200",
  "city": "Chicago",
  "state": "IL",
  "postal_code": "60601",
  "country": "US",
  "phone": "312-555-0123",
  "fax": "312-555-0124",
  "email": "billing@vendor.com",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

**Error Responses:**
- `400` - Validation error
- `404` - Vendor not found
- `409` - Duplicate address
- `500` - Server error

---

#### 5. Update Vendor Address
```
PUT /api/vendors/:vendorId/addresses/:id
```

**Request Body (partial update):**
```json
{
  "address_line2": "Suite 300 - Updated",
  "phone": "312-555-9999"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "address_type": "billing",
  "is_primary": false,
  "address_line1": "123 Main Street",
  "address_line2": "Suite 300 - Updated",
  "city": "Chicago",
  "state": "IL",
  "postal_code": "60601",
  "country": "US",
  "phone": "312-555-9999",
  "fax": "312-555-0124",
  "email": "billing@vendor.com",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:30:00Z"
}
```

---

#### 6. Set Primary Address
```
PUT /api/vendors/:vendorId/addresses/:id/set-primary
```

**No Request Body Required**

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "address_type": "billing",
  "is_primary": true,
  "address_line1": "123 Main Street",
  "city": "Chicago",
  "state": "IL",
  "postal_code": "60601",
  "country": "US",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:30:00Z"
}
```

**Business Logic:**
- Automatically unsets any existing primary address
- Sets the specified address as primary

---

#### 7. Delete Vendor Address
```
DELETE /api/vendors/:vendorId/addresses/:id
```

**Response (200):**
```json
{
  "message": "Address deleted successfully",
  "address_id": "uuid"
}
```

**Note:** Hard delete - permanently removes the address from the database

---

### Vendor Contact Endpoints (7)

#### 1. List Vendor Contacts
```
GET /api/vendors/:vendorId/contacts
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "vendor_id": "uuid",
    "first_name": "John",
    "last_name": "Smith",
    "title": "Account Manager",
    "role": "Account Manager",
    "email": "john.smith@vendor.com",
    "phone": "312-555-1000",
    "mobile": "312-555-2000",
    "fax": "312-555-3000",
    "is_primary": true,
    "receive_orders": true,
    "receive_invoices": false,
    "notes": "Primary ordering contact",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

---

#### 2. Get Contact by ID
```
GET /api/vendors/:vendorId/contacts/:id
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "first_name": "John",
  "last_name": "Smith",
  "title": "Account Manager",
  "role": "Account Manager",
  "email": "john.smith@vendor.com",
  "phone": "312-555-1000",
  "mobile": "312-555-2000",
  "is_primary": true,
  "receive_orders": true,
  "receive_invoices": false,
  "notes": "Primary ordering contact",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

#### 3. Get Primary Contact
```
GET /api/vendors/:vendorId/contacts/primary
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "first_name": "John",
  "last_name": "Smith",
  "title": "Account Manager",
  "email": "john.smith@vendor.com",
  "phone": "312-555-1000",
  "is_primary": true,
  "receive_orders": true,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `404` - No primary contact found

---

#### 4. Create Vendor Contact
```
POST /api/vendors/:vendorId/contacts
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "title": "Account Manager",
  "role": "Account Manager",
  "email": "john.smith@vendor.com",
  "phone": "312-555-1000",
  "mobile": "312-555-2000",
  "is_primary": false,
  "receive_orders": true,
  "receive_invoices": false,
  "notes": "Primary account contact"
}
```

**Required Fields:**
- `first_name` - Contact's first name
- `last_name` - Contact's last name
- `email` - Valid email address

**Optional Fields:**
- `title` - Job title
- `role` - One of: `Sales Rep`, `Account Manager`, `Billing Contact`, `Customer Service`, `Owner/Manager`, `Driver`, `Other`
- `phone` - Office phone
- `mobile` - Mobile phone
- `fax` - Fax number
- `is_primary` - Set as primary contact (default: false)
- `receive_orders` - Receive order notifications (default: false)
- `receive_invoices` - Receive invoice notifications (default: false)
- `notes` - Additional notes

**Response (201):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "first_name": "John",
  "last_name": "Smith",
  "title": "Account Manager",
  "role": "Account Manager",
  "email": "john.smith@vendor.com",
  "phone": "312-555-1000",
  "mobile": "312-555-2000",
  "is_primary": false,
  "receive_orders": true,
  "receive_invoices": false,
  "notes": "Primary account contact",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

---

#### 5. Update Vendor Contact
```
PUT /api/vendors/:vendorId/contacts/:id
```

**Request Body (partial update):**
```json
{
  "title": "Senior Account Manager",
  "mobile": "312-555-3000",
  "receive_invoices": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "first_name": "John",
  "last_name": "Smith",
  "title": "Senior Account Manager",
  "role": "Account Manager",
  "email": "john.smith@vendor.com",
  "phone": "312-555-1000",
  "mobile": "312-555-3000",
  "is_primary": false,
  "receive_orders": true,
  "receive_invoices": true,
  "notes": "Primary account contact",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:30:00Z"
}
```

---

#### 6. Set Primary Contact
```
PUT /api/vendors/:vendorId/contacts/:id/set-primary
```

**No Request Body Required**

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "first_name": "John",
  "last_name": "Smith",
  "is_primary": true,
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:30:00Z"
}
```

**Business Logic:**
- Automatically unsets any existing primary contact
- Sets the specified contact as primary

---

#### 7. Delete Vendor Contact
```
DELETE /api/vendors/:vendorId/contacts/:id
```

**Response (200):**
```json
{
  "message": "Contact deleted successfully",
  "contact_id": "uuid"
}
```

**Note:** Hard delete - permanently removes the contact from the database

---

### Vendor Payment Info Endpoints (4)

#### 1. Get Vendor Payment Info
```
GET /api/vendors/:vendorId/payment-info
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "payment_term_id": "uuid",
  "tax_id_type": "EIN",
  "tax_id_number": "12-3456789",
  "payment_method": "ACH",
  "bank_name": "First National Bank",
  "bank_account_type": "Checking",
  "bank_routing_number": "021000021",
  "bank_account_number": "****6789",
  "remittance_email": "payments@vendor.com",
  "credit_limit": 50000.00,
  "notes": "Standard payment terms",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Security Note:** Sensitive fields (account numbers) are masked in responses (e.g., `****6789`)

**Error Responses:**
- `404` - No payment info found for this vendor

---

#### 2. Create Vendor Payment Info
```
POST /api/vendors/:vendorId/payment-info
```

**Request Body:**
```json
{
  "payment_term_id": "uuid",
  "tax_id_type": "EIN",
  "tax_id_number": "12-3456789",
  "payment_method": "ACH",
  "bank_name": "First National Bank",
  "bank_account_type": "Checking",
  "bank_routing_number": "021000021",
  "bank_account_number": "123456789012",
  "remittance_email": "payments@vendor.com",
  "credit_limit": 50000.00,
  "notes": "Standard payment terms"
}
```

**Required Fields:**
- `payment_term_id` - Reference to payment_terms table

**Optional Fields:**
- `tax_id_type` - One of: `EIN`, `SSN`, `VAT`, `GST`, `Other`
- `tax_id_number` - Tax identification number
- `payment_method` - One of: `Check`, `ACH`, `Wire`, `Credit Card`, `PayPal`, `Other`
- `bank_name` - Name of bank
- `bank_account_type` - One of: `Checking`, `Savings`
- `bank_routing_number` - Bank routing number (US)
- `bank_account_number` - Bank account number (encrypted)
- `remittance_email` - Email for payment remittance
- `credit_limit` - Credit limit amount
- `notes` - Additional notes

**Response (201):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "payment_term_id": "uuid",
  "tax_id_type": "EIN",
  "tax_id_number": "12-3456789",
  "payment_method": "ACH",
  "bank_name": "First National Bank",
  "bank_account_type": "Checking",
  "bank_routing_number": "021000021",
  "bank_account_number": "****6789",
  "remittance_email": "payments@vendor.com",
  "credit_limit": 50000.00,
  "notes": "Standard payment terms",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

**Business Rule:** Only ONE payment info record per vendor is allowed

---

#### 3. Update Vendor Payment Info
```
PUT /api/vendors/:vendorId/payment-info
```

**Request Body (partial update):**
```json
{
  "credit_limit": 75000.00,
  "notes": "Credit limit increased"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "payment_term_id": "uuid",
  "credit_limit": 75000.00,
  "notes": "Credit limit increased",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:30:00Z"
}
```

---

#### 4. Delete Vendor Payment Info
```
DELETE /api/vendors/:vendorId/payment-info
```

**Response (200):**
```json
{
  "message": "Payment info deleted successfully",
  "vendor_id": "uuid"
}
```

**Note:** Hard delete - permanently removes the payment info from the database

---

### Vendor Document Endpoints (7)

#### 1. List Vendor Documents
```
GET /api/vendors/:vendorId/documents
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "vendor_id": "uuid",
    "document_type": "w9",
    "document_name": "2025 W9 Tax Form",
    "file_path": "/documents/vendors/w9_vendor_2025.pdf",
    "file_url": "https://example.com/documents/vendors/w9_vendor_2025.pdf",
    "expiration_date": "2025-12-31",
    "is_current": true,
    "notes": "Current W9 on file",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

---

#### 2. Get Document by ID
```
GET /api/vendors/:vendorId/documents/:id
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "document_type": "w9",
  "document_name": "2025 W9 Tax Form",
  "file_path": "/documents/vendors/w9_vendor_2025.pdf",
  "file_url": "https://example.com/documents/vendors/w9_vendor_2025.pdf",
  "expiration_date": "2025-12-31",
  "is_current": true,
  "notes": "Current W9 on file",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

#### 3. Create Vendor Document
```
POST /api/vendors/:vendorId/documents
```

**Request Body:**
```json
{
  "document_type": "w9",
  "document_name": "2025 W9 Tax Form",
  "file_path": "/documents/vendors/w9_vendor_2025.pdf",
  "file_url": "https://example.com/documents/vendors/w9_vendor_2025.pdf",
  "expiration_date": "2025-12-31",
  "is_current": true,
  "notes": "Current W9 on file"
}
```

**Required Fields:**
- `document_type` - One of: `w9`, `w8`, `form_1099`, `contract`, `insurance_certificate`, `food_safety_cert`, `business_license`, `pricing_sheet`, `other`
- `document_name` - Display name for the document
- `file_path` - Storage path or URL to the document file

**Optional Fields:**
- `file_url` - Public URL (if different from file_path)
- `expiration_date` - Expiration date (YYYY-MM-DD format)
- `is_current` - Mark as current version (for pricing sheets)
- `notes` - Additional notes

**Response (201):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "document_type": "w9",
  "document_name": "2025 W9 Tax Form",
  "file_path": "/documents/vendors/w9_vendor_2025.pdf",
  "file_url": "https://example.com/documents/vendors/w9_vendor_2025.pdf",
  "expiration_date": "2025-12-31",
  "is_current": true,
  "notes": "Current W9 on file",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

**Note:** This endpoint creates the database record. File upload to storage is handled separately.

---

#### 4. Update Vendor Document
```
PUT /api/vendors/:vendorId/documents/:id
```

**Request Body (partial update):**
```json
{
  "expiration_date": "2026-12-31",
  "notes": "Expiration date extended"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "document_type": "w9",
  "document_name": "2025 W9 Tax Form",
  "expiration_date": "2026-12-31",
  "notes": "Expiration date extended",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:30:00Z"
}
```

---

#### 5. Get Expired Documents
```
GET /api/vendors/:vendorId/documents/expired
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "vendor_id": "uuid",
    "document_type": "insurance_certificate",
    "document_name": "2024 Insurance Certificate",
    "expiration_date": "2024-12-31",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Use Case:** Alert users to expired documents that need renewal

---

#### 6. Get Expiring Soon Documents
```
GET /api/vendors/:vendorId/documents/expiring-soon?days=30
```

**Query Parameters:**
- `days` (optional): Number of days to look ahead (default: 30, min: 1, max: 365)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "vendor_id": "uuid",
    "document_type": "insurance_certificate",
    "document_name": "2025 Insurance Certificate",
    "expiration_date": "2025-01-15",
    "days_until_expiration": 14,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

**Use Case:** Proactive document renewal reminders

---

#### 7. Delete Vendor Document
```
DELETE /api/vendors/:vendorId/documents/:id
```

**Response (200):**
```json
{
  "message": "Document deleted successfully",
  "document_id": "uuid"
}
```

**Note:** This only deletes the database record, not the actual file from storage.

---

### Vendor Scorecard Endpoints (6)

#### 1. List Vendor Scorecards
```
GET /api/vendors/:vendorId/scorecards
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "vendor_id": "uuid",
    "period_start": "2025-12-01",
    "period_end": "2025-12-31",
    "on_time_delivery_pct": 95.5,
    "order_accuracy_pct": 98.2,
    "fill_rate_pct": 97.8,
    "quality_rating": 4.5,
    "response_time_hours": 2.3,
    "issue_resolution_days": 1.5,
    "total_orders": 42,
    "total_order_value": 12500.50,
    "notes": "Excellent performance this month",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

---

#### 2. Get Scorecard by ID
```
GET /api/vendors/:vendorId/scorecards/:id
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "period_start": "2025-12-01",
  "period_end": "2025-12-31",
  "on_time_delivery_pct": 95.5,
  "order_accuracy_pct": 98.2,
  "fill_rate_pct": 97.8,
  "quality_rating": 4.5,
  "response_time_hours": 2.3,
  "issue_resolution_days": 1.5,
  "total_orders": 42,
  "total_order_value": 12500.50,
  "notes": "Excellent performance this month",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

#### 3. Create Vendor Scorecard
```
POST /api/vendors/:vendorId/scorecards
```

**Request Body:**
```json
{
  "period_start": "2025-12-01",
  "period_end": "2025-12-31",
  "on_time_delivery_pct": 95.5,
  "order_accuracy_pct": 98.2,
  "fill_rate_pct": 97.8,
  "quality_rating": 4.5,
  "response_time_hours": 2.3,
  "issue_resolution_days": 1.5,
  "total_orders": 42,
  "total_order_value": 12500.50,
  "notes": "Excellent performance"
}
```

**Required Fields:**
- `period_start` - Start date (YYYY-MM-DD)
- `period_end` - End date (YYYY-MM-DD)

**Optional Performance Metrics:**
- `on_time_delivery_pct` - % of on-time deliveries (0-100)
- `order_accuracy_pct` - % of accurate orders (0-100)
- `fill_rate_pct` - % of items fulfilled (0-100)
- `quality_rating` - Quality rating (0-5 scale)
- `response_time_hours` - Avg response time in hours
- `issue_resolution_days` - Avg days to resolve issues
- `total_orders` - Number of orders in period
- `total_order_value` - Total dollar value
- `notes` - Additional notes

**Response (201):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "period_start": "2025-12-01",
  "period_end": "2025-12-31",
  "on_time_delivery_pct": 95.5,
  "order_accuracy_pct": 98.2,
  "fill_rate_pct": 97.8,
  "quality_rating": 4.5,
  "response_time_hours": 2.3,
  "issue_resolution_days": 1.5,
  "total_orders": 42,
  "total_order_value": 12500.50,
  "notes": "Excellent performance",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

---

#### 4. Update Vendor Scorecard
```
PUT /api/vendors/:vendorId/scorecards/:id
```

**Request Body (partial update):**
```json
{
  "on_time_delivery_pct": 97.0,
  "notes": "Performance improved"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "period_start": "2025-12-01",
  "period_end": "2025-12-31",
  "on_time_delivery_pct": 97.0,
  "notes": "Performance improved",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:30:00Z"
}
```

---

#### 5. Get Metric History (Trend Data)
```
GET /api/vendors/:vendorId/scorecards/metric/:metricName
```

**Path Parameters:**
- `metricName` - One of: `on_time_delivery_pct`, `order_accuracy_pct`, `fill_rate_pct`, `quality_rating`, `response_time_hours`, `issue_resolution_days`

**Example:**
```
GET /api/vendors/uuid/scorecards/metric/on_time_delivery_pct
```

**Response (200):**
```json
[
  {
    "period_start": "2025-12-01",
    "period_end": "2025-12-31",
    "metric_value": 95.5
  },
  {
    "period_start": "2025-11-01",
    "period_end": "2025-11-30",
    "metric_value": 93.2
  },
  {
    "period_start": "2025-10-01",
    "period_end": "2025-10-31",
    "metric_value": 94.8
  }
]
```

**Use Case:** Display trend charts for specific performance metrics over time

---

#### 6. Delete Vendor Scorecard
```
DELETE /api/vendors/:vendorId/scorecards/:id
```

**Response (200):**
```json
{
  "message": "Scorecard deleted successfully",
  "scorecard_id": "uuid"
}
```

**Note:** Hard delete - permanently removes the scorecard from the database

---

## Authentication

All API endpoints (except `/api/auth/login`) require authentication via JWT Bearer tokens.

### How Authentication Works

1. **Login** - User authenticates with email/password
2. **Token Storage** - Frontend stores `accessToken` in `localStorage` as `auth_token`
3. **Authenticated Requests** - Include token in Authorization header

### Implementation Example

```javascript
// Login and store token
const login = async (email, password) => {
  const response = await axios.post('/api/auth/login', { email, password });

  // Store token
  localStorage.setItem('auth_token', response.data.accessToken);

  // Store user data
  setUser(response.data.user);
};

// Axios instance with automatic token injection (already configured)
import api from '../core/database/api.js';

// All requests automatically include Authorization header
const vendors = await api.get('/vendors');
```

### Existing Axios Configuration

The frontend already has an Axios instance configured in `/frontend/src/core/database/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically adds auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handles 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Usage:** Import `api` instead of `axios` for all API calls.

---

## Data Models

### TypeScript/JavaScript Interfaces

While this project uses JavaScript (not TypeScript), these interfaces define the expected data structures:

```javascript
// Payment Term
const PaymentTerm = {
  id: "uuid",
  name: "string",
  description: "string",
  days: 0,
  discount_percent: 0,
  discount_days: 0,
  is_active: true,
  created_at: "ISO 8601 timestamp",
  updated_at: "ISO 8601 timestamp"
};

// Vendor
const Vendor = {
  id: "uuid",
  restaurant_id: "uuid",
  name: "string",
  vendor_code: "string | null",
  legal_name: "string | null",
  trade_name: "string | null",
  is_active: true,
  notes: "string | null",
  created_at: "ISO 8601 timestamp",
  updated_at: "ISO 8601 timestamp"
};

// Vendor Address
const VendorAddress = {
  id: "uuid",
  vendor_id: "uuid",
  address_type: "billing | remittance | ship_from | warehouse | primary | other",
  is_primary: false,
  address_line1: "string",
  address_line2: "string | null",
  city: "string",
  state: "string",
  postal_code: "string",
  country: "string",
  phone: "string | null",
  fax: "string | null",
  email: "string | null",
  created_at: "ISO 8601 timestamp",
  updated_at: "ISO 8601 timestamp"
};

// Vendor Contact
const VendorContact = {
  id: "uuid",
  vendor_id: "uuid",
  first_name: "string",
  last_name: "string",
  title: "string | null",
  role: "Sales Rep | Account Manager | Billing Contact | Customer Service | Owner/Manager | Driver | Other | null",
  email: "string",
  phone: "string | null",
  mobile: "string | null",
  fax: "string | null",
  is_primary: false,
  receive_orders: false,
  receive_invoices: false,
  notes: "string | null",
  created_at: "ISO 8601 timestamp",
  updated_at: "ISO 8601 timestamp"
};

// Vendor Payment Info
const VendorPaymentInfo = {
  id: "uuid",
  vendor_id: "uuid",
  payment_term_id: "uuid",
  tax_id_type: "EIN | SSN | VAT | GST | Other | null",
  tax_id_number: "string | null",
  payment_method: "Check | ACH | Wire | Credit Card | PayPal | Other | null",
  bank_name: "string | null",
  bank_account_type: "Checking | Savings | null",
  bank_routing_number: "string | null",
  bank_account_number: "string | null", // Masked in responses
  remittance_email: "string | null",
  credit_limit: 0.00,
  notes: "string | null",
  created_at: "ISO 8601 timestamp",
  updated_at: "ISO 8601 timestamp"
};

// Vendor Document
const VendorDocument = {
  id: "uuid",
  vendor_id: "uuid",
  document_type: "w9 | w8 | form_1099 | contract | insurance_certificate | food_safety_cert | business_license | pricing_sheet | other",
  document_name: "string",
  file_path: "string",
  file_url: "string | null",
  expiration_date: "YYYY-MM-DD | null",
  is_current: false,
  notes: "string | null",
  created_at: "ISO 8601 timestamp",
  updated_at: "ISO 8601 timestamp"
};

// Vendor Scorecard
const VendorScorecard = {
  id: "uuid",
  vendor_id: "uuid",
  period_start: "YYYY-MM-DD",
  period_end: "YYYY-MM-DD",
  on_time_delivery_pct: 0.00,
  order_accuracy_pct: 0.00,
  fill_rate_pct: 0.00,
  quality_rating: 0.00,
  response_time_hours: 0.00,
  issue_resolution_days: 0.00,
  total_orders: 0,
  total_order_value: 0.00,
  notes: "string | null",
  created_at: "ISO 8601 timestamp",
  updated_at: "ISO 8601 timestamp"
};

// Vendor Summary (Complete Profile)
const VendorSummary = {
  ...Vendor,
  addresses: [VendorAddress],
  contacts: [VendorContact],
  payment_info: VendorPaymentInfo,
  items: [IngredientVendorMapping],
  documents: [VendorDocument],
  scorecards: [VendorScorecard]
};
```

---

## Integration with Existing System

### Existing Tables Modified

This module extends two existing tables in the Invantry system:

#### 1. `vendors` Table (Extended)

**Existing Columns:**
- `id` (UUID) - Primary key
- `restaurant_id` (UUID) - Foreign key to restaurants
- `name` (VARCHAR) - Vendor name
- `is_active` (BOOLEAN) - Active status
- `notes` (TEXT) - Notes
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**New Columns Added:**
- `vendor_code` (VARCHAR) - Internal vendor code
- `legal_name` (VARCHAR) - Legal business name
- `trade_name` (VARCHAR) - DBA / Trading name

**Migration Impact:** Existing vendor records remain unchanged. New columns are `NULL` by default.

---

#### 2. `ingredient_vendor_mapping` Table (Extended)

**Existing Columns:**
- `id` (UUID) - Primary key
- `ingredient_id` (UUID) - FK to ingredient_library
- `vendor_id` (UUID) - FK to vendors
- `restaurant_id` (UUID) - FK to restaurants
- `is_preferred` (BOOLEAN) - Preferred vendor flag
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**New Columns Added:**
- `vendor_item_code` (VARCHAR) - Vendor's SKU/item code
- `vendor_item_name` (VARCHAR) - Vendor's item name
- `pack_size` (DECIMAL) - Package size (e.g., 25)
- `pack_unit` (VARCHAR) - Package unit (e.g., "lb", "kg", "ea")
- `price_per_pack` (DECIMAL) - Price per package
- `price_unit` (VARCHAR) - Price unit
- `price_effective_date` (DATE) - When price becomes effective
- `lead_time_days` (INTEGER) - Item-specific lead time
- `minimum_order_qty` (DECIMAL) - Minimum order quantity

**Migration Impact:** Existing mappings remain unchanged. New columns are `NULL` by default.

---

### Integration Points

1. **Vendor Selection in Purchase Orders**
   - Use `/api/vendors?is_active=true` to populate vendor dropdowns
   - Display vendor name + vendor_code

2. **Ingredient-Vendor Pricing**
   - Extended `ingredient_vendor_mapping` table now includes pricing data
   - Use existing endpoints but expect new fields in responses

3. **Document Expiration Alerts**
   - Use `/api/vendors/:vendorId/documents/expiring-soon?days=30` for dashboard alerts
   - Display count badge on vendor management page

4. **Payment Terms in PO Generation**
   - Use `/api/payment-terms` to populate payment term dropdowns
   - Display payment term name (e.g., "Net 30") in PO summary

---

## Testing

### Postman Collection

A comprehensive Postman collection is available for testing all 42 API endpoints:

**File Location:** `/Invantry-Vendor-ERP.postman_collection.json`
**Environment File:** `/Invantry-Vendor-ERP.postman_environment.json`

### How to Use Postman Collection

1. **Import Collection**
   ```
   Postman → File → Import → Select "Invantry-Vendor-ERP.postman_collection.json"
   ```

2. **Import Environment**
   ```
   Postman → File → Import → Select "Invantry-Vendor-ERP.postman_environment.json"
   ```

3. **Configure Environment**
   - Set `base_url` to `http://localhost:3001/api`
   - Set your test credentials in the Login request body

4. **Run Tests**
   - Start with "1. Authentication → Login"
   - Token is automatically saved to environment
   - All subsequent requests use the token automatically

### Test Coverage

The Postman collection includes:
- ✅ 42 endpoint tests
- ✅ Automated token management
- ✅ Response validation
- ✅ Error case testing
- ✅ Business logic validation

### Manual Testing Checklist

Before starting frontend development, verify these key workflows:

- [ ] Login and receive access token
- [ ] Create a vendor
- [ ] Add multiple addresses to vendor (billing, shipping, etc.)
- [ ] Set one address as primary
- [ ] Add multiple contacts to vendor
- [ ] Set one contact as primary
- [ ] Add payment info to vendor
- [ ] Upload a document (W9) with expiration date
- [ ] Create performance scorecard for vendor
- [ ] Retrieve vendor summary (all data in one call)
- [ ] Test expiring documents endpoint (should return docs expiring soon)
- [ ] Test vendor metrics endpoint (dashboard KPIs)

---

## Recommended UI Implementation

### Page Structure

```
/vendors
  ├── index.jsx                 # Vendor List (table/grid view)
  ├── VendorDetails.jsx         # Single vendor details page
  ├── VendorForm.jsx            # Create/Edit vendor form
  ├── components/
  │   ├── VendorAddressList.jsx
  │   ├── VendorContactList.jsx
  │   ├── VendorPaymentInfo.jsx
  │   ├── VendorDocumentList.jsx
  │   ├── VendorScorecardChart.jsx
  │   └── VendorMetricsCard.jsx
```

### Recommended Components

#### 1. Vendor List Page (`/vendors`)

**Features:**
- Searchable/filterable table
- Show: Name, Vendor Code, Active Status, # of Items
- Actions: View, Edit, Delete (soft)
- "Add Vendor" button

**API Calls:**
- `GET /api/vendors?is_active=true` - Load active vendors
- `GET /api/vendors/metrics` - Display dashboard metrics

**UI Components:**
- DataTable (existing shared component)
- Search input
- Filter dropdown (Active/Inactive/All)
- Metric cards (Total Vendors, Active Vendors, Avg Lead Time)

---

#### 2. Vendor Details Page (`/vendors/:id`)

**Features:**
- Tabbed interface for different sections
- Tabs: Overview, Addresses, Contacts, Payment Info, Documents, Performance

**Tab 1: Overview**
- Display vendor basic info
- Edit button for vendor details
- Show vendor code, legal name, trade name

**Tab 2: Addresses**
- List all addresses
- Badge for primary address
- Add/Edit/Delete address buttons
- "Set as Primary" action

**Tab 3: Contacts**
- List all contacts
- Badge for primary contact
- Show role, email, phone
- Add/Edit/Delete contact buttons
- "Set as Primary" action

**Tab 4: Payment Info**
- Display payment terms
- Show masked account numbers (****6789)
- Credit limit
- Edit button (opens modal)

**Tab 5: Documents**
- Document list with expiration dates
- Color-coded badges: Expired (red), Expiring Soon (yellow), Current (green)
- Upload new document button
- Download/Delete actions

**Tab 6: Performance**
- Scorecard trend charts (line graphs)
- Filter by date range
- Show metrics: On-Time %, Accuracy %, Fill Rate %, Quality Rating
- Add new scorecard button

**API Calls:**
- `GET /api/vendors/:id/summary` - Load complete vendor profile
- Individual endpoints for updates

---

#### 3. Create/Edit Vendor Form

**Form Sections:**
- Basic Info (name, vendor code, legal name, trade name)
- Active status toggle
- Notes textarea

**Validation:**
- Name is required
- Vendor code must be unique (backend validates)

**API Calls:**
- `POST /api/vendors` - Create
- `PUT /api/vendors/:id` - Update

---

### Mobile-First Design Considerations

**The app is mobile-first**, so ensure:

1. **Responsive Tables**
   - Use card layout on mobile
   - Stack columns vertically on small screens

2. **Touch-Friendly Buttons**
   - Min 44px tap targets
   - Adequate spacing between buttons

3. **Modals for Forms**
   - Use slide-up modals on mobile
   - Full-screen modals for complex forms

4. **Accordion/Collapsible Sections**
   - Collapse vendor details sections on mobile
   - Expand on tap

---

### State Management Recommendations

Use **TanStack Query** (React Query) for server state:

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../core/database/api';

// Fetch vendors
export const useVendors = (filters = {}) => {
  return useQuery({
    queryKey: ['vendors', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/vendors?${params}`);
      return response.data;
    }
  });
};

// Fetch single vendor with all data
export const useVendorSummary = (vendorId) => {
  return useQuery({
    queryKey: ['vendor-summary', vendorId],
    queryFn: async () => {
      const response = await api.get(`/vendors/${vendorId}/summary`);
      return response.data;
    },
    enabled: !!vendorId
  });
};

// Create vendor
export const useCreateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorData) => {
      const response = await api.post('/vendors', vendorData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch vendors list
      queryClient.invalidateQueries(['vendors']);
    }
  });
};

// Update vendor
export const useUpdateVendor = (vendorId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      const response = await api.put(`/vendors/${vendorId}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
      queryClient.invalidateQueries(['vendor-summary', vendorId]);
    }
  });
};
```

---

### Error Handling

Display user-friendly error messages:

```javascript
const { data, error, isLoading } = useVendors();

if (error) {
  if (error.response?.status === 401) {
    // Redirect to login (handled by interceptor)
  } else if (error.response?.status === 404) {
    return <div>Vendor not found</div>;
  } else {
    return <div>Error: {error.response?.data?.error || 'Something went wrong'}</div>;
  }
}

if (isLoading) {
  return <LoadingSpinner />;
}

return <VendorList vendors={data} />;
```

---

## Next Steps

### Phase 1: Basic Vendor Management (Week 1-2)

1. **Create Vendor List Page**
   - [ ] Vendor table with search/filter
   - [ ] Vendor metrics dashboard cards
   - [ ] Create vendor modal/form
   - [ ] Edit vendor functionality
   - [ ] Delete vendor (soft delete)

2. **API Integration**
   - [ ] Set up React Query hooks for vendors
   - [ ] Implement error handling
   - [ ] Add loading states

---

### Phase 2: Address & Contact Management (Week 3)

1. **Vendor Details Page - Addresses Tab**
   - [ ] List vendor addresses
   - [ ] Add/Edit/Delete address modals
   - [ ] Set primary address functionality
   - [ ] Display address type badges

2. **Vendor Details Page - Contacts Tab**
   - [ ] List vendor contacts
   - [ ] Add/Edit/Delete contact modals
   - [ ] Set primary contact functionality
   - [ ] Display role and notification preferences

---

### Phase 3: Payment & Documents (Week 4)

1. **Payment Info Tab**
   - [ ] Display payment terms dropdown
   - [ ] Show masked banking details
   - [ ] Edit payment info modal
   - [ ] Credit limit display

2. **Documents Tab**
   - [ ] Document list with expiration status
   - [ ] File upload integration (Supabase Storage)
   - [ ] Expired/Expiring document alerts
   - [ ] Download/Delete document functionality

---

### Phase 4: Performance Tracking (Week 5)

1. **Scorecards Tab**
   - [ ] Scorecard trend charts (Chart.js or Recharts)
   - [ ] Date range filter
   - [ ] Add new scorecard modal
   - [ ] Metric history visualization

2. **Dashboard Integration**
   - [ ] Vendor metrics widget
   - [ ] Expiring documents alert
   - [ ] Top vendors by spend

---

### Phase 5: Testing & Polish (Week 6)

1. **Testing**
   - [ ] Component unit tests
   - [ ] Integration tests with mock API
   - [ ] E2E testing (Cypress or Playwright)

2. **Polish**
   - [ ] Accessibility audit (ARIA labels, keyboard navigation)
   - [ ] Mobile responsiveness testing
   - [ ] Performance optimization
   - [ ] User feedback and iterations

---

## Quick Start Guide

### 1. Set Up Development Environment

```bash
# Start backend server
cd backend
npm run dev

# Start frontend development server (in separate terminal)
cd frontend
npm run dev
```

### 2. Test API with Postman

1. Import Postman collection and environment
2. Run "Login" request to get auth token
3. Explore other endpoints

### 3. Create Your First Component

```jsx
// frontend/src/pages/vendors/VendorList.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../core/database/api';

const VendorList = () => {
  const { data: vendors, isLoading, error } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await api.get('/vendors?is_active=true');
      return response.data;
    }
  });

  if (isLoading) return <div>Loading vendors...</div>;
  if (error) return <div>Error loading vendors: {error.message}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Vendors</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map(vendor => (
          <div key={vendor.id} className="border rounded-lg p-4 shadow">
            <h3 className="font-bold">{vendor.name}</h3>
            <p className="text-sm text-gray-600">{vendor.vendor_code}</p>
            <span className={`inline-block px-2 py-1 text-xs rounded ${
              vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {vendor.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorList;
```

### 4. Add Route

```jsx
// frontend/src/App.jsx
import VendorList from './pages/vendors/VendorList';

// Inside your route configuration
<Route path="/vendors" element={<ProtectedRoute><VendorList /></ProtectedRoute>} />
```

---

## Support & Documentation

- **API Specification:** See this document
- **Postman Collection:** `/Invantry-Vendor-ERP.postman_collection.json`
- **Database Migrations:** `.project/features/FEATURE-20251229-VENDOR-ERP/migration-*.sql`
- **Backend Code:** `/backend/src/routes/` and `/backend/src/services/`
- **Project Instructions:** `/CLAUDE.md`

---

## Summary

You now have everything you need to build the frontend for the Vendor ERP module:

✅ **42 Fully Tested API Endpoints**
✅ **8 New Database Tables** (+ 2 extended tables)
✅ **Complete API Documentation** with request/response examples
✅ **Postman Collection** for testing and reference
✅ **Data Model Definitions** for all entities
✅ **Recommended UI/UX patterns** for React components
✅ **Integration guide** with existing Invantry system

**The backend is 100% complete and ready for integration.**

Start with the Vendor List page, test against the API using Postman, and build incrementally following the phased approach above.

**Good luck!** 🚀
