// /frontend/src/components/dashboard/content/OrdersContent.jsx

import { useState, useRef, useEffect } from "react";
import { Plus, RefreshCw, Calendar, User, Hash } from "lucide-react";
import OrderLineItem from "../../orders/OrderLineItem";
import ItemDetailsPanel from "../../orders/ItemDetailsPanel";

/**
 * OrdersContent - Main Orders screen
 * 
 * Features:
 * - Header with order info (Order Number, Order Date, Order Taker, Required Date)
 * - "Populate Lines" button to auto-add low-stock items
 * - Line items list with smart search
 * - Item Details panel for selected item
 * - Click-to-select line items
 * - Auto-focus to new line when completing a line
 */
export default function OrdersContent({ subsection }) {
	// Order header state
	const [orderHeader, setOrderHeader] = useState({
		orderNumber: "", // Auto-generated on submit
		orderDate: new Date().toISOString().split("T")[0],
		orderTaker: "",
		requiredDate: "",
	});

	// Line items state
	const [lineItems, setLineItems] = useState([
		createEmptyLineItem(1), // Start with one empty line
	]);

	// Selected item state
	const [selectedLineIndex, setSelectedLineIndex] = useState(null);

	// Ref to track if we should focus new line
	const shouldFocusNewLine = useRef(false);

	// Mock available items from ingredient library
	// In production, this would come from an API/hook
	const availableItems = [
		{
			id: "1",
			name: "Chicken Breast",
			category: "Meat",
			itemNumber: "332845",
			upc: "601089456780",
			unit: "Case",
			costPerUnit: 23.99,
			preferredVendor: "Gordon Food Service",
			pkgQty: 1,
			pkgUom: "Case",
			itemsPerPkg: 2,
			itemQty: 5,
			itemUom: "lbs",
		},
		{
			id: "2",
			name: "Spaghetti Sauce",
			category: "Canned Goods",
			itemNumber: "445521",
			unit: "Case",
			costPerUnit: 23.99,
			preferredVendor: "Sysco",
			pkgQty: 1,
			pkgUom: "Case",
			itemsPerPkg: 6,
			itemQty: 32,
			itemUom: "oz",
		},
		{
			id: "3",
			name: "Dish Soap",
			category: "Cleaning Supplies",
			itemNumber: "778842",
			unit: "Box",
			costPerUnit: 23.99,
			preferredVendor: "Sysco",
		},
		{
			id: "4",
			name: "Tomatoes",
			category: "Produce",
			itemNumber: "112233",
			unit: "Box",
			costPerUnit: 23.99,
			preferredVendor: "Local Farm Co",
		},
		{
			id: "5",
			name: "Onion Yellow Super Coloss",
			category: "Produce",
			itemNumber: "998877",
			upc: "601089456999",
			unit: "Case",
			costPerUnit: 26.31,
			preferredVendor: "Gordon Food Service",
			pkgQty: 1,
			pkgUom: "Case",
			itemsPerPkg: 1,
			itemQty: 50,
			itemUom: "lbs",
		},
	];

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
			purchaseOrderNumber: null, // Will be set when assigned to PO
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
		
		// Only add new line if current line has data
		if (currentItem.itemName && currentItem.qty) {
			// Check if next line already exists and is empty
			const nextLine = lineItems[index + 1];
			
			if (!nextLine) {
				// Add new empty line
				const newLineNumber = lineItems.length + 1;
				setLineItems((prev) => [...prev, createEmptyLineItem(newLineNumber)]);
				shouldFocusNewLine.current = true;
			}
			
			// Move selection to next line
			setSelectedLineIndex(index + 1);
		}
	};

	// Handle populate lines (auto-add low-stock items)
	const handlePopulateLines = () => {
		// In production, this would fetch low-stock items from API
		// For now, simulate adding a few items
		const lowStockItems = availableItems.slice(0, 2);
		
		const newLines = lowStockItems.map((item, idx) => ({
			...createEmptyLineItem(lineItems.length + idx + 1),
			ingredientId: item.id,
			itemName: item.name,
			itemNumber: item.itemNumber,
			upc: item.upc,
			qty: 1, // Default quantity
			uom: item.unit,
			cost: item.costPerUnit,
			category: item.category,
			vendor: item.preferredVendor,
			pkgQty: item.pkgQty,
			pkgUom: item.pkgUom,
			itemsPerPkg: item.itemsPerPkg,
			itemQty: item.itemQty,
			itemUom: item.itemUom,
		}));

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
	};

	// Handle creating new item from search
	const handleCreateNewItem = (searchQuery) => {
		// In production, this would open a modal to create new ingredient
		console.log("Create new item:", searchQuery);
		alert(`Create new item: "${searchQuery}"\n\nThis would open a modal to add the new item to your ingredient library.`);
	};

	// Handle header field changes
	const handleHeaderChange = (field, value) => {
		setOrderHeader((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Get the selected item for the details panel
	const selectedItem = selectedLineIndex !== null ? lineItems[selectedLineIndex] : null;

	// Handle updating item from details panel
	const handleUpdateFromPanel = (updatedItem) => {
		if (selectedLineIndex !== null) {
			handleLineItemChange(selectedLineIndex, updatedItem);
		}
	};

	// Calculate totals
	const calculateTotals = () => {
		const filledLines = lineItems.filter((line) => line.itemName && line.qty && line.cost);
		const total = filledLines.reduce((sum, line) => {
			return sum + (parseFloat(line.qty) || 0) * (parseFloat(line.cost) || 0);
		}, 0);
		return {
			lineCount: filledLines.length,
			total: total.toFixed(2),
		};
	};

	const totals = calculateTotals();

	return (
		<div className="flex gap-6 h-full">
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
								value={orderHeader.orderNumber}
								onChange={(e) => handleHeaderChange("orderNumber", e.target.value)}
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
								value={orderHeader.orderDate}
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
								value={orderHeader.orderTaker}
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
								value={orderHeader.requiredDate}
								onChange={(e) => handleHeaderChange("requiredDate", e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
							/>
						</div>
					</div>

					{/* Populate Lines Button */}
					<div className="mt-4 flex items-center justify-between">
						<div className="text-sm text-gray-500">
							{totals.lineCount} items · Est. Total: ${totals.total}
						</div>
						<button
							onClick={handlePopulateLines}
							className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
						>
							<RefreshCw size={16} />
							Populate Lines
						</button>
					</div>
				</div>

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
								onChange={(updatedItem) => handleLineItemChange(index, updatedItem)}
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
							setLineItems((prev) => [...prev, createEmptyLineItem(newLineNumber)]);
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
			<div className="w-80 flex-shrink-0">
				<ItemDetailsPanel
					item={selectedItem}
					type="order"
					onUpdate={handleUpdateFromPanel}
				/>
			</div>
		</div>
	);
}
