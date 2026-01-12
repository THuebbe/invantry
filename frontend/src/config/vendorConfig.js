import {
  MapPin,
  User,
  CreditCard,
  FileText,
  BarChart3,
  Building2,
  Mail,
  Phone,
  Globe,
  DollarSign,
  Landmark
} from 'lucide-react';

/**
 * Address types configuration
 */
export const addressTypes = [
  { value: 'billing', label: 'Billing Address', icon: CreditCard },
  { value: 'remittance', label: 'Remittance Address', icon: Mail },
  { value: 'ship_from', label: 'Ship From', icon: MapPin },
  { value: 'warehouse', label: 'Warehouse', icon: Building2 },
  { value: 'primary', label: 'Primary Address', icon: MapPin },
  { value: 'other', label: 'Other', icon: MapPin },
];

/**
 * Contact roles configuration
 */
export const contactRoles = [
  { value: 'Sales Rep', label: 'Sales Representative' },
  { value: 'Account Manager', label: 'Account Manager' },
  { value: 'Billing Contact', label: 'Billing Contact' },
  { value: 'Customer Service', label: 'Customer Service' },
  { value: 'Owner/Manager', label: 'Owner/Manager' },
  { value: 'Driver', label: 'Delivery Driver' },
  { value: 'Other', label: 'Other' },
];

/**
 * Tax ID types
 */
export const taxIdTypes = [
  { value: 'EIN', label: 'EIN (Employer Identification Number)' },
  { value: 'SSN', label: 'SSN (Social Security Number)' },
  { value: 'VAT', label: 'VAT (Value Added Tax)' },
  { value: 'GST', label: 'GST (Goods and Services Tax)' },
  { value: 'Other', label: 'Other' },
];

/**
 * Payment methods
 */
export const paymentMethods = [
  { value: 'Check', label: 'Check', icon: FileText },
  { value: 'ACH', label: 'ACH (Electronic Transfer)', icon: Landmark },
  { value: 'Wire', label: 'Wire Transfer', icon: Globe },
  { value: 'Credit Card', label: 'Credit Card', icon: CreditCard },
  { value: 'PayPal', label: 'PayPal', icon: DollarSign },
  { value: 'Other', label: 'Other', icon: FileText },
];

/**
 * Bank account types
 */
export const bankAccountTypes = [
  { value: 'Checking', label: 'Checking Account' },
  { value: 'Savings', label: 'Savings Account' },
];

/**
 * Document types configuration
 * IMPORTANT: These values must match backend validation in vendorDocuments.js
 */
export const documentTypes = [
  { value: 'W9', label: 'W9 Tax Form', requiresExpiration: true },
  { value: 'W8', label: 'W8 Tax Form', requiresExpiration: true },
  { value: '1099', label: '1099 Form', requiresExpiration: true },
  { value: 'contract', label: 'Vendor Contract', requiresExpiration: true },
  { value: 'insurance', label: 'Insurance Certificate', requiresExpiration: true },
  { value: 'certification', label: 'Food Safety Certification', requiresExpiration: true },
  { value: 'license', label: 'Business License', requiresExpiration: true },
  { value: 'pricing_sheet', label: 'Pricing Sheet', requiresExpiration: false },
  { value: 'other', label: 'Other Document', requiresExpiration: false },
];

/**
 * Scorecard metrics configuration
 */
export const scorecardMetrics = [
  {
    key: 'on_time_delivery_pct',
    label: 'On-Time Delivery',
    format: 'percentage',
    icon: BarChart3,
    color: 'blue',
    description: 'Percentage of deliveries on time',
    min: 0,
    max: 100,
  },
  {
    key: 'order_accuracy_pct',
    label: 'Order Accuracy',
    format: 'percentage',
    icon: BarChart3,
    color: 'green',
    description: 'Percentage of orders fulfilled correctly',
    min: 0,
    max: 100,
  },
  {
    key: 'fill_rate_pct',
    label: 'Fill Rate',
    format: 'percentage',
    icon: BarChart3,
    color: 'purple',
    description: 'Percentage of items fulfilled',
    min: 0,
    max: 100,
  },
  {
    key: 'quality_rating',
    label: 'Quality Rating',
    format: 'decimal',
    suffix: '/5',
    icon: BarChart3,
    color: 'yellow',
    description: 'Product quality rating (0-5 scale)',
    min: 0,
    max: 5,
  },
  {
    key: 'response_time_hours',
    label: 'Response Time',
    format: 'decimal',
    suffix: ' hrs',
    icon: BarChart3,
    color: 'red',
    description: 'Average response time in hours',
    min: 0,
  },
  {
    key: 'issue_resolution_days',
    label: 'Issue Resolution',
    format: 'decimal',
    suffix: ' days',
    icon: BarChart3,
    color: 'orange',
    description: 'Average days to resolve issues',
    min: 0,
  },
];

/**
 * US States for dropdown
 */
export const usStates = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

/**
 * Countries for dropdown
 */
export const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'MX', label: 'Mexico' },
];
