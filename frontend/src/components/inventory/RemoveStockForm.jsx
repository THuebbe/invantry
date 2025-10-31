// frontend\src\components\inventory\RemoveStockForm.jsx

import { useState } from "react";
import { useWasteReasons, useRemoveStock } from "../../hooks/useWaste";

export default function RemoveStockForm({ item, onSuccess, onCancel }) {
	const [quantity, setQuantity] = useState("");
	const [reason, setReason] = useState("");
	const [notes, setNotes] = useState("");
	const [errors, setErrors] = useState({});

	// Fetch waste reasons for dropdown
	const { data: reasonsData, isLoading: reasonsLoading } = useWasteReasons();

	// Mutation for removing stock
	const removeStockMutation = useRemoveStock();

	// Validate form
	const validate = () => {
		const newErrors = {};

		if (!quantity || quantity <= 0) {
			newErrors.quantity = "Quantity must be greater than 0";
		}

		if (parseFloat(quantity) > item.quantity) {
			newErrors.quantity = `Cannot remove more than ${item.quantity} ${item.unit} available`;
		}

		if (!reason) {
			newErrors.reason = "Please select a reason";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Handle form submission
	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validate()) return;

		try {
			await removeStockMutation.mutateAsync({
				items: [
					{
						ingredientId: item.ingredient_id,
						quantity: parseFloat(quantity),
						unit: item.unit,
						reason,
						notes: notes.trim() || undefined,
					},
				],
			});

			// Success! Call onSuccess callback
			onSuccess();
		} catch (error) {
			setErrors({
				submit: error.response?.data?.error || "Failed to remove stock",
			});
		}
	};

	// Group reasons by category
	const wasteReasons = reasonsData?.waste || [];
	const reductionReasons = reasonsData?.reduction || [];

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-6"
		>
			{/* Item Info */}
			<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
				<h3 className="font-semibold text-gray-900 mb-2">
					{item.ingredient_name}
				</h3>
				<div className="text-sm text-gray-600 space-y-1">
					<p>
						<span className="font-medium">Category:</span> {item.category}
					</p>
					<p>
						<span className="font-medium">Location:</span> {item.location}
					</p>
					<p className="text-lg font-semibold text-green-700">
						Available: {item.quantity} {item.unit}
					</p>
				</div>
			</div>

			{/* Quantity Input */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Quantity to Remove *
				</label>
				<div className="flex gap-2">
					<input
						type="number"
						step="0.01"
						min="0"
						max={item.quantity}
						value={quantity}
						onChange={(e) => setQuantity(e.target.value)}
						className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
							errors.quantity ? "border-red-500" : "border-gray-300"
						}`}
						placeholder="0.00"
					/>
					<div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
						{item.unit}
					</div>
				</div>
				{errors.quantity && (
					<p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
				)}
			</div>

			{/* Reason Dropdown */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Reason *
				</label>
				<select
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
						errors.reason ? "border-red-500" : "border-gray-300"
					}`}
					disabled={reasonsLoading}
				>
					<option value="">Select a reason...</option>

					{/* Waste Reasons */}
					{wasteReasons.length > 0 && (
						<optgroup label="Waste">
							{wasteReasons.map((r) => (
								<option
									key={r.value}
									value={r.value}
								>
									{r.label} {r.description && `- ${r.description}`}
								</option>
							))}
						</optgroup>
					)}

					{/* Reduction Reasons */}
					{reductionReasons.length > 0 && (
						<optgroup label="Other Reductions">
							{reductionReasons.map((r) => (
								<option
									key={r.value}
									value={r.value}
								>
									{r.label} {r.description && `- ${r.description}`}
								</option>
							))}
						</optgroup>
					)}
				</select>
				{errors.reason && (
					<p className="mt-1 text-sm text-red-600">{errors.reason}</p>
				)}
			</div>

			{/* Notes Textarea */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Notes (Optional)
				</label>
				<textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					rows={3}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
					placeholder="Add any additional details..."
				/>
				<p className="mt-1 text-xs text-gray-500">
					Optional: Add context about why this item is being removed
				</p>
			</div>

			{/* Submit Error */}
			{errors.submit && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-sm text-red-600">{errors.submit}</p>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex gap-3 pt-4 border-t border-gray-200">
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
					disabled={removeStockMutation.isPending}
				>
					Cancel
				</button>
				<button
					type="submit"
					className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={removeStockMutation.isPending}
				>
					{removeStockMutation.isPending ? "Removing..." : "Remove from Stock"}
				</button>
			</div>
		</form>
	);
}
