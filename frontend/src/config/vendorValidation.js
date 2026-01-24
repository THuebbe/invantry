/**
 * Validation rules for vendor forms
 */
export const vendorValidation = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 255,
    errorMessages: {
      required: 'Vendor name is required',
      minLength: 'Vendor name must be at least 1 character',
      maxLength: 'Vendor name cannot exceed 255 characters',
    },
  },
  vendor_code: {
    required: false,
    maxLength: 50,
    pattern: /^[A-Z0-9-]+$/i,
    errorMessages: {
      maxLength: 'Vendor code cannot exceed 50 characters',
      pattern: 'Vendor code can only contain letters, numbers, and hyphens',
    },
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessages: {
      required: 'Email is required',
      pattern: 'Please enter a valid email address',
    },
  },
  phone: {
    required: false,
    pattern: /^[\d\s\-\(\)\+]+$/,
    errorMessages: {
      pattern: 'Please enter a valid phone number',
    },
  },
  postal_code: {
    required: true,
    pattern: /^\d{5}(-\d{4})?$/,
    errorMessages: {
      required: 'ZIP code is required',
      pattern: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)',
    },
  },
};

/**
 * Form field configurations for vendor forms
 */
export const vendorFormFields = [
  {
    name: 'name',
    label: 'Vendor Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., Sysco Foods',
  },
  {
    name: 'vendor_code',
    label: 'Vendor Code',
    type: 'text',
    required: false,
    placeholder: 'e.g., SYS001',
    helpText: 'Internal identifier for this vendor',
  },
  {
    name: 'legal_name',
    label: 'Legal Business Name',
    type: 'text',
    required: false,
    placeholder: 'e.g., Sysco Corporation',
  },
  {
    name: 'trade_name',
    label: 'Trade Name (DBA)',
    type: 'text',
    required: false,
    placeholder: 'e.g., Sysco',
    helpText: 'Doing Business As name',
  },
  {
    name: 'is_active',
    label: 'Active',
    type: 'toggle',
    required: false,
    defaultValue: true,
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    required: false,
    placeholder: 'Additional notes about this vendor...',
  },
];

/**
 * Address form field configurations
 */
export const addressFormFields = [
  {
    name: 'address_type',
    label: 'Address Type',
    type: 'select',
    required: true,
    options: 'addressTypes',
  },
  {
    name: 'address_line1',
    label: 'Street Address',
    type: 'text',
    required: true,
    placeholder: '123 Main Street',
  },
  {
    name: 'address_line2',
    label: 'Apartment, Suite, etc.',
    type: 'text',
    required: false,
    placeholder: 'Suite 200',
  },
  {
    name: 'city',
    label: 'City',
    type: 'text',
    required: true,
    placeholder: 'Chicago',
  },
  {
    name: 'state',
    label: 'State',
    type: 'select',
    required: true,
    options: 'usStates',
  },
  {
    name: 'postal_code',
    label: 'ZIP Code',
    type: 'text',
    required: true,
    placeholder: '12345',
  },
  {
    name: 'country',
    label: 'Country',
    type: 'select',
    required: true,
    options: 'countries',
    defaultValue: 'US',
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'tel',
    required: false,
    placeholder: '(312) 555-1234',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: false,
    placeholder: 'contact@vendor.com',
  },
  {
    name: 'is_primary',
    label: 'Set as Primary Address',
    type: 'checkbox',
    required: false,
  },
];

/**
 * Contact form field configurations
 */
export const contactFormFields = [
  {
    name: 'first_name',
    label: 'First Name',
    type: 'text',
    required: true,
    placeholder: 'John',
  },
  {
    name: 'last_name',
    label: 'Last Name',
    type: 'text',
    required: true,
    placeholder: 'Smith',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    placeholder: 'john.smith@vendor.com',
  },
  {
    name: 'title',
    label: 'Job Title',
    type: 'text',
    required: false,
    placeholder: 'Account Manager',
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    required: false,
    options: 'contactRoles',
  },
  {
    name: 'phone',
    label: 'Office Phone',
    type: 'tel',
    required: false,
    placeholder: '(312) 555-1234',
  },
  {
    name: 'mobile',
    label: 'Mobile Phone',
    type: 'tel',
    required: false,
    placeholder: '(312) 555-5678',
  },
  {
    name: 'is_primary',
    label: 'Set as Primary Contact',
    type: 'checkbox',
    required: false,
  },
  {
    name: 'receive_orders',
    label: 'Receive Order Notifications',
    type: 'checkbox',
    required: false,
  },
  {
    name: 'receive_invoices',
    label: 'Receive Invoice Notifications',
    type: 'checkbox',
    required: false,
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    required: false,
    placeholder: 'Additional notes...',
  },
];

/**
 * Payment info form field configurations
 */
export const paymentFormFields = [
  {
    name: 'payment_term_id',
    label: 'Payment Terms',
    type: 'select',
    required: true,
    options: 'paymentTerms',
    helpText: 'Select payment terms for this vendor',
  },
  {
    name: 'tax_id_type',
    label: 'Tax ID Type',
    type: 'select',
    required: false,
    options: 'taxIdTypes',
  },
  {
    name: 'tax_id_number',
    label: 'Tax ID Number',
    type: 'text',
    required: false,
    placeholder: '12-3456789',
  },
  {
    name: 'payment_method',
    label: 'Payment Method',
    type: 'select',
    required: false,
    options: 'paymentMethods',
  },
  {
    name: 'bank_name',
    label: 'Bank Name',
    type: 'text',
    required: false,
    placeholder: 'First National Bank',
  },
  {
    name: 'bank_account_type',
    label: 'Account Type',
    type: 'select',
    required: false,
    options: 'bankAccountTypes',
  },
  {
    name: 'bank_routing_number',
    label: 'Routing Number',
    type: 'text',
    required: false,
    placeholder: '021000021',
  },
  {
    name: 'bank_account_number',
    label: 'Account Number',
    type: 'text',
    required: false,
    placeholder: 'Enter account number',
    helpText: 'This will be encrypted and masked in display',
  },
  {
    name: 'remittance_email',
    label: 'Remittance Email',
    type: 'email',
    required: false,
    placeholder: 'payments@vendor.com',
  },
  {
    name: 'credit_limit',
    label: 'Credit Limit',
    type: 'number',
    required: false,
    placeholder: '50000',
    helpText: 'Maximum credit limit for this vendor',
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    required: false,
    placeholder: 'Additional payment information...',
  },
];

/**
 * Document form field configurations
 */
export const documentFormFields = [
  {
    name: 'document_type',
    label: 'Document Type',
    type: 'select',
    required: true,
    options: 'documentTypes',
  },
  {
    name: 'document_name',
    label: 'Document Name',
    type: 'text',
    required: true,
    placeholder: '2025 W9 Tax Form',
  },
  {
    name: 'file_path',
    label: 'File Path/URL',
    type: 'text',
    required: true,
    placeholder: '/documents/vendors/w9_2025.pdf',
    helpText: 'Storage path or URL to the document file',
  },
  {
    name: 'expiration_date',
    label: 'Expiration Date',
    type: 'date',
    required: false,
    helpText: 'Leave blank if document does not expire',
  },
  {
    name: 'is_current',
    label: 'Mark as Current Version',
    type: 'checkbox',
    required: false,
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    required: false,
    placeholder: 'Additional notes...',
  },
];

/**
 * Scorecard form field configurations
 */
export const scorecardFormFields = [
  {
    name: 'period_start',
    label: 'Period Start Date',
    type: 'date',
    required: true,
  },
  {
    name: 'period_end',
    label: 'Period End Date',
    type: 'date',
    required: true,
  },
  {
    name: 'on_time_delivery_pct',
    label: 'On-Time Delivery %',
    type: 'number',
    required: false,
    placeholder: '95.5',
    min: 0,
    max: 100,
    step: 0.1,
  },
  {
    name: 'order_accuracy_pct',
    label: 'Order Accuracy %',
    type: 'number',
    required: false,
    placeholder: '98.2',
    min: 0,
    max: 100,
    step: 0.1,
  },
  {
    name: 'fill_rate_pct',
    label: 'Fill Rate %',
    type: 'number',
    required: false,
    placeholder: '97.8',
    min: 0,
    max: 100,
    step: 0.1,
  },
  {
    name: 'quality_rating',
    label: 'Quality Rating (0-5)',
    type: 'number',
    required: false,
    placeholder: '4.5',
    min: 0,
    max: 5,
    step: 0.1,
  },
  {
    name: 'response_time_hours',
    label: 'Response Time (hours)',
    type: 'number',
    required: false,
    placeholder: '2.3',
    min: 0,
    step: 0.1,
  },
  {
    name: 'issue_resolution_days',
    label: 'Issue Resolution (days)',
    type: 'number',
    required: false,
    placeholder: '1.5',
    min: 0,
    step: 0.1,
  },
  {
    name: 'total_orders',
    label: 'Total Orders',
    type: 'number',
    required: false,
    placeholder: '42',
    min: 0,
  },
  {
    name: 'total_order_value',
    label: 'Total Order Value ($)',
    type: 'number',
    required: false,
    placeholder: '12500.50',
    min: 0,
    step: 0.01,
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    required: false,
    placeholder: 'Performance notes for this period...',
  },
];
