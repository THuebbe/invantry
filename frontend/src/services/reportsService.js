// frontend\src\services\reportsService.js

import api from "../core/database/api";

/**
 * Fetch waste metrics for dashboard widget
 * @param {string} period - 'today', 'week', 'month'
 */
export async function fetchWasteMetrics(period = "week") {
	const response = await api.get(`/metrics/waste?period=${period}`);
	return response.data;
}

/**
 * Fetch waste summary with optional comparison
 * @param {Object} params - Query parameters
 * @param {string} params.period - 'today', 'week', 'month', 'quarter', 'year'
 * @param {boolean} params.compare - Compare to previous period
 * @param {string} params.start - Custom start date (YYYY-MM-DD)
 * @param {string} params.end - Custom end date (YYYY-MM-DD)
 */
export async function fetchWasteSummary(params = {}) {
	const queryParams = new URLSearchParams();

	if (params.period) queryParams.append("period", params.period);
	if (params.compare) queryParams.append("compare", params.compare);
	if (params.start) queryParams.append("start", params.start);
	if (params.end) queryParams.append("end", params.end);

	const response = await api.get(
		`/reports/waste/summary?${queryParams.toString()}`
	);
	return response.data;
}

/**
 * Fetch waste breakdown by category
 * @param {Object} params - Query parameters
 * @param {string} params.period - Time period
 * @param {string} params.start - Custom start date
 * @param {string} params.end - Custom end date
 */
export async function fetchWasteByCategory(params = {}) {
	const queryParams = new URLSearchParams();

	if (params.period) queryParams.append("period", params.period);
	if (params.start) queryParams.append("start", params.start);
	if (params.end) queryParams.append("end", params.end);

	const response = await api.get(
		`/reports/waste/by-category?${queryParams.toString()}`
	);
	return response.data;
}

/**
 * Fetch waste breakdown by reason
 * @param {Object} params - Query parameters
 */
export async function fetchWasteByReason(params = {}) {
	const queryParams = new URLSearchParams();

	if (params.period) queryParams.append("period", params.period);
	if (params.start) queryParams.append("start", params.start);
	if (params.end) queryParams.append("end", params.end);

	const response = await api.get(
		`/reports/waste/by-reason?${queryParams.toString()}`
	);
	return response.data;
}

/**
 * Fetch top wasted items
 * @param {Object} params - Query parameters
 * @param {string} params.period - Time period
 * @param {number} params.limit - Number of items to return (default: 20)
 */
export async function fetchWasteByItem(params = {}) {
	const queryParams = new URLSearchParams();

	if (params.period) queryParams.append("period", params.period);
	if (params.limit) queryParams.append("limit", params.limit);
	if (params.start) queryParams.append("start", params.start);
	if (params.end) queryParams.append("end", params.end);

	const response = await api.get(
		`/reports/waste/by-item?${queryParams.toString()}`
	);
	return response.data;
}

/**
 * Fetch waste trends over time
 * @param {Object} params - Query parameters
 * @param {string} params.period - 'month', 'quarter', 'year'
 * @param {string} params.groupBy - 'day', 'week', 'month'
 */
export async function fetchWasteTrends(params = {}) {
	const queryParams = new URLSearchParams();

	if (params.period) queryParams.append("period", params.period);
	if (params.groupBy) queryParams.append("groupBy", params.groupBy);
	if (params.start) queryParams.append("start", params.start);
	if (params.end) queryParams.append("end", params.end);

	const response = await api.get(
		`/reports/waste/trends?${queryParams.toString()}`
	);
	return response.data;
}

/**
 * Fetch food cost report
 * @param {Object} params - Query parameters
 */
export async function fetchFoodCostReport(params = {}) {
	const queryParams = new URLSearchParams();

	if (params.period) queryParams.append("period", params.period);
	if (params.start) queryParams.append("start", params.start);
	if (params.end) queryParams.append("end", params.end);

	const response = await api.get(
		`/reports/food-cost?${queryParams.toString()}`
	);
	return response.data;
}
