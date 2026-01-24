import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVendorContacts,
  fetchVendorContact,
  fetchPrimaryContact,
  createVendorContact,
  updateVendorContact,
  setPrimaryContact,
  deleteVendorContact
} from '../services/vendorContactService';

/**
 * Get all contacts for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {Object} options - Optional query options
 * @param {boolean} options.enabled - Whether the query should run (default: true when vendorId exists)
 * @returns {Object} Query result with contacts data
 */
export function useVendorContacts(vendorId, options = {}) {
  return useQuery({
    queryKey: ['vendor-contacts', vendorId],
    queryFn: () => fetchVendorContacts(vendorId),
    enabled: options.enabled !== undefined ? options.enabled && !!vendorId : !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get single contact by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} contactId - Contact UUID
 * @returns {Object} Query result with contact data
 */
export function useVendorContact(vendorId, contactId) {
  return useQuery({
    queryKey: ['vendor-contact', vendorId, contactId],
    queryFn: () => fetchVendorContact(vendorId, contactId),
    enabled: !!vendorId && !!contactId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get primary contact for vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Object} Query result with primary contact data
 */
export function usePrimaryContact(vendorId) {
  return useQuery({
    queryKey: ['vendor-primary-contact', vendorId],
    queryFn: () => fetchPrimaryContact(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Create vendor contact mutation
 * @returns {Object} Mutation object
 */
export function useCreateVendorContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, contactData }) => createVendorContact(vendorId, contactData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contacts', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      if (variables.contactData.is_primary) {
        queryClient.invalidateQueries({ queryKey: ['vendor-primary-contact', variables.vendorId] });
      }
    },
  });
}

/**
 * Update vendor contact mutation
 * @returns {Object} Mutation object
 */
export function useUpdateVendorContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, contactId, updates }) => updateVendorContact(vendorId, contactId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contacts', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-contact', variables.vendorId, variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}

/**
 * Set primary contact mutation
 * @returns {Object} Mutation object
 */
export function useSetPrimaryContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, contactId }) => setPrimaryContact(vendorId, contactId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contacts', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-primary-contact', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}

/**
 * Delete vendor contact mutation
 * @returns {Object} Mutation object
 */
export function useDeleteVendorContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, contactId }) => deleteVendorContact(vendorId, contactId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contacts', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}
