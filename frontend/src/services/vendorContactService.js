import api from '../core/database/api';

/**
 * Get all contacts for a vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Array>} Array of contact objects
 */
export async function fetchVendorContacts(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/contacts`);
  return response.data;
}

/**
 * Get single contact by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} contactId - Contact UUID
 * @returns {Promise<Object>} Contact object
 */
export async function fetchVendorContact(vendorId, contactId) {
  const response = await api.get(`/vendors/${vendorId}/contacts/${contactId}`);
  return response.data;
}

/**
 * Get primary contact for vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Object>} Primary contact object
 */
export async function fetchPrimaryContact(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/contacts/primary`);
  return response.data;
}

/**
 * Create vendor contact
 * @param {string} vendorId - Vendor UUID
 * @param {Object} contactData - Contact data
 * @param {string} contactData.first_name - First name (required)
 * @param {string} contactData.last_name - Last name (required)
 * @param {string} contactData.email - Email address (required)
 * @param {string} contactData.title - Job title (optional)
 * @param {string} contactData.role - Role: Sales Rep, Account Manager, Billing Contact, Customer Service, Owner/Manager, Driver, Other (optional)
 * @param {string} contactData.phone - Office phone (optional)
 * @param {string} contactData.mobile - Mobile phone (optional)
 * @param {string} contactData.fax - Fax number (optional)
 * @param {boolean} contactData.is_primary - Set as primary contact (optional)
 * @param {boolean} contactData.receive_orders - Receive order notifications (optional)
 * @param {boolean} contactData.receive_invoices - Receive invoice notifications (optional)
 * @param {string} contactData.notes - Additional notes (optional)
 * @returns {Promise<Object>} Created contact
 */
export async function createVendorContact(vendorId, contactData) {
  const response = await api.post(`/vendors/${vendorId}/contacts`, contactData);
  return response.data;
}

/**
 * Update vendor contact
 * @param {string} vendorId - Vendor UUID
 * @param {string} contactId - Contact UUID
 * @param {Object} updates - Partial contact data to update
 * @returns {Promise<Object>} Updated contact
 */
export async function updateVendorContact(vendorId, contactId, updates) {
  const response = await api.put(`/vendors/${vendorId}/contacts/${contactId}`, updates);
  return response.data;
}

/**
 * Set contact as primary (automatically unsets other primary)
 * @param {string} vendorId - Vendor UUID
 * @param {string} contactId - Contact UUID
 * @returns {Promise<Object>} Updated contact
 */
export async function setPrimaryContact(vendorId, contactId) {
  const response = await api.put(`/vendors/${vendorId}/contacts/${contactId}/set-primary`);
  return response.data;
}

/**
 * Delete vendor contact
 * @param {string} vendorId - Vendor UUID
 * @param {string} contactId - Contact UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteVendorContact(vendorId, contactId) {
  const response = await api.delete(`/vendors/${vendorId}/contacts/${contactId}`);
  return response.data;
}
