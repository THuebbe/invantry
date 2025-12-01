// frontend/src/components/dashboard/content/orders/ViewOrders.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../../../core/auth/useAuth";
import api from "../../../../core/database/api";
import OrderDetailsModal from "../../../shared/OrderDetailsModal";

export default function ViewOrders() {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [filter, setFilter] = useState("all");
	const [sortBy, setSortBy] = useState("created_at");
	const [sortOrder, setSortOrder] = useState("desc");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [modalMode, setModalMode] = useState("view");
	const [isModalOpen, setIsModalOpen] = useState(false);

	// eslint-disable-next-line no-unused-vars
	const { user } = useAuth();

	useEffect(() => {
		fetchOrders();
	}, []);

	const fetchOrders = async () => {
		try {
			setLoading(true);
			const response = await api.get("/orders/restaurant-orders");
			setOrders(response.data);
		} catch (err) {
			console.error("Error fetching orders:", err);
			setError(err.response?.data?.error || "Failed to load orders");
		} finally {
			setLoading(false);
		}
	};

	const handleViewDetails = (order) => {
		setSelectedOrder(order);
		setModalMode("view");
		setIsModalOpen(true);
	};

	const handleEditOrder = (order) => {
		setSelectedOrder(order);
		setModalMode("edit");
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedOrder(null);
		setModalMode("view");
	};

	const handleOrderUpdated = (updatedOrder) => {
		// Update the order in the list
		setOrders(prevOrders => 
			prevOrders.map(order => 
				order.id === updatedOrder.id 
					? { ...order, ...updatedOrder, item_count: updatedOrder.items?.length || order.item_count }
					: order
			)
		);
	};

	const filteredOrders = orders
		.filter((order) => {
			const statusMatch = filter === "all" || order.status === filter;
			const searchMatch =
				!searchTerm ||
				order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
			return statusMatch && searchMatch;
		})
		.sort((a, b) => {
			let aVal = a[sortBy];
			let bVal = b[sortBy];

			if (sortBy === "created_at") {
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
				<h2 className="text-2xl font-bold text-gray-900 mb-4">View Orders</h2>
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
				<h2 className="text-2xl font-bold text-gray-900 mb-4">View Orders</h2>
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-red-700">{error}</p>
					<button
						onClick={fetchOrders}
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
				<h2 className="text-2xl font-bold text-gray-900">View Orders</h2>
				<button
					onClick={() => {
						window.history.pushState({}, "", "/orders");
						window.dispatchEvent(new PopStateEvent("popstate"));
					}}
					className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
				>
					← Back to Orders
				</button>
			</div>

			{/* Search Bar */}
			<div className="mb-4">
				<input
					type="text"
					placeholder="Search by order number or notes..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			{/* Filters and Sorting */}
			<div className="flex flex-wrap gap-4 mb-6">
				{/* Status Filter */}
				<div className="flex gap-2">
					<button
						onClick={() => setFilter("all")}
						className={`px-4 py-2 rounded-lg ${
							filter === "all"
								? "bg-blue-600 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
						}`}
					>
						All Orders
					</button>
					<button
						onClick={() => setFilter("draft")}
						className={`px-4 py-2 rounded-lg ${
							filter === "draft"
								? "bg-blue-600 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
						}`}
					>
						Draft
					</button>
					<button
						onClick={() => setFilter("submitted")}
						className={`px-4 py-2 rounded-lg ${
							filter === "submitted"
								? "bg-blue-600 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
						}`}
					>
						Submitted
					</button>
					<button
						onClick={() => setFilter("fulfilled")}
						className={`px-4 py-2 rounded-lg ${
							filter === "fulfilled"
								? "bg-blue-600 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
						}`}
					>
						Fulfilled
					</button>
				</div>

				{/* Sort Options */}
				<div className="flex gap-2">
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className="px-3 py-2 border border-gray-300 rounded-lg"
					>
						<option value="created_at">Date Created</option>
						<option value="order_number">Order Number</option>
						<option value="total_estimated_value">Total Value</option>
						<option value="status">Status</option>
					</select>
					<button
						onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
						className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
					>
						{sortOrder === "asc" ? "↑" : "↓"}
					</button>
				</div>
			</div>

			{/* Orders List */}
			{filteredOrders.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					{filter === "all" ? "No orders found" : `No ${filter} orders found`}
				</div>
			) : (
				<div className="space-y-4">
					{filteredOrders.map((order) => (
						<OrderCard 
							key={order.id} 
							order={order} 
							onViewDetails={handleViewDetails}
							onEditOrder={handleEditOrder}
						/>
					))}
				</div>
			)}

			{/* Order Details Modal */}
			<OrderDetailsModal
				order={selectedOrder}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onOrderUpdated={handleOrderUpdated}
				mode={modalMode}
			/>
		</div>
	);
}

function OrderCard({ order, onViewDetails, onEditOrder }) {
	const statusColors = {
		draft: "bg-gray-100 text-gray-800",
		submitted: "bg-blue-100 text-blue-800",
		partially_fulfilled: "bg-yellow-100 text-yellow-800",
		fulfilled: "bg-green-100 text-green-800",
		cancelled: "bg-red-100 text-red-800",
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount || 0);
	};

	const formatDate = (dateString) => {
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
							{order.order_number}
						</h3>
						<span
							className={`px-2 py-1 text-xs font-medium rounded-full ${
								statusColors[order.status]
							}`}
						>
							{order.status.replace("_", " ").toUpperCase()}
						</span>
					</div>

					<div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
						<div>
							<span className="font-medium">Created:</span>{" "}
							{formatDate(order.created_at)}
						</div>
						<div>
							<span className="font-medium">Total Value:</span>{" "}
							{formatCurrency(order.total_estimated_value)}
						</div>
						<div>
							<span className="font-medium">Items:</span> {order.item_count || 0}
						</div>
					</div>

					{order.notes && (
						<p className="text-sm text-gray-600 mt-2 italic">"{order.notes}"</p>
					)}
				</div>

				<div className="flex gap-2">
					<button
						onClick={() => onViewDetails(order)}
						className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
					>
						Full Details
					</button>
					{order.status === "draft" && (
						<button
							onClick={() => onEditOrder(order)}
							className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
						>
							Edit
						</button>
					)}
				</div>
			</div>
		</div>
	);
}