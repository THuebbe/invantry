import {
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Package
} from 'lucide-react';

/**
 * Vendor dashboard metrics configuration
 * Follows pattern from dashboardMetrics.js
 */
export const vendorDashboardMetrics = [
  {
    id: 'active-vendors',
    label: 'Active Vendors',
    icon: Users,
    color: 'blue',
    dataKey: 'activeVendorsCount',
    format: 'number',
    description: 'Total active vendors',
  },
  {
    id: 'avg-lead-time',
    label: 'Avg Lead Time',
    icon: Clock,
    color: 'purple',
    dataKey: 'avgLeadTimeDays',
    format: 'decimal',
    suffix: ' days',
    description: 'Average vendor lead time',
  },
  {
    id: 'top-vendor-spend',
    label: 'Top Vendor',
    icon: DollarSign,
    color: 'green',
    dataKey: 'topVendorBySpend',
    format: 'vendor-spend',
    description: 'Highest spend vendor this month',
  },
  {
    id: 'expiring-documents',
    label: 'Expiring Docs',
    icon: AlertTriangle,
    color: 'red',
    dataKey: 'expiringDocumentsCount',
    format: 'number',
    description: 'Documents expiring within 30 days',
  },
];

/**
 * Vendor detail metrics (for vendor detail page)
 */
export const vendorDetailMetrics = [
  {
    id: 'total-items',
    label: 'Total Items',
    icon: Package,
    color: 'blue',
    dataKey: 'ingredient_count',
    format: 'number',
    description: 'Number of items from this vendor',
  },
  {
    id: 'total-orders',
    label: 'Total Orders',
    icon: TrendingUp,
    color: 'purple',
    dataKey: 'po_count',
    format: 'number',
    description: 'Number of purchase orders',
  },
  {
    id: 'total-spend',
    label: 'Total Spend',
    icon: DollarSign,
    color: 'green',
    dataKey: 'total_spend',
    format: 'currency',
    description: 'Total spending with this vendor',
  },
];

/**
 * Helper function to get metrics for a specific route
 * @param {string} pathname - Current route pathname
 * @returns {Array} Array of metric configurations
 */
export function getVendorMetricsForRoute(pathname) {
  if (pathname.includes('/vendors') && !pathname.includes('/vendors/')) {
    return vendorDashboardMetrics;
  }
  return vendorDetailMetrics;
}
