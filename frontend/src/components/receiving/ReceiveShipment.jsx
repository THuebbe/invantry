// ReceiveShipment - PO selector with barcode scan, then renders receiving form

import { useState, useEffect } from "react";
import { getOpenPOs } from "../../services/ordersService";
import ReceivePurchaseOrder from "../dashboard/content/orders/ReceivePurchaseOrder";
import BarcodeScanner from "./BarcodeScanner";
import {
	Search,
	ScanLine,
	Package,
	Truck,
	Clock,
	ChevronRight,
	ArrowLeft,
	AlertCircle,
} from "lucide-react";

export default function ReceiveShipment({ params }) {
	const [selectedPoId, setSelectedPoId] = useState(params?.poId || null);
	const [openPOs, setOpenPOs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [showScanner, setShowScanner] = useState(false);
	const [scanError, setScanError] = useState(null);

	useEffect(() => {
		if (!selectedPoId) {
			fetchOpenPOs();
		}
	}, [selectedPoId]);

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

		clearTimeout(window._receiveShipmentSearchTimeout);
		window._receiveShipmentSearchTimeout = setTimeout(() => {
			fetchOpenPOs(value);
		}, 300);
	};

	const handleScan = (scannedText) => {
		setShowScanner(false);
		setScanError(null);

		// Try to match scanned value against open POs by order_number
		const match = openPOs.find(
			(po) =>
				po.order_number === scannedText ||
				po.order_number.toLowerCase() === scannedText.toLowerCase()
		);

		if (match) {
			setSelectedPoId(match.id);
		} else {
			// Try to search with the scanned text
			setScanError(
				`No matching PO found for "${scannedText}". Try searching manually.`
			);
			setSearchTerm(scannedText);
			fetchOpenPOs(scannedText);
		}
	};

	const handleSelectPO = (poId) => {
		setSelectedPoId(poId);
	};

	const handleBack = () => {
		setSelectedPoId(null);
		setScanError(null);
		// Update URL without the poId param
		window.history.replaceState({}, "", "/receiving/new");
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

	// If a PO is selected, show the receiving form
	if (selectedPoId) {
		return <ReceivePurchaseOrder poId={selectedPoId} onBack={handleBack} />;
	}

	// Otherwise show PO selector
	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
					Receive Shipment
				</h2>
				<p className="text-sm text-gray-600">
					Scan a barcode, search by PO number, or select from the list below
				</p>

				{/* Search + Scan Row */}
				<div className="flex gap-2 mt-4">
					<div className="relative flex-1">
						<Search
							size={18}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
						/>
						<input
							type="text"
							value={searchTerm}
							onChange={handleSearch}
							placeholder="Search PO number or vendor..."
							className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
						/>
					</div>
					<button
						onClick={() => setShowScanner(true)}
						className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium flex-shrink-0"
						title="Scan barcode or QR code"
					>
						<ScanLine size={18} />
						<span className="hidden sm:inline">Scan</span>
					</button>
				</div>
			</div>

			{/* Scan Error */}
			{scanError && (
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
					<AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
					<p className="text-amber-700 text-sm">{scanError}</p>
				</div>
			)}

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
					<div className="animate-pulse space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-20 bg-gray-100 rounded-lg" />
						))}
					</div>
				</div>
			)}

			{/* Empty */}
			{!loading && !error && openPOs.length === 0 && (
				<div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
					<Package size={48} className="mx-auto mb-3 text-gray-300" />
					<h3 className="text-lg font-medium text-gray-900 mb-1">
						{searchTerm ? "No matching POs" : "No open purchase orders"}
					</h3>
					<p className="text-sm text-gray-600">
						{searchTerm
							? "Try a different search or scan a barcode"
							: "Create a purchase order to start receiving"}
					</p>
				</div>
			)}

			{/* PO List */}
			{!loading && openPOs.length > 0 && (
				<div className="space-y-2">
					{openPOs.map((po) => (
						<button
							key={po.id}
							onClick={() => handleSelectPO(po.id)}
							className="w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all"
						>
							<div className="flex items-center justify-between">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap mb-1">
										<span className="font-semibold text-gray-900">
											{po.order_number}
										</span>
										<span
											className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}
										>
											{po.status}
										</span>
									</div>
									<p className="text-sm text-gray-600">
										{po.supplier_name || "Unknown Vendor"}
									</p>
									<div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-1">
										<span>{po.item_count} items</span>
										{po.expected_delivery_date && (
											<span>
												Expected: {new Date(po.expected_delivery_date).toLocaleDateString()}
											</span>
										)}
										<span>{po.percent_complete}% received</span>
									</div>
								</div>
								<ChevronRight size={18} className="text-gray-400 flex-shrink-0 ml-2" />
							</div>
						</button>
					))}
				</div>
			)}

			{/* Barcode Scanner Modal */}
			{showScanner && (
				<BarcodeScanner
					onScan={handleScan}
					onClose={() => setShowScanner(false)}
				/>
			)}
		</div>
	);
}
