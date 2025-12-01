// /frontend/src/preview/OrdersPreview.jsx
// This is a standalone preview component to visualize the Orders screen design

import { useState } from "react";
import { 
	Search, Plus, RefreshCw, Calendar, User, Hash, 
	ChevronDown, Lock, Package, Truck, Edit2, X 
} from "lucide-react";

export default function OrdersPreview() {
	const [selectedLine, setSelectedLine] = useState(2); // Pre-select line 3
	const [lineItems, setLineItems] = useState([
		{
			id: 1,
			itemName: "Chicken Breast",
			qty: 2,
			uom: "Case",
			cost: 23.99,
			extCost: 47.98,
			category: "Meat",
			vendor: "Gordon Food Service",
			pkgQty: 1,
			pkgUom: "Case",
			itemsPerPkg: 2,
			itemQty: 5,
			itemUom: "lbs",
			itemNumber: "332845",
			purchaseOrderNumber: "PO-2025-0042",
			isLibraryItem: true,
		},
		{
			id: 2,
			itemName: "Spaghetti Sauce",
			qty: 1,
			uom: "Case",
			cost: 23.99,
			extCost: 23.99,
			category: "Canned Goods",
			vendor: "Sysco",
			isLibraryItem: true,
		},
		{
			id: 3,
			itemName: "Dish Soap",
			qty: 1,
			uom: "Box",
			cost: 23.99,
			extCost: 23.99,
			category: "Cleaning Supplies",
			vendor: "Sysco",
			isLibraryItem: true,
		},
		{
			id: 4,
			itemName: "Tomatoes",
			qty: 2,
			uom: "Box",
			cost: 23.99,
			extCost: 47.98,
			category: "Produce",
			vendor: "Local Farm Co",
			isLibraryItem: true,
		},
		{
			id: 5,
			itemName: "Onion Yellow Super Coloss",
			qty: 1,
			uom: "Case",
			cost: 26.31,
			extCost: 26.31,
			category: "Produce",
			vendor: "Gordon Food Service",
			pkgQty: 1,
			pkgUom: "Case",
			itemsPerPkg: 1,
			itemQty: 50,
			itemUom: "lbs",
			itemNumber: "998877",
			upc: "601089456999",
			isLibraryItem: true,
		},
		{
			id: 6,
			itemName: "",
			qty: "",
			uom: "",
			cost: "",
			extCost: 0,
			isLibraryItem: false,
		},
	]);

	const selectedItem = lineItems[selectedLine];

	return (
		<div className="min-h-screen bg-gray-100 p-6">
			{/* Header Area - Simulated */}
			<div className="bg-gray-300 h-12 rounded mb-4 flex items-center justify-center text-gray-600 text-sm font-medium">
				HEADER
			</div>

			<div className="flex gap-6">
				{/* Sidebar - Simulated */}
				<div className="w-48 bg-gray-200 rounded p-4 text-gray-600 text-sm font-medium">
					Sidebar
				</div>

				{/* Main Content Area */}
				<div className="flex-1 flex flex-col gap-4">
					{/* Metric Cards - Placeholder */}
					<div className="bg-gray-200 h-24 rounded flex items-center justify-center text-gray-600 font-medium">
						Metric Cards
					</div>

					{/* Orders Content */}
					<div className="flex gap-6">
						{/* Left Side - Header + Line Items */}
						<div className="flex-1 flex flex-col gap-4">
							{/* Order Header */}
							<div className="bg-white border border-gray-200 rounded-lg p-5">
								<div className="grid grid-cols-4 gap-4">
									<div>
										<label className="block text-xs font-medium text-gray-600 mb-1">
											Order Number:
										</label>
										<input
											type="text"
											placeholder="Auto-generated"
											disabled
											className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-400 text-sm"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-600 mb-1">
											Order Date:
										</label>
										<input
											type="text"
											defaultValue="11/25/2025"
											className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-600 mb-1">
											Order Taker:
										</label>
										<input
											type="text"
											placeholder="Enter name..."
											className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-600 mb-1">
											Required Date:
										</label>
										<input
											type="text"
											placeholder="Select date..."
											className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
										/>
									</div>
								</div>
								
								<div className="mt-4 flex justify-end">
									<button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
										<RefreshCw size={16} />
										POPULATE LINES
									</button>
								</div>
							</div>

							{/* Line Items */}
							<div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
								<div className="space-y-3">
									{lineItems.map((item, index) => (
										<LineItem
											key={item.id}
											lineNumber={index + 1}
											item={item}
											isSelected={selectedLine === index}
											onClick={() => setSelectedLine(index)}
										/>
									))}
								</div>
							</div>
						</div>

						{/* Right Side - Item Details */}
						<div className="w-72">
							<div className="bg-white border border-gray-200 rounded-lg p-5 h-full">
								<h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
									Item Details
								</h3>
								{selectedItem?.itemName ? (
									<>
										<h2 className="text-lg font-bold text-gray-900 mb-6">
											{selectedItem.itemName}
										</h2>
										
										<div className="space-y-3 text-sm">
											<DetailRow label="Category" value={selectedItem.category || "—"} />
											
											<div className="pt-3 border-t border-gray-100">
												<DetailRow label="Pkg Qty" value={selectedItem.pkgQty || "1"} />
												<DetailRow label="Pkg UOM" value={selectedItem.pkgUom || selectedItem.uom} />
												<DetailRow label="Items Per Pkg" value={selectedItem.itemsPerPkg || "—"} />
												<DetailRow label="Item Qty" value={selectedItem.itemQty || "—"} />
												<DetailRow label="Item UOM" value={selectedItem.itemUom || "—"} />
											</div>
											
											<div className="pt-3 border-t border-gray-100">
												<DetailRow label="Vendor" value={selectedItem.vendor || "—"} />
												{selectedItem.purchaseOrderNumber && (
													<div className="mt-2">
														<span className="text-xs text-gray-500">Purchase Order:</span>
														<div className="mt-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm font-medium inline-block">
															{selectedItem.purchaseOrderNumber}
														</div>
													</div>
												)}
												<DetailRow label="Cost" value={`$${selectedItem.cost?.toFixed(2) || "0.00"}`} />
											</div>
											
											{(selectedItem.upc || selectedItem.itemNumber) && (
												<div className="pt-3 border-t border-gray-100">
													{selectedItem.upc && <DetailRow label="UPC" value={selectedItem.upc} />}
													{selectedItem.itemNumber && <DetailRow label="Item Number" value={selectedItem.itemNumber} />}
												</div>
											)}
											
											<div className="pt-3 border-t border-gray-100">
												<label className="block text-xs text-gray-500 mb-2">Notes:</label>
												<div className="px-3 py-2 border border-gray-200 rounded bg-gray-50 min-h-[60px]">
													<span className="text-gray-400 text-sm italic">No notes</span>
												</div>
											</div>
										</div>
									</>
								) : (
									<div className="flex flex-col items-center justify-center h-64 text-gray-400">
										<Package size={40} className="mb-3 opacity-50" />
										<p className="text-sm">Select a line item to view details</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function LineItem({ lineNumber, item, isSelected, onClick }) {
	const isEmpty = !item.itemName;
	
	return (
		<div
			onClick={onClick}
			className={`
				border rounded-lg p-4 cursor-pointer transition-all
				${isSelected 
					? "border-green-500 bg-green-50 shadow-md" 
					: "border-gray-200 bg-white hover:border-gray-300"
				}
			`}
		>
			<div className="flex items-start gap-3">
				{/* Line Number */}
				<div className="flex items-center gap-2 pt-5">
					{isSelected && <span className="text-green-600">◆</span>}
					<span className="text-sm font-medium text-gray-400 w-4 text-right">
						{lineNumber}
					</span>
				</div>

				{/* Fields */}
				<div className="flex-1 grid grid-cols-12 gap-3">
					{/* Item Name */}
					<div className="col-span-5">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
							Item Name
						</label>
						<div className="relative">
							<input
								type="text"
								value={item.itemName}
								placeholder="Search or enter item..."
								readOnly
								className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
							/>
							<Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
						</div>
					</div>

					{/* Qty */}
					<div className="col-span-2">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
							Qty
						</label>
						<input
							type="text"
							value={item.qty}
							placeholder="0"
							readOnly
							className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center"
						/>
					</div>

					{/* UOM */}
					<div className="col-span-2">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
							UOM
						</label>
						{item.isLibraryItem ? (
							<div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded bg-gray-50 text-sm text-gray-600">
								<span>{item.uom || "—"}</span>
								<Lock size={12} className="text-gray-400" />
							</div>
						) : (
							<div className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded text-sm">
								<span className="text-gray-400">{item.uom || "Select"}</span>
								<ChevronDown size={14} className="text-gray-400" />
							</div>
						)}
					</div>

					{/* Cost */}
					<div className="col-span-2">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
							Cost
						</label>
						<input
							type="text"
							value={item.cost ? `$${item.cost.toFixed(2)}` : ""}
							placeholder="$0.00"
							readOnly
							className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-right"
						/>
					</div>

					{/* Ext Cost */}
					<div className="col-span-1">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
							Ext Cost
						</label>
						<div className="px-2 py-2 border border-gray-100 rounded bg-gray-50 text-sm text-right font-medium text-gray-700">
							${item.extCost?.toFixed(2) || "0.00"}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function DetailRow({ label, value }) {
	return (
		<div className="flex items-center justify-between py-0.5">
			<span className="text-gray-500">{label}:</span>
			<span className="font-medium text-gray-900">{value}</span>
		</div>
	);
}
