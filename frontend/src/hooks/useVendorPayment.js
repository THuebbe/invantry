import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVendorPaymentInfo,
  createVendorPaymentInfo,
  updateVendorPaymentInfo,
  deleteVendorPaymentInfo
} from '../services/vendorPaymentService';

/**
 * Get vendor payment info
 * @param {string} vendorId - Vendor UUID
 * @returns {Object} Query result with payment info data
 */
export function useVendorPaymentInfo(vendorId) {
  return useQuery({
    queryKey: ['vendor-payment', vendorId],
    queryFn: () => fetchVendorPaymentInfo(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Create vendor payment info mutation
 * @returns {Object} Mutation object
 */
export function useCreateVendorPaymentInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, paymentData }) => createVendorPaymentInfo(vendorId, paymentData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-payment', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}

/**
 * Update vendor payment info mutation
 * @returns {Object} Mutation object
 */
export function useUpdateVendorPaymentInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, updates }) => updateVendorPaymentInfo(vendorId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-payment', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}

/**
 * Delete vendor payment info mutation
 * @returns {Object} Mutation object
 */
export function useDeleteVendorPaymentInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVendorPaymentInfo,
    onSuccess: (_, vendorId) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-payment', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', vendorId] });
    },
  });
}
