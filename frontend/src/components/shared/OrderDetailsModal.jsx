// frontend/src/components/shared/OrderDetailsModal.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../core/auth/useAuth";
import api from "../../core/database/api";

export default function OrderDetailsModal({ order, isOpen, onClose, onOrderUpdated, mode = "view" }) {
	const [orderDetails, setOrderDetails] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [editMode, setEditMode] = useState(mode === "edit");
	const [editedOrder, setEditedOrder] = useState(null);
	const [saving, setSaving] = useState(false);
	const [statusChangeLoading, setStatusChangeLoading] = useState(false);

	const { user } = useAuth();

	useEffect(() => {
		if (isOpen && order?.id) {
			fetchOrderDetails();
		}
	}, [isOpen, order?.id]);

	useEffect(() => {
		if (orderDetails) {
			setEditedOrder({
				...orderDetails,
				items: orderDetails.items?.map(item => ({
					...item,
					quantity: item.quantity,
					unit: item.unit,
					estimated_unit_cost: item.estimated_unit_cost || 0
				})) || []
			});
		}
	}, [orderDetails]);

	const fetchOrderDetails = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await api.get(`/orders/restaurant-orders/${order.id}`);
			setOrderDetails(response.data);
		} catch (err) {
			console.error("Error fetching order details:", err);
			setError(err.response?.data?.error || "Failed to load order details");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			
			// Update the order items
			const updateData = {
				notes: editedOrder.notes,
				items: editedOrder.items.map(item => ({
					id: item.id,
					ingredient_id: item.ingredient_id,
					quantity: parseFloat(item.quantity),
					unit: item.unit,
					estimated_unit_cost: parseFloat(item.estimated_unit_cost || 0)
				}))
			};

			const response = await api.put(`/orders/restaurant-orders/${order.id}`, updateData);
			
			setOrderDetails(response.data);
			setEditMode(false);
			
			if (onOrderUpdated) {
				onOrderUpdated(response.data);
			}
		} catch (err) {
			console.error("Error saving order:", err);
			setError(err.response?.data?.error || "Failed to save order");
		} finally {
			setSaving(false);
		}
	};

	const handleStatusChange = async (newStatus) => {
		try {
			setStatusChangeLoading(true);
			const response = await api.put(`/orders/restaurant-orders/${order.id}/status`, {
				status: newStatus
			});
			
			setOrderDetails(prev => ({
				...prev,
				status: newStatus
			}));
			
			if (onOrderUpdated) {
				onOrderUpdated(response.data);
			}
		} catch (err) {
			console.error("Error updating status:", err);
			setError(err.response?.data?.error || "Failed to update status");
		} finally {
			setStatusChangeLoading(false);
		}
	};

	const handleItemChange = (itemId, field, value) => {
		setEditedOrder(prev => ({
			...prev,
			items: prev.items.map(item => 
				item.id === itemId 
					? { ...item, [field]: value }
					: item
			)
		}));
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount || 0);
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusColor = (status) => {
		const colors = {
			draft: "bg-gray-100 text-gray-800",
			submitted: "bg-blue-100 text-blue-800",
			partially_fulfilled: "bg-yellow-100 text-yellow-800",
			fulfilled: "bg-green-100 text-green-800",
			cancelled: "bg-red-100 text-red-800",
		};
		return colors[status] || colors.draft;
	};

	const canEditStatus = (currentStatus) => {
		// Can only change status from draft to submitted, or cancel from any status
		return currentStatus === "draft" || currentStatus === "submitted";
	};

	const getNextValidStatuses = (currentStatus) => {
		switch (currentStatus) {
			case "draft":
				return ["submitted", "cancelled"];
			case "submitted":
				return ["partially_fulfilled", "fulfilled", "cancelled"];
			case "partially_fulfilled":
				return ["fulfilled", "cancelled"];
			default:
				return [];
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex justify-between items-center p-6 border-b">
					<div className="flex items-center gap-4">
						<h2 className="text-2xl font-bold text-gray-900">
							{editMode ? "Edit Order" : "Order Details"}
						</h2>
						{orderDetails && (
							<span
								className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(orderDetails.status)}`}
							>
								{orderDetails.status.replace("_", " ").toUpperCase()}
							</span>
						)}
					</div>
					<div className="flex gap-2">
						{!editMode && orderDetails?.status === "draft" && (
							<button
								onClick={() => setEditMode(true)}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
							>
								Edit Order
							</button>
						)}
						<button
							onClick={onClose}
							className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
						>
							Close
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="p-6">
					{loading ? (
						<div className="animate-pulse space-y-4">
							<div className="h-6 bg-gray-200 rounded"></div>
							<div className="h-32 bg-gray-200 rounded"></div>
						</div>
					) : error ? (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<p className="text-red-700">{error}</p>
							<button
								onClick={fetchOrderDetails}
								className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
							>
								Retry
							</button>
						</div>
					) : orderDetails ? (
						<div className="space-y-6">
							{/* Order Info */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700">Order Number</label>
									<p className="text-lg font-semibold text-gray-900">{orderDetails.order_number}</p>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Type</label>
									<p className="text-gray-900">{orderDetails.order_type.toUpperCase()}</p>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Created</label>
									<p className="text-gray-900">{formatDate(orderDetails.created_at)}</p>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">Total Value</label>
									<p className="text-lg font-semibold text-green-600">
										{formatCurrency(orderDetails.total_estimated_value)}
									</p>
								</div>
							</div>

							{/* Status Management */}
							{canEditStatus(orderDetails.status) && (
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
									<h3 className="text-lg font-semibold text-blue-900 mb-3">Update Status</h3>
									<div className="flex gap-2">
										{getNextValidStatuses(orderDetails.status).map((status) => (
											<button
												key={status}
												onClick={() => handleStatusChange(status)}
												disabled={statusChangeLoading}
												className={`px-4 py-2 rounded-lg font-medium ${
													status === "cancelled"
														? "bg-red-600 text-white hover:bg-red-700"
														: "bg-green-600 text-white hover:bg-green-700"
												} disabled:opacity-50`}
											>
												{statusChangeLoading ? "Updating..." : `Mark as ${status.replace("_", " ")}`}
											</button>
										))}
									</div>
								</div>
							)}

							{/* Notes */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
								{editMode ? (
									<textarea
										value={editedOrder?.notes || ""}
										onChange={(e) => setEditedOrder(prev => ({ ...prev, notes: e.target.value }))}
										rows={3}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
										placeholder="Add notes about this order..."
									/>
								) : (
									<p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
										{orderDetails.notes || "No notes"}
									</p>
								)}
							</div>

							{/* Order Items */}
							<div>
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items ({orderDetails.items?.length || 0})</h3>
								{orderDetails.items && orderDetails.items.length > 0 ? (
									<div className="border border-gray-200 rounded-lg overflow-hidden">
										<div className="overflow-x-auto">
											<table className="min-w-full divide-y divide-gray-200">
												<thead className="bg-gray-50">
													<tr>
														<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingredient</th>
														<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
														<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
														<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
														<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
														<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
													</tr>
												</thead>
												<tbody className="bg-white divide-y divide-gray-200">
													{(editMode ? editedOrder?.items : orderDetails.items)?.map((item) => (
														<tr key={item.id}>
															<td className="px-4 py-4 text-sm text-gray-900">{item.ingredient_name}</td>
															<td className="px-4 py-4 text-sm text-gray-600">{item.category}</td>
															<td className="px-4 py-4 text-sm">
																{editMode ? (
																	<input
																		type="number"
																		value={item.quantity}
																		onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
																		className="w-20 px-2 py-1 border border-gray-300 rounded"
																		step="0.01"
																	/>
																) : (
																	<span className="text-gray-900">{item.quantity}</span>
																)}
															</td>
															<td className="px-4 py-4 text-sm">
																{editMode ? (
																	<select
																		value={item.unit}
																		onChange={(e) => handleItemChange(item.id, "unit", e.target.value)}
																		className="px-2 py-1 border border-gray-300 rounded"
																	>
																		<option value="lbs">lbs</option>
																		<option value="kg">kg</option>
																		<option value="oz">oz</option>
																		<option value="each">each</option>
																		<option value="case">case</option>
																		<option value="box">box</option>
																	</select>
																) : (
																	<span className="text-gray-900">{item.unit}</span>
																)}
															</td>
															<td className="px-4 py-4 text-sm">
																{editMode ? (
																	<input
																		type="number"
																		value={item.estimated_unit_cost}
																		onChange={(e) => handleItemChange(item.id, "estimated_unit_cost", e.target.value)}
																		className="w-24 px-2 py-1 border border-gray-300 rounded"
																		step="0.01"
																	/>
																) : (
																	<span className="text-gray-900">{formatCurrency(item.estimated_unit_cost)}</span>
																)}
															</td>
															<td className="px-4 py-4 text-sm font-medium text-gray-900">
																{formatCurrency(item.quantity * (item.estimated_unit_cost || 0))}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								) : (
									<p className="text-gray-500 text-center py-4">No items in this order</p>
								)}
							</div>

							{/* Edit Actions */}
							{editMode && (
								<div className="flex justify-end gap-3 pt-4 border-t">
									<button
										onClick={() => {
											setEditMode(false);
											setEditedOrder(orderDetails);
											setError(null);
										}}
										className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
									>
										Cancel
									</button>
									<button
										onClick={handleSave}
										disabled={saving}
										className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
									>
										{saving ? "Saving..." : "Save Changes"}
									</button>
								</div>
							)}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}