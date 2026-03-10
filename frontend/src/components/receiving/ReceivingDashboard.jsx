// Receiving Dashboard - Landing page with PO search and open PO list

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOpenPOs } from "../../services/ordersService";
import {
	Search,
	Truck,
	Package,
	Clock,
	ChevronRight,
	AlertCircle,
	CheckCircle2,
} from "lucide-react";

export default function ReceivingDashboard() {
	const navigate = useNavigate();
	const [openPOs, setOpenPOs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		fetchOpenPOs();
	}, []);

	const fetchOpenPOs = async (search = "") => {
		try {
			setLoading(true);
			setError(null);
			const data = await getOpenPOs(search ? { search } : {});
			setOpenPOs(data);
		} catch (err) {
			console.error("Error fetching open POs:", err);
			setError("Failed to load purchase orders");
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (e) => {
		const value = e.target.value;
		setSearchTerm(value);

		// Debounce search
		clearTimeout(window._receivingSearchTimeout);
		window._receivingSearchTimeout = setTimeout(() => {
			fetchOpenPOs(value);
		}, 300);
	};

	const handleReceive = (poId) => {
		navigate(`/receiving/new?poId=${poId}`);
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "ordered":
				return "bg-blue-100 text-blue-800";
			case "backordered":
				return "bg-yellow-100 text-yellow-800";
			case "draft":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
					<div>
						<h2 className="text-xl md:text-2xl font-bold text-gray-900">
							Receiving
						</h2>
						<p className="text-sm text-gray-600 mt-1">
							Select a purchase order to receive items
						</p>
					</div>
					<div className="flex gap-2">
						<button
							onClick={() => navigate("/receiving/new")}
							className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
						>
							<Truck size={16} />
							Receive Shipment
						</button>
					</div>
				</div>

				{/* Search Bar */}
				<div className="relative">
					<Search
						size={18}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
					/>
					<input
						type="text"
						value={searchTerm}
						onChange={handleSearch}
						placeholder="Search by PO number or vendor name..."
						className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
					/>
				</div>
			</div>

			{/* Error */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
					<AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
					<p className="text-red-700 text-sm">{error}</p>
				</div>
			)}

			{/* Loading */}
			{loading && (
				<div className="bg-white rounded-lg border border-gray-200 p-6">
					<div className="animate-pulse space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-24 bg-gray-100 rounded-lg" />
						))}
					</div>
				</div>
			)}

			{/* Empty State */}
			{!loading && !error && openPOs.length === 0 && (
				<div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
					<Package size={48} className="mx-auto mb-3 text-gray-300" />
					<h3 className="text-lg font-medium text-gray-900 mb-1">
						{searchTerm ? "No matching POs found" : "No open purchase orders"}
					</h3>
					<p className="text-sm text-gray-600">
						{searchTerm
							? "Try a different search term"
							: "Create a purchase order first to start receiving"}
					</p>
				</div>
			)}

			{/* Open PO List */}
			{!loading && openPOs.length > 0 && (
				<div className="space-y-3">
					{openPOs.map((po) => (
						<div
							key={po.id}
							onClick={() => handleReceive(po.id)}
							className="bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
						>
							<div className="flex items-start justify-between mb-3">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<h3 className="font-semibold text-gray-900">
											{po.order_number}
										</h3>
										<span
											className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}
										>
											{po.status}
										</span>
									</div>
									<p className="text-sm text-gray-600 mt-1">
										{po.supplier_name || "Unknown Vendor"}
									</p>
								</div>
								<ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
							</div>

							{/* Info Row */}
							<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
								<span className="flex items-center gap-1">
									<Package size={12} />
									{po.item_count} items
								</span>
								{po.order_date && (
									<span className="flex items-center gap-1">
										<Clock size={12} />
										Ordered: {new Date(po.order_date).toLocaleDateString()}
									</span>
								)}
								{po.expected_delivery_date && (
									<span className="flex items-center gap-1">
										<Truck size={12} />
										Expected: {new Date(po.expected_delivery_date).toLocaleDateString()}
									</span>
								)}
								{po.total > 0 && (
									<span className="font-medium text-gray-700">
										${parseFloat(po.total).toFixed(2)}
									</span>
								)}
							</div>

							{/* Progress Bar */}
							<div className="flex items-center gap-3">
								<div className="flex-1 bg-gray-200 rounded-full h-2">
									<div
										className={`h-2 rounded-full transition-all ${
											po.percent_complete >= 100
												? "bg-green-500"
												: po.percent_complete > 0
													? "bg-purple-500"
													: "bg-gray-300"
										}`}
										style={{ width: `${Math.min(po.percent_complete, 100)}%` }}
									/>
								</div>
								<span className="text-xs font-medium text-gray-600 min-w-[40px] text-right">
									{po.percent_complete}%
								</span>
								{po.percent_complete >= 100 && (
									<CheckCircle2 size={14} className="text-green-500" />
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
