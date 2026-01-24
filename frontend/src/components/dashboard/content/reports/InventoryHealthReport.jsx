// frontend/src/components/dashboard/content/reports/InventoryHealthReport.jsx

import { useState, useEffect } from "react";
import { Package, AlertTriangle, Clock, TrendingDown, RefreshCw } from "lucide-react";
import { formatDataFetchTime, getCurrentTimestamp } from "../../../../utils/dateFormat";
import MetricSummaryCard from "../../../shared/MetricSummaryCard";
import DateRangePicker from "../../../shared/DateRangePicker";
import DataTable from "../../../shared/DataTable";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

/**
 * InventoryHealthReport - Stock levels, turnover, and expiration tracking
 * Shows inventory health metrics and items requiring attention
 *
 * TODO: Backend needs endpoints for:
 * - GET /api/inventory/low-stock
 * - GET /api/inventory/expiring-soon
 */
export default function InventoryHealthReport() {
	const [period, setPeriod] = useState("month");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [sortBy, setSortBy] = useState("urgency");
	const [lastFetchTime, setLastFetchTime] = useState(null);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Fetch inventory data (using existing inventory endpoint)
	const inventoryQuery = useQuery({
		queryKey: ["inventory", period],
		queryFn: async () => {
			const { data } = await axios.get("/api/inventory");
			return data;
		},
		staleTime: 1000 * 60 * 2,
	});

	const isLoading = inventoryQuery.isLoading;
	const isError = inventoryQuery.isError;
	const inventory = inventoryQuery.data || [];

	// Track data fetch time
	useEffect(() => {
		if (!isLoading && !isError && inventoryQuery.data) {
			setLastFetchTime(getCurrentTimestamp());
		}
	}, [isLoading, isError, inventoryQuery.data]);

	// Calculate metrics from inventory data
	const calculateMetrics = () => {
		const today = new Date();

		let totalItems = 0;
		let lowStockCount = 0;
		let expiringCount = 0;
		let outOfStockCount = 0;
		const lowStockItems = [];
		const expiringItems = [];

		inventory.forEach((item) => {
			totalItems++;

			// Low stock check
			if (
				item.quantity_on_hand <=
				(item.reorder_point || item.quantity_on_hand * 0.2)
			) {
				lowStockCount++;
				lowStockItems.push(item);
			}

			// Out of stock check
			if (item.quantity_on_hand === 0) {
				outOfStockCount++;
			}

			// Expiring soon check (within 3 days)
			if (item.expiration_date) {
				const expDate = new Date(item.expiration_date);
				const daysUntilExpiry = Math.ceil(
					(expDate - today) / (1000 * 60 * 60 * 24)
				);

				if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
					expiringCount++;
					expiringItems.push({
						...item,
						daysUntilExpiry,
					});
				}
			}
		});

		return {
			totalItems,
			lowStockCount,
			expiringCount,
			outOfStockCount,
			lowStockItems: lowStockItems.slice(0, 20),
			expiringItems: expiringItems
				.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
				.slice(0, 20),
		};
	};

	const metrics = calculateMetrics();

	// Filter low stock items
	const filteredLowStock =
		categoryFilter === "all"
			? metrics.lowStockItems
			: metrics.lowStockItems.filter(
					(item) =>
						item.category?.toLowerCase() === categoryFilter.toLowerCase()
				);

	// Filter expiring items
	const filteredExpiring =
		categoryFilter === "all"
			? metrics.expiringItems
			: metrics.expiringItems.filter(
					(item) =>
						item.category?.toLowerCase() === categoryFilter.toLowerCase()
				);

	// Table columns
	const lowStockColumns = [
		{ key: "ingredient_name", label: "Item Name", sortable: true },
		{ key: "category", label: "Category", sortable: true },
		{ key: "quantity_on_hand", label: "Current Qty", sortable: true },
		{ key: "reorder_point", label: "Reorder Point", sortable: true },
		{ key: "unit", label: "Unit", sortable: false },
	];

	const expiringColumns = [
		{ key: "ingredient_name", label: "Item Name", sortable: true },
		{ key: "expiration_date", label: "Expires", sortable: true, format: "date" },
		{
			key: "daysUntilExpiry",
			label: "Days Left",
			sortable: true,
		},
		{ key: "quantity_on_hand", label: "Qty", sortable: true },
		{ key: "category", label: "Category", sortable: true },
	];

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await inventoryQuery.refetch();
		} finally {
			setTimeout(() => setIsRefreshing(false), 500);
		}
	};

	// Get unique categories for filter
	const categories = [
		"all",
		...new Set(
			inventory
				.map((item) => item.category)
				.filter((cat) => cat)
		),
	];

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="flex items-start justify-between mb-2">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Inventory Health Report
						</h1>
						<p className="text-gray-600 mt-2">
							Track stock levels, expiration dates, and items requiring
							attention
						</p>
					</div>
					<button
						onClick={handleRefresh}
						disabled={isLoading || isRefreshing}
						className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
						aria-label="Refresh inventory"
					>
						<RefreshCw
							size={20}
							className={isRefreshing ? "animate-spin" : ""}
						/>
					</button>
				</div>
			</div>

			{/* Date & Filter Controls */}
			<div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
				<DateRangePicker
					selected={period}
					onSelect={setPeriod}
					showComparison={false}
				/>

				{/* Category Filter */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Filter by Category
					</label>
					<div className="flex gap-2 flex-wrap">
						{categories.map((cat) => (
							<button
								key={cat}
								onClick={() => setCategoryFilter(cat)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									categoryFilter === cat
										? "bg-green-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
								aria-pressed={categoryFilter === cat}
							>
								{cat === "all"
									? "All Categories"
									: cat.charAt(0).toUpperCase() + cat.slice(1)}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Health Metrics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<MetricSummaryCard
					title="Total Items"
					value={metrics.totalItems.toString()}
					icon={Package}
					color="blue"
					loading={isLoading}
					error={isError}
				/>

				<MetricSummaryCard
					title="Low Stock"
					value={metrics.lowStockCount.toString()}
					icon={AlertTriangle}
					color={metrics.lowStockCount > 0 ? "yellow" : "green"}
					trend={
						metrics.lowStockCount > 0
							? {
									direction: "neutral",
									value: `${metrics.lowStockCount} items`,
									isGood: false,
									description: "need attention",
								}
							: null
					}
					loading={isLoading}
					error={isError}
				/>

				<MetricSummaryCard
					title="Expiring Soon"
					value={metrics.expiringCount.toString()}
					icon={Clock}
					color={metrics.expiringCount > 0 ? "red" : "green"}
					trend={
						metrics.expiringCount > 0
							? {
									direction: "neutral",
									value: `${metrics.expiringCount} items`,
									isGood: false,
									description: "within 3 days",
								}
							: null
					}
					loading={isLoading}
					error={isError}
				/>

				<MetricSummaryCard
					title="Out of Stock"
					value={metrics.outOfStockCount.toString()}
					icon={TrendingDown}
					color={metrics.outOfStockCount > 0 ? "red" : "green"}
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
						<AlertTriangle className="text-red-600 mt-1 flex-shrink-0" />
						<div>
							<h3 className="font-semibold text-red-900 mb-1">
								Error Loading Inventory
							</h3>
							<p className="text-sm text-red-700 mb-4">
								Failed to load inventory data. Please try again.
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
			{!isLoading && !isError && inventory.length === 0 && (
				<div
					className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center"
					role="region"
					aria-label="No inventory data"
				>
					<Package size={48} className="mx-auto text-gray-400 mb-3" />
					<p className="text-gray-600 font-medium">
						No inventory items found
					</p>
					<p className="text-sm text-gray-500 mt-2">
						Add items to inventory to see health metrics
					</p>
				</div>
			)}

			{/* Tables Section */}
			{!isError && inventory.length > 0 && (
				<>
					{/* Low Stock Items */}
					<div className="bg-white rounded-lg border border-gray-200 p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4">
							Low Stock Items ({filteredLowStock.length})
						</h2>
						<DataTable
							columns={lowStockColumns}
							data={filteredLowStock}
							loading={isLoading}
							emptyMessage="No low stock items"
							defaultSort={{ column: "quantity_on_hand", direction: "asc" }}
						/>
					</div>

					{/* Expiring Soon Items */}
					<div className="bg-white rounded-lg border border-gray-200 p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4">
							Expiring Soon Items ({filteredExpiring.length})
						</h2>
						<DataTable
							columns={expiringColumns}
							data={filteredExpiring}
							loading={isLoading}
							emptyMessage="No items expiring soon"
							defaultSort={{ column: "daysUntilExpiry", direction: "asc" }}
						/>
					</div>
				</>
			)}

			{/* Data Info Footer */}
			{!isLoading && inventory.length > 0 && lastFetchTime && (
				<div className="text-xs text-gray-500 text-center py-4">
					{formatDataFetchTime(lastFetchTime)}
				</div>
			)}
		</div>
	);
}
