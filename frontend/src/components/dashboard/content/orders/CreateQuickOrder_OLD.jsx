// frontend/src/components/dashboard/content/orders/CreateQuickOrder.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../../../core/auth/useAuth";
import api from "../../../../core/database/api";

export default function CreateQuickOrder() {
	const [lowStockItems, setLowStockItems] = useState([]);
	const [selectedItems, setSelectedItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);
	const [notes, setNotes] = useState("");

	const { user } = useAuth();

	useEffect(() => {
		fetchLowStockItems();
	}, []);

	const fetchLowStockItems = async () => {
		try {
			setLoading(true);
			const response = await api.get("/inventory");
			const inventory = response.data;

			// Filter items where quantity <= minimum_quantity
			const lowStock = inventory.filter(
				(item) => item.quantity <= (item.minimum_quantity || 0)
			);

			setLowStockItems(lowStock);

			// Auto-select all low stock items with suggested quantities
			const autoSelected = lowStock.map((item) => ({
				ingredient_id: item.ingredient_id,
				ingredient_name: item.ingredient_name,
				current_quantity: item.quantity,
				minimum_quantity: item.minimum_quantity,
				unit: item.unit,
				cost_per_unit: item.cost_per_unit,
				// Suggest ordering enough to reach 2x minimum quantity
				suggested_quantity: Math.max(
					(item.minimum_quantity || 10) * 2 - item.quantity,
					1
				),
				quantity: Math.max((item.minimum_quantity || 10) * 2 - item.quantity, 1),
			}));

			setSelectedItems(autoSelected);
		} catch (err) {
			console.error("Error fetching low stock items:", err);
			setError(err.response?.data?.error || "Failed to load low stock items");
		} finally {
			setLoading(false);
		}
	};

	const updateItemQuantity = (ingredientId, newQuantity) => {
		setSelectedItems((prev) =>
			prev.map((item) =>
				item.ingredient_id === ingredientId
					? { ...item, quantity: Math.max(0, newQuantity) }
					: item
			)
		);
	};

	const removeItem = (ingredientId) => {
		setSelectedItems((prev) =>
			prev.filter((item) => item.ingredient_id !== ingredientId)
		);
	};

	const calculateTotal = () => {
		return selectedItems.reduce(
			(total, item) => total + (item.quantity * (item.cost_per_unit || 0)),
			0
		);
	};

	const createQuickOrder = async () => {
		if (selectedItems.length === 0) {
			setError("Please select at least one item to order");
			return;
		}

		try {
			setCreating(true);
			setError(null);

			const orderItems = selectedItems.map((item) => ({
				ingredientId: item.ingredient_id,
				quantity: item.quantity,
				unit: item.unit,
				estimatedUnitCost: item.cost_per_unit || 0,
				estimatedLineTotal: item.quantity * (item.cost_per_unit || 0),
			}));

			const response = await api.post("/orders/quick-order", {
				items: orderItems,
				notes: notes.trim() || "Auto-generated quick order for low stock items",
			});

			setSuccess(true);
			setTimeout(() => {
				window.history.pushState({}, "", "/orders");
				window.dispatchEvent(new PopStateEvent("popstate"));
			}, 2000);
		} catch (err) {
			console.error("Error creating quick order:", err);
			setError(err.response?.data?.error || "Failed to create order");
		} finally {
			setCreating(false);
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Create Quick Order
				</h2>
				<div className="animate-pulse space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-16 bg-gray-200 rounded"></div>
					))}
				</div>
			</div>
		);
	}

	if (success) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="text-center py-8">
					<div className="text-6xl mb-4">✅</div>
					<h2 className="text-2xl font-bold text-green-800 mb-2">
						Quick Order Created!
					</h2>
					<p className="text-gray-600">
						Your order has been created successfully. Redirecting to orders...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Create Quick Order</h2>
				<button
					onClick={() => window.history.pushState({}, "", "/orders")}
					className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
				>
					← Back to Orders
				</button>
			</div>

			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
				<p className="text-blue-800">
					<strong>Quick Order:</strong> This order has been automatically populated
					with all items that are currently at or below their minimum stock levels.
					Adjust quantities as needed and submit to create your order.
				</p>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<p className="text-red-700">{error}</p>
				</div>
			)}

			{lowStockItems.length === 0 ? (
				<div className="text-center py-8">
					<div className="text-6xl mb-4">🎉</div>
					<h3 className="text-xl font-semibold text-gray-900 mb-2">
						All Items Well Stocked!
					</h3>
					<p className="text-gray-600 mb-4">
						No items are currently below their minimum stock levels.
					</p>
					<button
						onClick={() =>
							window.history.pushState({}, "", "/orders/create-custom-order")
						}
						className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Create Custom Order Instead
					</button>
				</div>
			) : (
				<div>
					{/* Order Items */}
					<div className="mb-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Low Stock Items ({selectedItems.length})
						</h3>
						<div className="space-y-3">
							{selectedItems.map((item) => (
								<QuickOrderItem
									key={item.ingredient_id}
									item={item}
									onUpdateQuantity={updateItemQuantity}
									onRemove={removeItem}
								/>
							))}
						</div>
					</div>

					{/* Notes */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Order Notes (Optional)
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							placeholder="Add any special instructions or notes for this order..."
						/>
					</div>

					{/* Order Summary */}
					<div className="bg-gray-50 rounded-lg p-4 mb-6">
						<div className="flex justify-between items-center">
							<span className="text-lg font-semibold text-gray-900">
								Estimated Total:
							</span>
							<span className="text-xl font-bold text-green-600">
								{new Intl.NumberFormat("en-US", {
									style: "currency",
									currency: "USD",
								}).format(calculateTotal())}
							</span>
						</div>
						<p className="text-sm text-gray-600 mt-1">
							{selectedItems.length} items • Estimated based on last known costs
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3">
						<button
							onClick={createQuickOrder}
							disabled={creating || selectedItems.length === 0}
							className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{creating ? "Creating Order..." : "Create Quick Order"}
						</button>
						<button
							onClick={() => setSelectedItems([])}
							className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
						>
							Clear All
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function QuickOrderItem({ item, onUpdateQuantity, onRemove }) {
	return (
		<div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
			<div className="flex-1">
				<h4 className="font-semibold text-gray-900">{item.ingredient_name}</h4>
				<p className="text-sm text-gray-600">
					Current: {item.current_quantity} {item.unit} • Minimum:{" "}
					{item.minimum_quantity} {item.unit}
				</p>
			</div>

			<div className="flex items-center gap-2">
				<button
					onClick={() => onUpdateQuantity(item.ingredient_id, item.quantity - 1)}
					className="w-8 h-8 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
					disabled={item.quantity <= 0}
				>
					-
				</button>
				<input
					type="number"
					value={item.quantity}
					onChange={(e) =>
						onUpdateQuantity(item.ingredient_id, parseInt(e.target.value) || 0)
					}
					className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
					min="0"
				/>
				<button
					onClick={() => onUpdateQuantity(item.ingredient_id, item.quantity + 1)}
					className="w-8 h-8 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
				>
					+
				</button>
				<span className="text-sm text-gray-600 w-12">{item.unit}</span>
			</div>

			<div className="text-right">
				<p className="font-semibold text-gray-900">
					{new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: "USD",
					}).format(item.quantity * (item.cost_per_unit || 0))}
				</p>
				<p className="text-xs text-gray-500">
					${(item.cost_per_unit || 0).toFixed(2)} per {item.unit}
				</p>
			</div>

			<button
				onClick={() => onRemove(item.ingredient_id)}
				className="w-8 h-8 bg-red-100 text-red-600 rounded hover:bg-red-200"
			>
				×
			</button>
		</div>
	);
}