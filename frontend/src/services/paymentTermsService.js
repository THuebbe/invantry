import api from '../core/database/api';

/**
 * Get all payment terms (platform-wide reference data)
 * @returns {Promise<Array>} Array of payment term objects
 */
export async function fetchPaymentTerms() {
  const response = await api.get('/payment-terms');
  return response.data;
}

/**
 * Get payment term by ID
 * @param {string} termId - Payment term UUID
 * @returns {Promise<Object>} Payment term object
 */
export async function fetchPaymentTerm(termId) {
  const response = await api.get(`/payment-terms/${termId}`);
  return response.data;
}
