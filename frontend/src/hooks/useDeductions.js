// frontend/src/hooks/useDeductions.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	processDeductions,
	deductForSale,
	reverseDeductions,
	fetchDeductionHistory,
	fetchDeductionSummary,
} from "../services/deductionService";

/**
 * Get deduction history
 */
export function useDeductionHistory(filters = {}) {
	return useQuery({
		queryKey: ["deductions", filters],
		queryFn: () => fetchDeductionHistory(filters),
		staleTime: 1000 * 60 * 2,
	});
}

/**
 * Get deduction summary
 */
export function useDeductionSummary(options = {}) {
	return useQuery({
		queryKey: ["deduction-summary", options],
		queryFn: () => fetchDeductionSummary(options),
		staleTime: 1000 * 60 * 5,
	});
}

/**
 * Process all undeducted sales
 */
export function useProcessDeductions() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: processDeductions,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["deductions"] });
			queryClient.invalidateQueries({ queryKey: ["deduction-summary"] });
			queryClient.invalidateQueries({ queryKey: ["sales"] });
			queryClient.invalidateQueries({ queryKey: ["sync-status"] });
		},
	});
}

/**
 * Deduct inventory for a specific sale
 */
export function useDeductForSale() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ saleId }) => deductForSale(saleId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["deductions"] });
			queryClient.invalidateQueries({ queryKey: ["sales"] });
		},
	});
}

/**
 * Reverse deductions for a sale
 */
export function useReverseDeductions() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ saleId }) => reverseDeductions(saleId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["deductions"] });
			queryClient.invalidateQueries({ queryKey: ["deduction-summary"] });
			queryClient.invalidateQueries({ queryKey: ["sales"] });
		},
	});
}
