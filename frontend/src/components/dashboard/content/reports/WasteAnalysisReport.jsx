// frontend/src/components/dashboard/content/reports/WasteAnalysisReport.jsx

import { useState, useEffect } from "react";
import { AlertCircle, Activity, DollarSign, RefreshCw } from "lucide-react";
import { formatDataFetchTime, getCurrentTimestamp } from "../../../../utils/dateFormat";
import MetricSummaryCard from "../../../shared/MetricSummaryCard";
import DateRangePicker from "../../../shared/DateRangePicker";
import BarChart from "../../../shared/BarChart";
import DataTable from "../../../shared/DataTable";
import {
	useWasteSummary,
	useWasteByCategory,
	useWasteByReason,
	useWasteByItem,
} from "../../../../hooks/useReports";

/**
 * WasteAnalysisReport - Main waste tracking dashboard
 * HIGHEST VALUE: Shows trends, breakdowns, and top wasted items
 *
 * Features:
 * - 3 metric cards (total waste, count, avg per incident)
 * - 2 bar charts (by category, by reason)
 * - 1 sortable data table (top 20 items)
 * - Date filtering + comparison toggle
 */
export default function WasteAnalysisReport() {
	const [period, setPeriod] = useState("month");
	const [compareEnabled, setCompareEnabled] = useState(false);
	const [activeTab, setActiveTab] = useState("category");
	const [lastFetchTime, setLastFetchTime] = useState(null);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Fetch all required data
	const summaryQuery = useWasteSummary({
		period,
		compare: compareEnabled,
	});
	const categoryQuery = useWasteByCategory({ period });
	const reasonQuery = useWasteByReason({ period });
	const itemsQuery = useWasteByItem({ period, limit: 20 });

	const isLoading =
		summaryQuery.isLoading ||
		categoryQuery.isLoading ||
		reasonQuery.isLoading ||
		itemsQuery.isLoading;
	const isError =
		summaryQuery.isError ||
		categoryQuery.isError ||
		reasonQuery.isError ||
		itemsQuery.isError;

	// Track data fetch time (when data actually loads, not on render)
	useEffect(() => {
		if (!isLoading && !isError && summaryQuery.data) {
			setLastFetchTime(getCurrentTimestamp());
		}
	}, [isLoading, isError, summaryQuery.data]);

	// Extract data
	const summary = summaryQuery.data || {};
	const categoryData = categoryQuery.data || {};
	const reasonData = reasonQuery.data || {};
	const itemsData = itemsQuery.data || {};

	// Prepare chart data for category breakdown
	const categoryChartData = (categoryData.categories || []).map((cat) => ({
		label: cat.category || "Unknown",
		value: cat.total_value || 0,
		color: getCategoryColor(cat.category),
	}));

	// Prepare chart data for reason breakdown
	const reasonChartData = (reasonData.reasons || []).map((reason) => ({
		label: reason.reason || "Unknown",
		value: reason.total_value || 0,
		color: getReasonColor(reason.reason),
	}));

	// Prepare table data
	const tableData = (itemsData.items || []).map((item) => ({
		id: item.id,
		name: item.ingredient_name || "Unknown",
		category: item.category || "--",
		total_value: item.total_value || 0,
		count: item.total_count || 0,
		avg_per_incident: item.avg_per_incident || 0,
	}));

	const tableColumns = [
		{ key: "name", label: "Item Name", sortable: true },
		{ key: "category", label: "Category", sortable: true },
		{ key: "total_value", label: "Total Value", sortable: true, format: "currency" },
		{ key: "count", label: "Count", sortable: true },
		{ key: "avg_per_incident", label: "Avg/Incident", sortable: true, format: "currency" },
	];

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await Promise.all([
				summaryQuery.refetch(),
				categoryQuery.refetch(),
				reasonQuery.refetch(),
				itemsQuery.refetch(),
			]);
		} finally {
			// Keep spinner visible for at least 500ms for better UX
			setTimeout(() => setIsRefreshing(false), 500);
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header with Filters */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="flex items-start justify-between mb-4">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Waste Analysis Report
						</h1>
						{!isLoading && summary.waste && lastFetchTime && (
							<p className="text-xs text-gray-500 mt-2">
								{formatDataFetchTime(lastFetchTime)}
							</p>
						)}
					</div>
					<button
						onClick={handleRefresh}
						disabled={isLoading || isRefreshing}
						className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
						aria-label="Refresh report data"
					>
						<RefreshCw
							size={20}
							className={isRefreshing ? "animate-spin" : ""}
						/>
					</button>
				</div>

				{/* Date Range Picker */}
				<DateRangePicker
					selected={period}
					onSelect={setPeriod}
					showComparison={true}
					onComparisonToggle={setCompareEnabled}
					comparisonEnabled={compareEnabled}
				/>
			</div>

			{/* Key Metrics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<MetricSummaryCard
					title="Total Waste Value"
					value={`$${(summary.waste?.total_value || 0).toFixed(2)}`}
					icon={AlertCircle}
					color="red"
					trend={
						summary.comparison
							? {
									direction: summary.comparison.change?.direction === "increased" ? "up" : "down",
									value: `${Math.abs(summary.comparison.change?.percent || 0).toFixed(1)}%`,
									isGood: summary.comparison.change?.direction === "decreased",
									description: `vs previous ${period}`,
								}
							: null
					}
					loading={isLoading}
					error={isError}
				/>

				<MetricSummaryCard
					title="Total Incidents"
					value={(summary.waste?.total_count || 0).toString()}
					icon={Activity}
					color="yellow"
					trend={
						summary.comparison
							? {
									direction: summary.comparison.change?.direction === "increased" ? "up" : "down",
									value: `${summary.comparison.change?.count || 0} incidents`,
									isGood: summary.comparison.change?.direction === "decreased",
									description: "change",
								}
							: null
					}
					loading={isLoading}
					error={isError}
				/>

				<MetricSummaryCard
					title="Average per Incident"
					value={`$${(summary.waste?.avg_per_incident || 0).toFixed(2)}`}
					icon={DollarSign}
					color="blue"
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
								Failed to load waste analysis data. Please try again.
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
			{!isLoading && !isError && !summary.waste && (
				<div
					className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center"
					role="region"
					aria-label="No waste data"
				>
					<AlertCircle size={48} className="mx-auto text-gray-400 mb-3" />
					<p className="text-gray-600 font-medium">
						No waste data available for this period
					</p>
					<p className="text-sm text-gray-500 mt-2">
						Start logging waste to see analytics
					</p>
				</div>
			)}

			{/* Tabbed Content Section */}
			{!isError && summary.waste && (
				<div className="bg-white rounded-lg border border-gray-200">
					{/* Tab Navigation */}
					<div className="border-b border-gray-200">
						<div className="flex gap-8 px-6">
							<button
								onClick={() => setActiveTab("category")}
								className={`py-4 text-sm font-medium transition-colors relative ${
									activeTab === "category"
										? "text-green-600"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								By Category
								{activeTab === "category" && (
									<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
								)}
							</button>
							<button
								onClick={() => setActiveTab("reason")}
								className={`py-4 text-sm font-medium transition-colors relative ${
									activeTab === "reason"
										? "text-green-600"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								By Reason
								{activeTab === "reason" && (
									<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
								)}
							</button>
							<button
								onClick={() => setActiveTab("items")}
								className={`py-4 text-sm font-medium transition-colors relative ${
									activeTab === "items"
										? "text-green-600"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								Top Items
								{activeTab === "items" && (
									<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
								)}
							</button>
						</div>
					</div>

					{/* Tab Content */}
					<div className="p-6">
						{activeTab === "category" && (
							<div>
								<h2 className="text-lg font-semibold text-gray-900 mb-3">
									Waste by Category
								</h2>
								<BarChart
									data={categoryChartData}
									orientation="horizontal"
									maxValue={Math.max(...categoryChartData.map((d) => d.value), 100)}
									showValues={true}
									loading={categoryQuery.isLoading}
									emptyMessage="No category data available"
								/>
							</div>
						)}

						{activeTab === "reason" && (
							<div>
								<h2 className="text-lg font-semibold text-gray-900 mb-3">
									Waste by Reason
								</h2>
								<BarChart
									data={reasonChartData}
									orientation="vertical"
									maxValue={Math.max(...reasonChartData.map((d) => d.value), 100)}
									showValues={true}
									height={300}
									loading={reasonQuery.isLoading}
									emptyMessage="No reason data available"
								/>
							</div>
						)}

						{activeTab === "items" && (
							<div>
								<h2 className="text-lg font-semibold text-gray-900 mb-3">
									Top 20 Wasted Items
								</h2>
								<DataTable
									columns={tableColumns}
									data={tableData}
									loading={itemsQuery.isLoading}
									defaultSort={{ column: "total_value", direction: "desc" }}
									emptyMessage="No items wasted in this period"
								/>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

// Helper functions for chart colors
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

function getReasonColor(reason) {
	const colors = {
		spoilage: "bg-yellow-500",
		expired: "bg-red-500",
		damaged: "bg-orange-500",
		waste: "bg-red-600",
		other: "bg-gray-500",
	};
	return colors[reason?.toLowerCase()] || "bg-gray-500";
}
