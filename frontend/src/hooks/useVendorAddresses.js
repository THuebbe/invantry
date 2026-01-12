import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVendorAddresses,
  fetchVendorAddress,
  fetchPrimaryAddress,
  createVendorAddress,
  updateVendorAddress,
  setPrimaryAddress,
  deleteVendorAddress
} from '../services/vendorAddressService';

/**
 * Get all addresses for a vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Object} Query result with addresses data
 */
export function useVendorAddresses(vendorId) {
  return useQuery({
    queryKey: ['vendor-addresses', vendorId],
    queryFn: () => fetchVendorAddresses(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get single address by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} addressId - Address UUID
 * @returns {Object} Query result with address data
 */
export function useVendorAddress(vendorId, addressId) {
  return useQuery({
    queryKey: ['vendor-address', vendorId, addressId],
    queryFn: () => fetchVendorAddress(vendorId, addressId),
    enabled: !!vendorId && !!addressId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get primary address for vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Object} Query result with primary address data
 */
export function usePrimaryAddress(vendorId) {
  return useQuery({
    queryKey: ['vendor-primary-address', vendorId],
    queryFn: () => fetchPrimaryAddress(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Create vendor address mutation
 * @returns {Object} Mutation object
 */
export function useCreateVendorAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, addressData }) => createVendorAddress(vendorId, addressData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-addresses', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      if (variables.addressData.is_primary) {
        queryClient.invalidateQueries({ queryKey: ['vendor-primary-address', variables.vendorId] });
      }
    },
  });
}

/**
 * Update vendor address mutation
 * @returns {Object} Mutation object
 */
export function useUpdateVendorAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, addressId, updates }) => updateVendorAddress(vendorId, addressId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-addresses', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-address', variables.vendorId, variables.addressId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}

/**
 * Set primary address mutation
 * @returns {Object} Mutation object
 */
export function useSetPrimaryAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, addressId }) => setPrimaryAddress(vendorId, addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-addresses', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-primary-address', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}

/**
 * Delete vendor address mutation
 * @returns {Object} Mutation object
 */
export function useDeleteVendorAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, addressId }) => deleteVendorAddress(vendorId, addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-addresses', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}
