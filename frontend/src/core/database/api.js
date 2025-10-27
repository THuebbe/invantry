import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
	baseURL: API_BASE,
	headers: {
		"Content-type": "application/json",
	},
});

// Request interceptor - add token to all requests
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("auth_token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Toen expired or invalid - clear storage and redirect to login
			localStorage.removeItem("auth_token");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

// export async function fetchInventory(restaurantId) {
// 	const response = await fetch(`${API_BASE}/inventory/${restaurantId}`);

// 	if (!response.ok) {
// 		throw new Error("Failed to fetch inventory");
// 	}

// 	return response.json();
// }

// export async function fetchDashboardMetrics(businessId) {
// 	const response = await fetch(`${API_BASE}/dashboard/${businessId}`);

// 	if (!response.ok) {
// 		throw new Error("Failed to fetch metrics");
// 	}

// 	return response.json();
// }

// Add more API functions as needed

export default api;
