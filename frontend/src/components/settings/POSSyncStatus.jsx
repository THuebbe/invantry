// POS Sync Status - Last sync time, health indicator, manual trigger

import { useSyncStatus, useSyncSales } from "../../hooks/useSales";
import { useProcessDeductions } from "../../hooks/useDeductions";
import {
	RefreshCw,
	CheckCircle,
	AlertCircle,
	Clock,
	Loader2,
	Wifi,
	WifiOff,
} from "lucide-react";

export default function POSSyncStatus() {
	const syncStatusQuery = useSyncStatus();
	const syncMutation = useSyncSales();
	const processMutation = useProcessDeductions();

	const status = syncStatusQuery.data || {};
	const isConnected = !!status.posSystem;

	const handleFullSync = async () => {
		if (!status.posSystem) return;

		// Sync last 24 hours
		const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
		const endDate = new Date().toISOString();

		try {
			await syncMutation.mutateAsync({
				posSystem: status.posSystem,
				startDate,
				endDate,
			});
			// Then process deductions
			await processMutation.mutateAsync();
		} catch (error) {
			console.error("Sync failed:", error);
		}
	};

	const isSyncing = syncMutation.isPending || processMutation.isPending;

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-gray-900">POS Sync Status</h3>
				<div className="flex items-center gap-2">
					{isConnected ? (
						<Wifi className="w-4 h-4 text-green-500" />
					) : (
						<WifiOff className="w-4 h-4 text-gray-400" />
					)}
					<span
						className={`text-sm font-medium ${
							isConnected ? "text-green-600" : "text-gray-500"
						}`}
					>
						{isConnected ? `Connected (${status.posSystem})` : "Not Connected"}
					</span>
				</div>
			</div>

			{/* Status Details */}
			<div className="space-y-3 mb-4">
				<div className="flex items-center justify-between py-2 border-b">
					<span className="text-sm text-gray-600 flex items-center gap-2">
						<Clock className="w-4 h-4" />
						Last Sync
					</span>
					<span className="text-sm font-medium text-gray-900">
						{status.lastSync
							? new Date(status.lastSync).toLocaleString()
							: "Never"}
					</span>
				</div>
				<div className="flex items-center justify-between py-2 border-b">
					<span className="text-sm text-gray-600 flex items-center gap-2">
						<AlertCircle className="w-4 h-4" />
						Pending Deductions
					</span>
					<span
						className={`text-sm font-medium ${
							status.unprocessedSales > 0
								? "text-amber-600"
								: "text-green-600"
						}`}
					>
						{status.unprocessedSales || 0} sales
					</span>
				</div>
			</div>

			{/* Sync Results */}
			{syncMutation.isSuccess && (
				<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
					<div className="flex items-center gap-2">
						<CheckCircle className="w-4 h-4 text-green-600" />
						<span className="text-sm text-green-800">
							Synced {syncMutation.data?.stats?.fetched || 0} orders
							{processMutation.isSuccess &&
								`, processed ${processMutation.data?.succeeded || 0} deductions`}
						</span>
					</div>
				</div>
			)}

			{syncMutation.isError && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<div className="flex items-center gap-2">
						<AlertCircle className="w-4 h-4 text-red-600" />
						<span className="text-sm text-red-800">
							Sync failed: {syncMutation.error?.message || "Unknown error"}
						</span>
					</div>
				</div>
			)}

			{/* Sync Button */}
			<button
				onClick={handleFullSync}
				disabled={isSyncing || !isConnected}
				className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{isSyncing ? (
					<>
						<Loader2 className="w-4 h-4 animate-spin" />
						{syncMutation.isPending ? "Syncing Sales..." : "Processing Deductions..."}
					</>
				) : (
					<>
						<RefreshCw className="w-4 h-4" />
						Sync Now
					</>
				)}
			</button>
		</div>
	);
}
