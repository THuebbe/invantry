// useVendorItems.js - React Query hooks for vendor item (ingredient-vendor mapping) operations
// Handles updating vendor item pricing, lead times, and preferences

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../core/database/api';

/**
 * Hook to update an ingredient-vendor mapping
 * @returns {Object} Mutation object with mutate function and loading state
 */
export function useUpdateVendorItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, ingredientId, updates }) => {
      const response = await api.put(`/vendors/${vendorId}/ingredients/${ingredientId}`, updates);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate vendor summary to refresh the items list
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      // Also invalidate vendors list in case summary info changed
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (error) => {
      console.error('Error updating vendor item:', error);
    }
  });
}

/**
 * Hook to create a new ingredient-vendor mapping
 * @returns {Object} Mutation object with mutate function and loading state
 */
export function useCreateVendorItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, ingredientId, itemData }) => {
      const response = await api.post(`/vendors/${vendorId}/ingredients/${ingredientId}`, itemData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate vendor summary to refresh the items list
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      // Also invalidate vendors list in case summary info changed
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (error) => {
      console.error('Error creating vendor item:', error);
    }
  });
}

/**
 * Hook to delete an ingredient-vendor mapping
 * @returns {Object} Mutation object with mutate function and loading state
 */
export function useDeleteVendorItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, ingredientId }) => {
      const response = await api.delete(`/vendors/${vendorId}/ingredients/${ingredientId}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate vendor summary to refresh the items list
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      // Also invalidate vendors list in case summary info changed
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (error) => {
      console.error('Error deleting vendor item:', error);
    }
  });
}
