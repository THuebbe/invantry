// /frontend/src/components/orders/AddressInputModal.jsx

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

/**
 * AddressInputModal - Modal for entering full address details
 * 
 * Only displays street address in the main form field,
 * but stores the complete address data
 */
export default function AddressInputModal({
	isOpen,
	onClose,
	onSave,
	initialAddress = {},
	title = "Enter Address",
	otherAddress = null, // For "Same as" checkbox functionality
	otherAddressLabel = "Ship To", // Label for the other address
}) {
	const [address, setAddress] = useState({
		street1: "",
		street2: "",
		city: "",
		state: "",
		zipCode: "",
		country: "USA",
		...initialAddress,
	});

	const [sameAsOther, setSameAsOther] = useState(false);

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			setAddress({
				street1: "",
				street2: "",
				city: "",
				state: "",
				zipCode: "",
				country: "USA",
				...initialAddress,
			});
			setSameAsOther(false);
		}
	}, [isOpen, initialAddress]);

	// Handle "Same as" checkbox
	const handleSameAsOther = (checked) => {
		setSameAsOther(checked);
		if (checked && otherAddress) {
			setAddress({ ...otherAddress });
		}
	};

	const handleFieldChange = (field, value) => {
		setAddress((prev) => ({
			...prev,
			[field]: value,
		}));
		// If user edits after checking "same as", uncheck it
		if (sameAsOther) {
			setSameAsOther(false);
		}
	};

	const handleSave = () => {
		onSave(address);
		onClose();
	};

	const isValid = address.street1 && address.city && address.state && address.zipCode;

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900">{title}</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 space-y-4">
					{/* Same As checkbox - only show if other address exists */}
					{otherAddress && otherAddress.street1 && (
						<label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
							<input
								type="checkbox"
								checked={sameAsOther}
								onChange={(e) => handleSameAsOther(e.target.checked)}
								className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
							/>
							<span className="text-sm text-gray-700">
								Same as {otherAddressLabel}
							</span>
						</label>
					)}

					{/* Street Address 1 */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Street Address <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							value={address.street1}
							onChange={(e) => handleFieldChange("street1", e.target.value)}
							placeholder="123 Main Street"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
						/>
					</div>

					{/* Street Address 2 */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Street Address 2
						</label>
						<input
							type="text"
							value={address.street2}
							onChange={(e) => handleFieldChange("street2", e.target.value)}
							placeholder="Suite, Unit, Building (optional)"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
						/>
					</div>

					{/* City */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							City <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							value={address.city}
							onChange={(e) => handleFieldChange("city", e.target.value)}
							placeholder="City"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
						/>
					</div>

					{/* State & Zip Row */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								State <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={address.state}
								onChange={(e) => handleFieldChange("state", e.target.value)}
								placeholder="State"
								maxLength={2}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 uppercase"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Zip Code <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={address.zipCode}
								onChange={(e) => handleFieldChange("zipCode", e.target.value)}
								placeholder="12345"
								maxLength={10}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
					</div>

					{/* Country */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Country
						</label>
						<input
							type="text"
							value={address.country}
							onChange={(e) => handleFieldChange("country", e.target.value)}
							placeholder="USA"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
						/>
					</div>
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
						Save Address
					</button>
				</div>
			</div>
		</div>
	);
}

/**
 * Helper to format address for display (street only)
 */
export function formatAddressStreet(address) {
	if (!address || !address.street1) return "";
	return address.street2 
		? `${address.street1}, ${address.street2}`
		: address.street1;
}

/**
 * Helper to format full address
 */
export function formatFullAddress(address) {
	if (!address || !address.street1) return "";
	const parts = [
		address.street1,
		address.street2,
		`${address.city}, ${address.state} ${address.zipCode}`,
		address.country !== "USA" ? address.country : null,
	].filter(Boolean);
	return parts.join("\n");
}
