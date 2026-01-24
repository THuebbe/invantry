import api from '../core/database/api';

/**
 * Get all documents for a vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Array>} Array of document objects
 */
export async function fetchVendorDocuments(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/documents`);
  return response.data;
}

/**
 * Get single document by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} documentId - Document UUID
 * @returns {Promise<Object>} Document object
 */
export async function fetchVendorDocument(vendorId, documentId) {
  const response = await api.get(`/vendors/${vendorId}/documents/${documentId}`);
  return response.data;
}

/**
 * Create vendor document
 * @param {string} vendorId - Vendor UUID
 * @param {Object} documentData - Document data (FormData for file uploads)
 * @param {string} documentData.document_type - Type: W9, W8, 1099, contract, insurance, certification, license, pricing_sheet, other (required)
 * @param {File} documentData.document - File object to upload (required when uploading)
 * @param {string} documentData.expiration_date - Expiration date in YYYY-MM-DD format (optional)
 * @param {string} documentData.notes - Additional notes (optional)
 * @returns {Promise<Object>} Created document
 * @note For file uploads, documentData should be a FormData object with 'document' field containing the file
 */
export async function createVendorDocument(vendorId, documentData) {
  const response = await api.post(`/vendors/${vendorId}/documents`, documentData);
  return response.data;
}

/**
 * Update vendor document
 * @param {string} vendorId - Vendor UUID
 * @param {string} documentId - Document UUID
 * @param {Object} updates - Partial document data to update
 * @returns {Promise<Object>} Updated document
 */
export async function updateVendorDocument(vendorId, documentId, updates) {
  const response = await api.put(`/vendors/${vendorId}/documents/${documentId}`, updates);
  return response.data;
}

/**
 * Get expired documents for a vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Array>} Array of expired documents
 */
export async function fetchExpiredDocuments(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/documents/expired`);
  return response.data;
}

/**
 * Get documents expiring soon for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {number} days - Number of days to look ahead (default: 30, min: 1, max: 365)
 * @returns {Promise<Array>} Array of expiring documents
 */
export async function fetchExpiringSoonDocuments(vendorId, days = 30) {
  const response = await api.get(`/vendors/${vendorId}/documents/expiring-soon?days=${days}`);
  return response.data;
}

/**
 * Delete vendor document
 * @param {string} vendorId - Vendor UUID
 * @param {string} documentId - Document UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteVendorDocument(vendorId, documentId) {
  const response = await api.delete(`/vendors/${vendorId}/documents/${documentId}`);
  return response.data;
}

/**
 * Download vendor document file
 * Uses backend proxy to avoid CORS issues with Supabase Storage
 * @param {string} vendorId - Vendor UUID
 * @param {string} documentId - Document UUID
 * @param {string} fileName - Original file name for the download
 * @returns {Promise<void>} Triggers file download in browser
 */
export async function downloadVendorDocument(vendorId, documentId, fileName = 'document') {
  try {
    const response = await api.get(`/vendors/${vendorId}/documents/${documentId}/download`, {
      responseType: 'blob'
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = window.document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);

    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error(`Failed to download document: ${error.message}`);
  }
}
