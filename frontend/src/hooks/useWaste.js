// /frontend/src/hooks/useWaste.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	logWaste,
	fetchWasteEntries,
	fetchWasteSummary,
	fetchWasteReasons,
	removeStock,
} from "../services/wasteService";

/**
 * Query hook to fetch waste entries
 */
export function useWasteEntries(filters = {}) {
	return useQuery({
		queryKey: ["waste", "entries", filters],
		queryFn: () => fetchWasteEntries(filters),
		staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
	});
}

/**
 * Query hook to fetch waste summary/analytics
 */
export function useWasteSummary(period = "month") {
	return useQuery({
		queryKey: ["waste", "summary", period],
		queryFn: () => fetchWasteSummary(period),
		staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
	});
}

/**
 * Query hook to fetch waste reasons
 */
export function useWasteReasons() {
	return useQuery({
		queryKey: ["waste", "reasons"],
		queryFn: fetchWasteReasons,
		staleTime: 1000 * 60 * 60, // Fresh for 1 hour (rarely changes)
	});
}

/**
 * Mutation hook to log waste
 * Automatically invalidates relevant queries after success
 */
export function useLogWaste() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: logWaste,
		onSuccess: () => {
			// Invalidate and refetch relevant data
			queryClient.invalidateQueries({ queryKey: ["waste"] });
			queryClient.invalidateQueries({ queryKey: ["inventory"] });
			queryClient.invalidateQueries({ queryKey: ["metrics"] });
		},
	});
}

/**
 * Mutation hook to remove stock (with waste tracking)
 * This will call both remove stock AND log waste
 */
export function useRemoveStock() {
	const queryClient = useQueryClient();
	const logWasteMutation = useLogWaste();

	return useMutation({
		mutationFn: async ({ items, wasteData }) => {
			// Step 1: Remove from inventory
			const removeResult = await removeStock(items);

			// Step 2: Log waste entry
			if (wasteData) {
				await logWasteMutation.mutateAsync(wasteData);
			}

			return removeResult;
		},
		onSuccess: () => {
			// Invalidate queries
			queryClient.invalidateQueries({ queryKey: ["inventory"] });
			queryClient.invalidateQueries({ queryKey: ["waste"] });
			queryClient.invalidateQueries({ queryKey: ["metrics"] });
		},
	});
}
