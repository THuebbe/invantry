import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVendors,
  fetchVendor,
  fetchVendorSummary,
  fetchVendorMetrics,
  createVendor,
  updateVendor,
  deleteVendor
} from '../services/vendorService';

/**
 * Get all vendors with optional filters
 * @param {Object} filters - Optional filters
 * @param {boolean} filters.is_active - Filter by active status
 * @returns {Object} Query result with vendors data
 */
export function useVendors(filters = {}) {
  return useQuery({
    queryKey: ['vendors', filters],
    queryFn: () => fetchVendors(filters),
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  });
}

/**
 * Get single vendor basic info
 * @param {string} vendorId - Vendor UUID
 * @returns {Object} Query result with vendor data
 */
export function useVendor(vendorId) {
  return useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => fetchVendor(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get complete vendor summary (all related data)
 * Use this for detail pages to minimize API calls
 * @param {string} vendorId - Vendor UUID
 * @returns {Object} Query result with complete vendor data
 */
export function useVendorSummary(vendorId) {
  return useQuery({
    queryKey: ['vendor-summary', vendorId],
    queryFn: () => fetchVendorSummary(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get vendor metrics for dashboard
 * @returns {Object} Query result with vendor metrics
 */
export function useVendorMetrics() {
  return useQuery({
    queryKey: ['vendor-metrics'],
    queryFn: fetchVendorMetrics,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Create vendor mutation
 * @returns {Object} Mutation object
 */
export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      // Invalidate ALL vendor list queries (with any filter combination)
      queryClient.invalidateQueries({
        queryKey: ['vendors'],
        exact: false,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ queryKey: ['vendor-metrics'] });
    },
  });
}

/**
 * Update vendor mutation
 * @returns {Object} Mutation object
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, updates }) => updateVendor(vendorId, updates),
    onSuccess: (_, variables) => {
      // Invalidate ALL vendor list queries (with any filter combination)
      // Using exact: false ensures queries like ['vendors', {}] and ['vendors', {is_active: true}] are all invalidated
      queryClient.invalidateQueries({
        queryKey: ['vendors'],
        exact: false,
        refetchType: 'active'
      });
      // Invalidate specific vendor queries
      queryClient.invalidateQueries({ queryKey: ['vendor', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      // Invalidate vendor metrics since status changes affect active/inactive counts
      queryClient.invalidateQueries({ queryKey: ['vendor-metrics'] });
    },
  });
}

/**
 * Delete vendor mutation (soft delete)
 * @returns {Object} Mutation object
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      // Invalidate ALL vendor list queries (with any filter combination)
      queryClient.invalidateQueries({
        queryKey: ['vendors'],
        exact: false,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ queryKey: ['vendor-metrics'] });
    },
  });
}
