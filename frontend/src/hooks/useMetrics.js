// /frontend/src/hooks/useMetrics.js

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchMetrics } from "../services/metricsService";

export function useMetrics() {
	const location = useLocation();

	const section = location.pathname.split("/")[1] || "dashboard";

	return useQuery({
		queryKey: ["metrics", section],
		queryFn: async () => {
			try {
				return await fetchMetrics(section);
			} catch (error) {
				// If it's a 404, return mock data for reports section
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
