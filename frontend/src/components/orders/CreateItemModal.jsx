// /frontend/src/components/orders/CreateItemModal.jsx

import { useState, useEffect } from "react";
import { X, Check, Package, Truck, Barcode } from "lucide-react";

/**
 * CreateItemModal - Modal for creating a new item in the ingredient library
 * 
 * Triggered when user searches for an item that doesn't exist
 * and clicks "Create New Item"
 */
export default function CreateItemModal({
	isOpen,
	onClose,
	onSave,
	initialName = "",
}) {
	const [formData, setFormData] = useState({
		name: "",
		category: "",
		itemNumber: "",
		upc: "",
		unit: "",
		costPerUnit: "",
		preferredVendor: "",
		pkgQty: "1",
		pkgUom: "",
		itemsPerPkg: "1",
		itemQty: "",
		itemUom: "",
		storageType: "dry", // dry, refrigerated, frozen
		shelfLifeDays: "",
		minimumQuantity: "",
	});

	// Category options
	const categoryOptions = [
		"Meat",
		"Poultry",
		"Seafood",
		"Produce",
		"Dairy",
		"Bakery",
		"Canned Goods",
		"Dry Goods",
		"Frozen",
		"Beverages",
		"Liquor",
		"Beer/Wine",
		"Cleaning Supplies",
		"Paper Goods",
		"Smallwares",
		"Other",
	];

	// UOM options
	const uomOptions = ["Case", "Box", "Each", "lbs", "oz", "gal", "dozen", "bag", "bottle"];

	// Storage type options
	const storageOptions = [
		{ value: "dry", label: "Dry Storage" },
		{ value: "refrigerated", label: "Refrigerated" },
		{ value: "frozen", label: "Frozen" },
	];

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			setFormData({
				name: initialName,
				category: "",
				itemNumber: "",
				upc: "",
				unit: "",
				costPerUnit: "",
				preferredVendor: "",
				pkgQty: "1",
				pkgUom: "",
				itemsPerPkg: "1",
				itemQty: "",
				itemUom: "",
				storageType: "dry",
				shelfLifeDays: "",
				minimumQuantity: "",
			});
		}
	}, [isOpen, initialName]);

	const handleFieldChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSave = () => {
		// Basic validation
		if (!formData.name || !formData.category || !formData.unit) {
			alert("Please fill in required fields: Name, Category, and Unit");
			return;
		}

		onSave(formData);
		onClose();
	};

	const isValid = formData.name && formData.category && formData.unit;

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">Create New Item</h2>
						<p className="text-sm text-gray-500 mt-1">Add a new item to your ingredient library</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6">
					{/* Basic Info Section */}
					<section className="mb-6">
						<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
							<Package size={16} />
							Basic Information
						</h3>
						
						<div className="grid grid-cols-2 gap-4">
							{/* Item Name */}
							<div className="col-span-2">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Item Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) => handleFieldChange("name", e.target.value)}
									placeholder="Enter item name..."
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								/>
							</div>

							{/* Category */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Category <span className="text-red-500">*</span>
								</label>
								<select
									value={formData.category}
									onChange={(e) => handleFieldChange("category", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								>
									<option value="">Select category...</option>
									{categoryOptions.map((cat) => (
										<option key={cat} value={cat}>{cat}</option>
									))}
								</select>
							</div>

							{/* Default Unit */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Default Unit <span className="text-red-500">*</span>
								</label>
								<select
									value={formData.unit}
									onChange={(e) => handleFieldChange("unit", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								>
									<option value="">Select unit...</option>
									{uomOptions.map((uom) => (
										<option key={uom} value={uom}>{uom}</option>
									))}
								</select>
							</div>
						</div>
					</section>

					{/* Identifiers Section */}
					<section className="mb-6">
						<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
							<Barcode size={16} />
							Identifiers
						</h3>
						
						<div className="grid grid-cols-2 gap-4">
							{/* Item Number */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Item Number
								</label>
								<input
									type="text"
									value={formData.itemNumber}
									onChange={(e) => handleFieldChange("itemNumber", e.target.value)}
									placeholder="Vendor item #"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								/>
							</div>

							{/* UPC */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									UPC / Barcode
								</label>
								<input
									type="text"
									value={formData.upc}
									onChange={(e) => handleFieldChange("upc", e.target.value)}
									placeholder="Barcode number"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								/>
							</div>
						</div>
					</section>

					{/* Vendor & Pricing Section */}
					<section className="mb-6">
						<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
							<Truck size={16} />
							Vendor & Pricing
						</h3>
						
						<div className="grid grid-cols-2 gap-4">
							{/* Preferred Vendor */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Preferred Vendor
								</label>
								<input
									type="text"
									value={formData.preferredVendor}
									onChange={(e) => handleFieldChange("preferredVendor", e.target.value)}
									placeholder="Vendor name"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								/>
							</div>

							{/* Cost Per Unit */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Cost Per Unit
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
									<input
										type="number"
										min="0"
										step="0.01"
										value={formData.costPerUnit}
										onChange={(e) => handleFieldChange("costPerUnit", e.target.value)}
										placeholder="0.00"
										className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
									/>
								</div>
							</div>
						</div>
					</section>

					{/* Package Info Section */}
					<section className="mb-6">
						<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
							Package Information
						</h3>
						
						<div className="grid grid-cols-3 gap-4">
							{/* Pkg Qty */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Pkg Qty
								</label>
								<input
									type="number"
									min="1"
									value={formData.pkgQty}
									onChange={(e) => handleFieldChange("pkgQty", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								/>
							</div>

							{/* Pkg UOM */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Pkg UOM
								</label>
								<select
									value={formData.pkgUom}
									onChange={(e) => handleFieldChange("pkgUom", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								>
									<option value="">Select...</option>
									{uomOptions.map((uom) => (
										<option key={uom} value={uom}>{uom}</option>
									))}
								</select>
							</div>

							{/* Items Per Pkg */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Items Per Pkg
								</label>
								<input
									type="number"
									min="1"
									value={formData.itemsPerPkg}
									onChange={(e) => handleFieldChange("itemsPerPkg", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								/>
							</div>

							{/* Item Qty */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Item Qty
								</label>
								<input
									type="number"
									min="0"
									step="0.01"
									value={formData.itemQty}
									onChange={(e) => handleFieldChange("itemQty", e.target.value)}
									placeholder="e.g., 5"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								/>
							</div>

							{/* Item UOM */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Item UOM
								</label>
								<select
									value={formData.itemUom}
									onChange={(e) => handleFieldChange("itemUom", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								>
									<option value="">Select...</option>
									{uomOptions.map((uom) => (
										<option key={uom} value={uom}>{uom}</option>
									))}
								</select>
							</div>
						</div>
					</section>

					{/* Storage Section */}
					<section>
						<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
							Storage & Inventory
						</h3>
						
						<div className="grid grid-cols-3 gap-4">
							{/* Storage Type */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Storage Type
								</label>
								<select
									value={formData.storageType}
									onChange={(e) => handleFieldChange("storageType", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								>
									{storageOptions.map((opt) => (
										<option key={opt.value} value={opt.value}>{opt.label}</option>
									))}
								</select>
							</div>

							{/* Shelf Life */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Shelf Life (days)
								</label>
								<input
									type="number"
									min="0"
									value={formData.shelfLifeDays}
									onChange={(e) => handleFieldChange("shelfLifeDays", e.target.value)}
									placeholder="e.g., 30"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								/>
							</div>

							{/* Minimum Quantity (par level) */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Min Qty (Par Level)
								</label>
								<input
									type="number"
									min="0"
									value={formData.minimumQuantity}
									onChange={(e) => handleFieldChange("minimumQuantity", e.target.value)}
									placeholder="e.g., 5"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								/>
							</div>
						</div>
					</section>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
					<button
						onClick={onClose}
						className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={!isValid}
						className={`
							flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
							${isValid
								? "bg-green-600 text-white hover:bg-green-700"
								: "bg-gray-200 text-gray-400 cursor-not-allowed"
							}
						`}
					>
						<Check size={18} />
						Create Item
					</button>
				</div>
			</div>
		</div>
	);
}
