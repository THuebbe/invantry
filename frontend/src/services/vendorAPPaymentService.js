// vendorAPPaymentService.js - API service for vendor accounts payable payments
import api from '../core/database/api';

/**
 * Get all AP payments for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {Object} filters - Optional filters
 * @param {string} filters.start_date - Filter payments from this date
 * @param {string} filters.end_date - Filter payments to this date
 * @param {string} filters.payment_method - Filter by payment method
 * @returns {Promise<Array>} Array of payment objects
 */
export async function getVendorPayments(vendorId, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const queryString = params.toString();
  const url = queryString
    ? `/vendors/${vendorId}/ap-payments?${queryString}`
    : `/vendors/${vendorId}/ap-payments`;
  const response = await api.get(url);
  return response.data;
}

/**
 * Get a single AP payment by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} paymentId - Payment UUID
 * @returns {Promise<Object>} Payment object
 */
export async function getVendorPayment(vendorId, paymentId) {
  const response = await api.get(`/vendors/${vendorId}/ap-payments/${paymentId}`);
  return response.data;
}

/**
 * Create a new AP payment
 * @param {string} vendorId - Vendor UUID
 * @param {Object} paymentData - Payment data
 * @param {string} paymentData.payment_date - Date of payment (required)
 * @param {number} paymentData.amount - Payment amount (required)
 * @param {string} paymentData.payment_method - Method: ACH, Wire, Check, Credit Card, Other (required)
 * @param {string} paymentData.reference_number - Check number or transaction ID (optional)
 * @param {string} paymentData.invoice_id - Apply to specific invoice (optional)
 * @param {string} paymentData.notes - Additional notes (optional)
 * @returns {Promise<Object>} Created payment
 */
export async function createVendorPayment(vendorId, paymentData) {
  const response = await api.post(`/vendors/${vendorId}/ap-payments`, paymentData);
  return response.data;
}

/**
 * Void an AP payment
 * @param {string} vendorId - Vendor UUID
 * @param {string} paymentId - Payment UUID
 * @returns {Promise<Object>} Void confirmation
 */
export async function voidVendorPayment(vendorId, paymentId) {
  const response = await api.delete(`/vendors/${vendorId}/ap-payments/${paymentId}`);
  return response.data;
}
