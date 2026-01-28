// frontend/src/services/deductionService.js

import api from "../core/database/api";

/**
 * Process all undeducted sales
 */
export async function processDeductions() {
	const response = await api.post("/deductions/process");
	return response.data;
}

/**
 * Deduct inventory for a specific sale
 * @param {string} saleId - Sale UUID
 */
export async function deductForSale(saleId) {
	const response = await api.post(`/deductions/sale/${saleId}`);
	return response.data;
}

/**
 * Reverse deductions for a sale
 * @param {string} saleId - Sale UUID
 */
export async function reverseDeductions(saleId) {
	const response = await api.post(`/deductions/reverse/${saleId}`);
	return response.data;
}

/**
 * Get deduction history
 * @param {object} filters - Query filters
 */
export async function fetchDeductionHistory(filters = {}) {
	const params = new URLSearchParams();

	if (filters.startDate) params.append("startDate", filters.startDate);
	if (filters.endDate) params.append("endDate", filters.endDate);
	if (filters.ingredientId) params.append("ingredientId", filters.ingredientId);
	if (filters.limit) params.append("limit", filters.limit.toString());

	const response = await api.get(`/deductions?${params.toString()}`);
	return response.data;
}

/**
 * Get deduction summary
 * @param {object} options - Query options
 */
export async function fetchDeductionSummary(options = {}) {
	const params = new URLSearchParams();

	if (options.startDate) params.append("startDate", options.startDate);
	if (options.endDate) params.append("endDate", options.endDate);

	const response = await api.get(`/deductions/summary?${params.toString()}`);
	return response.data;
}
