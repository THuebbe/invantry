/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateEmail(email) {
  if (!email) return { valid: true }; // Optional field
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    valid: pattern.test(email),
    error: pattern.test(email) ? null : 'Invalid email format',
  };
}

/**
 * Validate phone number
 * @param {string} phone - Phone number
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validatePhone(phone) {
  if (!phone) return { valid: true }; // Optional field
  const cleaned = phone.replace(/\D/g, '');
  const isValid = cleaned.length >= 10;
  return {
    valid: isValid,
    error: isValid ? null : 'Phone number must be at least 10 digits',
  };
}

/**
 * Validate ZIP code
 * @param {string} zip - ZIP code
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateZipCode(zip) {
  if (!zip) return { valid: false, error: 'ZIP code is required' };
  const pattern = /^\d{5}(-\d{4})?$/;
  return {
    valid: pattern.test(zip),
    error: pattern.test(zip) ? null : 'Invalid ZIP code format',
  };
}

/**
 * Validate vendor code format
 * @param {string} code - Vendor code
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateVendorCode(code) {
  if (!code) return { valid: true }; // Optional field
  const pattern = /^[A-Z0-9-]+$/i;
  return {
    valid: pattern.test(code),
    error: pattern.test(code) ? null : 'Vendor code can only contain letters, numbers, and hyphens',
  };
}

/**
 * Validate scorecard metric value
 * @param {any} value - Metric value
 * @param {Object} metricConfig - Metric configuration object
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateScorecardMetric(value, metricConfig) {
  if (value === null || value === undefined || value === '') {
    return { valid: true }; // Optional metrics
  }

  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { valid: false, error: 'Must be a number' };
  }

  if (metricConfig.min !== undefined && numValue < metricConfig.min) {
    return { valid: false, error: `Must be at least ${metricConfig.min}` };
  }

  if (metricConfig.max !== undefined && numValue > metricConfig.max) {
    return { valid: false, error: `Cannot exceed ${metricConfig.max}` };
  }

  return { valid: true };
}

/**
 * Validate date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Both start and end dates are required' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  return { valid: true };
}

/**
 * Validate required field
 * @param {any} value - Field value
 * @param {string} fieldName - Field name for error message
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateRequired(value, fieldName = 'This field') {
  const isValid = value !== null && value !== undefined && value !== '';
  return {
    valid: isValid,
    error: isValid ? null : `${fieldName} is required`,
  };
}

/**
 * Validate string length
 * @param {string} value - String value
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateLength(value, minLength = 0, maxLength = Infinity) {
  if (!value) return { valid: true }; // Optional field

  const length = value.length;

  if (length < minLength) {
    return { valid: false, error: `Must be at least ${minLength} characters` };
  }

  if (length > maxLength) {
    return { valid: false, error: `Cannot exceed ${maxLength} characters` };
  }

  return { valid: true };
}

/**
 * Validate numeric value
 * @param {any} value - Numeric value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateNumeric(value, min = -Infinity, max = Infinity) {
  if (value === null || value === undefined || value === '') {
    return { valid: true }; // Optional field
  }

  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return { valid: false, error: 'Must be a number' };
  }

  if (numValue < min) {
    return { valid: false, error: `Must be at least ${min}` };
  }

  if (numValue > max) {
    return { valid: false, error: `Cannot exceed ${max}` };
  }

  return { valid: true };
}

/**
 * Validate credit limit
 * @param {number} creditLimit - Credit limit amount
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateCreditLimit(creditLimit) {
  if (!creditLimit) return { valid: true }; // Optional field

  const numValue = parseFloat(creditLimit);

  if (isNaN(numValue)) {
    return { valid: false, error: 'Credit limit must be a number' };
  }

  if (numValue < 0) {
    return { valid: false, error: 'Credit limit cannot be negative' };
  }

  return { valid: true };
}

/**
 * Validate form data against validation rules
 * @param {Object} formData - Form data object
 * @param {Object} validationRules - Validation rules object
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateForm(formData, validationRules) {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach((fieldName) => {
    const rules = validationRules[fieldName];
    const value = formData[fieldName];

    // Check required
    if (rules.required && (!value || value === '')) {
      errors[fieldName] = rules.errorMessages?.required || `${fieldName} is required`;
      isValid = false;
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value || value === '') return;

    // Check pattern
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[fieldName] = rules.errorMessages?.pattern || `Invalid ${fieldName} format`;
      isValid = false;
      return;
    }

    // Check min length
    if (rules.minLength && value.length < rules.minLength) {
      errors[fieldName] = rules.errorMessages?.minLength || `${fieldName} must be at least ${rules.minLength} characters`;
      isValid = false;
      return;
    }

    // Check max length
    if (rules.maxLength && value.length > rules.maxLength) {
      errors[fieldName] = rules.errorMessages?.maxLength || `${fieldName} cannot exceed ${rules.maxLength} characters`;
      isValid = false;
      return;
    }
  });

  return { valid: isValid, errors };
}
