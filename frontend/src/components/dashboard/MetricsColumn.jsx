// /frontend/src/components/dashboard/MetricsColumn.jsx

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MetricCard from "./MetricCard";
import { getMetricsForRoute } from "../../config/dashboardMetrics";
import { useMetrics } from "../../hooks/useMetrics.js";

export default function MetricsColumn() {
	const location = useLocation();
	const availableMetrics = getMetricsForRoute(location.pathname);

	const { data: metricsData, isLoading, isError, error } = useMetrics();

	const [selectedMetrics, setSelectedMetrics] = useState({
		top: availableMetrics[0]?.id,
		bottom: availableMetrics[1]?.id,
	});

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

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex flex-col gap-4 h-full">
				<div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-center">
					<div className="text-center">
						<div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
						<p className="text-sm text-gray-500">Loading metrics...</p>
					</div>
				</div>
				<div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-center">
					<div className="text-center">
						<div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
						<p className="text-sm text-gray-500">Loading metrics...</p>
					</div>
				</div>
			</div>
		);
	}

	// Show error state
	if (isError) {
		return (
			<div className="flex flex-col gap-4 h-full">
				<div className="flex-1 bg-white border border-red-200 rounded-lg p-6 flex items-center justify-center">
					<div className="text-center text-red-600">
						<p className="font-semibold mb-1">Failed to load metrics</p>
						<p className="text-sm">{error?.message || "Please try again"}</p>
					</div>
				</div>
			</div>
		);
	}

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
