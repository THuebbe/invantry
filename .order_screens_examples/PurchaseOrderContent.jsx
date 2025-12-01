// /frontend/src/components/dashboard/content/PurchaseOrderContent.jsx

import { useState } from "react";
import { 
	Plus, 
	RefreshCw, 
	Calendar, 
	Hash, 
	Truck, 
	MapPin,
	FileText,
	Save,
	Send
} from "lucide-react";
import OrderLineItem from "../../orders/OrderLineItem";
import ItemDetailsPanel from "../../orders/ItemDetailsPanel";
import AddressInputModal, { formatAddressStreet } from "../../orders/AddressInputModal";

/**
 * PurchaseOrderContent - Main Purchase Order screen
 * 
 * Features:
 * - Header with PO info (PO Number, Vendor, Ship To, Bill To, dates)
 * - "Populate Lines" button to auto-add open order items for selected vendor
 * - Line items list showing source Order # for each item
 * - Item Details panel for selected item
 * - Address input modals for Ship To / Bill To
 */
export default function PurchaseOrderContent({ subsection }) {
	// PO header state
	const [poHeader, setPoHeader] = useState({
		poNumber: "", // Auto-generated on submit
		vendorId: "",
		shipTo: null, // Full address object
		billTo: null, // Full address object
		orderDate: new Date().toISOString().split("T")[0],
		requiredDate: "",
	});

	// Address modal state
	const [addressModal, setAddressModal] = useState({
		isOpen: false,
		type: null, // "shipTo" or "billTo"
	});

	// Line items state
	const [lineItems, setLineItems] = useState([
		createEmptyLineItem(1), // Start with one empty line
	]);

	// Selected item state
	const [selectedLineIndex, setSelectedLineIndex] = useState(null);

	// Mock available items from ingredient library
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

	// Mock open order items (items from Orders not yet on a PO)
	const openOrderItems = [
		{
			sourceOrderNumber: "ORD-2025-0015",
			ingredientId: "1",
			itemName: "Chicken Breast",
			qty: 2,
			uom: "Case",
			cost: 23.99,
			category: "Meat",
			vendor: "Gordon Food Service",
			itemNumber: "332845",
		},
		{
			sourceOrderNumber: "ORD-2025-0018",
			ingredientId: "5",
			itemName: "Onion Yellow Super Coloss",
			qty: 1,
			uom: "Case",
			cost: 26.31,
			category: "Produce",
			vendor: "Gordon Food Service",
			itemNumber: "998877",
			upc: "601089456999",
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
			sourceOrderNumber: null, // Links back to originating Order
			quoteNumber: "",
			invoiceNumber: "", // Filled at receiving
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

	// Handle line item completion
	const handleLineComplete = (index) => {
		const currentItem = lineItems[index];
		
		if (currentItem.itemName && currentItem.qty) {
			const nextLine = lineItems[index + 1];
			
			if (!nextLine) {
				const newLineNumber = lineItems.length + 1;
				setLineItems((prev) => [...prev, createEmptyLineItem(newLineNumber)]);
			}
			
			setSelectedLineIndex(index + 1);
		}
	};

	// Handle populate lines (auto-add open order items for this vendor)
	const handlePopulateLines = () => {
		const vendor = poHeader.vendorId.toLowerCase();
		
		// Filter open order items by vendor (if vendor is specified)
		const matchingItems = vendor
			? openOrderItems.filter((item) => 
					item.vendor.toLowerCase().includes(vendor)
				)
			: openOrderItems;

		if (matchingItems.length === 0) {
			alert("No open order items found for this vendor.");
			return;
		}

		const newLines = matchingItems.map((item, idx) => ({
			...createEmptyLineItem(lineItems.length + idx + 1),
			ingredientId: item.ingredientId,
			itemName: item.itemName,
			itemNumber: item.itemNumber,
			upc: item.upc,
			qty: item.qty,
			uom: item.uom,
			cost: item.cost,
			category: item.category,
			vendor: item.vendor,
			sourceOrderNumber: item.sourceOrderNumber,
		}));

		setLineItems((prev) => {
			const nonEmptyLines = prev.filter((line) => line.itemName);
			const renumbered = [...nonEmptyLines, ...newLines].map((line, idx) => ({
				...line,
				lineNumber: idx + 1,
			}));
			return [...renumbered, createEmptyLineItem(renumbered.length + 1)];
		});
	};

	// Handle creating new item from search
	const handleCreateNewItem = (searchQuery) => {
		console.log("Create new item:", searchQuery);
		alert(`Create new item: "${searchQuery}"\n\nThis would open a modal to add the new item to your ingredient library.`);
	};

	// Handle header field changes
	const handleHeaderChange = (field, value) => {
		setPoHeader((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Handle address save
	const handleAddressSave = (address) => {
		setPoHeader((prev) => ({
			...prev,
			[addressModal.type]: address,
		}));
	};

	// Open address modal
	const openAddressModal = (type) => {
		setAddressModal({ isOpen: true, type });
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
		const subtotal = filledLines.reduce((sum, line) => {
			return sum + (parseFloat(line.qty) || 0) * (parseFloat(line.cost) || 0);
		}, 0);
		const tax = subtotal * 0.09; // 9% tax
		const total = subtotal + tax;
		
		return {
			lineCount: filledLines.length,
			subtotal: subtotal.toFixed(2),
			tax: tax.toFixed(2),
			total: total.toFixed(2),
		};
	};

	const totals = calculateTotals();

	return (
		<>
			<div className="flex gap-6 h-full">
				{/* Left Side - Header + Line Items */}
				<div className="flex-1 flex flex-col min-w-0">
					{/* PO Header Card */}
					<div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
						{/* Row 1: PO Number, Vendor, Order Date, Required Date */}
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
							{/* PO Number */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									<Hash size={14} className="inline mr-1" />
									Purchase Order Number
								</label>
								<input
									type="text"
									value={poHeader.poNumber}
									placeholder="Auto-generated"
									disabled
									className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
								/>
							</div>

							{/* Vendor ID */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									<Truck size={14} className="inline mr-1" />
									Vendor ID
								</label>
								<input
									type="text"
									value={poHeader.vendorId}
									onChange={(e) => handleHeaderChange("vendorId", e.target.value)}
									placeholder="Enter vendor name..."
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
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
									value={poHeader.orderDate}
									onChange={(e) => handleHeaderChange("orderDate", e.target.value)}
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
									value={poHeader.requiredDate}
									onChange={(e) => handleHeaderChange("requiredDate", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
								/>
							</div>
						</div>

						{/* Row 2: Ship To, Bill To */}
						<div className="grid grid-cols-2 gap-4 mb-4">
							{/* Ship To */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									<MapPin size={14} className="inline mr-1" />
									Ship To
								</label>
								<button
									type="button"
									onClick={() => openAddressModal("shipTo")}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-sm hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
								>
									{poHeader.shipTo ? (
										<span className="text-gray-900">
											{formatAddressStreet(poHeader.shipTo)}
										</span>
									) : (
										<span className="text-gray-400">Click to enter address...</span>
									)}
								</button>
							</div>

							{/* Bill To */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									<FileText size={14} className="inline mr-1" />
									Bill To
								</label>
								<button
									type="button"
									onClick={() => openAddressModal("billTo")}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-sm hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
								>
									{poHeader.billTo ? (
										<span className="text-gray-900">
											{formatAddressStreet(poHeader.billTo)}
										</span>
									) : (
										<span className="text-gray-400">Click to enter address...</span>
									)}
								</button>
							</div>
						</div>

						{/* Row 3: Actions */}
						<div className="flex items-center justify-between pt-4 border-t border-gray-100">
							<div className="text-sm text-gray-500">
								{totals.lineCount} items · Subtotal: ${totals.subtotal} · Tax: ${totals.tax} · <span className="font-semibold text-gray-700">Total: ${totals.total}</span>
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={handlePopulateLines}
									className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
								>
									<RefreshCw size={16} />
									Populate Lines
								</button>
								<button
									className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
								>
									<Save size={16} />
									Save Draft
								</button>
								<button
									className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
								>
									<Send size={16} />
									Submit Order
								</button>
							</div>
						</div>
					</div>

					{/* Line Items List */}
					<div className="bg-white border border-gray-200 rounded-lg p-4 flex-1 overflow-y-auto">
						<div className="space-y-3">
							{lineItems.map((item, index) => (
								<div key={item.id}>
									<OrderLineItem
										lineNumber={item.lineNumber}
										item={item}
										isSelected={selectedLineIndex === index}
										onSelect={() => setSelectedLineIndex(index)}
										onChange={(updatedItem) => handleLineItemChange(index, updatedItem)}
										onComplete={() => handleLineComplete(index)}
										onCreateNewItem={handleCreateNewItem}
										availableItems={availableItems}
									/>
									{/* Source Order Badge */}
									{item.sourceOrderNumber && (
										<div className="ml-10 mt-1">
											<span className="inline-flex items-center px-2 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs rounded-full">
												From: {item.sourceOrderNumber}
											</span>
										</div>
									)}
								</div>
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
						type="purchaseOrder"
						onUpdate={handleUpdateFromPanel}
					/>
				</div>
			</div>

			{/* Address Input Modal */}
			<AddressInputModal
				isOpen={addressModal.isOpen}
				onClose={() => setAddressModal({ isOpen: false, type: null })}
				onSave={handleAddressSave}
				initialAddress={addressModal.type ? poHeader[addressModal.type] : {}}
				title={addressModal.type === "shipTo" ? "Ship To Address" : "Bill To Address"}
				otherAddress={addressModal.type === "billTo" ? poHeader.shipTo : poHeader.billTo}
				otherAddressLabel={addressModal.type === "billTo" ? "Ship To" : "Bill To"}
			/>
		</>
	);
}
