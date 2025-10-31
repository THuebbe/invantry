# Invantry-App Folder Structure

## Complete Project Layout

```
invantry-app/
├── backend/
│   └── src/
│       ├── index.js
│       ├── middleware/
│       │   └── auth.js
│       ├── routes/
│       │   ├── api.js
│       │   ├── auth.js
│       │   ├── business.js
│       │   ├── dashboard.js
│       │   ├── inventory.js
│       │   ├── metrics.js
│       │   ├── orders.js
│       │   └── reports.js
│       └── services/
│           ├── auth.js
│           ├── business.js
│           ├── inventory.js
│           ├── metrics.js
│           ├── orders.js
│           └── supabase.js
│
└── frontend/
    └── src/
        ├── App.jsx
        ├── App.css
        ├── index.css
        ├── main.jsx
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   └── dashboard/
        │       ├── MainContent.jsx
        │       ├── MetricCard.jsx
        │       ├── MetricsColumn.jsx
        │       ├── QuickActionCard.jsx
        │       ├── QuickActionCarousel.jsx
        │       ├── content/
        │       │   ├── DashboardContent.jsx
        │       │   ├── InventoryContent.jsx
        │       │   ├── OrdersContent.jsx
        │       │   ├── ReceivingContent.jsx
        │       │   ├── ReportsContent.jsx
        │       │   └── WasteContent.jsx
        │       └── layout/
        │           ├── Layout.jsx
        │           ├── Sidebar.jsx
        │           ├── SidebarItem.jsx
        │           └── SidebarSubItem.jsx
        ├── config/
        │   ├── dashboardMetrics.js
        │   ├── menuItems.js
        |   └── quickActions.js
        |   └── valueProps.js
        ├── core/
        │   └── auth/
        │       ├── AuthContext.jsx
        │       └── useAuth.js
        │   └── database/
        │       └── api.js
        ├── hooks/
        │   ├── useMetrics.js
        │   └── useWaste.js
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── RegisterBusiness.jsx
        │   └── RegisterUser.jsx
        └── services/
            ├── metricsService.js
            └── wasteService.js
```

## Quick Reference

### Backend Structure (5 folders, 16 files)

- Entry point: `index.js`
- Middleware: Authentication
- Routes: API, Auth, Business, Dashboard, Inventory, Metrics, Orders, Reports
- Services: Auth, Business, Inventory, Metrics, Orders, Supabase

### Frontend Structure (13 folders, 36 files)

- Entry point: `App.jsx`
- Pages: Auth (Login, Register variants) + Dashboard
- Components: Dashboard-focused UI components organized by function
- Core: Authentication logic
- Config: Dashboard metrics configuration
- Hooks: Custom React hooks for metrics and waste tracking
- Services: API service layers for metrics and waste

## File Count Summary

- **Backend Total:** 16 files (.js)
- **Frontend Total:** 36 files (.jsx + .js + .css)
- **Combined Total:** 52 code files
