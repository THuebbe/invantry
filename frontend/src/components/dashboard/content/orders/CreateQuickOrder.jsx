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
	ChevronDown,
	ChevronUp,
	X,
	Truck,
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
import { useVendors } from "../../../../hooks/useVendors";

/**
 * CreateQuickOrder - Enhanced order creation with mobile-first UI
 *
 * Mobile Features:
 * - Collapsible header (shows order # and date by default)
 * - Clean line item cards without repeated headers
 * - Sticky action bar at bottom
 * - Item details as slide-up sheet
 */
export default function CreateQuickOrder() {
	const { user } = useAuth();

	// Fetch vendors for dropdown
	const { data: vendors = [] } = useVendors({ is_active: true });

	// Order header state
	const [orderHeader, setOrderHeader] = useState({
		orderNumber: "",
		orderDate: new Date().toISOString().split("T")[0],
		orderTaker: user?.firstName
			? `${user.firstName} ${user.lastName || ""}`.trim()
			: "",
		requiredDate: "",
	});

	// Selected vendor filter
	const [selectedVendorId, setSelectedVendorId] = useState("");

	// Mobile UI state
	const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
	const [showMobileDetails, setShowMobileDetails] = useState(false);
	const [showVendorDropdown, setShowVendorDropdown] = useState(false);

	// Line items state
	const [lineItems, setLineItems] = useState([
		createEmptyLineItem(1),
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

	// Show mobile details sheet when item is selected on mobile
	useEffect(() => {
		if (selectedLineIndex !== null && window.innerWidth < 768) {
			setShowMobileDetails(true);
		}
	}, [selectedLineIndex]);

	// Close vendor dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (showVendorDropdown && !e.target.closest('.vendor-dropdown-container')) {
				setShowVendorDropdown(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [showVendorDropdown]);

	const fetchIngredientLibrary = async () => {
		try {
			setLoading(true);
			const items = await getIngredientLibrary();

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

	// Get selected vendor name for filtering
	const selectedVendor = vendors.find(v => v.id === selectedVendorId);
	const selectedVendorName = selectedVendor?.name || selectedVendor?.vendor_name || "";

	// Filter available items by selected vendor
	const filteredAvailableItems = selectedVendorId
		? availableItems.filter(item =>
			item.preferredVendor?.toLowerCase() === selectedVendorName.toLowerCase()
		)
		: availableItems;

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

	const handleLineItemChange = (index, updatedItem) => {
		setLineItems((prev) => {
			const newItems = [...prev];
			newItems[index] = { ...newItems[index], ...updatedItem };
			return newItems;
		});
	};

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

	const handlePopulateLines = async () => {
		try {
			setPopulating(true);
			setError(null);

			const restaurantId = user?.restaurantId || user?.businessId;
			if (!restaurantId) {
				throw new Error("No restaurant ID found");
			}

			let lowStockItems = await populateOrderLines(restaurantId);

			// Filter by selected vendor if one is chosen
			if (selectedVendorId && selectedVendorName) {
				lowStockItems = lowStockItems.filter(item =>
					item.preferred_vendor?.toLowerCase() === selectedVendorName.toLowerCase()
				);
			}

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
					selectedVendorId
						? `No low-stock items found for ${selectedVendorName}. Try selecting a different vendor or "All Vendors".`
						: "No low-stock items found. All inventory levels are adequate."
				);
				return;
			}

			setLineItems((prev) => {
				const nonEmptyLines = prev.filter((line) => line.itemName);
				const renumbered = [...nonEmptyLines, ...newLines].map((line, idx) => ({
					...line,
					lineNumber: idx + 1,
				}));
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

	const handleCreateNewItem = (searchQuery) => {
		setCreateItemInitialName(searchQuery);
		setShowCreateItemModal(true);
	};

	const handleNewItemCreated = async (newItemData) => {
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
	};

	const handleHeaderChange = (field, value) => {
		setOrderHeader((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const selectedItem =
		selectedLineIndex !== null ? lineItems[selectedLineIndex] : null;

	const handleUpdateFromPanel = (updatedItem) => {
		if (selectedLineIndex !== null) {
			handleLineItemChange(selectedLineIndex, updatedItem);
		}
	};

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

	const handleSubmitOrder = async (status = 'submitted') => {
		try {
			setSubmitting(true);
			setError(null);

			const filledLines = lineItems.filter((line) => line.itemName && line.qty);
			if (filledLines.length === 0) {
				setError("Please add at least one item to the order");
				return;
			}

			const restaurantId = user?.restaurantId || user?.businessId;
			if (!restaurantId) {
				throw new Error("No restaurant ID found");
			}

			const orderData = {
				restaurantId,
				status: status,
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

	// Format date for display
	const formatDateDisplay = (dateStr) => {
		if (!dateStr) return "Today";
		const date = new Date(dateStr);
		const today = new Date();
		if (date.toDateString() === today.toDateString()) return "Today";
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	};

	// Truncate vendor name for display
	const truncateVendorName = (name, maxLength = 30) => {
		if (!name) return "";
		return name.length > maxLength ? name.substring(0, maxLength) + "..." : name;
	};

	// Loading state
	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
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
			<div className="flex flex-col h-full pb-20 md:pb-0">
				<div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
					{/* Left Side - Header + Line Items */}
					<div className="flex-1 flex flex-col min-w-0">
						{/* Order Header Card */}
						<div className="bg-white border border-gray-200 rounded-lg mb-4 flex-shrink-0">
							{/* Mobile Collapsed Header */}
							<div className="md:hidden">
								<button
									onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
									className="w-full p-4 flex items-center justify-between"
								>
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
											<Hash size={16} className="text-green-600" />
										</div>
										<div className="text-left min-w-0">
											<div className="text-sm font-medium text-gray-900 flex items-center gap-1">
												<span>{orderHeader.orderNumber || "New Order"}</span>
												{selectedVendorName && (
													<span className="text-xs font-normal text-green-600 truncate max-w-[120px]">
														({truncateVendorName(selectedVendorName, 15)})
													</span>
												)}
											</div>
											<div className="text-xs text-gray-500">
												{formatDateDisplay(orderHeader.orderDate)}
												{orderHeader.orderTaker && ` · ${orderHeader.orderTaker}`}
											</div>
										</div>
									</div>
									{isHeaderExpanded ? (
										<ChevronUp size={20} className="text-gray-400" />
									) : (
										<ChevronDown size={20} className="text-gray-400" />
									)}
								</button>

								{/* Expanded Header Fields */}
								{isHeaderExpanded && (
									<div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
										{/* Vendor Selection - Custom Dropdown for Mobile */}
										<div className="relative vendor-dropdown-container">
											<label className="block text-xs font-medium text-gray-500 mb-1">
												<Truck size={12} className="inline mr-1" />
												Vendor
											</label>
											<button
												type="button"
												onClick={() => setShowVendorDropdown(!showVendorDropdown)}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-left flex items-center justify-between"
											>
												<span className="truncate">
													{selectedVendorName ? truncateVendorName(selectedVendorName) : "All Vendors"}
												</span>
												<ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />
											</button>

											{/* Custom Dropdown */}
											{showVendorDropdown && (
												<div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
													<button
														type="button"
														onClick={() => {
															setSelectedVendorId("");
															setShowVendorDropdown(false);
														}}
														className={`w-full px-3 py-2.5 text-left text-sm truncate ${
															!selectedVendorId ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
														}`}
													>
														All Vendors
													</button>
													{vendors.map((vendor) => (
														<button
															key={vendor.id}
															type="button"
															onClick={() => {
																setSelectedVendorId(vendor.id);
																setShowVendorDropdown(false);
															}}
															className={`w-full px-3 py-2.5 text-left text-sm truncate ${
																selectedVendorId === vendor.id ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
															}`}
														>
															{truncateVendorName(vendor.name || vendor.vendor_name)}
														</button>
													))}
												</div>
											)}
										</div>
										<div className="grid grid-cols-2 gap-3">
											<div>
												<label className="block text-xs font-medium text-gray-500 mb-1">
													Order Date
												</label>
												<input
													type="date"
													value={orderHeader.orderDate}
													onChange={(e) =>
														handleHeaderChange("orderDate", e.target.value)
													}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
												/>
											</div>
											<div>
												<label className="block text-xs font-medium text-gray-500 mb-1">
													Required Date
												</label>
												<input
													type="date"
													value={orderHeader.requiredDate}
													onChange={(e) =>
														handleHeaderChange("requiredDate", e.target.value)
													}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
												/>
											</div>
										</div>
										<div>
											<label className="block text-xs font-medium text-gray-500 mb-1">
												Order Taker
											</label>
											<input
												type="text"
												value={orderHeader.orderTaker}
												onChange={(e) =>
													handleHeaderChange("orderTaker", e.target.value)
												}
												placeholder="Enter name..."
												className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
											/>
										</div>
									</div>
								)}
							</div>

							{/* Desktop Header - Always Expanded */}
							<div className="hidden md:block p-6">
								{/* Row 1: Order Details */}
								<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											<Hash size={14} className="inline mr-1" />
											Order Number
										</label>
										<input
											type="text"
											value={orderHeader.orderNumber}
											placeholder="Auto-generated"
											disabled
											className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											<Calendar size={14} className="inline mr-1" />
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
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											<User size={14} className="inline mr-1" />
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
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											<Calendar size={14} className="inline mr-1" />
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

								{/* Row 2: Vendor + Actions */}
								<div className="mt-4 flex items-end gap-4 pt-4 border-t border-gray-100">
									<div className="w-48">
										<label className="block text-sm font-medium text-gray-700 mb-1">
											<Truck size={14} className="inline mr-1" />
											Vendor
										</label>
										<select
											value={selectedVendorId}
											onChange={(e) => setSelectedVendorId(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
										>
											<option value="">All Vendors</option>
											{vendors.map((vendor) => (
												<option key={vendor.id} value={vendor.id}>
													{vendor.name || vendor.vendor_name}
												</option>
											))}
										</select>
									</div>
									<div className="flex-1" />
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
											Save as Draft
										</button>
										<button
											onClick={() => handleSubmitOrder('submitted')}
											disabled={submitting || totals.lineCount === 0}
											className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<Send size={16} />
											Submit Order
										</button>
									</div>
								</div>

								{/* Row 3: Totals */}
								<div className="mt-4 pt-4 border-t border-gray-100">
									<div className="text-sm text-gray-500">
										{totals.lineCount} items · Est. Total: ${totals.total}
									</div>
								</div>
							</div>
						</div>

						{/* Error Display */}
						{error && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-4 flex-shrink-0">
								<p className="text-red-700 text-sm">{error}</p>
							</div>
						)}

						{/* Line Items List */}
						<div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 flex-1 overflow-y-auto">
							<div className="space-y-2 md:space-y-3">
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
										availableItems={filteredAvailableItems}
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

					{/* Right Side - Item Details Panel (Desktop Only) */}
					<div className="hidden md:block w-80 flex-shrink-0">
						<ItemDetailsPanel
							item={selectedItem}
							type="order"
							onUpdate={handleUpdateFromPanel}
						/>
					</div>
				</div>
			</div>

			{/* Mobile Sticky Action Bar */}
			<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20 px-4 py-3">
				<div className="flex items-center justify-between gap-3">
					<div className="text-sm">
						<span className="font-medium text-gray-900">{totals.lineCount} items</span>
						<span className="text-gray-500"> · ${totals.total}</span>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handlePopulateLines}
							disabled={populating}
							className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
						>
							<RefreshCw size={18} className={populating ? "animate-spin" : ""} />
						</button>
						<button
							onClick={() => handleSubmitOrder('draft')}
							disabled={submitting || totals.lineCount === 0}
							className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
						>
							<Save size={18} />
						</button>
						<button
							onClick={() => handleSubmitOrder('submitted')}
							disabled={submitting || totals.lineCount === 0}
							className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
						>
							<Send size={18} />
							Submit
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Item Details Sheet */}
			{showMobileDetails && selectedItem && (
				<div className="md:hidden fixed inset-0 z-30">
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black bg-opacity-50"
						onClick={() => setShowMobileDetails(false)}
					/>
					{/* Sheet */}
					<div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
						{/* Handle */}
						<div className="flex justify-center py-2">
							<div className="w-10 h-1 bg-gray-300 rounded-full" />
						</div>
						{/* Header */}
						<div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
							<h3 className="font-semibold text-gray-900">Item Details</h3>
							<button
								onClick={() => setShowMobileDetails(false)}
								className="p-2 hover:bg-gray-100 rounded-lg"
							>
								<X size={20} className="text-gray-500" />
							</button>
						</div>
						{/* Content */}
						<div className="flex-1 overflow-y-auto p-4">
							<ItemDetailsPanel
								item={selectedItem}
								type="order"
								onUpdate={handleUpdateFromPanel}
								isSheet={true}
							/>
						</div>
						{/* Done Button */}
						<div className="p-4 border-t border-gray-100">
							<button
								onClick={() => setShowMobileDetails(false)}
								className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
							>
								Done
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Create Item Modal */}
			<CreateItemModal
				isOpen={showCreateItemModal}
				onClose={() => setShowCreateItemModal(false)}
				onSave={handleNewItemCreated}
				initialName={createItemInitialName}
			/>

			{/* CSS for slide-up animation */}
			<style>{`
				@keyframes slide-up {
					from {
						transform: translateY(100%);
					}
					to {
						transform: translateY(0);
					}
				}
				.animate-slide-up {
					animation: slide-up 0.3s ease-out;
				}
			`}</style>
		</>
	);
}
