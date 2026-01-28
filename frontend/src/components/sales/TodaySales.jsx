// Today's Sales - Summary cards, top items, and recent orders

import { useSalesSummary, useTopSellingItems, useSales, useSyncSales } from "../../hooks/useSales";
import { useSyncStatus } from "../../hooks/useSales";
import {
	DollarSign,
	ShoppingBag,
	TrendingUp,
	Loader2,
	RefreshCw,
	AlertCircle,
	Clock,
} from "lucide-react";

export default function TodaySales() {
	const today = new Date().toISOString().split("T")[0];

	const summaryQuery = useSalesSummary({ startDate: today, endDate: today });
	const topItemsQuery = useTopSellingItems({ startDate: today, endDate: today, limit: 10 });
	const recentSalesQuery = useSales({ startDate: today, limit: 20 });
	const syncStatusQuery = useSyncStatus();
	const syncMutation = useSyncSales();

	const summary = summaryQuery.data?.summary || {};
	const isLoading = summaryQuery.isLoading;

	const handleSync = () => {
		const posSystem = syncStatusQuery.data?.posSystem;
		if (posSystem) {
			syncMutation.mutate({
				posSystem,
				startDate: `${today}T00:00:00.000Z`,
				endDate: new Date().toISOString(),
			});
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Today's Sales</h2>
					<p className="text-gray-600">
						{new Date().toLocaleDateString("en-US", {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
				</div>
				<div className="flex items-center gap-3">
					{syncStatusQuery.data?.lastSync && (
						<span className="text-sm text-gray-500 flex items-center gap-1">
							<Clock className="w-3 h-3" />
							Last sync: {new Date(syncStatusQuery.data.lastSync).toLocaleTimeString()}
						</span>
					)}
					<button
						onClick={handleSync}
						disabled={syncMutation.isPending || !syncStatusQuery.data?.posSystem}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
					>
						{syncMutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<RefreshCw className="w-4 h-4" />
						)}
						Sync Sales
					</button>
				</div>
			</div>

			{/* No POS Warning */}
			{!syncStatusQuery.isLoading && !syncStatusQuery.data?.posSystem && (
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
					<div className="flex items-start gap-3">
						<AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
						<div>
							<h3 className="font-medium text-amber-800">No POS Connected</h3>
							<p className="text-sm text-amber-700 mt-1">
								Connect your POS system in Settings &gt; Integrations to see sales data.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<SummaryCard
					title="Total Revenue"
					value={`$${(summary.totalRevenue || 0).toFixed(2)}`}
					icon={DollarSign}
					color="green"
					loading={isLoading}
				/>
				<SummaryCard
					title="Orders"
					value={summary.orderCount || 0}
					icon={ShoppingBag}
					color="blue"
					loading={isLoading}
				/>
				<SummaryCard
					title="Avg Order Value"
					value={`$${(summary.averageOrderValue || 0).toFixed(2)}`}
					icon={TrendingUp}
					color="purple"
					loading={isLoading}
				/>
				<SummaryCard
					title="Tax Collected"
					value={`$${(summary.totalTax || 0).toFixed(2)}`}
					icon={DollarSign}
					color="gray"
					loading={isLoading}
				/>
			</div>

			{/* Top Selling Items */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
				{topItemsQuery.isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
					</div>
				) : topItemsQuery.data?.topItems?.length > 0 ? (
					<div className="space-y-3">
						{topItemsQuery.data.topItems.map((item, idx) => (
							<div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
								<div className="flex items-center gap-3">
									<span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
										{idx + 1}
									</span>
									<span className="font-medium text-gray-900">{item.name}</span>
								</div>
								<div className="flex items-center gap-4 text-sm">
									<span className="text-gray-600">{item.quantitySold} sold</span>
									<span className="font-medium text-gray-900">${item.revenue.toFixed(2)}</span>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-gray-500 text-center py-8">No sales data for today</p>
				)}
			</div>

			{/* Recent Orders */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
				{recentSalesQuery.isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
					</div>
				) : recentSalesQuery.data?.sales?.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-gray-50">
									<th className="px-4 py-2 text-left font-medium text-gray-700">Order #</th>
									<th className="px-4 py-2 text-left font-medium text-gray-700">Time</th>
									<th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
									<th className="px-4 py-2 text-left font-medium text-gray-700">Items</th>
									<th className="px-4 py-2 text-right font-medium text-gray-700">Total</th>
									<th className="px-4 py-2 text-center font-medium text-gray-700">Deducted</th>
								</tr>
							</thead>
							<tbody>
								{recentSalesQuery.data.sales.map((sale) => (
									<tr key={sale.id} className="border-b last:border-b-0 hover:bg-gray-50">
										<td className="px-4 py-2 font-medium">{sale.order_number || sale.pos_order_id?.slice(0, 8)}</td>
										<td className="px-4 py-2 text-gray-600">
											{sale.order_date ? new Date(sale.order_date).toLocaleTimeString() : "-"}
										</td>
										<td className="px-4 py-2 text-gray-600">{sale.order_type || "-"}</td>
										<td className="px-4 py-2 text-gray-600">{sale.pos_sales_items?.length || 0}</td>
										<td className="px-4 py-2 text-right font-medium">${parseFloat(sale.total_amount || 0).toFixed(2)}</td>
										<td className="px-4 py-2 text-center">
											{sale.inventory_deducted ? (
												<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Yes</span>
											) : (
												<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">No</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="text-gray-500 text-center py-8">No orders today</p>
				)}
			</div>
		</div>
	);
}

function SummaryCard({ title, value, icon: Icon, color, loading }) {
	const colorClasses = {
		green: "bg-green-50 text-green-600",
		blue: "bg-blue-50 text-blue-600",
		purple: "bg-purple-50 text-purple-600",
		gray: "bg-gray-50 text-gray-600",
	};

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-5">
			<div className="flex items-center gap-3 mb-2">
				<div className={`p-2 rounded-lg ${colorClasses[color]}`}>
					<Icon className="w-5 h-5" />
				</div>
				<span className="text-sm font-medium text-gray-600">{title}</span>
			</div>
			{loading ? (
				<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
			) : (
				<p className="text-2xl font-bold text-gray-900">{value}</p>
			)}
		</div>
	);
}
