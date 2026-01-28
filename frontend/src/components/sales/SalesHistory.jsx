// Sales History - Date range filtering and list view

import { useState } from "react";
import { useSales, useSalesSummary } from "../../hooks/useSales";
import {
	Calendar,
	Loader2,
	Search,
	DollarSign,
	ShoppingBag,
	ChevronDown,
	ChevronUp,
} from "lucide-react";

export default function SalesHistory() {
	const [dateRange, setDateRange] = useState(() => {
		const today = new Date();
		const weekAgo = new Date(today);
		weekAgo.setDate(weekAgo.getDate() - 7);
		return {
			startDate: weekAgo.toISOString().split("T")[0],
			endDate: today.toISOString().split("T")[0],
		};
	});
	const [expandedSale, setExpandedSale] = useState(null);

	const salesQuery = useSales({
		startDate: dateRange.startDate,
		endDate: dateRange.endDate,
		limit: 100,
	});

	const summaryQuery = useSalesSummary({
		startDate: dateRange.startDate,
		endDate: dateRange.endDate,
	});

	const summary = summaryQuery.data?.summary || {};
	const sales = salesQuery.data?.sales || [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-bold text-gray-900">Sales History</h2>
				<p className="text-gray-600">Browse and analyze historical sales data</p>
			</div>

			{/* Date Range Filter */}
			<div className="bg-white rounded-lg border border-gray-200 p-4">
				<div className="flex items-center gap-4">
					<Calendar className="w-5 h-5 text-gray-400" />
					<div className="flex items-center gap-2">
						<input
							type="date"
							value={dateRange.startDate}
							onChange={(e) =>
								setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
							}
							className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						<span className="text-gray-400">to</span>
						<input
							type="date"
							value={dateRange.endDate}
							onChange={(e) =>
								setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
							}
							className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div className="flex gap-2 ml-auto">
						{["today", "7d", "30d"].map((preset) => (
							<button
								key={preset}
								onClick={() => {
									const today = new Date();
									const start = new Date(today);
									if (preset === "today") {
										// start is already today
									} else if (preset === "7d") {
										start.setDate(start.getDate() - 7);
									} else {
										start.setDate(start.getDate() - 30);
									}
									setDateRange({
										startDate: start.toISOString().split("T")[0],
										endDate: today.toISOString().split("T")[0],
									});
								}}
								className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
							>
								{preset === "today" ? "Today" : preset === "7d" ? "7 Days" : "30 Days"}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Summary for period */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white rounded-lg border border-gray-200 p-5">
					<div className="flex items-center gap-2 mb-1">
						<DollarSign className="w-4 h-4 text-green-600" />
						<span className="text-sm font-medium text-gray-600">Total Revenue</span>
					</div>
					{summaryQuery.isLoading ? (
						<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
					) : (
						<p className="text-2xl font-bold text-gray-900">
							${(summary.totalRevenue || 0).toFixed(2)}
						</p>
					)}
				</div>
				<div className="bg-white rounded-lg border border-gray-200 p-5">
					<div className="flex items-center gap-2 mb-1">
						<ShoppingBag className="w-4 h-4 text-blue-600" />
						<span className="text-sm font-medium text-gray-600">Total Orders</span>
					</div>
					{summaryQuery.isLoading ? (
						<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
					) : (
						<p className="text-2xl font-bold text-gray-900">{summary.orderCount || 0}</p>
					)}
				</div>
				<div className="bg-white rounded-lg border border-gray-200 p-5">
					<div className="flex items-center gap-2 mb-1">
						<DollarSign className="w-4 h-4 text-purple-600" />
						<span className="text-sm font-medium text-gray-600">Avg Order Value</span>
					</div>
					{summaryQuery.isLoading ? (
						<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
					) : (
						<p className="text-2xl font-bold text-gray-900">
							${(summary.averageOrderValue || 0).toFixed(2)}
						</p>
					)}
				</div>
			</div>

			{/* Sales List */}
			<div className="bg-white rounded-lg border border-gray-200">
				<div className="p-4 border-b">
					<h3 className="font-semibold text-gray-900">
						Orders ({sales.length})
					</h3>
				</div>
				{salesQuery.isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
					</div>
				) : sales.length > 0 ? (
					<div className="divide-y">
						{sales.map((sale) => (
							<div key={sale.id}>
								<button
									onClick={() =>
										setExpandedSale(expandedSale === sale.id ? null : sale.id)
									}
									className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
								>
									<div className="flex items-center gap-4">
										<div>
											<p className="font-medium text-gray-900 text-left">
												#{sale.order_number || sale.pos_order_id?.slice(0, 8)}
											</p>
											<p className="text-sm text-gray-500">
												{sale.order_date
													? new Date(sale.order_date).toLocaleString()
													: "-"}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-4">
										<span className="text-sm text-gray-600">
											{sale.pos_sales_items?.length || 0} items
										</span>
										<span className="font-semibold text-gray-900">
											${parseFloat(sale.total_amount || 0).toFixed(2)}
										</span>
										{sale.inventory_deducted ? (
											<span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
												Deducted
											</span>
										) : (
											<span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
												Pending
											</span>
										)}
										{expandedSale === sale.id ? (
											<ChevronUp className="w-4 h-4 text-gray-400" />
										) : (
											<ChevronDown className="w-4 h-4 text-gray-400" />
										)}
									</div>
								</button>
								{expandedSale === sale.id && sale.pos_sales_items?.length > 0 && (
									<div className="px-4 pb-4 bg-gray-50">
										<table className="w-full text-sm">
											<thead>
												<tr className="border-b">
													<th className="py-2 text-left font-medium text-gray-600">Item</th>
													<th className="py-2 text-center font-medium text-gray-600">Qty</th>
													<th className="py-2 text-right font-medium text-gray-600">Price</th>
													<th className="py-2 text-right font-medium text-gray-600">Total</th>
												</tr>
											</thead>
											<tbody>
												{sale.pos_sales_items.map((item) => (
													<tr key={item.id} className="border-b last:border-b-0">
														<td className="py-2">{item.name}</td>
														<td className="py-2 text-center">{item.quantity}</td>
														<td className="py-2 text-right">
															${parseFloat(item.unit_price || 0).toFixed(2)}
														</td>
														<td className="py-2 text-right font-medium">
															${parseFloat(item.total_price || 0).toFixed(2)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<p className="text-gray-500 text-center py-12">No sales found for this date range</p>
				)}
			</div>
		</div>
	);
}
