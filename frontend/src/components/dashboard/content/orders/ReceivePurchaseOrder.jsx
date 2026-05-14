// frontend/src/components/dashboard/content/orders/ReceivePurchaseOrder.jsx

import { useState, useEffect, useRef, forwardRef } from "react";
import { useAuth } from "../../../../core/auth/useAuth";
import { Calendar, Package, CheckCircle, AlertCircle, ArrowLeft, ScanLine } from "lucide-react";
import { receivePO, getPOReceivingStatus, lookupIngredientByBarcode } from "../../../../services/ordersService";
import BarcodeScanner from "../../../receiving/BarcodeScanner";
import Toast from "../../../shared/Toast";

/**
 * ReceivePurchaseOrder - Split-view interface for receiving PO items
 *
 * Features:
 * - Left panel: List of PO items with Ordered / This Session / Open columns
 * - Right panel: Details and additional fields for selected item
 * - Barcode scan: scan a package barcode → adds 1 unit to that item's session count
 * - Support for partial receiving
 * - Real-time total calculations
 * - Expiration date and batch number tracking
 */
export default function ReceivePurchaseOrder({ poId, onBack }) {
	// eslint-disable-next-line no-unused-vars
	const { user } = useAuth();

	// PO data state
	const [poData, setPoData] = useState(null);
	const [receivingItems, setReceivingItems] = useState([]);
	const [selectedItemIndex, setSelectedItemIndex] = useState(null);

	// Scan state
	const [showItemScanner, setShowItemScanner] = useState(false);
	const [scanMessage, setScanMessage] = useState(null); // { type: 'success'|'error', text }
	const [recentlyScanndedIndex, setRecentlyScannedIndex] = useState(null);
	const itemRowRefs = useRef([]);

	// Stable refs used by the keyboard scan listener (avoids stale closure)
	const handleItemScanRef = useRef(null);
	const showItemScannerRef = useRef(false);

	// Loading & error states
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	// Fetch PO data on mount
	useEffect(() => {
		loadPOData();
	}, [poId]);

	// Clear scan flash after 2s
	useEffect(() => {
		if (recentlyScanndedIndex !== null) {
			const t = setTimeout(() => setRecentlyScannedIndex(null), 2000);
			return () => clearTimeout(t);
		}
	}, [recentlyScanndedIndex]);

	// Clear scan message after 4s
	useEffect(() => {
		if (scanMessage) {
			const t = setTimeout(() => setScanMessage(null), 4000);
			return () => clearTimeout(t);
		}
	}, [scanMessage]);

	// Keep refs current every render so the keyboard listener always calls the latest version
	useEffect(() => {
		handleItemScanRef.current = handleItemScan;
		showItemScannerRef.current = showItemScanner;
	});

	// Handheld barcode scanner support (USB/Bluetooth scanners act as keyboard emulators)
	// They fire characters very fast (<30 ms apart) then send Enter.
	// We accumulate those rapid keystrokes and treat the Enter as a completed scan.
	useEffect(() => {
		let buffer = "";
		let lastKeyTime = 0;

		const handleKeyDown = (e) => {
			// Don't intercept if the user is typing in a form field
			const tag = document.activeElement?.tagName?.toUpperCase();
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

			// Don't intercept if the camera scanner overlay is open
			if (showItemScannerRef.current) return;

			if (e.key === "Enter") {
				if (buffer.length >= 3) {
					const scanned = buffer;
					buffer = "";
					handleItemScanRef.current?.(scanned);
				} else {
					buffer = "";
				}
				return;
			}

			// Accumulate printable single characters
			if (e.key.length === 1) {
				const now = Date.now();
				// A gap > 1 s means the user pressed a stray key, not a scanner — start fresh
				if (now - lastKeyTime > 1000) buffer = "";
				buffer += e.key;
				lastKeyTime = now;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []); // runs once — reads current handlers via refs

	const loadPOData = async () => {
		try {
			setLoading(true);
			setError(null);

			const data = await getPOReceivingStatus(poId);
			setPoData(data);

			const items = (data.items || []).map((item) => ({
				po_item_id: item.po_item_id || item.id,
				ingredient_id: item.ingredient_id,
				ingredient_name: item.ingredient_name || item.item_name,
				quantity_ordered: parseFloat(item.quantity_ordered || item.quantity),
				quantity_received: parseFloat(item.quantity_received || 0),
				quantity_to_receive: 0, // accumulates this session (via scan or manual)
				unit: item.unit,
				unit_price: parseFloat(item.unit_price || 0),
				expiration_date: "",
				batch_number: "",
				notes: "",
			}));

			setReceivingItems(items);

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

	// Update a field on a specific item
	const updateReceivingItem = (index, field, value) => {
		setReceivingItems((prev) => {
			const newItems = [...prev];
			newItems[index] = { ...newItems[index], [field]: value };
			return newItems;
		});
	};

	// Handle a barcode scan from the scanner overlay
	const handleItemScan = async (scannedText) => {
		setShowItemScanner(false);

		try {
			// 1. Look up ingredient by barcode
			const ingredient = await lookupIngredientByBarcode(scannedText);

			// 2. Find it on the current PO
			const itemIndex = receivingItems.findIndex(
				(item) => item.ingredient_id === ingredient.id
			);

			if (itemIndex === -1) {
				setScanMessage({
					type: "error",
					text: `"${ingredient.name}" is not on this purchase order.`,
				});
				return;
			}

			const item = receivingItems[itemIndex];
			const open = item.quantity_ordered - item.quantity_received - item.quantity_to_receive;

			// 3. Check if already fully received
			if (open <= 0) {
				setScanMessage({
					type: "error",
					text: `${item.ingredient_name} is already fully received on this PO.`,
				});
				return;
			}

			// 4. Calculate how much one scanned package contributes in PO units
			// package_quantity = packages per scanned unit (e.g. 4 bags/box)
			// item_quantity    = PO units per package     (e.g. 5 lbs/bag)
			// → scan 1 box = 4 × 5 = 20 lbs
			const pkgQty  = parseFloat(ingredient.package_quantity) || 1;
			const itemQty = parseFloat(ingredient.item_quantity)    || 1;
			const scanQty = pkgQty * itemQty;

			// Clamp to whatever is still open (partial package is valid)
			const remaining = item.quantity_ordered - item.quantity_received - item.quantity_to_receive;
			const addQty = Math.min(scanQty, remaining);
			const clamped = addQty < scanQty;

			// 5. Apply and update UI
			updateReceivingItem(itemIndex, "quantity_to_receive", item.quantity_to_receive + addQty);
			setSelectedItemIndex(itemIndex);
			setRecentlyScannedIndex(itemIndex);

			// Scroll item into view
			itemRowRefs.current[itemIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });

			const newOpen = remaining - addQty;
			const pkgLabel = ingredient.package_uom
				? `${pkgQty} × ${itemQty} ${ingredient.item_uom} ${ingredient.package_uom}`
				: null;

			setScanMessage({
				type: clamped ? "warning" : "success",
				text: clamped
					? `+${addQty} ${item.unit} of ${item.ingredient_name} (partial — only ${remaining} ${item.unit} remaining).`
					: `+${addQty} ${item.unit} of ${item.ingredient_name}${pkgLabel ? ` (${pkgLabel})` : ""} — ${newOpen} ${item.unit} open.`,
			});
		} catch (err) {
			if (err.response?.status === 404) {
				setScanMessage({
					type: "error",
					text: `Barcode not found in ingredient library. Add it to the library first.`,
				});
			} else {
				setScanMessage({
					type: "error",
					text: err.response?.data?.error || err.message || "Scan failed.",
				});
			}
		}
	};

	// Calculate session-level totals
	const calculateTotals = () => {
		const totalOrdered = receivingItems.reduce((sum, item) => sum + item.quantity_ordered, 0);
		const totalSessionQty = receivingItems.reduce(
			(sum, item) => sum + (parseFloat(item.quantity_to_receive) || 0),
			0
		);
		const totalValue = receivingItems.reduce(
			(sum, item) => sum + (parseFloat(item.quantity_to_receive) || 0) * item.unit_price,
			0
		);
		return { totalOrdered, totalSessionQty, totalValue };
	};

	const totals = calculateTotals();

	// Validate and submit receiving
	const handleSubmitReceiving = async () => {
		try {
			setSubmitting(true);
			setError(null);

			const itemsToReceive = receivingItems.filter(
				(item) => parseFloat(item.quantity_to_receive) > 0
			);

			if (itemsToReceive.length === 0) {
				setError("Please scan or enter quantities to receive for at least one item");
				return;
			}

			// Validate none exceed remaining
			for (const item of itemsToReceive) {
				const remaining = item.quantity_ordered - item.quantity_received;
				if (item.quantity_to_receive > remaining) {
					setError(
						`Quantity for ${item.ingredient_name} exceeds remaining (${remaining} ${item.unit})`
					);
					return;
				}
			}

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

			await receivePO(poId, receivingData);

			setSuccess(true);
			setTimeout(() => {
				if (onBack) {
					onBack();
				} else {
					window.history.pushState({}, "", "/receiving");
					window.dispatchEvent(new PopStateEvent("popstate"));
				}
			}, 2000);
		} catch (err) {
			console.error("Error receiving PO:", err);
			setError(err.response?.data?.error || err.message || "Failed to receive purchase order");
		} finally {
			setSubmitting(false);
		}
	};

	const handleGoBack = () => {
		if (onBack) {
			onBack();
		} else {
			window.history.pushState({}, "", "/receiving");
			window.dispatchEvent(new PopStateEvent("popstate"));
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Receive Purchase Order</h2>
				<div className="animate-pulse space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-16 bg-gray-200 rounded" />
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
						Inventory has been updated. Redirecting...
					</p>
				</div>
			</div>
		);
	}

	const selectedItem = selectedItemIndex !== null ? receivingItems[selectedItemIndex] : null;

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-4 flex-shrink-0">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<button
							onClick={handleGoBack}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
							title="Back"
						>
							<ArrowLeft size={20} className="text-gray-600" />
						</button>
						<div>
							<h2 className="text-xl md:text-2xl font-bold text-gray-900">
								Receive Purchase Order
							</h2>
							<p className="text-sm text-gray-600 mt-1">
								PO: {poData?.po_number || poData?.order_number || "N/A"} •{" "}
								Vendor: {poData?.vendor_name || poData?.supplier_name || "N/A"}
							</p>
						</div>
					</div>
					<div className="text-right hidden sm:block">
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
						{totals.totalSessionQty} units this session • Est. Value: $
						{totals.totalValue.toFixed(2)}
					</div>
					<button
						onClick={handleSubmitReceiving}
						disabled={submitting || totals.totalSessionQty === 0}
						className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
					>
						<CheckCircle size={18} />
						{submitting ? "Receiving..." : "Complete Receiving"}
					</button>
				</div>
			</div>

			{/* Error */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3 flex-shrink-0">
					<AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
					<p className="text-red-700 text-sm">{error}</p>
				</div>
			)}

			{/* Scan Message (success or error from item scan) */}
			{scanMessage && (
				<Toast
					type={scanMessage.type}
					message={scanMessage.text}
					onClose={() => setScanMessage(null)}
					className="mb-4 flex-shrink-0"
				/>
			)}

			{/* Split View */}
			<div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 overflow-hidden">
				{/* Left Side - Items List */}
				<div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col min-h-[300px]">
					{/* Left Header with Scan Button */}
					<div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
						<div>
							<h3 className="font-semibold text-gray-900">PO Items</h3>
							<p className="text-xs text-gray-500 mt-0.5">
								{receivingItems.length} items
							</p>
						</div>
						<button
							onClick={() => setShowItemScanner(true)}
							className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
						>
							<ScanLine size={16} />
							Scan Item
						</button>
					</div>

					{/* Column Headers */}
					<div className="grid grid-cols-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
						<div className="col-span-1">Item</div>
						<div className="text-center">Ordered</div>
						<div className="text-center">Session</div>
						<div className="text-center">Open</div>
					</div>

					<div className="flex-1 overflow-y-auto">
						<div className="divide-y divide-gray-200">
							{receivingItems.map((item, index) => (
								<ReceivingItemRow
									key={item.po_item_id}
									ref={(el) => (itemRowRefs.current[index] = el)}
									item={item}
									isSelected={selectedItemIndex === index}
									isFlashing={recentlyScanndedIndex === index}
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
				<div className="w-full lg:w-96 lg:flex-shrink-0 flex flex-col">
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

			{/* Item Barcode Scanner */}
			{showItemScanner && (
				<BarcodeScanner
					onScan={handleItemScan}
					onClose={() => setShowItemScanner(false)}
					title="Scan Item Barcode"
					hint="Point camera at the barcode on the package"
				/>
			)}
		</div>
	);
}

/**
 * ReceivingItemRow - One row in the item list with Ordered / Session / Open columns
 */
const ReceivingItemRow = forwardRef(function ReceivingItemRow({ item, isSelected, isFlashing, onSelect, onUpdateQuantity }, ref) {
	const alreadyReceived = item.quantity_received;
	const sessionQty = parseFloat(item.quantity_to_receive) || 0;
	const open = item.quantity_ordered - alreadyReceived - sessionQty;
	const isFullyReceived = open <= 0 && item.quantity_ordered > 0;

	return (
		<div
			ref={ref}
			onClick={onSelect}
			className={`
				cursor-pointer transition-colors duration-200
				${isSelected ? "bg-purple-50 border-l-4 border-purple-500" : "hover:bg-gray-50 border-l-4 border-transparent"}
				${isFlashing ? "bg-green-50 border-l-4 border-green-500" : ""}
				${isFullyReceived ? "opacity-60" : ""}
			`}
		>
			{/* Main Row - 4 columns */}
			<div className="grid grid-cols-4 items-center px-4 py-3">
				{/* Item Name */}
				<div className="col-span-1 pr-2 min-w-0">
					<p className="text-sm font-medium text-gray-900 truncate">
						{item.ingredient_name}
					</p>
					<p className="text-xs text-gray-500">{item.unit}</p>
					{isFullyReceived && (
						<span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-0.5">
							<CheckCircle size={11} /> Done
						</span>
					)}
				</div>

				{/* Ordered */}
				<div className="text-center">
					<p className="text-sm font-medium text-gray-700">{item.quantity_ordered}</p>
				</div>

				{/* Session (this receiving session) */}
				<div className="text-center">
					<p className={`text-sm font-semibold ${sessionQty > 0 ? "text-purple-700" : "text-gray-400"}`}>
						{sessionQty > 0 ? sessionQty : "—"}
					</p>
				</div>

				{/* Open */}
				<div className="text-center">
					<p className={`text-sm font-semibold ${
						isFullyReceived ? "text-green-600" : open > 0 ? "text-orange-600" : "text-gray-400"
					}`}>
						{Math.max(open, 0)}
					</p>
				</div>
			</div>

			{/* Progress bar */}
			<div className="px-4 pb-2">
				<div className="w-full bg-gray-200 rounded-full h-1">
					<div
						className={`h-1 rounded-full transition-all duration-300 ${
							isFullyReceived ? "bg-green-500" : sessionQty > 0 ? "bg-purple-500" : "bg-gray-300"
						}`}
						style={{
							width: `${Math.min(
								((alreadyReceived + sessionQty) / item.quantity_ordered) * 100,
								100
							)}%`,
						}}
					/>
				</div>
			</div>

			{/* Manual qty input (only when selected and not fully received) */}
			{isSelected && !isFullyReceived && (
				<div
					className="px-4 pb-3 flex items-center gap-2"
					onClick={(e) => e.stopPropagation()}
				>
					<label className="text-xs text-gray-600 font-medium">Manual qty:</label>
					<input
						type="number"
						value={item.quantity_to_receive || ""}
						onChange={(e) => onUpdateQuantity(parseFloat(e.target.value) || 0)}
						min="0"
						max={item.quantity_ordered - alreadyReceived}
						step="1"
						placeholder="0"
						className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
					/>
					<span className="text-xs text-gray-500">{item.unit}</span>
				</div>
			)}
		</div>
	);
});

/**
 * ReceivingDetailsPanel - Right-side detail form for selected item
 */
function ReceivingDetailsPanel({ item, itemIndex, onUpdate }) {
	const alreadyReceived = item.quantity_received;
	const sessionQty = parseFloat(item.quantity_to_receive) || 0;
	const open = item.quantity_ordered - alreadyReceived - sessionQty;

	return (
		<div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col">
			<div className="bg-purple-50 border-b border-purple-100 p-4 flex-shrink-0">
				<h3 className="font-semibold text-gray-900 mb-1">Receiving Details</h3>
				<p className="text-sm font-medium text-purple-800">{item.ingredient_name}</p>
			</div>

			<div className="p-4 space-y-4 flex-1 overflow-y-auto">
				{/* Item quantities */}
				<div>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span className="text-gray-600">Unit Price:</span>
							<span className="font-medium">${item.unit_price.toFixed(2)} / {item.unit}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">Ordered:</span>
							<span className="font-medium">{item.quantity_ordered} {item.unit}</span>
						</div>
						{alreadyReceived > 0 && (
							<div className="flex justify-between">
								<span className="text-gray-600">Previously Received:</span>
								<span className="font-medium">{alreadyReceived} {item.unit}</span>
							</div>
						)}
						<div className="flex justify-between">
							<span className="text-gray-600">This Session:</span>
							<span className={`font-semibold ${sessionQty > 0 ? "text-purple-700" : "text-gray-400"}`}>
								{sessionQty} {item.unit}
							</span>
						</div>
						<div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
							<span className="text-gray-600">Still Open:</span>
							<span className={`font-semibold ${open > 0 ? "text-orange-600" : "text-green-600"}`}>
								{Math.max(open, 0)} {item.unit}
							</span>
						</div>
					</div>
					{sessionQty > 0 && (
						<p className="text-xs text-gray-500 mt-1">
							Session value: ${(sessionQty * item.unit_price).toFixed(2)}
						</p>
					)}
				</div>

				{/* Manual quantity override */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Session Quantity (Scan or enter manually)
					</label>
					<div className="flex items-center gap-2">
						<input
							type="number"
							value={item.quantity_to_receive || ""}
							onChange={(e) =>
								onUpdate("quantity_to_receive", parseFloat(e.target.value) || 0)
							}
							min="0"
							max={item.quantity_ordered - alreadyReceived}
							step="1"
							placeholder="0"
							className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						/>
						<span className="text-sm text-gray-600 min-w-[60px]">{item.unit}</span>
					</div>
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

				{/* Receive All Remaining */}
				<div className="pt-4 border-t border-gray-200">
					<button
						onClick={() =>
							onUpdate("quantity_to_receive", item.quantity_ordered - alreadyReceived)
						}
						disabled={open <= 0}
						className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
					>
						Receive All Remaining ({Math.max(open, 0)} {item.unit})
					</button>
				</div>
			</div>
		</div>
	);
}
