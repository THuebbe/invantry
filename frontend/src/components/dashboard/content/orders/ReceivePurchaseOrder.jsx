// frontend/src/components/dashboard/content/orders/ReceivePurchaseOrder.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../../../core/auth/useAuth";
import { Calendar, Package, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { receivePO, getPOReceivingStatus } from "../../../../services/ordersService";

/**
 * ReceivePurchaseOrder - Split-view interface for receiving PO items
 *
 * Features:
 * - Left panel: List of PO items with ordered/received quantities
 * - Right panel: Summary and receiving form
 * - Support for partial receiving
 * - Real-time total calculations
 * - Expiration date and batch number tracking
 */
export default function ReceivePurchaseOrder({ poId }) {
	// eslint-disable-next-line no-unused-vars
	const { user } = useAuth();

	// PO data state
	const [poData, setPoData] = useState(null);
	const [receivingItems, setReceivingItems] = useState([]);
	const [selectedItemIndex, setSelectedItemIndex] = useState(null);

	// Loading & error states
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	// Fetch PO data on mount
	useEffect(() => {
		loadPOData();
	}, [poId]);

	const loadPOData = async () => {
		try {
			setLoading(true);
			setError(null);

			// Get PO details with receiving status
			const data = await getPOReceivingStatus(poId);
			setPoData(data);

			// Initialize receiving items array
			const items = (data.items || []).map((item) => ({
				po_item_id: item.po_item_id || item.id,
				ingredient_id: item.ingredient_id,
				ingredient_name: item.ingredient_name,
				quantity_ordered: parseFloat(item.quantity_ordered || item.quantity),
				quantity_received: parseFloat(item.quantity_received || 0),
				quantity_to_receive: 0, // User input
				unit: item.unit,
				unit_price: parseFloat(item.unit_price || 0),
				expiration_date: "",
				batch_number: "",
				notes: "",
			}));

			setReceivingItems(items);

			// Auto-select first item
			if (items.length > 0) {
				setSelectedItemIndex(0);
			}
		} catch (err) {
			console.error("Error loading PO data:", err);
			setError(err.response?.data?.error || err.message || "Failed to load purchase order");
		} finally {
			setLoading(false);
		}
	};

	// Update receiving item field
	const updateReceivingItem = (index, field, value) => {
		setReceivingItems((prev) => {
			const newItems = [...prev];
			newItems[index] = {
				...newItems[index],
				[field]: value,
			};
			return newItems;
		});
	};

	// Calculate totals
	const calculateTotals = () => {
		const totalOrdered = receivingItems.reduce(
			(sum, item) => sum + item.quantity_ordered,
			0
		);
		const totalReceived = receivingItems.reduce(
			(sum, item) => sum + item.quantity_received + (parseFloat(item.quantity_to_receive) || 0),
			0
		);
		const totalToReceive = receivingItems.reduce(
			(sum, item) => sum + (parseFloat(item.quantity_to_receive) || 0),
			0
		);
		const totalValue = receivingItems.reduce(
			(sum, item) =>
				sum + (parseFloat(item.quantity_to_receive) || 0) * item.unit_price,
			0
		);

		return {
			totalOrdered,
			totalReceived,
			totalToReceive,
			totalValue,
		};
	};

	const totals = calculateTotals();

	// Validate and submit receiving
	const handleSubmitReceiving = async () => {
		try {
			setSubmitting(true);
			setError(null);

			// Filter items with quantity to receive > 0
			const itemsToReceive = receivingItems.filter(
				(item) => parseFloat(item.quantity_to_receive) > 0
			);

			if (itemsToReceive.length === 0) {
				setError("Please enter quantities to receive for at least one item");
				return;
			}

			// Validate quantities
			for (const item of itemsToReceive) {
				const remaining = item.quantity_ordered - item.quantity_received;
				if (item.quantity_to_receive > remaining) {
					setError(
						`Quantity to receive for ${item.ingredient_name} exceeds remaining quantity (${remaining} ${item.unit})`
					);
					return;
				}
			}

			// Prepare receiving data
			const receivingData = itemsToReceive.map((item) => ({
				po_item_id: item.po_item_id,
				ingredient_id: item.ingredient_id,
				quantity_received: parseFloat(item.quantity_to_receive),
				unit: item.unit,
				unit_price: item.unit_price,
				expiration_date: item.expiration_date || null,
				batch_number: item.batch_number || null,
				notes: item.notes || null,
			}));

			// Submit receiving
			await receivePO(poId, receivingData);

			setSuccess(true);
			setTimeout(() => {
				// Navigate back to PO list
				window.history.pushState({}, "", "/dashboard/orders/purchase-orders");
				window.dispatchEvent(new PopStateEvent("popstate"));
			}, 2000);
		} catch (err) {
			console.error("Error receiving PO:", err);
			setError(err.response?.data?.error || err.message || "Failed to receive purchase order");
		} finally {
			setSubmitting(false);
		}
	};

	// Handle back navigation
	const handleGoBack = () => {
		window.history.pushState({}, "", "/dashboard/orders/purchase-orders");
		window.dispatchEvent(new PopStateEvent("popstate"));
	};

	// Loading state
	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Receive Purchase Order</h2>
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
						Items Received Successfully!
					</h2>
					<p className="text-gray-600">
						Inventory has been updated. Redirecting to purchase orders...
					</p>
				</div>
			</div>
		);
	}

	const selectedItem = selectedItemIndex !== null ? receivingItems[selectedItemIndex] : null;

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<button
							onClick={handleGoBack}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
							title="Back to Purchase Orders"
						>
							<ArrowLeft size={20} className="text-gray-600" />
						</button>
						<div>
							<h2 className="text-2xl font-bold text-gray-900">
								Receive Purchase Order
							</h2>
							<p className="text-sm text-gray-600 mt-1">
								PO: {poData?.po_number || poData?.order_number || "N/A"} •{" "}
								Vendor: {poData?.vendor_name || poData?.supplier_name || "N/A"}
							</p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-sm text-gray-600">Order Date</p>
						<p className="text-sm font-medium text-gray-900">
							{poData?.order_date
								? new Date(poData.order_date).toLocaleDateString()
								: "N/A"}
						</p>
					</div>
				</div>

				{/* Action Bar */}
				<div className="flex items-center justify-between pt-4 border-t border-gray-100">
					<div className="text-sm text-gray-600">
						{totals.totalToReceive} items to receive • Est. Value: $
						{totals.totalValue.toFixed(2)}
					</div>
					<button
						onClick={handleSubmitReceiving}
						disabled={submitting || totals.totalToReceive === 0}
						className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<CheckCircle size={18} />
						{submitting ? "Receiving..." : "Complete Receiving"}
					</button>
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
					<AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
					<p className="text-red-700 text-sm">{error}</p>
				</div>
			)}

			{/* Split View */}
			<div className="flex gap-6 flex-1 overflow-hidden">
				{/* Left Side - Items List */}
				<div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
					<div className="p-4 border-b border-gray-200 bg-gray-50">
						<h3 className="font-semibold text-gray-900">PO Items</h3>
						<p className="text-sm text-gray-600 mt-1">
							{receivingItems.length} items in this purchase order
						</p>
					</div>
					<div className="flex-1 overflow-y-auto">
						<div className="divide-y divide-gray-200">
							{receivingItems.map((item, index) => (
								<ReceivingItemRow
									key={item.po_item_id}
									item={item}
									isSelected={selectedItemIndex === index}
									onSelect={() => setSelectedItemIndex(index)}
									onUpdateQuantity={(qty) =>
										updateReceivingItem(index, "quantity_to_receive", qty)
									}
								/>
							))}
						</div>
					</div>
				</div>

				{/* Right Side - Details Panel */}
				<div className="w-96 flex-shrink-0">
					{selectedItem ? (
						<ReceivingDetailsPanel
							item={selectedItem}
							itemIndex={selectedItemIndex}
							onUpdate={(field, value) =>
								updateReceivingItem(selectedItemIndex, field, value)
							}
						/>
					) : (
						<div className="bg-white border border-gray-200 rounded-lg p-6">
							<div className="text-center py-8 text-gray-500">
								<Package size={48} className="mx-auto mb-3 text-gray-300" />
								<p>Select an item to view details</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * ReceivingItemRow - Individual item in the receiving list
 */
function ReceivingItemRow({ item, isSelected, onSelect, onUpdateQuantity }) {
	const remaining = item.quantity_ordered - item.quantity_received;
	const isFullyReceived = remaining <= 0;
	const progressPercent = (item.quantity_received / item.quantity_ordered) * 100;

	return (
		<div
			onClick={onSelect}
			className={`
				p-4 cursor-pointer transition-colors
				${isSelected ? "bg-purple-50 border-l-4 border-purple-500" : "hover:bg-gray-50"}
				${isFullyReceived ? "opacity-60" : ""}
			`}
		>
			<div className="flex items-start justify-between mb-2">
				<div className="flex-1">
					<h4 className="font-medium text-gray-900">{item.ingredient_name}</h4>
					<div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
						<span>Ordered: {item.quantity_ordered} {item.unit}</span>
						<span>•</span>
						<span>Received: {item.quantity_received} {item.unit}</span>
						<span>•</span>
						<span className={remaining > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
							Remaining: {remaining} {item.unit}
						</span>
					</div>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
				<div
					className={`h-1.5 rounded-full transition-all ${
						isFullyReceived ? "bg-green-500" : "bg-purple-500"
					}`}
					style={{ width: `${Math.min(progressPercent, 100)}%` }}
				></div>
			</div>

			{/* Receiving Input */}
			{!isFullyReceived && (
				<div className="flex items-center gap-2">
					<label className="text-sm text-gray-700 font-medium">Receive:</label>
					<input
						type="number"
						value={item.quantity_to_receive || ""}
						onChange={(e) => onUpdateQuantity(parseFloat(e.target.value) || 0)}
						onClick={(e) => e.stopPropagation()}
						min="0"
						max={remaining}
						step="0.01"
						placeholder="0"
						className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
					/>
					<span className="text-sm text-gray-600">{item.unit}</span>
					{item.quantity_to_receive > 0 && (
						<span className="ml-auto text-sm font-medium text-purple-600">
							${(item.quantity_to_receive * item.unit_price).toFixed(2)}
						</span>
					)}
				</div>
			)}

			{isFullyReceived && (
				<div className="flex items-center gap-2 text-sm text-green-600">
					<CheckCircle size={16} />
					<span className="font-medium">Fully Received</span>
				</div>
			)}
		</div>
	);
}

/**
 * ReceivingDetailsPanel - Details and additional fields for selected item
 */
function ReceivingDetailsPanel({ item, itemIndex, onUpdate }) {
	const remaining = item.quantity_ordered - item.quantity_received;

	return (
		<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
			{/* Header */}
			<div className="bg-purple-50 border-b border-purple-100 p-4">
				<h3 className="font-semibold text-gray-900 mb-1">Receiving Details</h3>
				<p className="text-sm text-gray-600">Item #{itemIndex + 1}</p>
			</div>

			{/* Content */}
			<div className="p-4 space-y-4">
				{/* Item Info */}
				<div>
					<h4 className="font-medium text-gray-900 mb-2">{item.ingredient_name}</h4>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span className="text-gray-600">Unit Price:</span>
							<span className="font-medium">${item.unit_price.toFixed(2)} / {item.unit}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">Ordered:</span>
							<span className="font-medium">{item.quantity_ordered} {item.unit}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">Already Received:</span>
							<span className="font-medium">{item.quantity_received} {item.unit}</span>
						</div>
						<div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
							<span className="text-gray-600">Remaining:</span>
							<span className="font-semibold text-purple-600">
								{remaining} {item.unit}
							</span>
						</div>
					</div>
				</div>

				{/* Receiving Quantity */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Quantity to Receive <span className="text-red-500">*</span>
					</label>
					<div className="flex items-center gap-2">
						<input
							type="number"
							value={item.quantity_to_receive || ""}
							onChange={(e) =>
								onUpdate("quantity_to_receive", parseFloat(e.target.value) || 0)
							}
							min="0"
							max={remaining}
							step="0.01"
							placeholder="0.00"
							className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						/>
						<span className="text-sm text-gray-600 min-w-[60px]">{item.unit}</span>
					</div>
					{item.quantity_to_receive > 0 && (
						<p className="text-sm text-gray-600 mt-1">
							Line Total: ${(item.quantity_to_receive * item.unit_price).toFixed(2)}
						</p>
					)}
				</div>

				{/* Expiration Date */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						<Calendar size={14} className="inline mr-1" />
						Expiration Date
					</label>
					<input
						type="date"
						value={item.expiration_date}
						onChange={(e) => onUpdate("expiration_date", e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					/>
				</div>

				{/* Batch Number */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						<Package size={14} className="inline mr-1" />
						Batch / Lot Number
					</label>
					<input
						type="text"
						value={item.batch_number}
						onChange={(e) => onUpdate("batch_number", e.target.value)}
						placeholder="Enter batch number..."
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					/>
				</div>

				{/* Notes */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Notes
					</label>
					<textarea
						value={item.notes}
						onChange={(e) => onUpdate("notes", e.target.value)}
						placeholder="Any notes about this item..."
						rows={3}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					/>
				</div>

				{/* Quick Actions */}
				<div className="pt-4 border-t border-gray-200">
					<button
						onClick={() => onUpdate("quantity_to_receive", remaining)}
						disabled={remaining <= 0}
						className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
					>
						Receive All Remaining ({remaining} {item.unit})
					</button>
				</div>
			</div>
		</div>
	);
}
