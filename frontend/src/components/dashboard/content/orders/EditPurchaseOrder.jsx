// /frontend/src/components/dashboard/content/orders/EditPurchaseOrder.jsx

import { useState, useEffect } from "react";
import { Trash2, ArrowLeft } from "lucide-react";
import api from "../../../../core/database/api";

export default function EditPurchaseOrder({ poId }) {
	const [po, setPo] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		loadPOData();
	}, [poId]);

	const loadPOData = async () => {
		try {
			setLoading(true);
			setError(null);

			// Fetch PO details
			const response = await api.get(`/orders/purchase-orders/${poId}`);
			setPo(response.data);
		} catch (err) {
			console.error("Error loading PO:", err);
			setError(err.response?.data?.error || "Failed to load purchase order");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this purchase order? This action cannot be undone.")) {
			return;
		}

		try {
			setDeleting(true);
			setError(null);

			await api.delete(`/orders/purchase-orders/${poId}`);

			// Navigate back to PO list
			window.history.pushState({}, "", "/orders/view-purchase-orders");
			window.dispatchEvent(new PopStateEvent("popstate"));
		} catch (err) {
			console.error("Error deleting PO:", err);
			setError(err.response?.data?.error || "Failed to delete purchase order");
		} finally {
			setDeleting(false);
		}
	};

	const handleBack = () => {
		window.history.pushState({}, "", "/orders/view-purchase-orders");
		window.dispatchEvent(new PopStateEvent("popstate"));
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<p className="text-gray-600">Loading purchase order...</p>
			</div>
		);
	}

	if (error && !po) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
					<p className="text-red-700 text-sm">{error}</p>
				</div>
				<button
					onClick={handleBack}
					className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
				>
					<ArrowLeft size={16} />
					Back to Purchase Orders
				</button>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						Edit Purchase Order
					</h2>
					<p className="text-gray-600 text-sm mt-1">
						PO #{po?.order_number || poId}
					</p>
				</div>
				<button
					onClick={handleBack}
					className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
				>
					<ArrowLeft size={16} />
					Back
				</button>
			</div>

			{/* Error Display */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
					<p className="text-red-700 text-sm">{error}</p>
				</div>
			)}

			{/* PO Details */}
			{po && (
				<div className="space-y-6">
					{/* Basic Info */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Supplier
							</label>
							<p className="text-gray-900">{po.supplier_name}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Status
							</label>
							<span
								className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
									po.status === "submitted"
										? "bg-green-100 text-green-800"
										: po.status === "draft"
										? "bg-gray-100 text-gray-800"
										: po.status === "received"
										? "bg-blue-100 text-blue-800"
										: "bg-yellow-100 text-yellow-800"
								}`}
							>
								{po.status}
							</span>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Order Number
							</label>
							<p className="text-gray-900">{po.order_number}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Expected Delivery
							</label>
							<p className="text-gray-900">
								{po.expected_delivery_date
									? new Date(po.expected_delivery_date).toLocaleDateString()
									: "N/A"}
							</p>
						</div>
					</div>

					{/* Items Table */}
					<div>
						<h3 className="text-lg font-semibold text-gray-900 mb-3">
							Line Items
						</h3>
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Item
										</th>
										<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
											Qty
										</th>
										<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
											Unit Price
										</th>
										<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
											Total
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{po.items?.map((item, idx) => (
										<tr key={idx}>
											<td className="px-4 py-3 text-sm text-gray-900">
												{item.ingredient_name || item.item_name}
											</td>
											<td className="px-4 py-3 text-sm text-gray-900 text-right">
												{item.quantity} {item.unit}
											</td>
											<td className="px-4 py-3 text-sm text-gray-900 text-right">
												${item.unit_price?.toFixed(2) || "0.00"}
											</td>
											<td className="px-4 py-3 text-sm text-gray-900 text-right">
												${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
											</td>
										</tr>
									))}
								</tbody>
								<tfoot className="bg-gray-50">
									<tr>
										<td colSpan="3" className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
											Total:
										</td>
										<td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
											$
											{po.items
												?.reduce(
													(sum, item) =>
														sum + (item.quantity || 0) * (item.unit_price || 0),
													0
												)
												.toFixed(2) || "0.00"}
										</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>

					{/* Notes */}
					{po.notes && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Notes
							</label>
							<p className="text-gray-900">{po.notes}</p>
						</div>
					)}

					{/* Delete Button */}
					<div className="pt-6 border-t border-gray-200">
						<button
							onClick={handleDelete}
							disabled={deleting}
							className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Trash2 size={16} />
							{deleting ? "Deleting..." : "Delete Purchase Order"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
