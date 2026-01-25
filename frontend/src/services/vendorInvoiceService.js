// vendorInvoiceService.js - API service for vendor invoices and accounts payable
import api from '../core/database/api';

/**
 * Get all invoices for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status: pending, partial, paid, overdue
 * @param {string} filters.start_date - Filter invoices from this date
 * @param {string} filters.end_date - Filter invoices to this date
 * @returns {Promise<Array>} Array of invoice objects
 */
export async function getVendorInvoices(vendorId, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const queryString = params.toString();
  const url = queryString
    ? `/vendors/${vendorId}/invoices?${queryString}`
    : `/vendors/${vendorId}/invoices`;
  const response = await api.get(url);
  return response.data;
}

/**
 * Get a single invoice by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<Object>} Invoice object
 */
export async function getVendorInvoice(vendorId, invoiceId) {
  const response = await api.get(`/vendors/${vendorId}/invoices/${invoiceId}`);
  return response.data;
}

/**
 * Create a new vendor invoice
 * @param {string} vendorId - Vendor UUID
 * @param {Object} invoiceData - Invoice data
 * @param {string} invoiceData.invoice_number - Vendor's invoice number (required)
 * @param {string} invoiceData.invoice_date - Date on the invoice (required)
 * @param {string} invoiceData.due_date - Payment due date (required)
 * @param {number} invoiceData.amount - Invoice total amount (required)
 * @param {string} invoiceData.purchase_order_id - Associated PO (optional)
 * @param {string} invoiceData.notes - Additional notes (optional)
 * @returns {Promise<Object>} Created invoice
 */
export async function createVendorInvoice(vendorId, invoiceData) {
  const response = await api.post(`/vendors/${vendorId}/invoices`, invoiceData);
  return response.data;
}

/**
 * Update a vendor invoice
 * @param {string} vendorId - Vendor UUID
 * @param {string} invoiceId - Invoice UUID
 * @param {Object} updates - Partial invoice data to update
 * @returns {Promise<Object>} Updated invoice
 */
export async function updateVendorInvoice(vendorId, invoiceId, updates) {
  const response = await api.put(`/vendors/${vendorId}/invoices/${invoiceId}`, updates);
  return response.data;
}

/**
 * Delete a vendor invoice
 * @param {string} vendorId - Vendor UUID
 * @param {string} invoiceId - Invoice UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteVendorInvoice(vendorId, invoiceId) {
  const response = await api.delete(`/vendors/${vendorId}/invoices/${invoiceId}`);
  return response.data;
}

/**
 * Get vendor balance summary
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Object>} Balance object with total_outstanding, total_overdue, invoice_count
 */
export async function getVendorBalance(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/balance`);
  return response.data;
}

/**
 * Get vendor aging report
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Object>} Aging buckets: current, days_1_30, days_31_60, days_61_90, days_90_plus, total
 */
export async function getVendorAging(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/aging`);
  return response.data;
}
