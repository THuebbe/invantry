// frontend/src/components/orders/TabbedQuickOrderExample.jsx

import TabbedOrderInterface from "./TabbedOrderInterface";
import { createOrder } from "../../services/ordersService";
import { useState } from "react";
import { Plus, RefreshCw, Calendar, User, Hash, Send } from "lucide-react";
import OrderLineItem from "./OrderLineItem";
import ItemDetailsPanel from "./ItemDetailsPanel";
import CreateItemModal from "./CreateItemModal";
import { useAuth } from "../../core/auth/useAuth";

/**
 * TabbedQuickOrderExample - Example integration of TabbedOrderInterface with order creation
 *
 * This component demonstrates how to integrate the tabbed interface with
 * the existing order creation workflow.
 */
export default function TabbedQuickOrderExample() {
	const { user } = useAuth();

	// Handle saving an order tab
	const handleSaveOrder = async (tabData) => {
		const restaurantId = user?.restaurantId || user?.businessId;
		if (!restaurantId) {
			throw new Error("No restaurant ID found");
		}

		// Validate
		const filledLines = tabData.data.items.filter((line) => line.itemName && line.qty);
		if (filledLines.length === 0) {
			throw new Error("Please add at least one item to the order");
		}

		// Prepare order data
		const orderData = {
			restaurantId,
			orderDate: tabData.data.header.orderDate || new Date().toISOString().split("T")[0],
			orderTaker: tabData.data.header.orderTaker || user?.firstName || "",
			requiredDate: tabData.data.header.requiredDate || null,
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
			notes: `Order: ${tabData.label} - Created by ${tabData.data.header.orderTaker || user?.firstName || "user"}`,
		};

		// Call API
		const result = await createOrder(orderData);
		return result;
	};

	// Render content for each tab
	const renderOrderContent = (tabData, tabActions) => {
		return (
			<OrderTabContent
				tabData={tabData}
				tabActions={tabActions}
				mode="order"
			/>
		);
	};

	return (
		<TabbedOrderInterface
			mode="order"
			onSave={handleSaveOrder}
			renderContent={renderOrderContent}
			maxTabs={10}
		/>
	);
}

/**
 * OrderTabContent - Content component for a single order tab
 */
function OrderTabContent({ tabData, tabActions, mode }) {
	const { user } = useAuth();

	// Local state for this tab
	const [selectedLineIndex, setSelectedLineIndex] = useState(null);
	const [availableItems, setAvailableItems] = useState([]);
	const [showCreateItemModal, setShowCreateItemModal] = useState(false);
	const [createItemInitialName, setCreateItemInitialName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Initialize header if empty
	if (!tabData.data.header.orderDate) {
		tabActions.updateData({
			header: {
				orderDate: new Date().toISOString().split("T")[0],
				orderTaker: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "",
				requiredDate: "",
			},
		});
	}

	// Initialize items if empty
	if (!tabData.data.items || tabData.data.items.length === 0) {
		tabActions.updateData({
			items: [createEmptyLineItem(1)],
		});
	}

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

	// Handle header field changes
	const handleHeaderChange = (field, value) => {
		tabActions.updateData({
			header: {
				...tabData.data.header,
				[field]: value,
			},
		});
	};

	// Handle line item change
	const handleLineItemChange = (index, updatedItem) => {
		const newItems = [...tabData.data.items];
		newItems[index] = { ...newItems[index], ...updatedItem };
		tabActions.updateData({ items: newItems });
	};

	// Handle line item completion
	const handleLineComplete = (index) => {
		const currentItem = tabData.data.items[index];

		if (currentItem.itemName && currentItem.qty) {
			const nextLine = tabData.data.items[index + 1];

			if (!nextLine) {
				const newLineNumber = tabData.data.items.length + 1;
				tabActions.updateData({
					items: [...tabData.data.items, createEmptyLineItem(newLineNumber)],
				});
			}

			setSelectedLineIndex(index + 1);
		}
	};

	// Add line item
	const handleAddLine = () => {
		const newLineNumber = tabData.data.items.length + 1;
		tabActions.updateData({
			items: [...tabData.data.items, createEmptyLineItem(newLineNumber)],
		});
		setSelectedLineIndex(tabData.data.items.length);
	};

	// Calculate totals
	const calculateTotals = () => {
		const filledLines = tabData.data.items.filter((line) => line.itemName && line.qty && line.cost);
		const total = filledLines.reduce((sum, line) => {
			return sum + (parseFloat(line.qty) || 0) * (parseFloat(line.cost) || 0);
		}, 0);
		return {
			lineCount: filledLines.length,
			total: total.toFixed(2),
		};
	};

	const totals = calculateTotals();

	// Get selected item
	const selectedItem = selectedLineIndex !== null ? tabData.data.items[selectedLineIndex] : null;

	// Handle updating item from details panel
	const handleUpdateFromPanel = (updatedItem) => {
		if (selectedLineIndex !== null) {
			handleLineItemChange(selectedLineIndex, updatedItem);
		}
	};

	// Handle submit
	const handleSubmit = async () => {
		try {
			setLoading(true);
			setError(null);
			await tabActions.save();
			// Show success message or navigate
			alert("Order saved successfully!");
		} catch (err) {
			console.error("Error saving order:", err);
			setError(err.message || "Failed to save order");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex gap-6 h-full p-6">
			{/* Left Side - Header + Line Items */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Order Header Card */}
				<div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
						{/* Order Number */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								<Hash size={14} className="inline mr-1" />
								Order Number
							</label>
							<input
								type="text"
								value={tabData.data.header.orderNumber || ""}
								placeholder="Auto-generated"
								disabled
								className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
							/>
						</div>

						{/* Order Date */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								<Calendar size={14} className="inline mr-1" />
								Order Date
							</label>
							<input
								type="date"
								value={tabData.data.header.orderDate || ""}
								onChange={(e) => handleHeaderChange("orderDate", e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
							/>
						</div>

						{/* Order Taker */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								<User size={14} className="inline mr-1" />
								Order Taker
							</label>
							<input
								type="text"
								value={tabData.data.header.orderTaker || ""}
								onChange={(e) => handleHeaderChange("orderTaker", e.target.value)}
								placeholder="Enter name..."
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
							/>
						</div>

						{/* Required Date */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								<Calendar size={14} className="inline mr-1" />
								Required Date
							</label>
							<input
								type="date"
								value={tabData.data.header.requiredDate || ""}
								onChange={(e) => handleHeaderChange("requiredDate", e.target.value)}
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
								onClick={handleSubmit}
								disabled={loading || totals.lineCount === 0}
								className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<Send size={16} />
								{loading ? "Saving..." : "Save Order"}
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
						{tabData.data.items.map((item, index) => (
							<OrderLineItem
								key={item.id}
								lineNumber={item.lineNumber}
								item={item}
								isSelected={selectedLineIndex === index}
								onSelect={() => setSelectedLineIndex(index)}
								onChange={(updatedItem) => handleLineItemChange(index, updatedItem)}
								onComplete={() => handleLineComplete(index)}
								onCreateNewItem={(name) => {
									setCreateItemInitialName(name);
									setShowCreateItemModal(true);
								}}
								availableItems={availableItems}
							/>
						))}
					</div>

					{/* Add Line Button */}
					<button
						onClick={handleAddLine}
						className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
					>
						<Plus size={18} />
						Add Line Item
					</button>
				</div>
			</div>

			{/* Right Side - Item Details Panel */}
			<div className="w-80 flex-shrink-0">
				<ItemDetailsPanel
					item={selectedItem}
					type="order"
					onUpdate={handleUpdateFromPanel}
				/>
			</div>

			{/* Create Item Modal */}
			<CreateItemModal
				isOpen={showCreateItemModal}
				onClose={() => setShowCreateItemModal(false)}
				onSave={(newItemData) => {
					// Handle new item creation
					setShowCreateItemModal(false);
				}}
				initialName={createItemInitialName}
			/>
		</div>
	);
}
