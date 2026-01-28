// frontend/src/services/salesService.js

import api from "../core/database/api";

/**
 * Sync sales from POS
 * @param {string} posSystem - POS system type
 * @param {object} options - Sync options
 */
export async function syncSalesFromPOS(posSystem, options = {}) {
	const response = await api.post("/sales/sync", {
		posSystem,
		...options,
	});
	return response.data;
}

/**
 * Get sales list with filters
 * @param {object} filters - Query filters
 */
export async function fetchSales(filters = {}) {
	const params = new URLSearchParams();

	if (filters.startDate) params.append("startDate", filters.startDate);
	if (filters.endDate) params.append("endDate", filters.endDate);
	if (filters.status) params.append("status", filters.status);
	if (filters.limit) params.append("limit", filters.limit.toString());

	const response = await api.get(`/sales?${params.toString()}`);
	return response.data;
}

/**
 * Get single sale by ID
 * @param {string} id - Sale UUID
 */
export async function fetchSaleById(id) {
	const response = await api.get(`/sales/${id}`);
	return response.data;
}

/**
 * Get sales summary for a date range
 * @param {object} options - Summary options
 */
export async function fetchSalesSummary(options = {}) {
	const params = new URLSearchParams();

	if (options.startDate) params.append("startDate", options.startDate);
	if (options.endDate) params.append("endDate", options.endDate);

	const response = await api.get(`/sales/summary?${params.toString()}`);
	return response.data;
}

/**
 * Get top selling items
 * @param {object} options - Query options
 */
export async function fetchTopSellingItems(options = {}) {
	const params = new URLSearchParams();

	if (options.startDate) params.append("startDate", options.startDate);
	if (options.endDate) params.append("endDate", options.endDate);
	if (options.limit) params.append("limit", options.limit.toString());

	const response = await api.get(`/sales/top-items?${params.toString()}`);
	return response.data;
}

/**
 * Get POS sync status
 */
export async function fetchSyncStatus() {
	const response = await api.get("/sales/sync-status");
	return response.data;
}
