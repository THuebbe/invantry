// frontend/src/components/dashboard/content/orders/CreateQuickOrder.jsx

import { useState, useRef, useEffect } from "react";
import {
	Plus,
	RefreshCw,
	Calendar,
	User,
	Hash,
	Save,
	Send,
} from "lucide-react";
import { useAuth } from "../../../../core/auth/useAuth";
import {
	populateOrderLines,
	createOrder,
	getIngredientLibrary,
} from "../../../../services/ordersService";
import OrderLineItem from "../../../orders/OrderLineItem";
import ItemDetailsPanel from "../../../orders/ItemDetailsPanel";
import CreateItemModal from "../../../orders/CreateItemModal";

/**
 * CreateQuickOrder - Enhanced order creation with split-view UI
 *
 * Features:
 * - Header with order metadata
 * - "Populate Lines" button to auto-add low-stock items
 * - Line items with smart search
 * - Item Details panel for selected item
 * - Create new items on-the-fly
 */
export default function CreateQuickOrder() {
	const { user } = useAuth();

	// Order header state
	const [orderHeader, setOrderHeader] = useState({
		orderNumber: "", // Auto-generated on submit
		orderDate: new Date().toISOString().split("T")[0],
		orderTaker: user?.firstName
			? `${user.firstName} ${user.lastName || ""}`.trim()
			: "",
		requiredDate: "",
	});

	// Line items state
	const [lineItems, setLineItems] = useState([
		createEmptyLineItem(1), // Start with one empty line
	]);

	// Selected item state
	const [selectedLineIndex, setSelectedLineIndex] = useState(null);

	// Available items from ingredient library
	const [availableItems, setAvailableItems] = useState([]);

	// Modals
	const [showCreateItemModal, setShowCreateItemModal] = useState(false);
	const [createItemInitialName, setCreateItemInitialName] = useState("");

	// Loading & error states
	const [loading, setLoading] = useState(true);
	const [populating, setPopulating] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	// Ref to track if we should focus new line
	const shouldFocusNewLine = useRef(false);

	// Fetch ingredient library on mount
	useEffect(() => {
		fetchIngredientLibrary();
	}, []);

	// Track unsaved changes
	useEffect(() => {
		const hasContent = lineItems.some(line => line.itemName || line.qty);
		setHasUnsavedChanges(hasContent && !success);
	}, [lineItems, success]);

	// Warn before navigation with unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (e) => {
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasUnsavedChanges]);

	const fetchIngredientLibrary = async () => {
		try {
			setLoading(true);
			const items = await getIngredientLibrary();

			// Transform inventory data to match OrderLineItem expected format
			const transformedItems = items.map((item) => ({
				id: item.ingredient_id,
				name: item.ingredient_name,
				category: item.category,
				itemNumber: item.ingredient?.item_number,
				upc: item.ingredient?.upc,
				unit: item.unit,
				costPerUnit: item.cost_per_unit,
				preferredVendor: item.ingredient?.preferred_vendor,
				pkgQty: item.ingredient?.pkg_qty || 1,
				pkgUom: item.ingredient?.pkg_uom || item.unit,
				itemsPerPkg: item.ingredient?.items_per_pkg || 1,
				itemQty: item.ingredient?.item_qty,
				itemUom: item.ingredient?.item_uom,
			}));

			setAvailableItems(transformedItems);
		} catch (err) {
			console.error("Error fetching ingredient library:", err);
			setError("Failed to load ingredient library");
		} finally {
			setLoading(false);
		}
	};

	// Create empty line item helper
	function createEmptyLineItem(lineNumber) {
		return {
			id: `line-${Date.now()}-${lineNumber}`,
			lineNumber,
			ingredientId: null,
			itemName: "",
			itemNumber: null,
			upc: null,
			qty: "",
			uom: "",
			cost: "",
			category: "",
			vendor: "",
			pkgQty: null,
			pkgUom: "",
			itemsPerPkg: null,
			itemQty: null,
			itemUom: "",
			notes: "",
			purchaseOrderNumber: null,
		};
	}

	// Handle line item change
	const handleLineItemChange = (index, updatedItem) => {
		setLineItems((prev) => {
			const newItems = [...prev];
			newItems[index] = { ...newItems[index], ...updatedItem };
			return newItems;
		});
	};

	// Handle line item completion (Tab/Enter out of last field)
	const handleLineComplete = (index) => {
		const currentItem = lineItems[index];

		if (currentItem.itemName && currentItem.qty) {
			const nextLine = lineItems[index + 1];

			if (!nextLine) {
				const newLineNumber = lineItems.length + 1;
				setLineItems((prev) => [...prev, createEmptyLineItem(newLineNumber)]);
				shouldFocusNewLine.current = true;
			}

			setSelectedLineIndex(index + 1);
		}
	};

	// Handle populate lines (auto-add low-stock items from API)
	const handlePopulateLines = async () => {
		try {
			setPopulating(true);
			setError(null);

			const restaurantId = user?.restaurantId || user?.businessId;
			if (!restaurantId) {
				throw new Error("No restaurant ID found");
			}

			const lowStockItems = await populateOrderLines(restaurantId);

			const newLines = lowStockItems.map((item, idx) => ({
				...createEmptyLineItem(lineItems.length + idx + 1),
				ingredientId: item.ingredient_id,
				itemName: item.ingredient_name,
				itemNumber: item.item_number,
				upc: item.upc,
				qty: item.suggested_qty || 1,
				uom: item.unit,
				cost: item.estimated_unit_cost || 0,
				category: item.category,
				vendor: item.preferred_vendor,
				pkgQty: item.pkg_qty,
				pkgUom: item.pkg_uom,
				itemsPerPkg: item.items_per_pkg,
				itemQty: item.item_qty,
				itemUom: item.item_uom,
			}));

			if (newLines.length === 0) {
				setError(
					"No low-stock items found. All inventory levels are adequate."
				);
				return;
			}

			setLineItems((prev) => {
				// Remove empty lines first
				const nonEmptyLines = prev.filter((line) => line.itemName);
				// Renumber all lines
				const renumbered = [...nonEmptyLines, ...newLines].map((line, idx) => ({
					...line,
					lineNumber: idx + 1,
				}));
				// Add empty line at end
				return [...renumbered, createEmptyLineItem(renumbered.length + 1)];
			});
		} catch (err) {
			console.error("Error populating lines:", err);
			setError(
				err.response?.data?.error || err.message || "Failed to populate lines"
			);
		} finally {
			setPopulating(false);
		}
	};

	// Handle creating new item from search
	const handleCreateNewItem = (searchQuery) => {
		setCreateItemInitialName(searchQuery);
		setShowCreateItemModal(true);
	};

	// Handle new item created
	const handleNewItemCreated = async (newItemData) => {
		// In production, this would call API to create ingredient
		// For now, just add to available items locally
		const newItem = {
			id: `temp-${Date.now()}`,
			name: newItemData.name,
			category: newItemData.category,
			itemNumber: newItemData.itemNumber,
			upc: newItemData.upc,
			unit: newItemData.unit,
			costPerUnit: parseFloat(newItemData.costPerUnit) || 0,
			preferredVendor: newItemData.preferredVendor,
			pkgQty: parseInt(newItemData.pkgQty) || 1,
			pkgUom: newItemData.pkgUom || newItemData.unit,
			itemsPerPkg: parseInt(newItemData.itemsPerPkg) || 1,
			itemQty: parseFloat(newItemData.itemQty),
			itemUom: newItemData.itemUom,
		};

		setAvailableItems((prev) => [...prev, newItem]);

		// TODO: Call API to create ingredient in library
		// const createdItem = await createIngredient(newItemData);
	};

	// Handle header field changes
	const handleHeaderChange = (field, value) => {
		setOrderHeader((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Get the selected item for the details panel
	const selectedItem =
		selectedLineIndex !== null ? lineItems[selectedLineIndex] : null;

	// Handle updating item from details panel
	const handleUpdateFromPanel = (updatedItem) => {
		if (selectedLineIndex !== null) {
			handleLineItemChange(selectedLineIndex, updatedItem);
		}
	};

	// Calculate totals
	const calculateTotals = () => {
		const filledLines = lineItems.filter(
			(line) => line.itemName && line.qty && line.cost
		);
		const total = filledLines.reduce((sum, line) => {
			return sum + (parseFloat(line.qty) || 0) * (parseFloat(line.cost) || 0);
		}, 0);
		return {
			lineCount: filledLines.length,
			total: total.toFixed(2),
		};
	};

	const totals = calculateTotals();

	// Handle submit order
	const handleSubmitOrder = async (status = 'submitted') => {
		try {
			setSubmitting(true);
			setError(null);

			// Validate
			const filledLines = lineItems.filter((line) => line.itemName && line.qty);
			if (filledLines.length === 0) {
				setError("Please add at least one item to the order");
				return;
			}

			const restaurantId = user?.restaurantId || user?.businessId;
			if (!restaurantId) {
				throw new Error("No restaurant ID found");
			}

			// Prepare order data
			const orderData = {
				restaurantId,
				status: status, // Use provided status parameter
				orderDate: orderHeader.orderDate,
				orderTaker: orderHeader.orderTaker,
				requiredDate: orderHeader.requiredDate || null,
				items: filledLines.map((line) => ({
					ingredientId: line.ingredientId,
					ingredientName: line.itemName,
					quantity: parseFloat(line.qty),
					unit: line.uom,
					estimatedUnitCost: parseFloat(line.cost) || 0,
					estimatedLineTotal: parseFloat(line.qty) * parseFloat(line.cost || 0),
					notes: line.notes || null,
					vendor: line.vendor || null,
				})),
				notes: `Quick order created by ${
					orderHeader.orderTaker || user?.firstName || "user"
				}`,
			};

			await createOrder(orderData);

			setSuccess(true);
			setTimeout(() => {
				// Navigate back to orders list
				window.history.pushState({}, "", "/orders");
				window.dispatchEvent(new PopStateEvent("popstate"));
			}, 2000);
		} catch (err) {
			console.error("Error creating order:", err);
			setError(
				err.response?.data?.error || err.message || "Failed to create order"
			);
		} finally {
			setSubmitting(false);
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Create Quick Order
				</h2>
				<div className="animate-pulse space-y-4">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-16 bg-gray-200 rounded"
						></div>
					))}
				</div>
			</div>
		);
	}

	// Success state
	if (success) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="text-center py-8">
					<div className="text-6xl mb-4">✅</div>
					<h2 className="text-2xl font-bold text-green-800 mb-2">
						Order Created!
					</h2>
					<p className="text-gray-600">
						Your quick order has been created successfully. Redirecting...
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
				{/* Left Side - Header + Line Items */}
				<div className="flex-1 flex flex-col min-w-0">
					{/* Order Header Card */}
					<div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
							{/* Order Number */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									<Hash
										size={14}
										className="inline mr-1"
									/>
									Order Number
								</label>
								<input
									type="text"
									value={orderHeader.orderNumber}
									onChange={(e) =>
										handleHeaderChange("orderNumber", e.target.value)
									}
									placeholder="Auto-generated"
									disabled
									className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
								/>
							</div>

							{/* Order Date */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									<Calendar
										size={14}
										className="inline mr-1"
									/>
									Order Date
								</label>
								<input
									type="date"
									value={orderHeader.orderDate}
									onChange={(e) =>
										handleHeaderChange("orderDate", e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
								/>
							</div>

							{/* Order Taker */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									<User
										size={14}
										className="inline mr-1"
									/>
									Order Taker
								</label>
								<input
									type="text"
									value={orderHeader.orderTaker}
									onChange={(e) =>
										handleHeaderChange("orderTaker", e.target.value)
									}
									placeholder="Enter name..."
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
								/>
							</div>

							{/* Required Date */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									<Calendar
										size={14}
										className="inline mr-1"
									/>
									Required Date
								</label>
								<input
									type="date"
									value={orderHeader.requiredDate}
									onChange={(e) =>
										handleHeaderChange("requiredDate", e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
								/>
							</div>
						</div>

						{/* Actions Row */}
						<div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-100">
							<div className="text-sm text-gray-500">
								{totals.lineCount} items · Est. Total: ${totals.total}
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={handlePopulateLines}
									disabled={populating}
									className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
								>
									<RefreshCw
										size={16}
										className={populating ? "animate-spin" : ""}
									/>
									{populating ? "Populating..." : "Populate Lines"}
								</button>
								<button
									onClick={() => handleSubmitOrder('draft')}
									disabled={submitting || totals.lineCount === 0}
									className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Save size={16} />
									{submitting ? "Saving..." : "Save as Draft"}
								</button>
								<button
									onClick={() => handleSubmitOrder('submitted')}
									disabled={submitting || totals.lineCount === 0}
									className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Send size={16} />
									{submitting ? "Submitting..." : "Submit Order"}
								</button>
							</div>
						</div>
					</div>

					{/* Error Display */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
							<p className="text-red-700 text-sm">{error}</p>
						</div>
					)}

					{/* Line Items List */}
					<div className="bg-white border border-gray-200 rounded-lg p-4 flex-1 overflow-y-auto">
						<div className="space-y-3">
							{lineItems.map((item, index) => (
								<OrderLineItem
									key={item.id}
									lineNumber={item.lineNumber}
									item={item}
									isSelected={selectedLineIndex === index}
									onSelect={() => setSelectedLineIndex(index)}
									onChange={(updatedItem) =>
										handleLineItemChange(index, updatedItem)
									}
									onComplete={() => handleLineComplete(index)}
									onCreateNewItem={handleCreateNewItem}
									availableItems={availableItems}
								/>
							))}
						</div>

						{/* Add Line Button */}
						<button
							onClick={() => {
								const newLineNumber = lineItems.length + 1;
								setLineItems((prev) => [
									...prev,
									createEmptyLineItem(newLineNumber),
								]);
								setSelectedLineIndex(lineItems.length);
							}}
							className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
						>
							<Plus size={18} />
							Add Line Item
						</button>
					</div>
				</div>

				{/* Right Side - Item Details Panel */}
				<div className="w-full lg:w-80 lg:flex-shrink-0">
					<ItemDetailsPanel
						item={selectedItem}
						type="order"
						onUpdate={handleUpdateFromPanel}
					/>
				</div>
			</div>

			{/* Create Item Modal */}
			<CreateItemModal
				isOpen={showCreateItemModal}
				onClose={() => setShowCreateItemModal(false)}
				onSave={handleNewItemCreated}
				initialName={createItemInitialName}
			/>
		</>
	);
}
