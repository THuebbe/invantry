// frontend/src/components/dashboard/content/reports/DashboardOverviewReport.jsx

import { useState } from "react";
import {
	AlertCircle,
	TrendingUp,
	Package,
	DollarSign,
	Activity,
} from "lucide-react";
import MetricSummaryCard from "../../../shared/MetricSummaryCard";
import DateRangePicker from "../../../shared/DateRangePicker";
import { useWasteMetrics, useWasteSummary } from "../../../../hooks/useReports";

/**
 * DashboardOverviewReport - High-level metrics summary for waste tracking
 * Displays 4 key metric cards and alert cards for warnings
 *
 * This is the simplest report - good for validating the component approach
 */
export default function DashboardOverviewReport() {
	const [period, setPeriod] = useState("week");
	const [compareEnabled, setCompareEnabled] = useState(false);

	// Fetch data from backend
	const metricsQuery = useWasteMetrics(period);
	const summaryQuery = useWasteSummary({
		period,
		compare: compareEnabled,
	});

	const isLoading = metricsQuery.isLoading || summaryQuery.isLoading;
	const isError = metricsQuery.isError || summaryQuery.isError;

	// Extract data
	const metrics = metricsQuery.data || {};
	const summary = summaryQuery.data || {};

	// Format metric cards data
	const metricCards = [
		{
			title: "Total Waste",
			value: `$${(summary.waste?.total_value || 0).toFixed(2)}`,
			icon: AlertCircle,
			color: "red",
			trend: summary.comparison
				? {
						direction: summary.comparison.change?.direction === "increased" ? "up" : "down",
						value: `${Math.abs(summary.comparison.change?.percent || 0).toFixed(1)}%`,
						isGood: summary.comparison.change?.direction === "decreased",
						description: `vs previous ${period}`,
					}
				: null,
		},
		{
			title: "Waste Incidents",
			value: (summary.waste?.total_count || 0).toString(),
			icon: Activity,
			color: "yellow",
			trend: summary.comparison
				? {
						direction: summary.comparison.change?.direction === "increased" ? "up" : "down",
						value: `${Math.abs(summary.comparison.change?.percent || 0).toFixed(1)}%`,
						isGood: summary.comparison.change?.direction === "decreased",
						description: `incidents`,
					}
				: null,
		},
		{
			title: "Avg per Incident",
			value: `$${(summary.waste?.avg_per_incident || 0).toFixed(2)}`,
			icon: DollarSign,
			color: "blue",
		},
		{
			title: "Total Items",
			value: metrics.total_items || "--",
			icon: Package,
			color: "green",
		},
	];

	// Alert cards data (if waste is high)
	const alerts = [];
	if (summary.waste?.total_value > 1000) {
		alerts.push({
			type: "warning",
			title: "High Waste Detected",
			message: `Total waste value of $${summary.waste.total_value.toFixed(2)} exceeds threshold`,
			icon: "⚠️",
		});
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Dashboard Overview
				</h1>
				<p className="text-gray-600">
					High-level summary of key metrics and alerts
				</p>
			</div>

			{/* Date Range Picker */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<DateRangePicker
					selected={period}
					onSelect={setPeriod}
					showComparison={true}
					onComparisonToggle={setCompareEnabled}
					comparisonEnabled={compareEnabled}
				/>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{metricCards.map((card, index) => (
					<MetricSummaryCard
						key={index}
						title={card.title}
						value={card.value}
						icon={card.icon}
						color={card.color}
						trend={card.trend}
						loading={isLoading}
						error={isError}
					/>
				))}
			</div>

			{/* Alert Cards */}
			{alerts.length > 0 && (
				<div className="space-y-3">
					<h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
					{alerts.map((alert, index) => (
						<div
							key={index}
							className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-4"
							role="alert"
						>
							<div className="text-2xl">{alert.icon}</div>
							<div>
								<h3 className="font-semibold text-yellow-900">
									{alert.title}
								</h3>
								<p className="text-sm text-yellow-800 mt-1">
									{alert.message}
								</p>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Error State */}
			{isError && (
				<div
					className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
					role="alert"
				>
					<h3 className="text-lg font-semibold text-red-900 mb-2">
						Error Loading Report
					</h3>
					<p className="text-red-700 mb-4">
						Failed to load dashboard metrics. Please try again.
					</p>
					<button
						onClick={() => {
							metricsQuery.refetch();
							summaryQuery.refetch();
						}}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Retry
					</button>
				</div>
			)}

			{/* Empty State */}
			{!isLoading && !isError && !summary.waste && (
				<div
					className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
					role="region"
					aria-label="No data"
				>
					<Package size={48} className="mx-auto text-gray-400 mb-3" />
					<p className="text-gray-600">
						No waste data available for the selected period
					</p>
				</div>
			)}
		</div>
	);
}
