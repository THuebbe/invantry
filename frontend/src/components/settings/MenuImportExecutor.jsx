// Menu Import Executor - Progress, results, and navigation to menu items

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePOSImport } from "../../hooks/usePOSImport";
import {
	ArrowLeft,
	Loader2,
	CheckCircle,
	XCircle,
	AlertTriangle,
	ArrowRight,
	RefreshCw,
	ChefHat,
	ExternalLink,
} from "lucide-react";

export default function MenuImportExecutor({ posSystem, onBack, onComplete }) {
	const navigate = useNavigate();
	const [importOptions, setImportOptions] = useState({
		updateExisting: true,
		deactivateMissing: false,
	});
	const [importStarted, setImportStarted] = useState(false);

	const importMutation = usePOSImport();

	const handleStartImport = async () => {
		setImportStarted(true);
		try {
			await importMutation.mutateAsync({
				posSystem,
				options: importOptions,
			});
		} catch (error) {
			console.error("Import failed:", error);
		}
	};

	// Pre-import options screen
	if (!importStarted) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="flex items-center gap-4 mb-6">
					<button
						onClick={onBack}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<ArrowLeft className="w-5 h-5 text-gray-600" />
					</button>
					<div>
						<h2 className="text-xl font-bold text-gray-900">Import Options</h2>
						<p className="text-sm text-gray-600">Configure how items should be imported</p>
					</div>
				</div>

				<div className="space-y-4 mb-8">
					<label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
						<input
							type="checkbox"
							checked={importOptions.updateExisting}
							onChange={(e) =>
								setImportOptions((prev) => ({
									...prev,
									updateExisting: e.target.checked,
								}))
							}
							className="mt-1 w-4 h-4 text-orange-500 focus:ring-orange-500 rounded"
						/>
						<div>
							<p className="font-medium text-gray-900">Update Existing Items</p>
							<p className="text-sm text-gray-600">
								If an item already exists, update its name, price, and category to match the
								POS data
							</p>
						</div>
					</label>

					<label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
						<input
							type="checkbox"
							checked={importOptions.deactivateMissing}
							onChange={(e) =>
								setImportOptions((prev) => ({
									...prev,
									deactivateMissing: e.target.checked,
								}))
							}
							className="mt-1 w-4 h-4 text-orange-500 focus:ring-orange-500 rounded"
						/>
						<div>
							<p className="font-medium text-gray-900">Deactivate Missing Items</p>
							<p className="text-sm text-gray-600">
								If an item exists in Invantry but not in the POS, mark it as inactive
							</p>
							<p className="text-xs text-amber-600 mt-1">
								Use with caution - this will hide items from your active menu
							</p>
						</div>
					</label>
				</div>

				<div className="flex justify-between items-center pt-6 border-t">
					<button
						onClick={onBack}
						className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
					>
						Back to Preview
					</button>
					<button
						onClick={handleStartImport}
						className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
					>
						Start Import
						<ArrowRight className="w-4 h-4" />
					</button>
				</div>
			</div>
		);
	}

	// Import in progress
	if (importMutation.isPending) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="text-center py-12">
					<Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
					<h2 className="text-xl font-bold text-gray-900 mb-2">Importing Menu Items</h2>
					<p className="text-gray-600">Please wait while we sync your menu from {posSystem}...</p>
				</div>
			</div>
		);
	}

	// Import failed
	if (importMutation.isError) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="text-center py-12">
					<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<XCircle className="w-8 h-8 text-red-600" />
					</div>
					<h2 className="text-xl font-bold text-gray-900 mb-2">Import Failed</h2>
					<p className="text-gray-600 mb-4 max-w-md mx-auto">
						{importMutation.error?.message || "An error occurred during import"}
					</p>
					<div className="flex justify-center gap-3">
						<button
							onClick={onBack}
							className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
						>
							Back
						</button>
						<button
							onClick={handleStartImport}
							className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
						>
							<RefreshCw className="w-4 h-4" />
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Import successful
	const result = importMutation.data;
	const stats = result?.stats || {};

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			{/* Success Header */}
			<div className="text-center py-8 mb-6">
				<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<CheckCircle className="w-8 h-8 text-green-600" />
				</div>
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete!</h2>
				<p className="text-gray-600">
					Successfully synced {stats.total || 0} menu items from {posSystem}
				</p>
			</div>

			{/* Stats Summary */}
			<div className="grid grid-cols-4 gap-4 mb-8">
				<ResultStat label="Total Items" value={stats.total || 0} color="gray" />
				<ResultStat label="Created" value={stats.created || 0} color="green" />
				<ResultStat label="Updated" value={stats.updated || 0} color="blue" />
				{stats.errors > 0 && (
					<ResultStat label="Errors" value={stats.errors} color="red" />
				)}
				{stats.skipped > 0 && (
					<ResultStat label="Skipped" value={stats.skipped} color="gray" />
				)}
			</div>

			{/* Results List */}
			{result?.results?.length > 0 && (
				<div className="mb-8">
					<h3 className="font-semibold text-gray-900 mb-3">Import Details</h3>
					<div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 sticky top-0">
								<tr>
									<th className="px-4 py-2 text-left font-medium text-gray-700">Item</th>
									<th className="px-4 py-2 text-left font-medium text-gray-700">Action</th>
									<th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
								</tr>
							</thead>
							<tbody>
								{result.results.slice(0, 50).map((item, idx) => (
									<tr key={idx} className="border-t">
										<td className="px-4 py-2">{item.name}</td>
										<td className="px-4 py-2 capitalize">{item.action}</td>
										<td className="px-4 py-2">
											<ActionBadge action={item.action} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{result.results.length > 50 && (
							<div className="p-3 bg-gray-50 text-center text-sm text-gray-600">
								...and {result.results.length - 50} more items
							</div>
						)}
					</div>
				</div>
			)}

			{/* Next Steps */}
			<div className="border-t pt-6">
				<h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
				<div className="space-y-3">
					<button
						onClick={() => navigate("/menu-items")}
						className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
					>
						<div className="flex items-center gap-3">
							<ChefHat className="w-5 h-5 text-gray-600" />
							<div className="text-left">
								<p className="font-medium text-gray-900">View Menu Items</p>
								<p className="text-sm text-gray-600">
									Review and add recipes to your imported items
								</p>
							</div>
						</div>
						<ExternalLink className="w-4 h-4 text-gray-400" />
					</button>

					<button
						onClick={() => {
							onComplete?.();
							onBack?.();
						}}
						className="w-full flex items-center justify-center gap-2 p-4 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
					>
						<RefreshCw className="w-4 h-4" />
						Import More Items
					</button>
				</div>
			</div>
		</div>
	);
}

function ResultStat({ label, value, color }) {
	const colorClasses = {
		gray: "bg-gray-100 text-gray-700",
		green: "bg-green-100 text-green-700",
		blue: "bg-blue-100 text-blue-700",
		red: "bg-red-100 text-red-700",
	};

	return (
		<div className={`p-4 rounded-lg text-center ${colorClasses[color]}`}>
			<p className="text-2xl font-bold">{value}</p>
			<p className="text-sm">{label}</p>
		</div>
	);
}

function ActionBadge({ action }) {
	const config = {
		created: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
		updated: { bg: "bg-blue-100", text: "text-blue-700", icon: RefreshCw },
		skipped: { bg: "bg-gray-100", text: "text-gray-600", icon: null },
		error: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
		deactivated: { bg: "bg-amber-100", text: "text-amber-700", icon: AlertTriangle },
	};

	const { bg, text, icon: Icon } = config[action] || config.skipped;

	return (
		<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${bg} ${text} text-xs`}>
			{Icon && <Icon className="w-3 h-3" />}
			{action}
		</span>
	);
}
