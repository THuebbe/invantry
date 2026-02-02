// /frontend/src/components/orders/ItemDetailsPanel.jsx

import { useState } from "react";
import { Package, Truck, FileText, Edit2, X } from "lucide-react";

/**
 * ItemDetailsPanel - Right-side panel showing extended details for selected line item
 * 
 * Used by both Orders and Purchase Orders screens
 * Shows different fields based on context (order vs PO)
 */
export default function ItemDetailsPanel({
	item,
	type = "order", // "order" or "purchaseOrder"
	onUpdate,
	onClose,
	isSheet = false, // Mobile sheet mode - removes border/background
}) {
	const [isEditingNotes, setIsEditingNotes] = useState(false);
	const [notesValue, setNotesValue] = useState(item?.notes || "");
	const [isEditingVendor, setIsEditingVendor] = useState(false);
	const [vendorValue, setVendorValue] = useState(item?.vendor || "");

	if (!item) {
		return (
			<div className={`flex flex-col items-center justify-center text-gray-400 ${
				isSheet
					? "p-4"
					: "bg-white border border-gray-200 rounded-lg p-6 h-full"
			}`}>
				<Package size={48} className="mb-4 opacity-50" />
				<p className="text-sm">Select a line item to view details</p>
			</div>
		);
	}

	const handleSaveNotes = () => {
		onUpdate?.({ ...item, notes: notesValue });
		setIsEditingNotes(false);
	};

	const handleSaveVendor = () => {
		onUpdate?.({ ...item, vendor: vendorValue });
		setIsEditingVendor(false);
	};

	return (
		<div className={`flex flex-col ${
			isSheet
				? "p-4"
				: "bg-white border border-gray-200 rounded-lg p-6 h-full"
		}`}>
			{/* Header */}
			<div className="flex items-start justify-between mb-6">
				<div>
					<h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
						Item Details
					</h3>
					<h2 className="text-lg font-bold text-gray-900">
						{item.itemName || "Unnamed Item"}
					</h2>
				</div>
				{onClose && (
					<button
						onClick={onClose}
						className="p-1 text-gray-400 hover:text-gray-600 rounded"
					>
						<X size={20} />
					</button>
				)}
			</div>

			{/* Details Grid */}
			<div className="flex-1 overflow-y-auto space-y-6">
				{/* Category & Basic Info */}
				<section>
					<DetailRow label="Category" value={item.category || "—"} />
				</section>

				{/* Package Information */}
				<section>
					<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
						<Package size={14} />
						Package Info
					</h4>
					<div className="space-y-2">
						<DetailRow label="Pkg Qty" value={item.pkgQty || "—"} />
						<DetailRow label="Pkg UOM" value={item.pkgUom || item.uom || "—"} />
						<DetailRow label="Items Per Pkg" value={item.itemsPerPkg || "—"} />
						<DetailRow label="Item Qty" value={item.itemQty || "—"} />
						<DetailRow label="Item UOM" value={item.itemUom || "—"} />
					</div>
				</section>

				{/* Vendor Section - Editable */}
				<section>
					<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
						<Truck size={14} />
						Vendor
					</h4>
					{isEditingVendor ? (
						<div className="space-y-2">
							<input
								type="text"
								value={vendorValue}
								onChange={(e) => setVendorValue(e.target.value)}
								placeholder="Enter vendor name..."
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
								autoFocus
							/>
							<div className="flex gap-2">
								<button
									onClick={handleSaveVendor}
									className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
								>
									Save
								</button>
								<button
									onClick={() => {
										setVendorValue(item?.vendor || "");
										setIsEditingVendor(false);
									}}
									className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-between group">
							<span className="text-sm text-gray-900">
								{item.vendor || "No vendor assigned"}
							</span>
							<button
								onClick={() => setIsEditingVendor(true)}
								className="p-1 text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<Edit2 size={14} />
							</button>
						</div>
					)}
				</section>

				{/* Order/PO Linkage */}
				{type === "order" && item.purchaseOrderNumber && (
					<section>
						<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
							Purchase Order
						</h4>
						<div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
							<span className="text-sm font-medium text-blue-700">
								{item.purchaseOrderNumber}
							</span>
						</div>
					</section>
				)}

				{type === "purchaseOrder" && item.sourceOrderNumber && (
					<section>
						<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
							Source Order
						</h4>
						<div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
							<span className="text-sm font-medium text-purple-700">
								{item.sourceOrderNumber}
							</span>
						</div>
					</section>
				)}

				{/* Pricing */}
				<section>
					<DetailRow 
						label="Cost" 
						value={item.cost ? `$${parseFloat(item.cost).toFixed(2)}` : "—"} 
					/>
				</section>

				{/* Item Identifiers - More relevant for PO */}
				{(item.upc || item.itemNumber || type === "purchaseOrder") && (
					<section>
						<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
							<FileText size={14} />
							Identifiers
						</h4>
						<div className="space-y-2">
							{item.upc && <DetailRow label="UPC" value={item.upc} />}
							{item.itemNumber && <DetailRow label="Item Number" value={item.itemNumber} />}
							{type === "purchaseOrder" && (
								<>
									<DetailRow label="Quote Number" value={item.quoteNumber || "—"} />
									<DetailRow label="Invoice Number" value={item.invoiceNumber || "—"} />
								</>
							)}
						</div>
					</section>
				)}

				{/* Notes Section - Editable */}
				<section className="flex-1">
					<div className="flex items-center justify-between mb-3">
						<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
							Notes
						</h4>
						{!isEditingNotes && (
							<button
								onClick={() => setIsEditingNotes(true)}
								className="p-1 text-gray-400 hover:text-green-600"
							>
								<Edit2 size={14} />
							</button>
						)}
					</div>
					
					{isEditingNotes ? (
						<div className="space-y-2">
							<textarea
								value={notesValue}
								onChange={(e) => setNotesValue(e.target.value)}
								placeholder="Add notes about this item..."
								rows={4}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none"
								autoFocus
							/>
							<div className="flex gap-2">
								<button
									onClick={handleSaveNotes}
									className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
								>
									Save
								</button>
								<button
									onClick={() => {
										setNotesValue(item?.notes || "");
										setIsEditingNotes(false);
									}}
									className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<div className="px-3 py-3 border border-gray-200 rounded-lg min-h-[80px] bg-gray-50">
							{item.notes ? (
								<p className="text-sm text-gray-700 whitespace-pre-wrap">
									{item.notes}
								</p>
							) : (
								<p className="text-sm text-gray-400 italic">
									No notes added
								</p>
							)}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}

/**
 * DetailRow - Simple label/value row for the details panel
 */
function DetailRow({ label, value }) {
	return (
		<div className="flex items-center justify-between py-1">
			<span className="text-sm text-gray-600">{label}:</span>
			<span className="text-sm font-medium text-gray-900">{value}</span>
		</div>
	);
}
