import api from '../core/database/api';

/**
 * Get all addresses for a vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Array>} Array of address objects
 */
export async function fetchVendorAddresses(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/addresses`);
  return response.data;
}

/**
 * Get single address by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} addressId - Address UUID
 * @returns {Promise<Object>} Address object
 */
export async function fetchVendorAddress(vendorId, addressId) {
  const response = await api.get(`/vendors/${vendorId}/addresses/${addressId}`);
  return response.data;
}

/**
 * Get primary address for vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Object>} Primary address object
 */
export async function fetchPrimaryAddress(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/addresses/primary`);
  return response.data;
}

/**
 * Create vendor address
 * @param {string} vendorId - Vendor UUID
 * @param {Object} addressData - Address data
 * @param {string} addressData.address_type - Type: billing, remittance, ship_from, warehouse, primary, other
 * @param {boolean} addressData.is_primary - Set as primary address
 * @param {string} addressData.address_line1 - Street address (required)
 * @param {string} addressData.address_line2 - Apartment, suite, etc. (optional)
 * @param {string} addressData.city - City (required)
 * @param {string} addressData.state - State/Province (required)
 * @param {string} addressData.postal_code - ZIP/Postal code (required)
 * @param {string} addressData.country - Country code (required, e.g., 'US')
 * @param {string} addressData.phone - Contact phone (optional)
 * @param {string} addressData.fax - Fax number (optional)
 * @param {string} addressData.email - Contact email (optional)
 * @returns {Promise<Object>} Created address
 */
export async function createVendorAddress(vendorId, addressData) {
  const response = await api.post(`/vendors/${vendorId}/addresses`, addressData);
  return response.data;
}

/**
 * Update vendor address
 * @param {string} vendorId - Vendor UUID
 * @param {string} addressId - Address UUID
 * @param {Object} updates - Partial address data to update
 * @returns {Promise<Object>} Updated address
 */
export async function updateVendorAddress(vendorId, addressId, updates) {
  const response = await api.put(`/vendors/${vendorId}/addresses/${addressId}`, updates);
  return response.data;
}

/**
 * Set address as primary (automatically unsets other primary)
 * @param {string} vendorId - Vendor UUID
 * @param {string} addressId - Address UUID
 * @returns {Promise<Object>} Updated address
 */
export async function setPrimaryAddress(vendorId, addressId) {
  const response = await api.put(`/vendors/${vendorId}/addresses/${addressId}/set-primary`);
  return response.data;
}

/**
 * Delete vendor address
 * @param {string} vendorId - Vendor UUID
 * @param {string} addressId - Address UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteVendorAddress(vendorId, addressId) {
  const response = await api.delete(`/vendors/${vendorId}/addresses/${addressId}`);
  return response.data;
}
