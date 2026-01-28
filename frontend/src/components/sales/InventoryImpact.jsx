// Inventory Impact - Deduction summary and reconciliation

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeductionSummary, useDeductionHistory, useProcessDeductions } from "../../hooks/useDeductions";
import { useSyncStatus } from "../../hooks/useSales";
import {
	TrendingDown,
	Loader2,
	RefreshCw,
	Package,
	AlertTriangle,
	CheckCircle,
	Calendar,
} from "lucide-react";

export default function InventoryImpact() {
	const navigate = useNavigate();
	const [dateRange, setDateRange] = useState(() => {
		const today = new Date();
		const weekAgo = new Date(today);
		weekAgo.setDate(weekAgo.getDate() - 7);
		return {
			startDate: weekAgo.toISOString().split("T")[0],
			endDate: today.toISOString().split("T")[0],
		};
	});

	const summaryQuery = useDeductionSummary({
		startDate: dateRange.startDate,
		endDate: dateRange.endDate,
	});
	const historyQuery = useDeductionHistory({
		startDate: dateRange.startDate,
		endDate: dateRange.endDate,
		limit: 50,
	});
	const syncStatusQuery = useSyncStatus();
	const processDeductionsMutation = useProcessDeductions();

	const summary = summaryQuery.data?.summary || [];
	const history = historyQuery.data?.deductions || [];
	const unprocessedCount = syncStatusQuery.data?.unprocessedSales || 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Inventory Impact</h2>
					<p className="text-gray-600">
						Track how sales affect your inventory levels
					</p>
				</div>
				{unprocessedCount > 0 && (
					<button
						onClick={() => processDeductionsMutation.mutate()}
						disabled={processDeductionsMutation.isPending}
						className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
					>
						{processDeductionsMutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<RefreshCw className="w-4 h-4" />
						)}
						Process {unprocessedCount} Sales
					</button>
				)}
			</div>

			{/* Date Range */}
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
				</div>
			</div>

			{/* Unprocessed Sales Alert */}
			{unprocessedCount > 0 && (
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
					<div className="flex items-center gap-3">
						<AlertTriangle className="w-5 h-5 text-amber-600" />
						<div>
							<p className="font-medium text-amber-800">
								{unprocessedCount} sales pending inventory deduction
							</p>
							<p className="text-sm text-amber-700 mt-1">
								Click "Process Sales" to deduct ingredients from inventory based on
								recipes.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Process Results */}
			{processDeductionsMutation.isSuccess && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<div className="flex items-center gap-3">
						<CheckCircle className="w-5 h-5 text-green-600" />
						<p className="font-medium text-green-800">
							Processed {processDeductionsMutation.data?.succeeded || 0} sales,{" "}
							{processDeductionsMutation.data?.totalDeductions || 0} ingredients deducted
						</p>
					</div>
				</div>
			)}

			{/* Deduction Summary by Ingredient */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Ingredients Used (by Sales)
				</h3>
				{summaryQuery.isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
					</div>
				) : summary.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-gray-50">
									<th className="px-4 py-2 text-left font-medium text-gray-700">
										Ingredient
									</th>
									<th className="px-4 py-2 text-left font-medium text-gray-700">
										Category
									</th>
									<th className="px-4 py-2 text-right font-medium text-gray-700">
										Total Used
									</th>
									<th className="px-4 py-2 text-right font-medium text-gray-700">
										# Deductions
									</th>
								</tr>
							</thead>
							<tbody>
								{summary.map((item) => (
									<tr key={item.ingredientId} className="border-b last:border-b-0 hover:bg-gray-50">
										<td className="px-4 py-2 font-medium">
											{item.ingredientName}
										</td>
										<td className="px-4 py-2 text-gray-600">
											{item.category}
										</td>
										<td className="px-4 py-2 text-right">
											{item.totalDeducted.toFixed(2)} {item.unit}
										</td>
										<td className="px-4 py-2 text-right text-gray-600">
											{item.deductionCount}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="text-center py-8">
						<Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
						<p className="text-gray-500">No deductions recorded for this period</p>
						<p className="text-sm text-gray-400 mt-1">
							Deductions occur when sales with recipes are processed
						</p>
					</div>
				)}
			</div>

			{/* Recent Deductions */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Recent Deductions
				</h3>
				{historyQuery.isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
					</div>
				) : history.length > 0 ? (
					<div className="overflow-x-auto max-h-64 overflow-y-auto">
						<table className="w-full text-sm">
							<thead className="sticky top-0 bg-gray-50">
								<tr className="border-b">
									<th className="px-4 py-2 text-left font-medium text-gray-700">Time</th>
									<th className="px-4 py-2 text-left font-medium text-gray-700">Ingredient</th>
									<th className="px-4 py-2 text-left font-medium text-gray-700">Menu Item</th>
									<th className="px-4 py-2 text-right font-medium text-gray-700">Amount</th>
									<th className="px-4 py-2 text-center font-medium text-gray-700">Status</th>
								</tr>
							</thead>
							<tbody>
								{history.map((d) => (
									<tr key={d.id} className="border-b last:border-b-0">
										<td className="px-4 py-2 text-gray-600">
											{d.deducted_at
												? new Date(d.deducted_at).toLocaleString()
												: "-"}
										</td>
										<td className="px-4 py-2">
											{d.ingredient_library?.name || "Unknown"}
										</td>
										<td className="px-4 py-2 text-gray-600">
											{d.menu_items?.name || "-"}
										</td>
										<td className="px-4 py-2 text-right">
											{parseFloat(d.quantity_deducted).toFixed(2)} {d.unit}
										</td>
										<td className="px-4 py-2 text-center">
											{d.reversed ? (
												<span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
													Reversed
												</span>
											) : (
												<span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
													Applied
												</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="text-gray-500 text-center py-8">No deduction history</p>
				)}
			</div>
		</div>
	);
}
