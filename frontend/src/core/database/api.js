const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export async function fetchInventory(restaurantId) {
	const response = await fetch(`${API_BASE}/inventory/${restaurantId}`);

	if (!response.ok) {
		throw new Error("Failed to fetch inventory");
	}

	return response.json();
}

export async function fetchDashboardMetrics(businessId) {
	const response = await fetch(`${API_BASE}/dashboard/${businessId}`);

	if (!response.ok) {
		throw new Error("Failed to fetch metrics");
	}

	return response.json();
}

// Add more API functions as needed
