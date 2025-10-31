// /frontend/src/services/wasteService.js

import api from "../core/database/api";

/**
 * Log a waste entry
 * @param {Object} wasteData - Waste entry data
 * @param {string} wasteData.ingredientId - UUID of ingredient
 * @param {number} wasteData.quantity - Amount wasted
 * @param {string} wasteData.unit - Unit of measurement
 * @param {string} wasteData.reason - Reason for waste
 * @param {string} wasteData.notes - Optional notes
 */
export async function logWaste(wasteData) {
	const response = await api.post("/waste/log", wasteData);
	return response.data;
}

/**
 * Fetch waste entries with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.startDate - ISO date string
 * @param {string} filters.endDate - ISO date string
 * @param {string} filters.reason - Filter by reason
 * @param {string} filters.ingredientId - Filter by ingredient
 * @param {string} filters.category - Filter by category
 */
export async function fetchWasteEntries(filters = {}) {
	const params = new URLSearchParams();

	if (filters.startDate) params.append("startDate", filters.startDate);
	if (filters.endDate) params.append("endDate", filters.endDate);
	if (filters.reason) params.append("reason", filters.reason);
	if (filters.ingredientId) params.append("ingredientId", filters.ingredientId);
	if (filters.category) params.append("category", filters.category);

	const response = await api.get(`/waste?${params.toString()}`);
	return response.data;
}

/**
 * Fetch waste summary/analytics
 * @param {string} period - Time period (week, month, year)
 */
export async function fetchWasteSummary(period = "month") {
	const response = await api.get(`/waste/summary?period=${period}`);
	return response.data;
}

/**
 * Fetch available waste reasons
 */
export async function fetchWasteReasons() {
	const response = await api.get("/waste/reasons");
	return response.data;
}

/**
 * Remove stock from inventory (existing endpoint)
 * @param {Array} items - Array of items to remove
 */
export async function removeStock(items) {
	const response = await api.post("/inventory/remove", { items });
	return response.data;
}
