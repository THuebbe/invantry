// /frontend/src/services/metricsService.js

import api from "../core/database/api";

// Fetch metrics based on current section
export async function fetchMetrics(section) {
	const endpoint = `/metrics/${section}`;
	const response = await api.get(endpoint);
	return response.data;
}

// Individual metric fetchers (if you need them separately)
export async function fetchDashboardMetrics() {
	const response = await api.get("/metrics/dashboard");
	return response.data;
}

export async function fetchInventoryMetrics() {
	const response = await api.get("/metrics/inventory");
	return response.data;
}

export async function fetchOrdersMetrics() {
	const response = await api.get("/metrics/orders");
	return response.data;
}

export async function fetchReceivingMetrics() {
	const response = await api.get("/metrics/receiving");
	return response.data;
}

export async function fetchReportsMetrics() {
	const response = await api.get("/metrics/reports");
	return response.data;
}
