import api from '../core/database/api';

/**
 * Get all vendors for the restaurant
 * @param {Object} filters - Optional filters
 * @param {boolean} filters.is_active - Filter by active status
 * @returns {Promise<Array>} Array of vendor objects
 */
export async function fetchVendors(filters = {}) {
  const params = new URLSearchParams();
  if (filters.is_active !== undefined) {
    params.append('is_active', filters.is_active);
  }

  const queryString = params.toString();
  const url = queryString ? `/vendors?${queryString}` : '/vendors';

  const response = await api.get(url);
  return response.data;
}

/**
 * Get single vendor by ID
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Object>} Vendor object
 */
export async function fetchVendor(vendorId) {
  const response = await api.get(`/vendors/${vendorId}`);
  return response.data;
}

/**
 * Get complete vendor summary (all related data)
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Object>} Vendor with addresses, contacts, payment info, items, documents, scorecards
 */
export async function fetchVendorSummary(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/summary`);
  return response.data;
}

/**
 * Get vendor metrics for dashboard KPIs
 * @returns {Promise<Object>} Metrics object with activeVendorsCount, avgLeadTimeDays, topVendorBySpend, expiringDocumentsCount
 */
export async function fetchVendorMetrics() {
  const response = await api.get('/vendors/metrics');
  return response.data;
}

/**
 * Create a new vendor
 * @param {Object} vendorData - Vendor creation data
 * @param {string} vendorData.name - Vendor name (required)
 * @param {string} vendorData.vendor_code - Internal vendor code (optional)
 * @param {string} vendorData.legal_name - Legal business name (optional)
 * @param {string} vendorData.trade_name - DBA name (optional)
 * @param {boolean} vendorData.is_active - Active status (optional, default: true)
 * @param {string} vendorData.notes - Additional notes (optional)
 * @returns {Promise<Object>} Created vendor
 */
export async function createVendor(vendorData) {
  const response = await api.post('/vendors', vendorData);
  return response.data;
}

/**
 * Update vendor
 * @param {string} vendorId - Vendor UUID
 * @param {Object} updates - Partial vendor data to update
 * @returns {Promise<Object>} Updated vendor
 */
export async function updateVendor(vendorId, updates) {
  const response = await api.put(`/vendors/${vendorId}`, updates);
  return response.data;
}

/**
 * Delete vendor (soft delete - sets is_active = false)
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteVendor(vendorId) {
  const response = await api.delete(`/vendors/${vendorId}`);
  return response.data;
}
