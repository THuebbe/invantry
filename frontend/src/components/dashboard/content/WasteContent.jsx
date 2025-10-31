// /frontend/src/components/dashboard/content/WasteContent.jsx

export default function WasteContent({ subsection }) {
	// This component is no longer needed since we moved waste to hybrid approach
	// Redirecting to appropriate location

	if (subsection === "log") {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Log Waste</h2>
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
					<p className="text-blue-700 font-semibold">
						Waste logging has moved!
					</p>
					<p className="text-sm text-blue-600 mt-2">
						Go to Inventory → Remove/Log Waste to log waste items
					</p>
				</div>
			</div>
		);
	}

	// For all other subsections, show redirect message
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">
				Waste Tracking Moved
			</h2>
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
				<p className="text-blue-700 font-semibold">
					Waste tracking is now part of the hybrid system!
				</p>
				<p className="text-sm text-blue-600 mt-4">
					<strong>To log waste:</strong> Go to Inventory → Remove/Log Waste
				</p>
				<p className="text-sm text-blue-600 mt-2">
					<strong>To view analytics:</strong> Go to Reports → Waste Analysis
				</p>
			</div>
		</div>
	);
}

// Log Waste View (placeholder for now)
function LogWasteView() {
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">Log Waste</h2>
			<div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
				<p className="text-green-700">Waste logging form coming next!</p>
				<p className="text-sm text-green-600 mt-2">
					API integration is ready - just need to build the UI
				</p>
			</div>
		</div>
	);
}

// Waste History View
function WasteHistoryView({ entries, loading }) {
	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading waste entries...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">Waste History</h2>

			{!entries || entries.length === 0 ? (
				<div className="text-center py-12 text-gray-500">
					<p>No waste entries yet</p>
					<p className="text-sm mt-2">
						Start logging waste to see history here
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{entries.map((entry) => (
						<WasteEntryCard
							key={entry.id}
							entry={entry}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// Analytics View
function WasteAnalyticsView({ summary, loading }) {
	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading analytics...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">Waste Analytics</h2>

			{summary ? (
				<div className="grid grid-cols-2 gap-4">
					<div className="p-4 bg-red-50 rounded-lg border border-red-200">
						<h3 className="text-sm font-medium text-red-900 mb-2">
							Total Value
						</h3>
						<p className="text-2xl font-bold text-red-700">
							${summary.totalValue?.toFixed(2) || "0.00"}
						</p>
					</div>

					<div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
						<h3 className="text-sm font-medium text-yellow-900 mb-2">
							Total Items
						</h3>
						<p className="text-2xl font-bold text-yellow-700">
							{summary.totalItems || 0}
						</p>
					</div>

					<div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
						<h3 className="text-sm font-medium text-purple-900 mb-2">
							Top Reason
						</h3>
						<p className="text-lg font-semibold text-purple-700">
							{summary.topReason || "N/A"}
						</p>
					</div>

					<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
						<h3 className="text-sm font-medium text-blue-900 mb-2">
							Top Category
						</h3>
						<p className="text-lg font-semibold text-blue-700">
							{summary.topCategory || "N/A"}
						</p>
					</div>
				</div>
			) : (
				<div className="text-center py-12 text-gray-500">
					<p>No analytics data available yet</p>
				</div>
			)}
		</div>
	);
}

// Individual waste entry card
function WasteEntryCard({ entry }) {
	return (
		<div className="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h3 className="font-semibold text-gray-900">
						{entry.ingredient_name}
					</h3>
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
						<span>Reason: {entry.reason}</span>
						<span>
							Qty: {entry.quantity} {entry.unit}
						</span>
						{entry.value && <span>Value: ${entry.value.toFixed(2)}</span>}
					</div>
					{entry.notes && (
						<p className="text-sm text-gray-500 mt-2">{entry.notes}</p>
					)}
				</div>

				<div className="text-right text-xs text-gray-500">
					{new Date(entry.logged_at).toLocaleDateString()}
				</div>
			</div>
		</div>
	);
}
