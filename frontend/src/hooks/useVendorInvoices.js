// useVendorInvoices.js - React Query hooks for vendor invoice operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVendorInvoices,
  getVendorInvoice,
  createVendorInvoice,
  updateVendorInvoice,
  deleteVendorInvoice,
  getVendorBalance,
  getVendorAging
} from '../services/vendorInvoiceService';

/**
 * Get all invoices for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {Object} filters - Optional filters (status, start_date, end_date)
 * @param {Object} options - Optional query options
 * @returns {Object} Query result with invoices data
 */
export function useVendorInvoices(vendorId, filters = {}, options = {}) {
  return useQuery({
    queryKey: ['vendor-invoices', vendorId, filters],
    queryFn: () => getVendorInvoices(vendorId, filters),
    enabled: options.enabled !== undefined ? options.enabled && !!vendorId : !!vendorId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get a single invoice by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} invoiceId - Invoice UUID
 * @returns {Object} Query result with invoice data
 */
export function useVendorInvoice(vendorId, invoiceId) {
  return useQuery({
    queryKey: ['vendor-invoice', vendorId, invoiceId],
    queryFn: () => getVendorInvoice(vendorId, invoiceId),
    enabled: !!vendorId && !!invoiceId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get vendor balance summary
 * @param {string} vendorId - Vendor UUID
 * @param {Object} options - Optional query options
 * @returns {Object} Query result with balance data
 */
export function useVendorBalance(vendorId, options = {}) {
  return useQuery({
    queryKey: ['vendor-balance', vendorId],
    queryFn: () => getVendorBalance(vendorId),
    enabled: options.enabled !== undefined ? options.enabled && !!vendorId : !!vendorId,
    staleTime: 1000 * 60 * 1, // 1 minute - balance changes frequently
  });
}

/**
 * Get vendor aging report
 * @param {string} vendorId - Vendor UUID
 * @param {Object} options - Optional query options
 * @returns {Object} Query result with aging buckets
 */
export function useVendorAging(vendorId, options = {}) {
  return useQuery({
    queryKey: ['vendor-aging', vendorId],
    queryFn: () => getVendorAging(vendorId),
    enabled: options.enabled !== undefined ? options.enabled && !!vendorId : !!vendorId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Create vendor invoice mutation
 * @returns {Object} Mutation object
 */
export function useCreateVendorInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, invoiceData }) => createVendorInvoice(vendorId, invoiceData),
    onSuccess: (_, variables) => {
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices', variables.vendorId] });
      // Invalidate balance and aging since they depend on invoices
      queryClient.invalidateQueries({ queryKey: ['vendor-balance', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-aging', variables.vendorId] });
      // Invalidate vendor summary
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}

/**
 * Update vendor invoice mutation
 * @returns {Object} Mutation object
 */
export function useUpdateVendorInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, invoiceId, updates }) => updateVendorInvoice(vendorId, invoiceId, updates),
    onSuccess: (_, variables) => {
      // Invalidate specific invoice
      queryClient.invalidateQueries({ queryKey: ['vendor-invoice', variables.vendorId, variables.invoiceId] });
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices', variables.vendorId] });
      // Invalidate balance and aging
      queryClient.invalidateQueries({ queryKey: ['vendor-balance', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-aging', variables.vendorId] });
      // Invalidate vendor summary
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}

/**
 * Delete vendor invoice mutation
 * @returns {Object} Mutation object
 */
export function useDeleteVendorInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, invoiceId }) => deleteVendorInvoice(vendorId, invoiceId),
    onSuccess: (_, variables) => {
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices', variables.vendorId] });
      // Invalidate balance and aging
      queryClient.invalidateQueries({ queryKey: ['vendor-balance', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-aging', variables.vendorId] });
      // Invalidate vendor summary
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
    },
  });
}
