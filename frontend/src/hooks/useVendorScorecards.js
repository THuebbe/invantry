import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVendorScorecards,
  fetchVendorScorecard,
  createVendorScorecard,
  updateVendorScorecard,
  fetchMetricHistory,
  deleteVendorScorecard
} from '../services/vendorScorecardService';

/**
 * Get all scorecards for a vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Object} Query result with scorecards data
 */
export function useVendorScorecards(vendorId) {
  return useQuery({
    queryKey: ['vendor-scorecards', vendorId],
    queryFn: () => fetchVendorScorecards(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get single scorecard by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} scorecardId - Scorecard UUID
 * @returns {Object} Query result with scorecard data
 */
export function useVendorScorecard(vendorId, scorecardId) {
  return useQuery({
    queryKey: ['vendor-scorecard', vendorId, scorecardId],
    queryFn: () => fetchVendorScorecard(vendorId, scorecardId),
    enabled: !!vendorId && !!scorecardId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get metric history (trend data) for a specific performance metric
 * @param {string} vendorId - Vendor UUID
 * @param {string} metricName - Metric name (on_time_delivery_pct, order_accuracy_pct, etc.)
 * @returns {Object} Query result with metric history data
 */
export function useMetricHistory(vendorId, metricName) {
  return useQuery({
    queryKey: ['vendor-metric-history', vendorId, metricName],
    queryFn: () => fetchMetricHistory(vendorId, metricName),
    enabled: !!vendorId && !!metricName,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Create vendor scorecard mutation
 * @returns {Object} Mutation object
 */
export function useCreateVendorScorecard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, scorecardData }) => createVendorScorecard(vendorId, scorecardData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-scorecards', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-metric-history', variables.vendorId] });
    },
  });
}

/**
 * Update vendor scorecard mutation
 * @returns {Object} Mutation object
 */
export function useUpdateVendorScorecard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, scorecardId, updates }) => updateVendorScorecard(vendorId, scorecardId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-scorecards', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-scorecard', variables.vendorId, variables.scorecardId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-metric-history', variables.vendorId] });
    },
  });
}

/**
 * Delete vendor scorecard mutation
 * @returns {Object} Mutation object
 */
export function useDeleteVendorScorecard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, scorecardId }) => deleteVendorScorecard(vendorId, scorecardId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-scorecards', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-summary', variables.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-metric-history', variables.vendorId] });
    },
  });
}
