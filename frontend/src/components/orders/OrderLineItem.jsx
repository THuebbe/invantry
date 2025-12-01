// /frontend/src/components/orders/OrderLineItem.jsx

import { useState, useRef, useEffect } from "react";
import { Search, Plus, ChevronDown, Lock } from "lucide-react";

/**
 * OrderLineItem - A single line item row for Orders or Purchase Orders
 * 
 * Features:
 * - Smart item search (by name, item number, or UPC)
 * - Click-anywhere-to-select
 * - Always-editable inputs
 * - UOM locked for valid library items
 * - Auto-calculated extended cost
 */
export default function OrderLineItem({
	lineNumber,
	item,
	isSelected,
	onSelect,
	onChange,
	onComplete,
	onCreateNewItem,
	availableItems = [], // From ingredient library
	uomOptions = ["Case", "Box", "Each", "lbs", "oz", "gal", "dozen"],
}) {
	const [showItemSearch, setShowItemSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState(item?.itemName || "");
	const [filteredItems, setFilteredItems] = useState([]);
	const [showUomDropdown, setShowUomDropdown] = useState(false);
	
	const itemInputRef = useRef(null);
	const searchTimeoutRef = useRef(null);
	const costInputRef = useRef(null);

	// Sync searchQuery with item.itemName when item prop changes
	useEffect(() => {
		setSearchQuery(item?.itemName || "");
	}, [item?.itemName]);

	// Determine if this is a valid library item (locks UOM)
	const isLibraryItem = item?.ingredientId && item?.itemNumber;

	// Calculate extended cost
	const extCost = (parseFloat(item?.qty) || 0) * (parseFloat(item?.cost) || 0);

	// Handle item search with debounce
	useEffect(() => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		if (searchQuery.length >= 3 && showItemSearch) {
			searchTimeoutRef.current = setTimeout(() => {
				const filtered = availableItems.filter(
					(libItem) =>
						libItem.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
						libItem.itemNumber?.includes(searchQuery) ||
						libItem.upc?.includes(searchQuery)
				);
				setFilteredItems(filtered);
			}, 300);
		} else if (searchQuery.length < 3) {
			setFilteredItems([]);
		}

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, [searchQuery, showItemSearch, availableItems]);

	// Handle item selection from search results
	const handleSelectItem = (selectedItem) => {
		onChange({
			...item,
			ingredientId: selectedItem.id,
			itemName: selectedItem.name,
			itemNumber: selectedItem.itemNumber || null,
			upc: selectedItem.upc || null,
			uom: selectedItem.unit || item?.uom,
			cost: selectedItem.costPerUnit || item?.cost,
			category: selectedItem.category,
			vendor: selectedItem.preferredVendor || item?.vendor,
			pkgQty: selectedItem.pkgQty || 1,
			pkgUom: selectedItem.pkgUom || selectedItem.unit,
			itemsPerPkg: selectedItem.itemsPerPkg || 1,
			itemQty: selectedItem.itemQty,
			itemUom: selectedItem.itemUom,
		});
		setSearchQuery(selectedItem.name);
		setShowItemSearch(false);
		setFilteredItems([]);
	};

	// Handle double-click to open search modal
	const handleItemDoubleClick = () => {
		setShowItemSearch(true);
		setFilteredItems([]);
	};

	// Handle Enter key in item search
	const handleItemKeyDown = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (filteredItems.length > 0) {
				// If there are results, show them
				setShowItemSearch(true);
			} else if (searchQuery.length >= 3) {
				// Search and show results
				setShowItemSearch(true);
			}
		} else if (e.key === "Tab" && !e.shiftKey) {
			setShowItemSearch(false);
		}
	};

	// Handle field changes
	const handleFieldChange = (field, value) => {
		onChange({
			...item,
			[field]: value,
		});
	};

	// Handle Tab out of last field (cost) to complete line
	const handleCostKeyDown = (e) => {
		if (e.key === "Tab" && !e.shiftKey) {
			// User is tabbing forward out of the last field
			if (item?.itemName && item?.qty) {
				onComplete?.();
			}
		} else if (e.key === "Enter") {
			if (item?.itemName && item?.qty) {
				onComplete?.();
			}
		}
	};

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (!e.target.closest(".item-search-container")) {
				setShowItemSearch(false);
			}
			if (!e.target.closest(".uom-dropdown-container")) {
				setShowUomDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div
			onClick={onSelect}
			className={`
				border rounded-lg p-4 transition-all cursor-pointer
				${isSelected 
					? "border-green-500 bg-green-50 shadow-md" 
					: "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
				}
			`}
		>
			<div className="flex items-start gap-4">
				{/* Line Number */}
				<div className="flex items-center gap-2 pt-6">
					{isSelected && (
						<span className="text-green-600">◆</span>
					)}
					<span className="text-sm font-medium text-gray-500 w-6 text-right">
						{lineNumber}
					</span>
				</div>

				{/* Main Fields Grid */}
				<div className="flex-1 grid grid-cols-12 gap-2">
					{/* Item Name - spans more columns */}
					<div className="col-span-4 item-search-container relative">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
							Item Name
						</label>
						<div className="relative">
							<input
								ref={itemInputRef}
								type="text"
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									handleFieldChange("itemName", e.target.value);
									if (e.target.value.length >= 3) {
										setShowItemSearch(true);
									}
								}}
								onDoubleClick={handleItemDoubleClick}
								onKeyDown={handleItemKeyDown}
								onFocus={() => {
									if (searchQuery.length >= 3) {
										setShowItemSearch(true);
									}
								}}
								placeholder="Search or enter item..."
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
							/>
							<Search 
								size={16} 
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
							/>
						</div>

						{/* Search Results Dropdown */}
						{showItemSearch && (
							<div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
								{filteredItems.length > 0 ? (
									<>
										{filteredItems.map((libItem) => (
											<button
												key={libItem.id}
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleSelectItem(libItem);
												}}
												className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
											>
												<div className="font-medium text-gray-900 text-sm">
													{libItem.name}
												</div>
												<div className="text-xs text-gray-500 mt-0.5">
													{libItem.category}
													{libItem.itemNumber && ` · #${libItem.itemNumber}`}
													{libItem.preferredVendor && ` · ${libItem.preferredVendor}`}
												</div>
											</button>
										))}
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onCreateNewItem?.(searchQuery);
												setShowItemSearch(false);
											}}
											className="w-full px-4 py-3 text-left hover:bg-green-50 border-t border-gray-200 text-green-600 flex items-center gap-2"
										>
											<Plus size={16} />
											<span className="text-sm font-medium">
												Create "{searchQuery}" as new item
											</span>
										</button>
									</>
								) : searchQuery.length >= 3 ? (
									<div className="p-4">
										<p className="text-sm text-gray-500 mb-3">
											No items found matching "{searchQuery}"
										</p>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onCreateNewItem?.(searchQuery);
												setShowItemSearch(false);
											}}
											className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
										>
											<Plus size={16} />
											Create New Item
										</button>
									</div>
								) : (
									<div className="p-4 text-sm text-gray-500">
										Type at least 3 characters to search...
									</div>
								)}
							</div>
						)}
					</div>

					{/* Quantity */}
					<div className="col-span-2">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
							Qty
						</label>
						<input
							type="number"
							min="0"
							step="1"
							value={item?.qty || ""}
							onChange={(e) => handleFieldChange("qty", e.target.value)}
							placeholder="0"
							className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-center"
						/>
					</div>

					{/* UOM */}
					<div className="col-span-2 uom-dropdown-container relative">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
							UOM
						</label>
						{isLibraryItem ? (
							// Locked UOM for library items
							<div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm flex items-center justify-between text-gray-700">
								<span>{item?.uom || "—"}</span>
								<Lock size={14} className="text-gray-400" />
							</div>
						) : (
							// Editable UOM dropdown for new items
							<div className="relative">
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setShowUomDropdown(!showUomDropdown);
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
								>
									<span className={item?.uom ? "text-gray-900" : "text-gray-400"}>
										{item?.uom || "Select"}
									</span>
									<ChevronDown size={16} className="text-gray-400" />
								</button>

								{showUomDropdown && (
									<div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
										{uomOptions.map((uom) => (
											<button
												key={uom}
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleFieldChange("uom", uom);
													setShowUomDropdown(false);
												}}
												className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
													item?.uom === uom ? "bg-green-50 text-green-700" : "text-gray-700"
												}`}
											>
												{uom}
											</button>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Cost */}
					<div className="col-span-2">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
							Cost
						</label>
						<div className="relative">
							<span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
								$
							</span>
							<input
								ref={costInputRef}
								type="number"
								min="0"
								step="0.01"
								value={item?.cost || ""}
								onChange={(e) => handleFieldChange("cost", e.target.value)}
								onKeyDown={handleCostKeyDown}
								placeholder="0.00"
								className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-right"
							/>
						</div>
					</div>

					{/* Extended Cost (calculated, read-only) */}
					<div className="col-span-2">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 truncate">
							Ext Cost
						</label>
						<div className="w-full px-2 py-2 border border-gray-100 rounded-lg bg-gray-50 text-sm text-right font-medium text-gray-700 overflow-hidden">
							<span className="block truncate" title={`$${extCost.toFixed(2)}`}>
								${extCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
