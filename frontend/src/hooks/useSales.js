// frontend/src/hooks/useSales.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	syncSalesFromPOS,
	fetchSales,
	fetchSaleById,
	fetchSalesSummary,
	fetchTopSellingItems,
	fetchSyncStatus,
} from "../services/salesService";

/**
 * Get sales list with filters
 */
export function useSales(filters = {}) {
	return useQuery({
		queryKey: ["sales", filters],
		queryFn: () => fetchSales(filters),
		staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
	});
}

/**
 * Get single sale by ID
 */
export function useSale(id) {
	return useQuery({
		queryKey: ["sale", id],
		queryFn: () => fetchSaleById(id),
		enabled: !!id,
		staleTime: 1000 * 60 * 5,
	});
}

/**
 * Get sales summary
 */
export function useSalesSummary(options = {}) {
	return useQuery({
		queryKey: ["sales-summary", options],
		queryFn: () => fetchSalesSummary(options),
		staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
	});
}

/**
 * Get top selling items
 */
export function useTopSellingItems(options = {}) {
	return useQuery({
		queryKey: ["top-selling-items", options],
		queryFn: () => fetchTopSellingItems(options),
		staleTime: 1000 * 60 * 5,
	});
}

/**
 * Get POS sync status
 */
export function useSyncStatus() {
	return useQuery({
		queryKey: ["sync-status"],
		queryFn: fetchSyncStatus,
		staleTime: 1000 * 30, // Fresh for 30 seconds
	});
}

/**
 * Sync sales from POS mutation
 */
export function useSyncSales() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ posSystem, startDate, endDate }) =>
			syncSalesFromPOS(posSystem, { startDate, endDate }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sales"] });
			queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
			queryClient.invalidateQueries({ queryKey: ["top-selling-items"] });
			queryClient.invalidateQueries({ queryKey: ["sync-status"] });
		},
	});
}
