// frontend/src/components/dashboard/content/orders/ViewPurchaseOrders.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../../../core/auth/useAuth";
import api from "../../../../core/database/api";

export default function ViewPurchaseOrders() {
	const [purchaseOrders, setPurchaseOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [filter, setFilter] = useState("all");
	const [supplierFilter, setSupplierFilter] = useState("all");
	const [sortBy, setSortBy] = useState("created_at");
	const [sortOrder, setSortOrder] = useState("desc");

	const { user } = useAuth();

	useEffect(() => {
		fetchPurchaseOrders();
	}, []);

	const fetchPurchaseOrders = async () => {
		try {
			setLoading(true);
			const response = await api.get("/orders/purchase-orders");
			setPurchaseOrders(response.data || []);
		} catch (err) {
			console.error("Error fetching purchase orders:", err);
			setError(err.response?.data?.error || "Failed to load purchase orders");
		} finally {
			setLoading(false);
		}
	};

	const uniqueSuppliers = [
		...new Set(purchaseOrders.map((po) => po.supplier_name).filter(Boolean)),
	];

	const filteredPOs = purchaseOrders
		.filter((po) => {
			const statusMatch = filter === "all" || po.status === filter;
			const supplierMatch =
				supplierFilter === "all" || po.supplier_name === supplierFilter;
			return statusMatch && supplierMatch;
		})
		.sort((a, b) => {
			let aVal = a[sortBy];
			let bVal = b[sortBy];

			if (sortBy === "created_at" || sortBy === "expected_delivery_date") {
				aVal = new Date(aVal);
				bVal = new Date(bVal);
			}

			if (sortOrder === "asc") {
				return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
			} else {
				return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
			}
		});

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					View Purchase Orders
				</h2>
				<div className="animate-pulse space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-20 bg-gray-200 rounded"></div>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					View Purchase Orders
				</h2>
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-red-700">{error}</p>
					<button
						onClick={fetchPurchaseOrders}
						className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900">
					View Purchase Orders
				</h2>
				<button
					onClick={() => window.history.pushState({}, "", "/orders")}
					className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
				>
					← Back to Orders
				</button>
			</div>

			{/* Filters and Sorting */}
			<div className="flex flex-wrap gap-4 mb-6">
				{/* Status Filter */}
				<div className="flex gap-2">
					<button
						onClick={() => setFilter("all")}
						className={`px-4 py-2 rounded-lg ${
							filter === "all"
								? "bg-purple-600 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
						}`}
					>
						All POs
					</button>
					<button
						onClick={() => setFilter("draft")}
						className={`px-4 py-2 rounded-lg ${
							filter === "draft"
								? "bg-purple-600 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
						}`}
					>
						Draft
					</button>
					<button
						onClick={() => setFilter("ordered")}
						className={`px-4 py-2 rounded-lg ${
							filter === "ordered"
								? "bg-purple-600 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
						}`}
					>
						Ordered
					</button>
					<button
						onClick={() => setFilter("received")}
						className={`px-4 py-2 rounded-lg ${
							filter === "received"
								? "bg-purple-600 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
						}`}
					>
						Received
					</button>
				</div>

				{/* Supplier Filter */}
				<select
					value={supplierFilter}
					onChange={(e) => setSupplierFilter(e.target.value)}
					className="px-3 py-2 border border-gray-300 rounded-lg"
				>
					<option value="all">All Suppliers</option>
					{uniqueSuppliers.map((supplier) => (
						<option key={supplier} value={supplier}>
							{supplier}
						</option>
					))}
				</select>

				{/* Sort Options */}
				<div className="flex gap-2">
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className="px-3 py-2 border border-gray-300 rounded-lg"
					>
						<option value="created_at">Date Created</option>
						<option value="order_number">PO Number</option>
						<option value="supplier_name">Supplier</option>
						<option value="total">Total Value</option>
						<option value="expected_delivery_date">Delivery Date</option>
					</select>
					<button
						onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
						className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
					>
						{sortOrder === "asc" ? "↑" : "↓"}
					</button>
				</div>
			</div>

			{/* Purchase Orders List */}
			{filteredPOs.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					{filter === "all" && supplierFilter === "all"
						? "No purchase orders found"
						: "No purchase orders match your filters"}
				</div>
			) : (
				<div className="space-y-4">
					{filteredPOs.map((po) => (
						<PurchaseOrderCard key={po.id} purchaseOrder={po} />
					))}
				</div>
			)}
		</div>
	);
}

function PurchaseOrderCard({ purchaseOrder: po }) {
	const statusColors = {
		draft: "bg-gray-100 text-gray-800",
		ordered: "bg-blue-100 text-blue-800",
		received: "bg-yellow-100 text-yellow-800",
		stocked: "bg-green-100 text-green-800",
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount || 0);
	};

	const formatDate = (dateString) => {
		if (!dateString) return "Not set";
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatDateTime = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
			<div className="flex justify-between items-start">
				<div className="flex-1">
					<div className="flex items-center gap-3 mb-2">
						<h3 className="text-lg font-semibold text-gray-900">
							PO: {po.order_number}
						</h3>
						<span
							className={`px-2 py-1 text-xs font-medium rounded-full ${
								statusColors[po.status] || statusColors.draft
							}`}
						>
							{(po.status || "draft").replace("_", " ").toUpperCase()}
						</span>
						{po.order_type && (
							<span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-600 rounded-full">
								{po.order_type.toUpperCase()}
							</span>
						)}
					</div>

					<div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
						<div>
							<span className="font-medium">Supplier:</span>{" "}
							{po.supplier_name || "Not specified"}
						</div>
						<div>
							<span className="font-medium">Total:</span>{" "}
							{formatCurrency(po.total)}
						</div>
						<div>
							<span className="font-medium">Created:</span>{" "}
							{formatDate(po.created_at)}
						</div>
						<div>
							<span className="font-medium">Expected Delivery:</span>{" "}
							{formatDate(po.expected_delivery_date)}
						</div>
					</div>

					{po.source_order_ids && po.source_order_ids.length > 0 && (
						<div className="text-sm text-gray-600">
							<span className="font-medium">Source Orders:</span>{" "}
							{po.source_order_ids.length} order(s)
						</div>
					)}

					{po.notes && (
						<p className="text-sm text-gray-600 mt-2 italic">"{po.notes}"</p>
					)}
				</div>

				<div className="flex gap-2">
					<button className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
						View Details
					</button>
					{po.status === "draft" && (
						<button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
							Edit
						</button>
					)}
					{po.status === "ordered" && (
						<button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
							Mark Received
						</button>
					)}
				</div>
			</div>

			{/* Order Progress Indicator */}
			<div className="mt-3 pt-3 border-t border-gray-100">
				<div className="flex items-center justify-between text-xs text-gray-500">
					<span>Progress:</span>
					<div className="flex-1 mx-3">
						<div className="w-full bg-gray-200 rounded-full h-1">
							<div
								className={`h-1 rounded-full ${
									po.status === "draft"
										? "bg-gray-400 w-1/4"
										: po.status === "ordered"
										? "bg-blue-500 w-1/2"
										: po.status === "received"
										? "bg-yellow-500 w-3/4"
										: "bg-green-500 w-full"
								}`}
							></div>
						</div>
					</div>
					<span className="capitalize">{po.status || "draft"}</span>
				</div>
			</div>
		</div>
	);
}