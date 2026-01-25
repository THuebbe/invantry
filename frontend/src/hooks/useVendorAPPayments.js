// useVendorAPPayments.js - React Query hooks for vendor AP payment operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVendorPayments,
  getVendorPayment,
  createVendorPayment,
  voidVendorPayment
} from '../services/vendorAPPaymentService';

/**
 * Get all AP payments for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {Object} filters - Optional filters (start_date, end_date, payment_method)
 * @param {Object} options - Optional query options
 * @returns {Object} Query result with payments data
 */
export function useVendorPayments(vendorId, filters = {}, options = {}) {
  return useQuery({
    queryKey: ['vendor-ap-payments', vendorId, filters],
    queryFn: () => getVendorPayments(vendorId, filters),
    enabled: options.enabled !== undefined ? options.enabled && !!vendorId : !!vendorId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get a single AP payment by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} paymentId - Payment UUID
 * @returns {Object} Query result with payment data
 */
export function useVendorPayment(vendorId, paymentId) {
  return useQuery({
    queryKey: ['vendor-ap-payment', vendorId, paymentId],
    queryFn: () => getVendorPayment(vendorId, paymentId),
    enabled: !!vendorId && !!paymentId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Create AP payment mutation
 * @returns {Object} Mutation object
 */
export function useCreateVendorPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, paymentData }) => createVendorPayment(vendorId, paymentData),
    onSuccess: (_, variables) => {
      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: ['vendor-ap-payments', variables.vendorId] });
      // Invalidate invoices since payment affects them
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices', variables.vendorId] });
      // Invalidate balance and aging since payment affects them
      queryClient.invalidateQueries({ queryKey: ['vendor-balance', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-aging', variables.vendorId] });
      // Invalidate vendor summary
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}

/**
 * Void AP payment mutation
 * @returns {Object} Mutation object
 */
export function useVoidVendorPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, paymentId }) => voidVendorPayment(vendorId, paymentId),
    onSuccess: (_, variables) => {
      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: ['vendor-ap-payments', variables.vendorId] });
      // Invalidate invoices since voiding payment affects them
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices', variables.vendorId] });
      // Invalidate balance and aging
      queryClient.invalidateQueries({ queryKey: ['vendor-balance', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-aging', variables.vendorId] });
      // Invalidate vendor summary
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}
