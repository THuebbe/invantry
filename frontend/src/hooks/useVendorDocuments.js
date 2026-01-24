import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVendorDocuments,
  fetchVendorDocument,
  createVendorDocument,
  updateVendorDocument,
  fetchExpiredDocuments,
  fetchExpiringSoonDocuments,
  deleteVendorDocument
} from '../services/vendorDocumentService';

/**
 * Get all documents for a vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Object} Query result with documents data
 */
export function useVendorDocuments(vendorId) {
  return useQuery({
    queryKey: ['vendor-documents', vendorId],
    queryFn: () => fetchVendorDocuments(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get single document by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} documentId - Document UUID
 * @returns {Object} Query result with document data
 */
export function useVendorDocument(vendorId, documentId) {
  return useQuery({
    queryKey: ['vendor-document', vendorId, documentId],
    queryFn: () => fetchVendorDocument(vendorId, documentId),
    enabled: !!vendorId && !!documentId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get expired documents for a vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Object} Query result with expired documents data
 */
export function useExpiredDocuments(vendorId) {
  return useQuery({
    queryKey: ['vendor-expired-docs', vendorId],
    queryFn: () => fetchExpiredDocuments(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get documents expiring soon for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {number} days - Number of days to look ahead (default: 30)
 * @returns {Object} Query result with expiring documents data
 */
export function useExpiringSoonDocuments(vendorId, days = 30) {
  return useQuery({
    queryKey: ['vendor-expiring-docs', vendorId, days],
    queryFn: () => fetchExpiringSoonDocuments(vendorId, days),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Create vendor document mutation
 * @returns {Object} Mutation object
 */
export function useCreateVendorDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, documentData }) => createVendorDocument(vendorId, documentData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-documents', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-expired-docs', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-expiring-docs', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-metrics'] });
    },
  });
}

/**
 * Update vendor document mutation
 * @returns {Object} Mutation object
 */
export function useUpdateVendorDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, documentId, updates }) => updateVendorDocument(vendorId, documentId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-documents', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-document', variables.vendorId, variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-expired-docs', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-expiring-docs', variables.vendorId] });
    },
  });
}

/**
 * Delete vendor document mutation
 * @returns {Object} Mutation object
 */
export function useDeleteVendorDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, documentId }) => deleteVendorDocument(vendorId, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-documents', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-expired-docs', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-expiring-docs', variables.vendorId] });
    },
  });
}
