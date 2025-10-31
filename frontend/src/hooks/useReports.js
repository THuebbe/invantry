// frontend\src\hooks\useReports.js

import { useQuery } from "@tanstack/react-query";
import {
	fetchWasteMetrics,
	fetchWasteSummary,
	fetchWasteByCategory,
	fetchWasteByReason,
	fetchWasteByItem,
	fetchWasteTrends,
	fetchFoodCostReport,
} from "../services/reportsService";

/**
 * Hook for waste metrics (dashboard widget)
 * @param {string} period - 'today', 'week', 'month'
 */
export function useWasteMetrics(period = "week") {
	return useQuery({
		queryKey: ["metrics", "waste", period],
		queryFn: () => fetchWasteMetrics(period),
		staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
	});
}

/**
 * Hook for waste summary report
 * @param {Object} params - Query parameters
 */
export function useWasteSummary(params = {}) {
	return useQuery({
		queryKey: ["reports", "waste", "summary", params],
		queryFn: () => fetchWasteSummary(params),
		staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
	});
}

/**
 * Hook for waste by category report
 */
export function useWasteByCategory(params = {}) {
	return useQuery({
		queryKey: ["reports", "waste", "by-category", params],
		queryFn: () => fetchWasteByCategory(params),
		staleTime: 1000 * 60 * 2,
	});
}

/**
 * Hook for waste by reason report
 */
export function useWasteByReason(params = {}) {
	return useQuery({
		queryKey: ["reports", "waste", "by-reason", params],
		queryFn: () => fetchWasteByReason(params),
		staleTime: 1000 * 60 * 2,
	});
}

/**
 * Hook for waste by item report
 */
export function useWasteByItem(params = {}) {
	return useQuery({
		queryKey: ["reports", "waste", "by-item", params],
		queryFn: () => fetchWasteByItem(params),
		staleTime: 1000 * 60 * 2,
	});
}

/**
 * Hook for waste trends report
 */
export function useWasteTrends(params = {}) {
	return useQuery({
		queryKey: ["reports", "waste", "trends", params],
		queryFn: () => fetchWasteTrends(params),
		staleTime: 1000 * 60 * 2,
	});
}

/**
 * Hook for food cost report
 */
export function useFoodCostReport(params = {}) {
	return useQuery({
		queryKey: ["reports", "food-cost", params],
		queryFn: () => fetchFoodCostReport(params),
		staleTime: 1000 * 60 * 2,
	});
}
