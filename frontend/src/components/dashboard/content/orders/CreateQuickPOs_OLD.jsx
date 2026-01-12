// frontend/src/components/dashboard/content/orders/CreateQuickPOs.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../../../core/auth/useAuth";
import api from "../../../../core/database/api";

export default function CreateQuickPOs() {
	const [pendingOrders, setPendingOrders] = useState([]);
	const [vendorGroups, setVendorGroups] = useState({});
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [selectedVendors, setSelectedVendors] = useState(new Set());

	const { user } = useAuth();

	useEffect(() => {
		fetchPendingOrders();
	}, []);

	const fetchPendingOrders = async () => {
		try {
			setLoading(true);
			const response = await api.get("/orders/pending-for-pos");
			const orders = response.data || [];
			setPendingOrders(orders);

			// Group order items by vendor/supplier
			const groups = {};
			orders.forEach((order) => {
				order.items?.forEach((item) => {
					const vendor = item.supplier_name || "Unassigned Supplier";
					if (!groups[vendor]) {
						groups[vendor] = {
							vendor,
							orders: new Set(),
							items: [],
							totalValue: 0,
						};
					}
					groups[vendor].orders.add(order.order_number);
					groups[vendor].items.push({
						...item,
						source_order_id: order.id,
						source_order_number: order.order_number,
					});
					groups[vendor].totalValue += item.estimated_line_total || 0;
				});
			});

			// Convert Sets to arrays for rendering
			Object.values(groups).forEach((group) => {
				group.orders = Array.from(group.orders);
			});

			setVendorGroups(groups);

			// Select all vendors by default
			setSelectedVendors(new Set(Object.keys(groups)));
		} catch (err) {
			console.error("Error fetching pending orders:", err);
			setError(err.response?.data?.error || "Failed to load pending orders");
		} finally {
			setLoading(false);
		}
	};

	const toggleVendorSelection = (vendor) => {
		setSelectedVendors((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(vendor)) {
				newSet.delete(vendor);
			} else {
				newSet.add(vendor);
			}
			return newSet;
		});
	};

	const createPurchaseOrders = async () => {
		if (selectedVendors.size === 0) {
			setError("Please select at least one vendor to create purchase orders");
			return;
		}

		try {
			setCreating(true);
			setError(null);

			const results = [];
			
			for (const vendor of selectedVendors) {
				const group = vendorGroups[vendor];
				
				const poData = {
					supplierName: vendor,
					expectedDeliveryDate: null, // Can be set later
					notes: `Auto-generated PO from orders: ${group.orders.join(", ")}`,
					orderItemIds: group.items.map(item => item.id), // Use order item IDs for linking
				};

				const response = await api.post("/orders/from-order-items", poData);
				results.push({
					vendor,
					poNumber: response.data.purchaseOrder.order_number, // Fixed path to PO number
					success: true,
				});
			}

			setSuccess({
				message: `Successfully created ${results.length} purchase order(s)`,
				details: results,
			});

			// Refresh the pending orders list
			setTimeout(() => {
				fetchPendingOrders();
			}, 1000);

		} catch (err) {
			console.error("Error creating purchase orders:", err);
			setError(err.response?.data?.error || "Failed to create purchase orders");
		} finally {
			setCreating(false);
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Create Quick Purchase Orders
				</h2>
				<div className="animate-pulse space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-20 bg-gray-200 rounded"></div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900">
					Create Quick Purchase Orders
				</h2>
				<button
					onClick={() => window.history.pushState({}, "", "/orders")}
					className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
				>
					← Back to Orders
				</button>
			</div>

			<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
				<p className="text-green-800">
					<strong>Quick Purchase Orders:</strong> This will automatically create
					purchase orders for all pending orders that don't have POs yet,
					grouping items by supplier/vendor. Select which vendors you want to
					create POs for.
				</p>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<p className="text-red-700">{error}</p>
				</div>
			)}

			{success && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
					<p className="text-green-700 font-medium">{success.message}</p>
					<div className="mt-2 space-y-1">
						{success.details.map((result, index) => (
							<p key={index} className="text-sm text-green-600">
								• {result.vendor}: PO #{result.poNumber}
							</p>
						))}
					</div>
				</div>
			)}

			{Object.keys(vendorGroups).length === 0 ? (
				<div className="text-center py-8">
					<div className="text-6xl mb-4">✅</div>
					<h3 className="text-xl font-semibold text-gray-900 mb-2">
						No Pending Orders
					</h3>
					<p className="text-gray-600 mb-4">
						All orders already have purchase orders created, or there are no
						orders waiting for PO generation.
					</p>
					<button
						onClick={() =>
							window.history.pushState({}, "", "/orders/create-custom-po")
						}
						className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
					>
						Create Custom Purchase Order
					</button>
				</div>
			) : (
				<div>
					{/* Vendor Selection */}
					<div className="mb-6">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-900">
								Vendors with Pending Items ({Object.keys(vendorGroups).length})
							</h3>
							<div className="flex gap-2">
								<button
									onClick={() =>
										setSelectedVendors(new Set(Object.keys(vendorGroups)))
									}
									className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
								>
									Select All
								</button>
								<button
									onClick={() => setSelectedVendors(new Set())}
									className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
								>
									Clear All
								</button>
							</div>
						</div>

						<div className="space-y-3">
							{Object.values(vendorGroups).map((group) => (
								<VendorGroup
									key={group.vendor}
									group={group}
									isSelected={selectedVendors.has(group.vendor)}
									onToggle={() => toggleVendorSelection(group.vendor)}
								/>
							))}
						</div>
					</div>

					{/* Summary and Actions */}
					<div className="bg-gray-50 rounded-lg p-4 mb-6">
						<div className="flex justify-between items-center mb-2">
							<span className="text-lg font-semibold text-gray-900">
								Summary:
							</span>
							<span className="text-lg font-bold text-purple-600">
								{selectedVendors.size} POs to create
							</span>
						</div>
						<p className="text-sm text-gray-600">
							Total estimated value: $
							{Object.values(vendorGroups)
								.filter((group) => selectedVendors.has(group.vendor))
								.reduce((total, group) => total + group.totalValue, 0)
								.toFixed(2)}
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3">
						<button
							onClick={createPurchaseOrders}
							disabled={creating || selectedVendors.size === 0}
							className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{creating
								? "Creating Purchase Orders..."
								: `Create ${selectedVendors.size} Purchase Order${
										selectedVendors.size !== 1 ? "s" : ""
								  }`}
						</button>
						<button
							onClick={fetchPendingOrders}
							className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							Refresh
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function VendorGroup({ group, isSelected, onToggle }) {
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount || 0);
	};

	return (
		<div
			className={`border rounded-lg p-4 cursor-pointer transition-all ${
				isSelected
					? "border-green-300 bg-green-50"
					: "border-gray-200 bg-white hover:border-gray-300"
			}`}
			onClick={onToggle}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<input
						type="checkbox"
						checked={isSelected}
						onChange={onToggle}
						className="h-4 w-4 text-green-600 rounded"
					/>
					<div>
						<h4 className="font-semibold text-gray-900">{group.vendor}</h4>
						<p className="text-sm text-gray-600">
							{group.items.length} items from {group.orders.length} order(s)
						</p>
					</div>
				</div>
				<div className="text-right">
					<p className="font-semibold text-gray-900">
						{formatCurrency(group.totalValue)}
					</p>
					<p className="text-sm text-gray-600">Estimated Total</p>
				</div>
			</div>

			{/* Order References */}
			<div className="mt-2 text-sm text-gray-600">
				<span className="font-medium">Source Orders:</span> {group.orders.join(", ")}
			</div>

			{/* Preview of items */}
			<div className="mt-2 text-sm text-gray-500">
				<span className="font-medium">Items preview:</span>{" "}
				{group.items
					.slice(0, 3)
					.map((item) => item.ingredient_name)
					.join(", ")}
				{group.items.length > 3 && ` and ${group.items.length - 3} more...`}
			</div>
		</div>
	);
}