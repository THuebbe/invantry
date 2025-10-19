import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = "http://localhost:3000/api";

async function fetchTableData(tableName, options = {}) {
	const { columns = "*", filters = {} } = options;

	const queryParams = new URLSearchParams({
		table: tableName,
		columns: columns,
		filters: JSON.stringify(filters),
	});

	const response = await fetch(`${API_BASE_URL}/data?${queryParams}`, {
		credentials: "include",
		headers: {
			Authorization: `Bearer ${localStorage.getItem("token")}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch from ${tableName}`);
	}

	return response.json();
}

export function useTableData(tableName, options = {}) {
	const { columns = "*", filters = {}, enabled = true, staleTime } = options;

	return useQuery({
		queryKey: ["table", tableName, columns, filters],
		queryFn: () => fetchTableData(tableName, { columns, filters }),
		enabled, // Allow conditional fetching
		staleTime, // Override default staleTime if needed
	});
}

// Convenience hooks for specific tables
export function useSalesData(filters = {}) {
	return useTableData("sales", {
		columns: "id, amount, date, customer_id",
		filters,
		staleTime: 1000 * 60 * 2, // 2 minutes - sales data updates frequently
	});
}

export function useInventoryData(filters = {}) {
	return useTableData("inventory", {
		columns: "id, name, quantity, in_stock",
		filters,
		staleTime: 1000 * 60 * 5, // 5 minutes - inventory changes less often
	});
}

export function useAppointmentsData(filters = {}) {
	return useTableData("appointments", {
		columns: "id, time, customer_name, date, status",
		filters,
		staleTime: 1000 * 60, // 1 minute - appointments need to be fresh
	});
}
