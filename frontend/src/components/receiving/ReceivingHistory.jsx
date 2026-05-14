// ReceivingHistory - Chronological log of all receiving events

import { useState, useEffect } from "react";
import { getReceivingLog } from "../../services/ordersService";
import {
	Search,
	Calendar,
	ChevronDown,
	ChevronUp,
	Package,
	User,
	AlertCircle,
	Clock,
} from "lucide-react";

export default function ReceivingHistory() {
	const [entries, setEntries] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState(null);
	const [expandedId, setExpandedId] = useState(null);

	// Filters
	const [searchTerm, setSearchTerm] = useState("");
	const [vendor, setVendor] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const LIMIT = 20;

	useEffect(() => {
		fetchLog(true);
	}, []);

	const fetchLog = async (reset = false) => {
		try {
			if (reset) {
				setLoading(true);
			} else {
				setLoadingMore(true);
			}
			setError(null);

			const offset = reset ? 0 : entries.length;
			const filters = {
				limit: LIMIT,
				offset,
			};

			if (searchTerm) filters.poId = searchTerm;
			if (vendor) filters.vendor = vendor;
			if (startDate) filters.startDate = startDate;
			if (endDate) filters.endDate = endDate;

			const result = await getReceivingLog(filters);

			if (reset) {
				setEntries(result.entries);
			} else {
				setEntries((prev) => [...prev, ...result.entries]);
			}
			setTotal(result.total);
		} catch (err) {
			console.error("Error fetching receiving log:", err);
			setError("Failed to load receiving history");
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	};

	const handleApplyFilters = () => {
		fetchLog(true);
	};

	const handleClearFilters = () => {
		setSearchTerm("");
		setVendor("");
		setStartDate("");
		setEndDate("");
		// Fetch with no filters after state update
		setTimeout(() => fetchLog(true), 0);
	};

	const toggleExpand = (id) => {
		setExpandedId(expandedId === id ? null : id);
	};

	const hasMore = entries.length < total;
	const hasFilters = searchTerm || vendor || startDate || endDate;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
					Receiving History
				</h2>
				<p className="text-sm text-gray-600">
					Log of all receiving events
				</p>
			</div>

			{/* Filters */}
			<div className="bg-white rounded-lg border border-gray-200 p-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">
							Vendor
						</label>
						<div className="relative">
							<Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								value={vendor}
								onChange={(e) => setVendor(e.target.value)}
								placeholder="Filter by vendor..."
								className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
							/>
						</div>
					</div>
					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">
							Start Date
						</label>
						<input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						/>
					</div>
					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">
							End Date
						</label>
						<input
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						/>
					</div>
					<div className="flex items-end gap-2">
						<button
							onClick={handleApplyFilters}
							className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
						>
							Apply
						</button>
						{hasFilters && (
							<button
								onClick={handleClearFilters}
								className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
							>
								Clear
							</button>
						)}
					</div>
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
							<div key={i} className="h-20 bg-gray-100 rounded-lg" />
						))}
					</div>
				</div>
			)}

			{/* Empty State */}
			{!loading && !error && entries.length === 0 && (
				<div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
					<Clock size={48} className="mx-auto mb-3 text-gray-300" />
					<h3 className="text-lg font-medium text-gray-900 mb-1">
						No receiving history
					</h3>
					<p className="text-sm text-gray-600">
						{hasFilters
							? "No entries match your filters. Try adjusting them."
							: "Receiving events will appear here as you receive PO items."}
					</p>
				</div>
			)}

			{/* Log Entries */}
			{!loading && entries.length > 0 && (
				<div className="space-y-2">
					{entries.map((entry) => (
						<ReceivingLogCard
							key={entry.id}
							entry={entry}
							isExpanded={expandedId === entry.id}
							onToggle={() => toggleExpand(entry.id)}
						/>
					))}

					{/* Load More */}
					{hasMore && (
						<div className="text-center pt-2">
							<button
								onClick={() => fetchLog(false)}
								disabled={loadingMore}
								className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
							>
								{loadingMore ? "Loading..." : `Load More (${entries.length} of ${total})`}
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function ReceivingLogCard({ entry, isExpanded, onToggle }) {
	const receivedDate = new Date(entry.received_at);
	const items = entry.items_received || [];

	return (
		<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
			{/* Summary Row */}
			<button
				onClick={onToggle}
				className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
			>
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap mb-1">
							<span className="font-semibold text-gray-900">
								{entry.po_number}
							</span>
							<span className="text-sm text-gray-500">
								{entry.vendor_name || "Unknown Vendor"}
							</span>
						</div>
						<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
							<span className="flex items-center gap-1">
								<Calendar size={12} />
								{receivedDate.toLocaleDateString()}{" "}
								{receivedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
							</span>
							<span className="flex items-center gap-1">
								<Package size={12} />
								{entry.total_items_count} item{entry.total_items_count !== 1 ? "s" : ""}
							</span>
							{entry.total_value > 0 && (
								<span className="font-medium text-gray-700">
									${parseFloat(entry.total_value).toFixed(2)}
								</span>
							)}
							{entry.received_by_name && (
								<span className="flex items-center gap-1">
									<User size={12} />
									{entry.received_by_name}
								</span>
							)}
						</div>
					</div>
					<div className="flex-shrink-0 ml-2">
						{isExpanded ? (
							<ChevronUp size={18} className="text-gray-400" />
						) : (
							<ChevronDown size={18} className="text-gray-400" />
						)}
					</div>
				</div>
			</button>

			{/* Expanded Detail */}
			{isExpanded && items.length > 0 && (
				<div className="border-t border-gray-200 bg-gray-50">
					<div className="divide-y divide-gray-200">
						{items.map((item, idx) => (
							<div key={idx} className="px-4 py-3 flex items-center justify-between">
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-900">
										{item.ingredient_name || "Unknown"}
									</p>
									<div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-0.5">
										{item.batch_number && <span>Batch: {item.batch_number}</span>}
										{item.expiration_date && (
											<span>Exp: {new Date(item.expiration_date).toLocaleDateString()}</span>
										)}
										{item.notes && <span className="italic">{item.notes}</span>}
									</div>
								</div>
								<div className="text-right flex-shrink-0 ml-4">
									<p className="text-sm font-medium text-gray-900">
										{item.quantity_received} {item.unit}
									</p>
									{item.unit_price > 0 && (
										<p className="text-xs text-gray-500">
											${(item.quantity_received * item.unit_price).toFixed(2)}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
