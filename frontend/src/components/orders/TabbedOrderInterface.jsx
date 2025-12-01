// frontend/src/components/orders/TabbedOrderInterface.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, Edit2, AlertCircle } from "lucide-react";

/**
 * TabbedOrderInterface - Reusable tabbed interface for managing multiple orders/POs
 *
 * Features:
 * - Create and manage multiple tabs
 * - Switch between tabs while preserving state
 * - Hybrid labeling (date/purpose for orders, vendor for POs)
 * - Unsaved changes protection with confirmation dialog
 * - Editable tab names
 * - Keyboard shortcuts
 * - Maximum tabs limit
 *
 * @param {string} mode - "order" or "po"
 * @param {function} onSave - Callback when saving a tab (receives tabData)
 * @param {function} renderContent - Render function for tab content (receives tabData, tabActions)
 * @param {array} initialTabs - Optional initial tabs array
 * @param {number} maxTabs - Maximum number of tabs allowed (default: 10)
 */
export default function TabbedOrderInterface({
	mode = "order",
	onSave,
	renderContent,
	initialTabs = [],
	maxTabs = 10,
}) {
	// Generate default label based on mode
	const generateDefaultLabel = useCallback((mode, index = 1) => {
		if (mode === "order") {
			// Use today's date as default for orders
			const today = new Date();
			const month = today.toLocaleDateString("en-US", { month: "short" });
			const day = today.getDate();
			return `${month} ${day}`;
		} else {
			// Default vendor name for POs
			return `Vendor ${index}`;
		}
	}, []);

	// Initialize tabs state
	const [tabs, setTabs] = useState(() => {
		if (initialTabs.length > 0) {
			return initialTabs;
		}
		// Create first tab by default
		return [
			{
				id: `tab-${Date.now()}`,
				label: generateDefaultLabel(mode, 1),
				isDirty: false,
				data: {
					items: [],
					header: {},
					notes: "",
				},
			},
		];
	});

	const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
	const [editingTabId, setEditingTabId] = useState(null);
	const [editingLabel, setEditingLabel] = useState("");
	const [confirmDialog, setConfirmDialog] = useState({
		isOpen: false,
		tabId: null,
		action: null,
	});

	// Refs for keyboard shortcuts
	const tabBarRef = useRef(null);
	const editInputRef = useRef(null);

	// Auto-focus edit input when editing
	useEffect(() => {
		if (editingTabId && editInputRef.current) {
			editInputRef.current.focus();
			editInputRef.current.select();
		}
	}, [editingTabId]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e) => {
			// Cmd/Ctrl + T: New tab
			if ((e.metaKey || e.ctrlKey) && e.key === "t") {
				e.preventDefault();
				handleAddTab();
			}

			// Cmd/Ctrl + W: Close current tab
			if ((e.metaKey || e.ctrlKey) && e.key === "w") {
				e.preventDefault();
				handleCloseTab(activeTabId);
			}

			// Cmd/Ctrl + S: Save current tab
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				const activeTab = tabs.find((t) => t.id === activeTabId);
				if (activeTab && activeTab.isDirty) {
					handleSaveTab(activeTabId);
				}
			}

			// Cmd/Ctrl + Tab: Next tab
			if ((e.metaKey || e.ctrlKey) && e.key === "Tab" && !e.shiftKey) {
				e.preventDefault();
				const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
				const nextIndex = (currentIndex + 1) % tabs.length;
				setActiveTabId(tabs[nextIndex].id);
			}

			// Cmd/Ctrl + Shift + Tab: Previous tab
			if ((e.metaKey || e.ctrlKey) && e.key === "Tab" && e.shiftKey) {
				e.preventDefault();
				const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
				const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
				setActiveTabId(tabs[prevIndex].id);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [tabs, activeTabId]);

	// Warn before leaving page if there are unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (e) => {
			const hasUnsavedChanges = tabs.some((tab) => tab.isDirty);
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = "";
				return "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [tabs]);

	// Add new tab
	const handleAddTab = () => {
		if (tabs.length >= maxTabs) {
			return;
		}

		const newTab = {
			id: `tab-${Date.now()}`,
			label: generateDefaultLabel(mode, tabs.length + 1),
			isDirty: false,
			data: {
				items: [],
				header: {},
				notes: "",
			},
		};

		setTabs((prev) => [...prev, newTab]);
		setActiveTabId(newTab.id);
	};

	// Switch to a different tab
	const handleSwitchTab = (tabId) => {
		if (tabId !== activeTabId) {
			setActiveTabId(tabId);
		}
	};

	// Close a tab
	const handleCloseTab = (tabId) => {
		const tab = tabs.find((t) => t.id === tabId);

		if (!tab) return;

		// If only one tab left, prevent closing
		if (tabs.length === 1) {
			// Instead of preventing, create a new empty tab before closing
			const newTab = {
				id: `tab-${Date.now()}`,
				label: generateDefaultLabel(mode, 1),
				isDirty: false,
				data: {
					items: [],
					header: {},
					notes: "",
				},
			};
			setTabs([newTab]);
			setActiveTabId(newTab.id);
			return;
		}

		// Check if tab has unsaved changes
		if (tab.isDirty) {
			setConfirmDialog({
				isOpen: true,
				tabId,
				action: "close",
			});
			return;
		}

		// Remove tab
		removeTab(tabId);
	};

	// Remove tab from state
	const removeTab = (tabId) => {
		const tabIndex = tabs.findIndex((t) => t.id === tabId);
		const newTabs = tabs.filter((t) => t.id !== tabId);
		setTabs(newTabs);

		// If closing active tab, switch to another tab
		if (tabId === activeTabId) {
			// Switch to previous tab if available, otherwise next tab
			const newActiveIndex = Math.max(0, tabIndex - 1);
			setActiveTabId(newTabs[newActiveIndex]?.id);
		}
	};

	// Update tab data
	const handleUpdateTabData = (tabId, newData) => {
		setTabs((prev) =>
			prev.map((tab) => {
				if (tab.id === tabId) {
					return {
						...tab,
						data: { ...tab.data, ...newData },
						isDirty: true,
					};
				}
				return tab;
			})
		);
	};

	// Save tab
	const handleSaveTab = async (tabId) => {
		const tab = tabs.find((t) => t.id === tabId);
		if (!tab) return;

		try {
			// Call onSave callback
			await onSave({
				id: tabId,
				label: tab.label,
				data: tab.data,
			});

			// Mark as saved
			setTabs((prev) =>
				prev.map((t) => {
					if (t.id === tabId) {
						return { ...t, isDirty: false };
					}
					return t;
				})
			);
		} catch (error) {
			console.error("Error saving tab:", error);
			throw error;
		}
	};

	// Save and close tab
	const handleSaveAndClose = async (tabId) => {
		try {
			await handleSaveTab(tabId);
			removeTab(tabId);
			setConfirmDialog({ isOpen: false, tabId: null, action: null });
		} catch (error) {
			// Keep dialog open if save failed
			console.error("Failed to save tab:", error);
		}
	};

	// Discard changes and close tab
	const handleDiscardAndClose = (tabId) => {
		removeTab(tabId);
		setConfirmDialog({ isOpen: false, tabId: null, action: null });
	};

	// Cancel close action
	const handleCancelClose = () => {
		setConfirmDialog({ isOpen: false, tabId: null, action: null });
	};

	// Start editing tab label
	const handleStartEditLabel = (tabId) => {
		const tab = tabs.find((t) => t.id === tabId);
		if (tab) {
			setEditingTabId(tabId);
			setEditingLabel(tab.label);
		}
	};

	// Finish editing tab label
	const handleFinishEditLabel = () => {
		if (editingTabId && editingLabel.trim()) {
			setTabs((prev) =>
				prev.map((tab) => {
					if (tab.id === editingTabId) {
						return { ...tab, label: editingLabel.trim() };
					}
					return tab;
				})
			);
		}
		setEditingTabId(null);
		setEditingLabel("");
	};

	// Cancel editing tab label
	const handleCancelEditLabel = () => {
		setEditingTabId(null);
		setEditingLabel("");
	};

	// Get active tab
	const activeTab = tabs.find((t) => t.id === activeTabId);

	// Tab actions object to pass to renderContent
	const tabActions = {
		updateData: (newData) => handleUpdateTabData(activeTabId, newData),
		save: () => handleSaveTab(activeTabId),
		setDirty: (isDirty) => {
			setTabs((prev) =>
				prev.map((tab) => {
					if (tab.id === activeTabId) {
						return { ...tab, isDirty };
					}
					return tab;
				})
			);
		},
		updateLabel: (newLabel) => {
			setTabs((prev) =>
				prev.map((tab) => {
					if (tab.id === activeTabId) {
						return { ...tab, label: newLabel };
					}
					return tab;
				})
			);
		},
	};

	return (
		<div className="flex flex-col h-full bg-gray-50">
			{/* Tab Bar */}
			<div
				ref={tabBarRef}
				className="flex items-center border-b border-gray-200 bg-white overflow-x-auto"
				style={{ scrollbarWidth: "thin" }}
			>
				{/* Tabs */}
				{tabs.map((tab) => (
					<div
						key={tab.id}
						onClick={() => handleSwitchTab(tab.id)}
						className={`
							group relative flex items-center gap-2 px-4 py-3 border-r border-gray-200 cursor-pointer transition-all flex-shrink-0
							${
								tab.id === activeTabId
									? "bg-white border-b-2 border-green-500 -mb-[1px]"
									: "bg-gray-50 hover:bg-gray-100"
							}
						`}
					>
						{/* Tab Label */}
						{editingTabId === tab.id ? (
							<input
								ref={editInputRef}
								type="text"
								value={editingLabel}
								onChange={(e) => setEditingLabel(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleFinishEditLabel();
									} else if (e.key === "Escape") {
										handleCancelEditLabel();
									}
								}}
								onBlur={handleFinishEditLabel}
								className="w-24 px-2 py-1 text-sm font-medium border border-green-500 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
								onClick={(e) => e.stopPropagation()}
							/>
						) : (
							<>
								<span
									className={`text-sm font-medium ${
										tab.id === activeTabId ? "text-gray-900" : "text-gray-600"
									}`}
									title={tab.label}
								>
									{tab.label.length > 15 ? `${tab.label.substring(0, 15)}...` : tab.label}
								</span>

								{/* Edit button (visible on hover for active tab) */}
								{tab.id === activeTabId && (
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleStartEditLabel(tab.id);
										}}
										className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
										title="Edit label"
									>
										<Edit2 size={14} />
									</button>
								)}

								{/* Dirty indicator */}
								{tab.isDirty && (
									<span className="text-orange-500 font-bold" title="Unsaved changes">
										*
									</span>
								)}

								{/* Close button */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleCloseTab(tab.id);
									}}
									className={`${
										tab.isDirty
											? "opacity-100 text-orange-500"
											: "opacity-0 group-hover:opacity-100"
									} hover:text-red-500 transition-all`}
									title={tab.isDirty ? "Unsaved changes - click to close" : "Close tab"}
								>
									<X size={16} />
								</button>
							</>
						)}
					</div>
				))}

				{/* Add Tab Button */}
				<button
					onClick={handleAddTab}
					disabled={tabs.length >= maxTabs}
					className={`
						ml-auto px-4 py-3 flex items-center gap-2 transition-colors flex-shrink-0
						${
							tabs.length >= maxTabs
								? "text-gray-300 cursor-not-allowed"
								: "text-green-600 hover:bg-green-50"
						}
					`}
					title={
						tabs.length >= maxTabs
							? `Maximum ${maxTabs} tabs reached`
							: `New ${mode === "order" ? "order" : "PO"} (Ctrl+T)`
					}
				>
					<Plus size={18} />
					<span className="text-sm font-medium">New</span>
				</button>
			</div>

			{/* Tab Content */}
			<div className="flex-1 overflow-auto">
				{activeTab && renderContent(activeTab, tabActions)}
			</div>

			{/* Confirmation Dialog */}
			{confirmDialog.isOpen && (
				<ConfirmDialog
					isOpen={confirmDialog.isOpen}
					title="Unsaved Changes"
					message={`Tab "${tabs.find((t) => t.id === confirmDialog.tabId)?.label}" has unsaved changes. What would you like to do?`}
					onSaveAndClose={() => handleSaveAndClose(confirmDialog.tabId)}
					onDiscardAndClose={() => handleDiscardAndClose(confirmDialog.tabId)}
					onCancel={handleCancelClose}
				/>
			)}
		</div>
	);
}

/**
 * ConfirmDialog - Confirmation dialog for unsaved changes
 */
function ConfirmDialog({ isOpen, title, message, onSaveAndClose, onDiscardAndClose, onCancel }) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={onCancel}
			/>

			{/* Dialog */}
			<div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
				{/* Icon */}
				<div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full mb-4">
					<AlertCircle className="text-orange-600" size={24} />
				</div>

				{/* Title */}
				<h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{title}</h3>

				{/* Message */}
				<p className="text-sm text-gray-600 text-center mb-6">{message}</p>

				{/* Actions */}
				<div className="flex flex-col gap-2">
					<button
						onClick={onSaveAndClose}
						className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
					>
						Save & Close
					</button>
					<button
						onClick={onDiscardAndClose}
						className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
					>
						Discard Changes
					</button>
					<button
						onClick={onCancel}
						className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
