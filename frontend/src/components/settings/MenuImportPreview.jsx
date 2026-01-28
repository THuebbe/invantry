// Menu Import Preview - Shows items to create/update with diff view

import { useState } from "react";
import { usePOSImportPreview } from "../../hooks/usePOSImport";
import {
	ArrowLeft,
	Loader2,
	Plus,
	RefreshCw,
	CheckCircle,
	AlertCircle,
	ChevronDown,
	ChevronUp,
	Package,
	ArrowRight,
} from "lucide-react";

export default function MenuImportPreview({ posSystem, onBack, onStartImport }) {
	const [expandedSection, setExpandedSection] = useState("toCreate");
	const { data, isLoading, error, refetch, isRefetching } = usePOSImportPreview(posSystem);

	if (isLoading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
					<span className="ml-3 text-gray-600">Loading menu items from {posSystem}...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="flex items-center gap-4 mb-6">
					<button
						onClick={onBack}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<ArrowLeft className="w-5 h-5 text-gray-600" />
					</button>
					<h2 className="text-xl font-bold text-gray-900">Import Preview</h2>
				</div>
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex items-center gap-3">
						<AlertCircle className="w-5 h-5 text-red-600" />
						<div>
							<p className="font-medium text-red-800">Failed to load preview</p>
							<p className="text-sm text-red-700 mt-1">{error.message}</p>
						</div>
					</div>
					<button
						onClick={() => refetch()}
						className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	const preview = data?.preview || {};
	const stats = data?.stats || {};

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<button
						onClick={onBack}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<ArrowLeft className="w-5 h-5 text-gray-600" />
					</button>
					<div>
						<h2 className="text-xl font-bold text-gray-900">Import Preview</h2>
						<p className="text-sm text-gray-600">
							Review changes before importing from {posSystem}
						</p>
					</div>
				</div>
				<button
					onClick={() => refetch()}
					disabled={isRefetching}
					className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
					Refresh
				</button>
			</div>

			{/* Summary Stats */}
			<div className="grid grid-cols-4 gap-4 mb-6">
				<StatCard
					label="Total Items"
					value={stats.total || 0}
					icon={Package}
					color="gray"
				/>
				<StatCard
					label="New Items"
					value={stats.toCreate || 0}
					icon={Plus}
					color="green"
				/>
				<StatCard
					label="To Update"
					value={stats.toUpdate || 0}
					icon={RefreshCw}
					color="blue"
				/>
				<StatCard
					label="No Changes"
					value={stats.noChanges || 0}
					icon={CheckCircle}
					color="gray"
				/>
			</div>

			{/* Categories */}
			{preview.categories?.length > 0 && (
				<div className="mb-6">
					<h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
					<div className="flex flex-wrap gap-2">
						{preview.categories.map((category) => (
							<span
								key={category}
								className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
							>
								{category}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Items to Create */}
			{preview.toCreate?.length > 0 && (
				<ItemSection
					title="New Items to Create"
					items={preview.toCreate}
					color="green"
					icon={Plus}
					isExpanded={expandedSection === "toCreate"}
					onToggle={() =>
						setExpandedSection(expandedSection === "toCreate" ? null : "toCreate")
					}
				/>
			)}

			{/* Items to Update */}
			{preview.toUpdate?.length > 0 && (
				<ItemSection
					title="Items to Update"
					items={preview.toUpdate}
					color="blue"
					icon={RefreshCw}
					isExpanded={expandedSection === "toUpdate"}
					onToggle={() =>
						setExpandedSection(expandedSection === "toUpdate" ? null : "toUpdate")
					}
					showChanges
				/>
			)}

			{/* Unchanged Items */}
			{preview.existing?.length > 0 && (
				<ItemSection
					title="Items with No Changes"
					items={preview.existing}
					color="gray"
					icon={CheckCircle}
					isExpanded={expandedSection === "existing"}
					onToggle={() =>
						setExpandedSection(expandedSection === "existing" ? null : "existing")
					}
				/>
			)}

			{/* Action Buttons */}
			<div className="mt-6 pt-6 border-t flex justify-between items-center">
				<button
					onClick={onBack}
					className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
				>
					Back
				</button>
				<button
					onClick={onStartImport}
					disabled={stats.total === 0}
					className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Start Import
					<ArrowRight className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

function StatCard({ label, value, icon: Icon, color }) {
	const colorClasses = {
		gray: "bg-gray-50 text-gray-700",
		green: "bg-green-50 text-green-700",
		blue: "bg-blue-50 text-blue-700",
	};

	return (
		<div className={`p-4 rounded-lg ${colorClasses[color]}`}>
			<div className="flex items-center gap-2 mb-1">
				<Icon className="w-4 h-4" />
				<span className="text-sm font-medium">{label}</span>
			</div>
			<p className="text-2xl font-bold">{value}</p>
		</div>
	);
}

function ItemSection({ title, items, color, icon: Icon, isExpanded, onToggle, showChanges }) {
	const colorClasses = {
		gray: "border-gray-200 bg-gray-50",
		green: "border-green-200 bg-green-50",
		blue: "border-blue-200 bg-blue-50",
	};

	const textColorClasses = {
		gray: "text-gray-700",
		green: "text-green-700",
		blue: "text-blue-700",
	};

	return (
		<div className={`mb-4 border rounded-lg ${colorClasses[color]}`}>
			<button
				onClick={onToggle}
				className="w-full flex items-center justify-between p-4"
			>
				<div className="flex items-center gap-2">
					<Icon className={`w-5 h-5 ${textColorClasses[color]}`} />
					<span className={`font-medium ${textColorClasses[color]}`}>{title}</span>
					<span className="px-2 py-0.5 bg-white rounded text-sm">{items.length}</span>
				</div>
				{isExpanded ? (
					<ChevronUp className="w-5 h-5 text-gray-400" />
				) : (
					<ChevronDown className="w-5 h-5 text-gray-400" />
				)}
			</button>
			{isExpanded && (
				<div className="border-t bg-white">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-gray-50">
								<th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
								<th className="px-4 py-2 text-left font-medium text-gray-700">Category</th>
								<th className="px-4 py-2 text-right font-medium text-gray-700">Price</th>
								{showChanges && (
									<th className="px-4 py-2 text-left font-medium text-gray-700">Changes</th>
								)}
							</tr>
						</thead>
						<tbody>
							{items.map((item, idx) => (
								<tr key={idx} className="border-b last:border-b-0">
									<td className="px-4 py-2">{item.name}</td>
									<td className="px-4 py-2 text-gray-600">{item.category}</td>
									<td className="px-4 py-2 text-right">${item.price?.toFixed(2)}</td>
									{showChanges && (
										<td className="px-4 py-2">
											<ChangesDisplay changes={item.changes} />
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

function ChangesDisplay({ changes }) {
	if (!changes) return null;

	const changedFields = Object.entries(changes).filter(([_, value]) => value !== null);

	if (changedFields.length === 0) return <span className="text-gray-400">No changes</span>;

	return (
		<div className="space-y-1">
			{changedFields.map(([field, change]) => (
				<div key={field} className="text-xs">
					<span className="font-medium capitalize">{field}:</span>{" "}
					<span className="text-red-600 line-through">{change.old}</span>{" "}
					<ArrowRight className="inline w-3 h-3 text-gray-400" />{" "}
					<span className="text-green-600">{change.new}</span>
				</div>
			))}
		</div>
	);
}
