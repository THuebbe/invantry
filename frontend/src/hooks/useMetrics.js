// /frontend/src/hooks/useMetrics.js

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchMetrics } from "../services/metricsService";
import { fetchWasteMetrics } from "../services/reportsService";

export function useMetrics() {
	const location = useLocation();

	const section = location.pathname.split("/")[1] || "dashboard";

	return useQuery({
		queryKey: ["metrics", section],
		queryFn: async () => {
			try {
				// Special handling for waste section - use dedicated waste metrics endpoint
				if (section === "waste") {
					return await fetchWasteMetrics("week");
				}

				// Use regular metrics endpoint for other sections
				return await fetchMetrics(section);
			} catch (error) {
				// Fallback for reports section (endpoint not built yet)
				if (error.response?.status === 404 && section === "reports") {
					console.warn(
						"Reports metrics endpoint not yet implemented, using mock data"
					);
					return {
						monthlyFoodCostPercent: 29.2,
						wastePercent: 4.5,
						topWasteCategory: "Produce",
						avgCostPerPlate: 8.75,
					};
				}
				throw error;
			}
		},
		staleTime: 1000 * 60 * 2,
		refetchInterval: 1000 * 60 * 5,
		retry: 2,
	});
}
