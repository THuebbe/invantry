// frontend/src/components/dashboard/content/reports/FoodCostReport.jsx

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { formatDataFetchTime, getCurrentTimestamp } from "../../../../utils/dateFormat";
import MetricSummaryCard from "../../../shared/MetricSummaryCard";
import DateRangePicker from "../../../shared/DateRangePicker";
import BarChart from "../../../shared/BarChart";
import { useFoodCostReport, useWasteByCategory } from "../../../../hooks/useReports";

/**
 * FoodCostReport - Financial impact analysis of waste on food costs
 * Shows inventory value, waste impact, and food cost percentages
 */
export default function FoodCostReport() {
	const [period, setPeriod] = useState("month");
	const [compareEnabled, setCompareEnabled] = useState(false);
	const [lastFetchTime, setLastFetchTime] = useState(null);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Fetch data
	const costQuery = useFoodCostReport({
		period,
		compare: compareEnabled,
	});
	const categoryQuery = useWasteByCategory({ period });

	const isLoading = costQuery.isLoading || categoryQuery.isLoading;
	const isError = costQuery.isError || categoryQuery.isError;

	// Track data fetch time
	useEffect(() => {
		if (!isLoading && !isError && costQuery.data) {
			setLastFetchTime(getCurrentTimestamp());
		}
	}, [isLoading, isError, costQuery.data]);

	const costData = costQuery.data || {};
	const categoryData = categoryQuery.data || {};

	// Prepare breakdown chart data
	const breakdownChartData = (categoryData.categories || []).map((cat) => ({
		label: cat.category || "Unknown",
		value: cat.total_value || 0,
		color: getCategoryColor(cat.category),
	}));

	// Calculate food cost percentage
	const totalInventoryValue = costData.inventory_value || 0;
	const totalWasteValue = costData.total_waste_value || 0;
	const foodCostPercent =
		totalInventoryValue > 0
			? ((totalWasteValue / totalInventoryValue) * 100).toFixed(2)
			: 0;

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await Promise.all([
				costQuery.refetch(),
				categoryQuery.refetch(),
			]);
		} finally {
			setTimeout(() => setIsRefreshing(false), 500);
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="flex items-start justify-between mb-2">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Food Cost Analysis
						</h1>
						<p className="text-gray-600 mt-2">
							Understand the financial impact of waste on food cost
							percentages
						</p>
					</div>
					<button
						onClick={handleRefresh}
						disabled={isLoading || isRefreshing}
						className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
						aria-label="Refresh report"
					>
						<RefreshCw
							size={20}
							className={isRefreshing ? "animate-spin" : ""}
						/>
					</button>
				</div>
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

			{/* Key Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<MetricSummaryCard
					title="Total Inventory Value"
					value={`$${totalInventoryValue.toFixed(2)}`}
					icon={DollarSign}
					color="green"
					loading={isLoading}
					error={isError}
				/>

				<MetricSummaryCard
					title="Total Waste Value"
					value={`$${totalWasteValue.toFixed(2)}`}
					icon={AlertCircle}
					color="red"
					trend={
						costData.comparison
							? {
									direction: costData.comparison.change?.direction === "increased" ? "up" : "down",
									value: `${Math.abs(costData.comparison.change?.percent || 0).toFixed(1)}%`,
									isGood: costData.comparison.change?.direction === "decreased",
									description: `vs previous ${period}`,
								}
							: null
					}
					loading={isLoading}
					error={isError}
				/>

				<MetricSummaryCard
					title="Waste as % of Food Cost"
					value={`${foodCostPercent}%`}
					icon={TrendingUp}
					color={foodCostPercent > 5 ? "red" : foodCostPercent > 3 ? "yellow" : "green"}
					loading={isLoading}
					error={isError}
				/>
			</div>

			{/* Error State */}
			{isError && (
				<div
					className="bg-red-50 border border-red-200 rounded-lg p-6"
					role="alert"
				>
					<div className="flex items-start gap-4">
						<AlertCircle className="text-red-600 mt-1 flex-shrink-0" />
						<div>
							<h3 className="font-semibold text-red-900 mb-1">
								Error Loading Report
							</h3>
							<p className="text-sm text-red-700 mb-4">
								Failed to load food cost data. Please try again.
							</p>
							<button
								onClick={handleRefresh}
								className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
							>
								Retry
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Empty State */}
			{!isLoading && !isError && totalInventoryValue === 0 && (
				<div
					className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center"
					role="region"
					aria-label="No cost data"
				>
					<DollarSign size={48} className="mx-auto text-gray-400 mb-3" />
					<p className="text-gray-600 font-medium">
						No cost data available for this period
					</p>
					<p className="text-sm text-gray-500 mt-2">
						Inventory and waste data will populate this report
					</p>
				</div>
			)}

			{/* Cost Breakdown by Category */}
			{!isError && totalInventoryValue > 0 && (
				<>
					<div className="bg-white rounded-lg border border-gray-200 p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4">
							Cost Impact by Category
						</h2>
						<BarChart
							data={breakdownChartData}
							orientation="horizontal"
							maxValue={Math.max(...breakdownChartData.map((d) => d.value), 100)}
							showValues={true}
							loading={categoryQuery.isLoading}
							emptyMessage="No category breakdown available"
						/>
					</div>

					{/* Cost Analysis Card */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Waste Metrics */}
						<div className="bg-white rounded-lg border border-gray-200 p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								Waste Summary
							</h3>
							<div className="space-y-4">
								<div>
									<p className="text-sm text-gray-600">Total Items Wasted</p>
									<p className="text-2xl font-bold text-gray-900">
										{costData.total_waste_count || 0}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Avg Cost per Item</p>
									<p className="text-2xl font-bold text-gray-900">
										${((totalWasteValue / (costData.total_waste_count || 1)).toFixed(2))}
									</p>
								</div>
							</div>
						</div>

						{/* Benchmark Comparison */}
						<div className="bg-white rounded-lg border border-gray-200 p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								Industry Benchmarks
							</h3>
							<div className="space-y-4">
								<div>
									<div className="flex justify-between items-center mb-2">
										<span className="text-sm text-gray-600">Your Food Cost %</span>
										<span className="font-semibold text-gray-900">
											{foodCostPercent}%
										</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className={`h-2 rounded-full ${
												foodCostPercent > 35
													? "bg-red-500"
													: foodCostPercent > 30
														? "bg-yellow-500"
														: "bg-green-500"
											}`}
											style={{ width: `${Math.min(foodCostPercent * 3, 100)}%` }}
										/>
									</div>
								</div>
								<div className="pt-2 border-t border-gray-200">
									<p className="text-xs text-gray-600">
										Industry Average: 28-35% of revenue
									</p>
									<p className="text-xs text-gray-500 mt-1">
										Includes all food costs (waste, meals sold, etc.)
									</p>
								</div>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Data Info Footer */}
			{!isLoading && totalInventoryValue > 0 && lastFetchTime && (
				<div className="text-xs text-gray-500 text-center py-4">
					{formatDataFetchTime(lastFetchTime)}
				</div>
			)}
		</div>
	);
}

// Helper function for chart colors
function getCategoryColor(category) {
	const colors = {
		produce: "bg-green-500",
		protein: "bg-red-500",
		dairy: "bg-blue-500",
		pantry: "bg-yellow-500",
		prepared: "bg-purple-500",
		other: "bg-gray-500",
	};
	return colors[category?.toLowerCase()] || "bg-gray-500";
}
