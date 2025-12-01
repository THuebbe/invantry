// frontend/src/components/orders/TabbedOrderInterfaceDemo.jsx

import { useState } from "react";
import TabbedOrderInterface from "./TabbedOrderInterface";
import { Plus, Trash2, Calendar, DollarSign } from "lucide-react";

/**
 * TabbedOrderInterfaceDemo - Interactive demo component
 *
 * This component demonstrates all features of the TabbedOrderInterface
 * in a self-contained example. Use this to test and showcase the component.
 */
export default function TabbedOrderInterfaceDemo() {
	const [mode, setMode] = useState("order");
	const [saveLog, setSaveLog] = useState([]);
	const [simulateError, setSimulateError] = useState(false);

	// Mock save handler with simulated delay
	const handleSave = async (tabData) => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Simulate error if checkbox checked
		if (simulateError) {
			throw new Error("Simulated save error - try again!");
		}

		// Log save
		const logEntry = {
			timestamp: new Date().toISOString(),
			tabLabel: tabData.label,
			itemCount: tabData.data.items.length,
			total: tabData.data.items.reduce(
				(sum, item) => sum + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0),
				0
			),
		};
		setSaveLog((prev) => [logEntry, ...prev]);

		return { success: true, orderId: Date.now() };
	};

	// Render content for each tab
	const renderContent = (tabData, tabActions) => {
		return <DemoTabContent tabData={tabData} tabActions={tabActions} mode={mode} />;
	};

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			{/* Demo Controls */}
			<div className="max-w-7xl mx-auto mb-6">
				<div className="bg-white border border-gray-200 rounded-lg p-6">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						TabbedOrderInterface Demo
					</h1>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Mode Selector */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Mode
							</label>
							<select
								value={mode}
								onChange={(e) => setMode(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
							>
								<option value="order">Order (Date Labels)</option>
								<option value="po">Purchase Order (Vendor Labels)</option>
							</select>
						</div>

						{/* Error Simulation */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Simulate Errors
							</label>
							<label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer">
								<input
									type="checkbox"
									checked={simulateError}
									onChange={(e) => setSimulateError(e.target.checked)}
									className="w-4 h-4 text-green-600"
								/>
								<span className="text-sm text-gray-700">Enable save errors</span>
							</label>
						</div>

						{/* Save Log Count */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Saves Completed
							</label>
							<div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
								<span className="text-lg font-bold text-green-600">
									{saveLog.length}
								</span>
								<span className="text-sm text-gray-500 ml-2">orders saved</span>
							</div>
						</div>
					</div>

					{/* Feature Checklist */}
					<div className="mt-6 pt-6 border-t border-gray-200">
						<h3 className="text-sm font-semibold text-gray-700 mb-3">
							Features to Test:
						</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							<FeatureCheckbox label="Create new tabs (+ button)" />
							<FeatureCheckbox label="Switch between tabs" />
							<FeatureCheckbox label="Edit tab labels (pencil icon)" />
							<FeatureCheckbox label="Close clean tabs" />
							<FeatureCheckbox label="Unsaved changes warning" />
							<FeatureCheckbox label="Add/remove items" />
							<FeatureCheckbox label="Keyboard shortcuts" />
							<FeatureCheckbox label="Maximum tabs limit" />
						</div>
					</div>
				</div>
			</div>

			{/* Tabbed Interface */}
			<div className="max-w-7xl mx-auto" style={{ height: "600px" }}>
				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col">
					<TabbedOrderInterface
						mode={mode}
						onSave={handleSave}
						renderContent={renderContent}
						maxTabs={10}
					/>
				</div>
			</div>

			{/* Save Log */}
			{saveLog.length > 0 && (
				<div className="max-w-7xl mx-auto mt-6">
					<div className="bg-white border border-gray-200 rounded-lg p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-gray-900">Save Log</h3>
							<button
								onClick={() => setSaveLog([])}
								className="text-sm text-red-600 hover:text-red-700"
							>
								Clear Log
							</button>
						</div>
						<div className="space-y-2 max-h-64 overflow-y-auto">
							{saveLog.map((entry, idx) => (
								<div
									key={idx}
									className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
								>
									<div>
										<span className="font-medium text-gray-900">
											{entry.tabLabel}
										</span>
										<span className="text-sm text-gray-500 ml-2">
											{entry.itemCount} items
										</span>
									</div>
									<div className="text-right">
										<div className="font-semibold text-green-700">
											${entry.total.toFixed(2)}
										</div>
										<div className="text-xs text-gray-500">
											{new Date(entry.timestamp).toLocaleTimeString()}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Keyboard Shortcuts Reference */}
			<div className="max-w-7xl mx-auto mt-6">
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
					<h3 className="text-sm font-semibold text-blue-900 mb-3">
						Keyboard Shortcuts
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						<ShortcutItem keys="Cmd/Ctrl + T" action="New tab" />
						<ShortcutItem keys="Cmd/Ctrl + W" action="Close tab" />
						<ShortcutItem keys="Cmd/Ctrl + S" action="Save tab" />
						<ShortcutItem keys="Cmd/Ctrl + Tab" action="Next tab" />
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * DemoTabContent - Content component for demo tabs
 */
function DemoTabContent({ tabData, tabActions, mode }) {
	const [localError, setLocalError] = useState(null);
	const [saving, setSaving] = useState(false);

	// Initialize items if empty
	if (!tabData.data.items || tabData.data.items.length === 0) {
		tabActions.updateData({
			items: [],
			header: {
				date: new Date().toISOString().split("T")[0],
				notes: "",
			},
		});
	}

	const items = tabData.data.items || [];
	const header = tabData.data.header || {};

	const handleAddItem = () => {
		const newItem = {
			id: Date.now(),
			name: "",
			qty: "",
			price: "",
			unit: "ea",
		};
		tabActions.updateData({
			items: [...items, newItem],
		});
	};

	const handleUpdateItem = (index, field, value) => {
		const newItems = [...items];
		newItems[index] = { ...newItems[index], [field]: value };
		tabActions.updateData({ items: newItems });
	};

	const handleRemoveItem = (index) => {
		const newItems = items.filter((_, idx) => idx !== index);
		tabActions.updateData({ items: newItems });
	};

	const handleHeaderChange = (field, value) => {
		tabActions.updateData({
			header: { ...header, [field]: value },
		});
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			setLocalError(null);
			await tabActions.save();
			alert(`Successfully saved: ${tabData.label}`);
		} catch (error) {
			setLocalError(error.message);
		} finally {
			setSaving(false);
		}
	};

	const calculateTotal = () => {
		return items.reduce((sum, item) => {
			return sum + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
		}, 0);
	};

	const total = calculateTotal();

	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 overflow-auto p-6">
				{/* Header Section */}
				<div className="mb-6">
					<h2 className="text-xl font-bold text-gray-900 mb-4">
						{mode === "order" ? "Order" : "Purchase Order"}: {tabData.label}
					</h2>

					<div className="grid grid-cols-2 gap-4 mb-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								<Calendar size={14} className="inline mr-1" />
								Date
							</label>
							<input
								type="date"
								value={header.date || ""}
								onChange={(e) => handleHeaderChange("date", e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
							/>
						</div>

						{mode === "po" && (
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Vendor
								</label>
								<select
									value={tabData.label}
									onChange={(e) => tabActions.updateLabel(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
								>
									<option value="Sysco">Sysco</option>
									<option value="US Foods">US Foods</option>
									<option value="Gordon Food Service">Gordon Food Service</option>
									<option value="Local Farm Co">Local Farm Co</option>
								</select>
							</div>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Notes
						</label>
						<textarea
							value={header.notes || ""}
							onChange={(e) => handleHeaderChange("notes", e.target.value)}
							placeholder="Add notes..."
							rows={2}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
						/>
					</div>
				</div>

				{/* Error Display */}
				{localError && (
					<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-sm text-red-700">{localError}</p>
					</div>
				)}

				{/* Items Section */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-lg font-semibold text-gray-900">Items</h3>
						<button
							onClick={handleAddItem}
							className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
						>
							<Plus size={16} />
							Add Item
						</button>
					</div>

					{items.length === 0 ? (
						<div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
							<p className="text-gray-500">No items yet. Click "Add Item" to get started.</p>
						</div>
					) : (
						<div className="space-y-2">
							{items.map((item, idx) => (
								<div
									key={item.id}
									className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
								>
									<div className="flex-1 grid grid-cols-4 gap-3">
										<input
											type="text"
											value={item.name}
											onChange={(e) => handleUpdateItem(idx, "name", e.target.value)}
											placeholder="Item name..."
											className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
										/>
										<input
											type="number"
											value={item.qty}
											onChange={(e) => handleUpdateItem(idx, "qty", e.target.value)}
											placeholder="Qty..."
											className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
										/>
										<input
											type="number"
											step="0.01"
											value={item.price}
											onChange={(e) => handleUpdateItem(idx, "price", e.target.value)}
											placeholder="Price..."
											className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
										/>
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-gray-700">
												${((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}
											</span>
										</div>
									</div>
									<button
										onClick={() => handleRemoveItem(idx)}
										className="text-red-500 hover:text-red-700"
										title="Remove item"
									>
										<Trash2 size={18} />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Footer with Total and Actions */}
			<div className="border-t border-gray-200 bg-gray-50 p-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<DollarSign size={20} className="text-gray-600" />
						<span className="text-lg font-semibold text-gray-900">
							Total: ${total.toFixed(2)}
						</span>
						<span className="text-sm text-gray-500">({items.length} items)</span>
					</div>
					<button
						onClick={handleSave}
						disabled={saving || items.length === 0}
						className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
					>
						{saving ? "Saving..." : "Save Order"}
					</button>
				</div>
			</div>
		</div>
	);
}

/**
 * FeatureCheckbox - Checklist item for features
 */
function FeatureCheckbox({ label }) {
	const [checked, setChecked] = useState(false);

	return (
		<label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => setChecked(e.target.checked)}
				className="w-4 h-4 text-green-600"
			/>
			<span className={checked ? "line-through text-gray-400" : ""}>{label}</span>
		</label>
	);
}

/**
 * ShortcutItem - Keyboard shortcut display
 */
function ShortcutItem({ keys, action }) {
	return (
		<div className="flex items-center justify-between">
			<kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
				{keys}
			</kbd>
			<span className="text-xs text-blue-800 ml-2">{action}</span>
		</div>
	);
}
