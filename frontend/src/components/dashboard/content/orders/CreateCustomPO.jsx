// frontend/src/components/dashboard/content/orders/CreateCustomPO.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../../../core/auth/useAuth";
import api from "../../../../core/database/api";

export default function CreateCustomPO() {
	const [ingredients, setIngredients] = useState([]);
	const [selectedItems, setSelectedItems] = useState([]);
	const [supplierName, setSupplierName] = useState("");
	const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
	const [notes, setNotes] = useState("");
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [existingOrders, setExistingOrders] = useState([]);
	const [sourceOrderMode, setSourceOrderMode] = useState("new"); // 'new' or 'existing'
	const [selectedSourceOrders, setSelectedSourceOrders] = useState([]);

	const { user } = useAuth();

	useEffect(() => {
		fetchIngredients();
		fetchExistingOrders();
	}, []);

	const fetchIngredients = async () => {
		try {
			setLoading(true);
			const response = await api.get("/menu-items/ingredients");
			setIngredients(response.data || []);
		} catch (err) {
			console.error("Error fetching ingredients:", err);
			setError(err.response?.data?.error || "Failed to load ingredients");
		} finally {
			setLoading(false);
		}
	};

	const fetchExistingOrders = async () => {
		try {
			const response = await api.get("/orders/restaurant-orders?status=submitted");
			setExistingOrders(response.data || []);
		} catch (err) {
			console.error("Error fetching existing orders:", err);
		}
	};

	const categories = [
		"all",
		"protein",
		"produce",
		"dairy",
		"dry goods",
		"alcohol",
		"beverages",
		"supplies",
	];

	const filteredIngredients = ingredients.filter((ingredient) => {
		const matchesSearch = ingredient.name
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesCategory =
			categoryFilter === "all" || ingredient.category === categoryFilter;
		return matchesSearch && matchesCategory;
	});

	const addIngredientToPO = (ingredient) => {
		const existingItem = selectedItems.find(
			(item) => item.ingredient_id === ingredient.id
		);

		if (existingItem) {
			setSelectedItems((prev) =>
				prev.map((item) =>
					item.ingredient_id === ingredient.id
						? { ...item, quantityOrdered: item.quantityOrdered + 1 }
						: item
				)
			);
		} else {
			setSelectedItems((prev) => [
				...prev,
				{
					ingredient_id: ingredient.id,
					ingredient_name: ingredient.name,
					unit: ingredient.unit || "each",
					quantityOrdered: 1,
					unitPrice: 0,
				},
			]);
		}
	};

	const updateItemQuantity = (ingredientId, quantity) => {
		setSelectedItems((prev) =>
			prev.map((item) =>
				item.ingredient_id === ingredientId
					? { ...item, quantityOrdered: Math.max(0, quantity) }
					: item
			)
		);
	};

	const updateItemPrice = (ingredientId, price) => {
		setSelectedItems((prev) =>
			prev.map((item) =>
				item.ingredient_id === ingredientId
					? { ...item, unitPrice: Math.max(0, price) }
					: item
			)
		);
	};

	const removeItem = (ingredientId) => {
		setSelectedItems((prev) =>
			prev.filter((item) => item.ingredient_id !== ingredientId)
		);
	};

	const calculateSubtotal = () => {
		return selectedItems.reduce(
			(total, item) => total + item.quantityOrdered * item.unitPrice,
			0
		);
	};

	const calculateTotal = () => {
		const subtotal = calculateSubtotal();
		const tax = subtotal * 0.08; // 8% tax rate - should be configurable
		return subtotal + tax;
	};

	const loadItemsFromOrders = () => {
		const allItems = [];
		selectedSourceOrders.forEach((orderId) => {
			const order = existingOrders.find((o) => o.id === orderId);
			if (order && order.items) {
				order.items.forEach((item) => {
					allItems.push({
						ingredient_id: item.ingredient_id,
						ingredient_name: item.ingredient_name,
						unit: item.unit,
						quantityOrdered: item.quantity,
						unitPrice: item.estimated_unit_cost || 0,
					});
				});
			}
		});
		setSelectedItems(allItems);
	};

	const createCustomPO = async () => {
		if (!supplierName.trim()) {
			setError("Supplier name is required");
			return;
		}

		if (selectedItems.length === 0) {
			setError("Please add at least one item to the purchase order");
			return;
		}

		const invalidItems = selectedItems.filter(
			(item) => item.quantityOrdered <= 0 || item.unitPrice < 0
		);
		if (invalidItems.length > 0) {
			setError("All items must have valid quantities and prices");
			return;
		}

		try {
			setCreating(true);
			setError(null);

			const subtotal = calculateSubtotal();
			const tax = subtotal * 0.08;
			const total = subtotal + tax;

			const poData = {
				supplierName: supplierName.trim(),
				expectedDeliveryDate: expectedDeliveryDate || null,
				items: selectedItems.map((item) => ({
					ingredientId: item.ingredient_id,
					quantityOrdered: item.quantityOrdered,
					unit: item.unit,
					unitPrice: item.unitPrice,
					lineTotal: item.quantityOrdered * item.unitPrice,
				})),
				subtotal,
				tax,
				total,
				notes: notes.trim() || "",
				sourceOrderIds: sourceOrderMode === "existing" ? selectedSourceOrders : [],
			};

			const response = await api.post("/orders", poData);
			setSuccess(true);
			setTimeout(() => {
				window.history.pushState({}, "", "/orders");
				window.dispatchEvent(new PopStateEvent("popstate"));
			}, 2000);
		} catch (err) {
			console.error("Error creating custom PO:", err);
			setError(err.response?.data?.error || "Failed to create purchase order");
		} finally {
			setCreating(false);
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Create Custom Purchase Order
				</h2>
				<div className="animate-pulse space-y-4">
					{[1, 2, 3, 4, 5].map((i) => (
						<div key={i} className="h-12 bg-gray-200 rounded"></div>
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
						Purchase Order Created!
					</h2>
					<p className="text-gray-600">
						Your custom purchase order has been created successfully. Redirecting...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900">
					Create Custom Purchase Order
				</h2>
				<button
					onClick={() => window.history.pushState({}, "", "/orders")}
					className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
				>
					← Back to Orders
				</button>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<p className="text-red-700">{error}</p>
				</div>
			)}

			{/* PO Header Information */}
			<div className="grid grid-cols-2 gap-6 mb-6">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Supplier Name *
					</label>
					<input
						type="text"
						value={supplierName}
						onChange={(e) => setSupplierName(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
						placeholder="Enter supplier/vendor name"
						required
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Expected Delivery Date
					</label>
					<input
						type="date"
						value={expectedDeliveryDate}
						onChange={(e) => setExpectedDeliveryDate(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
					/>
				</div>
			</div>

			{/* Source Order Selection */}
			<div className="mb-6">
				<label className="block text-sm font-medium text-gray-700 mb-3">
					Item Source
				</label>
				<div className="flex gap-4 mb-4">
					<label className="flex items-center">
						<input
							type="radio"
							name="sourceMode"
							value="new"
							checked={sourceOrderMode === "new"}
							onChange={(e) => setSourceOrderMode(e.target.value)}
							className="mr-2"
						/>
						Build from scratch
					</label>
					<label className="flex items-center">
						<input
							type="radio"
							name="sourceMode"
							value="existing"
							checked={sourceOrderMode === "existing"}
							onChange={(e) => setSourceOrderMode(e.target.value)}
							className="mr-2"
						/>
						Import from existing orders
					</label>
				</div>

				{sourceOrderMode === "existing" && (
					<div className="bg-gray-50 p-4 rounded-lg">
						<div className="mb-3">
							<select
								multiple
								value={selectedSourceOrders}
								onChange={(e) =>
									setSelectedSourceOrders(
										Array.from(e.target.selectedOptions, (option) => option.value)
									)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
							>
								{existingOrders.map((order) => (
									<option key={order.id} value={order.id}>
										{order.order_number} - ${order.total_estimated_value || 0} ({order.item_count || 0} items)
									</option>
								))}
							</select>
							<p className="text-sm text-gray-600 mt-1">
								Hold Ctrl/Cmd to select multiple orders
							</p>
						</div>
						<button
							onClick={loadItemsFromOrders}
							disabled={selectedSourceOrders.length === 0}
							className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
						>
							Load Items from Selected Orders
						</button>
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-6">
				{/* Left Side - Ingredient Selection (only for new mode) */}
				{sourceOrderMode === "new" && (
					<div>
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Select Ingredients
						</h3>

						{/* Search and Filter */}
						<div className="space-y-3 mb-4">
							<input
								type="text"
								placeholder="Search ingredients..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
							/>
							<select
								value={categoryFilter}
								onChange={(e) => setCategoryFilter(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
							>
								{categories.map((category) => (
									<option key={category} value={category}>
										{category === "all"
											? "All Categories"
											: category
													.split(" ")
													.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
													.join(" ")}
									</option>
								))}
							</select>
						</div>

						{/* Ingredients List */}
						<div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
							{filteredIngredients.length === 0 ? (
								<div className="p-4 text-center text-gray-500">
									{searchTerm || categoryFilter !== "all"
										? "No ingredients match your search"
										: "No ingredients available"}
								</div>
							) : (
								<div className="divide-y divide-gray-200">
									{filteredIngredients.map((ingredient) => (
										<IngredientItem
											key={ingredient.id}
											ingredient={ingredient}
											onAdd={addIngredientToPO}
											isAdded={selectedItems.some(
												(item) => item.ingredient_id === ingredient.id
											)}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				{/* Right Side - PO Items */}
				<div className={sourceOrderMode === "new" ? "" : "col-span-2"}>
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						Purchase Order Items ({selectedItems.length})
					</h3>

					{selectedItems.length === 0 ? (
						<div className="border border-gray-300 rounded-lg p-8 text-center text-gray-500">
							<div className="text-4xl mb-2">📋</div>
							<p>No items added yet</p>
							{sourceOrderMode === "new" ? (
								<p className="text-sm">Select ingredients from the left</p>
							) : (
								<p className="text-sm">Import items from existing orders above</p>
							)}
						</div>
					) : (
						<div className="space-y-4">
							<div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
								<div className="divide-y divide-gray-200">
									{selectedItems.map((item) => (
										<POItem
											key={item.ingredient_id}
											item={item}
											onUpdateQuantity={updateItemQuantity}
											onUpdatePrice={updateItemPrice}
											onRemove={removeItem}
										/>
									))}
								</div>
							</div>

							{/* Notes */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Purchase Order Notes (Optional)
								</label>
								<textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
									placeholder="Add any special instructions for the supplier..."
								/>
							</div>

							{/* PO Summary */}
							<div className="bg-purple-50 rounded-lg p-4">
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Subtotal:</span>
										<span>${calculateSubtotal().toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>Tax (8%):</span>
										<span>${(calculateSubtotal() * 0.08).toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-lg font-semibold border-t border-purple-200 pt-2">
										<span>Total:</span>
										<span className="text-purple-600">
											${calculateTotal().toFixed(2)}
										</span>
									</div>
								</div>
								<p className="text-sm text-purple-600 mt-2">
									{selectedItems.length} items
								</p>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									onClick={createCustomPO}
									disabled={creating || selectedItems.length === 0 || !supplierName.trim()}
									className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{creating ? "Creating Purchase Order..." : "Create Purchase Order"}
								</button>
								<button
									onClick={() => setSelectedItems([])}
									className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
								>
									Clear All Items
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function IngredientItem({ ingredient, onAdd, isAdded }) {
	return (
		<div className="flex items-center justify-between p-3 hover:bg-gray-50">
			<div className="flex-1">
				<h4 className="font-medium text-gray-900">{ingredient.name}</h4>
				<p className="text-sm text-gray-600">
					{ingredient.category} • Unit: {ingredient.unit || "each"}
				</p>
			</div>
			<button
				onClick={() => onAdd(ingredient)}
				disabled={isAdded}
				className={`px-3 py-1 text-sm rounded ${
					isAdded
						? "bg-green-100 text-green-800 cursor-default"
						: "bg-purple-600 text-white hover:bg-purple-700"
				}`}
			>
				{isAdded ? "Added ✓" : "Add"}
			</button>
		</div>
	);
}

function POItem({ item, onUpdateQuantity, onUpdatePrice, onRemove }) {
	return (
		<div className="p-3 space-y-2">
			<div className="flex justify-between items-start">
				<h4 className="font-medium text-gray-900">{item.ingredient_name}</h4>
				<button
					onClick={() => onRemove(item.ingredient_id)}
					className="text-red-600 hover:text-red-800"
				>
					×
				</button>
			</div>

			<div className="grid grid-cols-3 gap-2">
				<div>
					<label className="block text-xs text-gray-600 mb-1">Quantity</label>
					<div className="flex items-center gap-1">
						<input
							type="number"
							value={item.quantityOrdered}
							onChange={(e) =>
								onUpdateQuantity(item.ingredient_id, parseInt(e.target.value) || 0)
							}
							className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
							min="0"
						/>
						<span className="text-xs text-gray-600">{item.unit}</span>
					</div>
				</div>
				<div>
					<label className="block text-xs text-gray-600 mb-1">Unit Price</label>
					<input
						type="number"
						value={item.unitPrice}
						onChange={(e) =>
							onUpdatePrice(item.ingredient_id, parseFloat(e.target.value) || 0)
						}
						className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
						min="0"
						step="0.01"
						placeholder="0.00"
					/>
				</div>
				<div>
					<label className="block text-xs text-gray-600 mb-1">Line Total</label>
					<div className="px-2 py-1 text-sm bg-gray-100 rounded font-semibold">
						${(item.quantityOrdered * item.unitPrice).toFixed(2)}
					</div>
				</div>
			</div>
		</div>
	);
}