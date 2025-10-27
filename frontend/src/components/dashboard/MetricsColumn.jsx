import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MetricCard from "./MetricCard";
import { getMetricsForRoute } from "../../config/dashboardMetrics";

export default function MetricsColumn() {
	const location = useLocation();
	const availableMetrics = getMetricsForRoute(location.pathname);

	// State to track which metrics are selected for each position
	const [selectedMetrics, setSelectedMetrics] = useState({
		top: availableMetrics[0]?.id,
		bottom: availableMetrics[1]?.id,
	});

	// Mock data - replace with real API calls later
	// const [metricsData, setMetricsData] = useState({
	// 	lowStockCount: 12,
	// 	expiringItemsCount: 5,
	// 	openOrdersCount: 3,
	// 	weeklyFoodCostPercent: 28.5,
	// 	// Add more mock data as needed
	// });

	// Mock data - replace with real API calls later
	const metricsData = {
		// 👈 REMOVE useState, just make it a const
		lowStockCount: 12,
		expiringItemsCount: 5,
		openOrdersCount: 3,
		weeklyFoodCostPercent: 28.5,
	};

	// Update selected metrics when route changes
	useEffect(() => {
		const metrics = getMetricsForRoute(location.pathname);
		setSelectedMetrics({
			top: metrics[0]?.id,
			bottom: metrics[1]?.id,
		});
	}, [location.pathname]);

	const handleMetricChange = (position, metricId) => {
		setSelectedMetrics((prev) => ({
			...prev,
			[position]: metricId,
		}));
	};

	return (
		<div className="flex flex-col gap-4 h-full">
			<MetricCard
				availableMetrics={availableMetrics}
				selectedMetricId={selectedMetrics.top}
				onMetricChange={handleMetricChange}
				metricData={metricsData}
				position="top"
			/>
			<MetricCard
				availableMetrics={availableMetrics}
				selectedMetricId={selectedMetrics.bottom}
				onMetricChange={handleMetricChange}
				metricData={metricsData}
				position="bottom"
			/>
		</div>
	);
}
