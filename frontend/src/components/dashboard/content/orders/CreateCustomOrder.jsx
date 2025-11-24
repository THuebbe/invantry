// frontend/src/components/dashboard/content/orders/CreateCustomOrder.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../../../core/auth/useAuth";
import api from "../../../../core/database/api";

export default function CreateCustomOrder() {
	const [ingredients, setIngredients] = useState([]);
	const [selectedItems, setSelectedItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);
	const [notes, setNotes] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");

	const { user } = useAuth();

	useEffect(() => {
		fetchIngredients();
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

	const addIngredientToOrder = (ingredient) => {
		const existingItem = selectedItems.find(
			(item) => item.ingredient_id === ingredient.id
		);

		if (existingItem) {
			setSelectedItems((prev) =>
				prev.map((item) =>
					item.ingredient_id === ingredient.id
						? { ...item, quantity: item.quantity + 1 }
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
					quantity: 1,
					cost_per_unit: 0, // User will need to set this
				},
			]);
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

	const updateItemCost = (ingredientId, newCost) => {
		setSelectedItems((prev) =>
			prev.map((item) =>
				item.ingredient_id === ingredientId
					? { ...item, cost_per_unit: Math.max(0, newCost) }
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
			(total, item) => total + item.quantity * item.cost_per_unit,
			0
		);
	};

	const createCustomOrder = async () => {
		if (selectedItems.length === 0) {
			setError("Please add at least one item to the order");
			return;
		}

		const invalidItems = selectedItems.filter((item) => item.quantity <= 0);
		if (invalidItems.length > 0) {
			setError("All items must have a quantity greater than 0");
			return;
		}

		try {
			setCreating(true);
			setError(null);

			const orderItems = selectedItems.map((item) => ({
				ingredientId: item.ingredient_id,
				quantity: item.quantity,
				unit: item.unit,
				estimatedUnitCost: item.cost_per_unit,
				estimatedLineTotal: item.quantity * item.cost_per_unit,
			}));

			const response = await api.post("/orders/restaurant-orders", {
				orderType: "custom",
				items: orderItems,
				notes: notes.trim() || "Custom order created manually",
			});

			setSuccess(true);
			setTimeout(() => {
				window.history.pushState({}, "", "/orders");
				window.dispatchEvent(new PopStateEvent("popstate"));
			}, 2000);
		} catch (err) {
			console.error("Error creating custom order:", err);
			setError(err.response?.data?.error || "Failed to create order");
		} finally {
			setCreating(false);
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Create Custom Order
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
						Custom Order Created!
					</h2>
					<p className="text-gray-600">
						Your custom order has been created successfully. Redirecting to orders...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Create Custom Order</h2>
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

			<div className="grid grid-cols-2 gap-6">
				{/* Left Side - Ingredient Selection */}
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
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
										onAdd={addIngredientToOrder}
										isAdded={selectedItems.some(
											(item) => item.ingredient_id === ingredient.id
										)}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Right Side - Order Builder */}
				<div>
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						Order Items ({selectedItems.length})
					</h3>

					{selectedItems.length === 0 ? (
						<div className="border border-gray-300 rounded-lg p-8 text-center text-gray-500">
							<div className="text-4xl mb-2">🛒</div>
							<p>No items added yet</p>
							<p className="text-sm">Select ingredients from the left to add them</p>
						</div>
					) : (
						<div className="space-y-4">
							<div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
								<div className="divide-y divide-gray-200">
									{selectedItems.map((item) => (
										<OrderItem
											key={item.ingredient_id}
											item={item}
											onUpdateQuantity={updateItemQuantity}
											onUpdateCost={updateItemCost}
											onRemove={removeItem}
										/>
									))}
								</div>
							</div>

							{/* Notes */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Order Notes (Optional)
								</label>
								<textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									placeholder="Add any special instructions..."
								/>
							</div>

							{/* Order Summary */}
							<div className="bg-gray-50 rounded-lg p-4">
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
									{selectedItems.length} items
								</p>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									onClick={createCustomOrder}
									disabled={creating || selectedItems.length === 0}
									className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{creating ? "Creating Order..." : "Create Custom Order"}
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
						: "bg-blue-600 text-white hover:bg-blue-700"
				}`}
			>
				{isAdded ? "Added ✓" : "Add"}
			</button>
		</div>
	);
}

function OrderItem({ item, onUpdateQuantity, onUpdateCost, onRemove }) {
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

			<div className="grid grid-cols-2 gap-2">
				<div>
					<label className="block text-xs text-gray-600 mb-1">Quantity</label>
					<div className="flex items-center gap-1">
						<input
							type="number"
							value={item.quantity}
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
					<label className="block text-xs text-gray-600 mb-1">Cost per unit</label>
					<input
						type="number"
						value={item.cost_per_unit}
						onChange={(e) =>
							onUpdateCost(item.ingredient_id, parseFloat(e.target.value) || 0)
						}
						className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
						min="0"
						step="0.01"
						placeholder="0.00"
					/>
				</div>
			</div>

			<div className="text-right">
				<span className="text-sm font-semibold text-gray-900">
					Line Total: $
					{(item.quantity * item.cost_per_unit).toFixed(2)}
				</span>
			</div>
		</div>
	);
}