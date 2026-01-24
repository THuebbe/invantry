/**
 * Mask account numbers for display
 * @param {string} accountNumber - Full account number
 * @param {number} visibleDigits - Number of digits to show (default: 4)
 * @returns {string} Masked account number (e.g., "****6789")
 */
export function maskAccountNumber(accountNumber, visibleDigits = 4) {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return '****';
  }

  const length = accountNumber.length;
  if (length <= visibleDigits) {
    return accountNumber;
  }

  const masked = '*'.repeat(length - visibleDigits);
  const visible = accountNumber.slice(-visibleDigits);
  return masked + visible;
}

/**
 * Format vendor name with code
 * @param {Object} vendor - Vendor object
 * @returns {string} "Vendor Name (CODE)" or "Vendor Name"
 */
export function formatVendorNameWithCode(vendor) {
  if (!vendor) return '';
  if (vendor.vendor_code) {
    return `${vendor.name} (${vendor.vendor_code})`;
  }
  return vendor.name;
}

/**
 * Format full address as single line
 * @param {Object} address - Address object
 * @returns {string} "123 Main St, Suite 200, Chicago, IL 60601"
 */
export function formatAddressOneLine(address) {
  if (!address) return '';

  const parts = [
    address.address_line1,
    address.address_line2,
    address.city,
    address.state,
    address.postal_code,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Format contact name
 * @param {Object} contact - Contact object
 * @returns {string} "First Last"
 */
export function formatContactName(contact) {
  if (!contact) return '';
  return `${contact.first_name} ${contact.last_name}`.trim();
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone (e.g., "(312) 555-1234")
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for 10-digit US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format as +X (XXX) XXX-XXXX for 11-digit numbers
  if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return as-is if not standard format
  return phone;
}

/**
 * Get document status based on expiration date
 * @param {string} expirationDate - ISO date string
 * @returns {Object} { status: 'expired'|'expiring'|'current'|'no-expiration', color: string, label: string }
 */
export function getDocumentStatus(expirationDate) {
  if (!expirationDate) {
    return { status: 'no-expiration', color: 'gray', label: 'No Expiration' };
  }

  const now = new Date();
  const expiry = new Date(expirationDate);
  const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { status: 'expired', color: 'red', label: 'Expired' };
  } else if (daysUntilExpiry <= 30) {
    return { status: 'expiring', color: 'yellow', label: `Expires in ${daysUntilExpiry} days` };
  } else {
    return { status: 'current', color: 'green', label: 'Current' };
  }
}

/**
 * Format scorecard metric value
 * @param {number} value - Metric value
 * @param {string} format - Format type ('percentage', 'decimal', 'number')
 * @param {string} suffix - Optional suffix
 * @returns {string} Formatted value
 */
export function formatScorecardMetric(value, format = 'number', suffix = '') {
  if (value === null || value === undefined) {
    return '--';
  }

  let formatted;
  switch (format) {
    case 'percentage':
      formatted = `${value.toFixed(1)}%`;
      break;
    case 'decimal':
      formatted = value.toFixed(2);
      break;
    case 'number':
      formatted = Math.round(value).toString();
      break;
    default:
      formatted = value.toString();
  }

  return suffix ? `${formatted}${suffix}` : formatted;
}

/**
 * Format currency
 * @param {number} amount - Amount in dollars
 * @returns {string} "$12,345.67"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) {
    return '--';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @param {string} format - 'short' | 'long' | 'full'
 * @returns {string} Formatted date
 */
export function formatDate(dateString, format = 'short') {
  if (!dateString) return '';

  const date = new Date(dateString);

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      });
    case 'long':
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    case 'full':
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    default:
      return date.toLocaleDateString('en-US');
  }
}

/**
 * Format vendor metric value based on format type
 * @param {any} value - Metric value
 * @param {string} format - Format type
 * @param {Object} metric - Metric configuration object
 * @returns {string} Formatted value
 */
export function formatVendorMetric(value, format, metric = {}) {
  if (value === null || value === undefined) {
    return '--';
  }

  // Handle special vendor-spend format
  if (format === 'vendor-spend') {
    if (typeof value === 'object' && value.vendor_name) {
      return `${value.vendor_name} (${formatCurrency(value.total_spend)})`;
    }
    return '--';
  }

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'decimal':
      const suffix = metric.suffix || '';
      return `${value.toFixed(1)}${suffix}`;
    case 'number':
      return value.toLocaleString();
    default:
      return value.toString();
  }
}
