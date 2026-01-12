/**
 * Find primary address from address list
 * @param {Array} addresses - Array of address objects
 * @returns {Object|null} Primary address or first address or null
 */
export function findPrimaryAddress(addresses) {
  if (!addresses || !Array.isArray(addresses)) return null;
  return addresses.find(addr => addr.is_primary) || addresses[0] || null;
}

/**
 * Find primary contact from contact list
 * @param {Array} contacts - Array of contact objects
 * @returns {Object|null} Primary contact or first contact or null
 */
export function findPrimaryContact(contacts) {
  if (!contacts || !Array.isArray(contacts)) return null;
  return contacts.find(contact => contact.is_primary) || contacts[0] || null;
}

/**
 * Group documents by type
 * @param {Array} documents - Array of document objects
 * @returns {Object} Documents grouped by type
 */
export function groupDocumentsByType(documents) {
  if (!documents || !Array.isArray(documents)) return {};

  return documents.reduce((acc, doc) => {
    const type = doc.document_type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {});
}

/**
 * Calculate average scorecard metric
 * @param {Array} scorecards - Array of scorecard objects
 * @param {string} metricKey - Metric key to average
 * @returns {number|null} Average value or null
 */
export function calculateAverageMetric(scorecards, metricKey) {
  if (!scorecards || !Array.isArray(scorecards) || scorecards.length === 0) {
    return null;
  }

  const values = scorecards
    .map(sc => sc[metricKey])
    .filter(val => val !== null && val !== undefined);

  if (values.length === 0) return null;

  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Sort scorecards by period (most recent first)
 * @param {Array} scorecards - Array of scorecard objects
 * @returns {Array} Sorted scorecards
 */
export function sortScorecardsByPeriod(scorecards) {
  if (!scorecards || !Array.isArray(scorecards)) return [];

  return [...scorecards].sort((a, b) => {
    const dateA = new Date(a.period_end);
    const dateB = new Date(b.period_end);
    return dateB - dateA; // Descending order (most recent first)
  });
}

/**
 * Check if vendor has complete profile
 * @param {Object} vendor - Vendor object (summary format)
 * @returns {Object} { complete: boolean, missingFields: Object }
 */
export function isVendorProfileComplete(vendor) {
  const hasBasicInfo = !!(vendor.name && vendor.vendor_code);
  const hasAddress = vendor.addresses && vendor.addresses.length > 0;
  const hasContact = vendor.contacts && vendor.contacts.length > 0;
  const hasPaymentInfo = !!vendor.payment_info;

  return {
    complete: hasBasicInfo && hasAddress && hasContact && hasPaymentInfo,
    missingFields: {
      basicInfo: !hasBasicInfo,
      address: !hasAddress,
      contact: !hasContact,
      paymentInfo: !hasPaymentInfo,
    },
  };
}

/**
 * Get address type label
 * @param {string} addressType - Address type value
 * @returns {string} Human-readable label
 */
export function getAddressTypeLabel(addressType) {
  const types = {
    billing: 'Billing',
    remittance: 'Remittance',
    ship_from: 'Ship From',
    warehouse: 'Warehouse',
    primary: 'Primary',
    other: 'Other',
  };
  return types[addressType] || addressType;
}

/**
 * Get document type label
 * @param {string} documentType - Document type value
 * @returns {string} Human-readable label
 * IMPORTANT: These values must match backend validation in vendorDocuments.js
 */
export function getDocumentTypeLabel(documentType) {
  const types = {
    W9: 'W9 Tax Form',
    W8: 'W8 Tax Form',
    '1099': '1099 Form',
    contract: 'Contract',
    insurance: 'Insurance Certificate',
    certification: 'Food Safety Certification',
    license: 'Business License',
    pricing_sheet: 'Pricing Sheet',
    other: 'Other',
  };
  return types[documentType] || documentType;
}

/**
 * Filter active vendors
 * @param {Array} vendors - Array of vendor objects
 * @returns {Array} Active vendors only
 */
export function filterActiveVendors(vendors) {
  if (!vendors || !Array.isArray(vendors)) return [];
  return vendors.filter(vendor => vendor.is_active);
}

/**
 * Filter inactive vendors
 * @param {Array} vendors - Array of vendor objects
 * @returns {Array} Inactive vendors only
 */
export function filterInactiveVendors(vendors) {
  if (!vendors || !Array.isArray(vendors)) return [];
  return vendors.filter(vendor => !vendor.is_active);
}

/**
 * Sort vendors by name (alphabetically)
 * @param {Array} vendors - Array of vendor objects
 * @returns {Array} Sorted vendors
 */
export function sortVendorsByName(vendors) {
  if (!vendors || !Array.isArray(vendors)) return [];
  return [...vendors].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search vendors by name or code
 * @param {Array} vendors - Array of vendor objects
 * @param {string} query - Search query
 * @returns {Array} Filtered vendors
 */
export function searchVendors(vendors, query) {
  if (!vendors || !Array.isArray(vendors)) return [];
  if (!query) return vendors;

  const lowerQuery = query.toLowerCase();
  return vendors.filter(vendor => {
    const nameMatch = vendor.name.toLowerCase().includes(lowerQuery);
    const codeMatch = vendor.vendor_code && vendor.vendor_code.toLowerCase().includes(lowerQuery);
    return nameMatch || codeMatch;
  });
}

/**
 * Get expired documents count
 * @param {Array} documents - Array of document objects
 * @returns {number} Count of expired documents
 */
export function getExpiredDocumentsCount(documents) {
  if (!documents || !Array.isArray(documents)) return 0;

  const now = new Date();
  return documents.filter(doc => {
    if (!doc.expiration_date) return false;
    const expiry = new Date(doc.expiration_date);
    return expiry < now;
  }).length;
}

/**
 * Get expiring soon documents count
 * @param {Array} documents - Array of document objects
 * @param {number} days - Number of days threshold (default: 30)
 * @returns {number} Count of expiring soon documents
 */
export function getExpiringSoonDocumentsCount(documents, days = 30) {
  if (!documents || !Array.isArray(documents)) return 0;

  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return documents.filter(doc => {
    if (!doc.expiration_date) return false;
    const expiry = new Date(doc.expiration_date);
    return expiry >= now && expiry <= threshold;
  }).length;
}

/**
 * Get vendor performance grade based on scorecards
 * @param {Array} scorecards - Array of scorecard objects
 * @returns {string} Grade: 'A', 'B', 'C', 'D', 'F', or 'N/A'
 */
export function getVendorPerformanceGrade(scorecards) {
  if (!scorecards || !Array.isArray(scorecards) || scorecards.length === 0) {
    return 'N/A';
  }

  // Calculate average of key metrics
  const avgOnTime = calculateAverageMetric(scorecards, 'on_time_delivery_pct');
  const avgAccuracy = calculateAverageMetric(scorecards, 'order_accuracy_pct');
  const avgFillRate = calculateAverageMetric(scorecards, 'fill_rate_pct');
  const avgQuality = calculateAverageMetric(scorecards, 'quality_rating');

  if (!avgOnTime && !avgAccuracy && !avgFillRate && !avgQuality) {
    return 'N/A';
  }

  // Normalize quality rating to 0-100 scale
  const normalizedQuality = avgQuality ? (avgQuality / 5) * 100 : null;

  // Calculate overall score (average of available metrics)
  const metrics = [avgOnTime, avgAccuracy, avgFillRate, normalizedQuality].filter(m => m !== null);
  const overallScore = metrics.reduce((sum, m) => sum + m, 0) / metrics.length;

  // Assign grade
  if (overallScore >= 90) return 'A';
  if (overallScore >= 80) return 'B';
  if (overallScore >= 70) return 'C';
  if (overallScore >= 60) return 'D';
  return 'F';
}

/**
 * Check if vendor has any expired documents
 * @param {Object} vendor - Vendor object (summary format)
 * @returns {boolean} True if has expired documents
 */
export function hasExpiredDocuments(vendor) {
  if (!vendor || !vendor.documents) return false;
  return getExpiredDocumentsCount(vendor.documents) > 0;
}

/**
 * Get vendor status summary
 * @param {Object} vendor - Vendor object (summary format)
 * @returns {Object} Status summary
 */
export function getVendorStatusSummary(vendor) {
  if (!vendor) {
    return {
      isActive: false,
      hasExpiredDocs: false,
      profileComplete: false,
      performanceGrade: 'N/A',
    };
  }

  const profileStatus = isVendorProfileComplete(vendor);

  return {
    isActive: vendor.is_active || false,
    hasExpiredDocs: hasExpiredDocuments(vendor),
    profileComplete: profileStatus.complete,
    performanceGrade: getVendorPerformanceGrade(vendor.scorecards),
  };
}
