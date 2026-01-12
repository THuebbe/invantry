import api from '../core/database/api';

/**
 * Get vendor payment info
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Object>} Payment info object (sensitive fields are masked)
 */
export async function fetchVendorPaymentInfo(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/payment-info`);
  return response.data;
}

/**
 * Create vendor payment info
 * @param {string} vendorId - Vendor UUID
 * @param {Object} paymentData - Payment data
 * @param {string} paymentData.payment_term_id - Reference to payment_terms table (required)
 * @param {string} paymentData.tax_id_type - EIN, SSN, VAT, GST, Other (optional)
 * @param {string} paymentData.tax_id_number - Tax identification number (optional)
 * @param {string} paymentData.payment_method - Check, ACH, Wire, Credit Card, PayPal, Other (optional)
 * @param {string} paymentData.bank_name - Name of bank (optional)
 * @param {string} paymentData.bank_account_type - Checking, Savings (optional)
 * @param {string} paymentData.bank_routing_number - Bank routing number (optional)
 * @param {string} paymentData.bank_account_number - Bank account number (encrypted) (optional)
 * @param {string} paymentData.remittance_email - Email for payment remittance (optional)
 * @param {number} paymentData.credit_limit - Credit limit amount (optional)
 * @param {string} paymentData.notes - Additional notes (optional)
 * @returns {Promise<Object>} Created payment info
 */
export async function createVendorPaymentInfo(vendorId, paymentData) {
  const response = await api.post(`/vendors/${vendorId}/payment-info`, paymentData);
  return response.data;
}

/**
 * Update vendor payment info
 * @param {string} vendorId - Vendor UUID
 * @param {Object} updates - Partial payment data to update
 * @returns {Promise<Object>} Updated payment info
 */
export async function updateVendorPaymentInfo(vendorId, updates) {
  const response = await api.put(`/vendors/${vendorId}/payment-info`, updates);
  return response.data;
}

/**
 * Delete vendor payment info
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteVendorPaymentInfo(vendorId) {
  const response = await api.delete(`/vendors/${vendorId}/payment-info`);
  return response.data;
}
