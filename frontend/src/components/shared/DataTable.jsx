// frontend/src/components/shared/DataTable.jsx

import { memo, useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/**
 * DataTable - Sortable, responsive table component
 * Handles large datasets, empty states, and mobile responsiveness
 *
 * Performance: Memoized to prevent unnecessary re-renders when props don't change
 * Uses useMemo for sorted data and useCallback for event handlers
 *
 * @component
 * @example
 * <DataTable
 *   columns={[
 *     { key: 'name', label: 'Item Name', sortable: true },
 *     { key: 'value', label: 'Value', sortable: true, format: 'currency' }
 *   ]}
 *   data={items}
 *   defaultSort={{ column: 'value', direction: 'desc' }}
 * />
 */
const DataTable = memo(function DataTable({
	columns = [],
	data = [],
	emptyMessage = "No data available",
	loading = false,
	defaultSort = null,
	onRowClick = null,
	highlightedRowId = null,
	highlightKey = "id",
	rowClassName = "",
}) {
	const [sortConfig, setSortConfig] = useState(
		defaultSort || { column: null, direction: "asc" }
	);

	// Memoize format cell value function
	const formatCellValue = useCallback((value, format) => {
		if (value == null) return "--";

		switch (format) {
			case "currency":
				return `$${typeof value === "number" ? value.toFixed(2) : value}`;
			case "percentage":
				return `${value}%`;
			case "number":
				return typeof value === "number" ? value.toLocaleString() : value;
			case "decimal":
				return typeof value === "number" ? value.toFixed(1) : value;
			case "date":
				return new Date(value).toLocaleDateString("en-US", {
					year: "numeric",
					month: "short",
					day: "numeric",
				});
			case "text":
			default:
				return String(value);
		}
	}, []);

	// Memoize column sorting handler
	const handleSort = useCallback((columnKey) => {
		const column = columns.find((c) => c.key === columnKey);
		if (!column?.sortable) return;

		setSortConfig((prev) => {
			if (prev.column === columnKey) {
				return {
					column: columnKey,
					direction: prev.direction === "asc" ? "desc" : "asc",
				};
			}
			return { column: columnKey, direction: "asc" };
		});
	}, [columns]);

	// Memoize row click handler
	const handleRowClick = useCallback((row) => {
		if (onRowClick) {
			onRowClick(row);
		}
	}, [onRowClick]);

	// Memoize sorted data
	const sortedData = useMemo(() => {
		if (!sortConfig.column) return data;

		const sorted = [...data].sort((a, b) => {
			const aValue = a[sortConfig.column];
			const bValue = b[sortConfig.column];

			// Handle null/undefined values
			if (aValue == null && bValue == null) return 0;
			if (aValue == null) return 1;
			if (bValue == null) return -1;

			// Numeric comparison
			if (typeof aValue === "number" && typeof bValue === "number") {
				return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
			}

			// String comparison
			const aStr = String(aValue).toLowerCase();
			const bStr = String(bValue).toLowerCase();
			return sortConfig.direction === "asc"
				? aStr.localeCompare(bStr)
				: bStr.localeCompare(aStr);
		});

		return sorted;
	}, [data, sortConfig]);

	// Loading skeleton
	if (loading) {
		return (
			<div
				className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden"
				role="status"
				aria-label="Loading table"
			>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								{columns.map((col) => (
									<th
										key={col.key}
										className="px-6 py-3 text-left text-xs font-semibold text-gray-700"
									>
										{col.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{[...Array(5)].map((_, index) => (
								<tr key={index} className="border-b border-gray-200">
									{columns.map((col) => (
										<td
											key={`${index}-${col.key}`}
											className="px-6 py-4"
										>
											<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	// Empty state
	if (sortedData.length === 0) {
		return (
			<div
				className="w-full bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-center min-h-[200px]"
				role="region"
				aria-label="Empty table"
			>
				<p className="text-gray-500 text-sm">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full min-w-full" role="table">
					{/* Header */}
					<thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
						<tr role="row">
							{columns.map((column) => (
								<th
									key={column.key}
									className={`px-6 py-3 text-left text-xs font-semibold text-gray-700 ${
										column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
									} transition-colors`}
									onClick={() => column.sortable && handleSort(column.key)}
									role="columnheader"
									aria-sort={
										sortConfig.column === column.key
											? sortConfig.direction === "asc"
												? "ascending"
												: "descending"
											: "none"
									}
								>
									<div className="flex items-center gap-2">
										<span>{column.label}</span>
										{column.sortable && (
											<div className="inline-flex">
												{sortConfig.column === column.key ? (
													sortConfig.direction === "asc" ? (
														<ChevronUp
															size={16}
															className="text-green-600"
														/>
													) : (
														<ChevronDown
															size={16}
															className="text-green-600"
														/>
													)
												) : (
													<div className="w-4 h-4" />
												)}
											</div>
										)}
									</div>
								</th>
							))}
						</tr>
					</thead>

					{/* Body */}
					<tbody role="rowgroup">
						{sortedData.map((row, rowIndex) => {
							const isHighlighted =
								highlightedRowId &&
								row[highlightKey] === highlightedRowId;

							return (
								<tr
									key={rowIndex}
									role="row"
									className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
										isHighlighted ? "bg-green-50" : ""
									} ${
										onRowClick
											? "cursor-pointer"
											: ""
									} ${rowClassName}`}
									onClick={() => handleRowClick(row)}
									aria-selected={isHighlighted}
								>
									{columns.map((column) => (
										<td
											key={`${rowIndex}-${column.key}`}
											className="px-6 py-4 text-sm text-gray-700"
										>
											{formatCellValue(
												row[column.key],
												column.format
											)}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Footer with record count */}
			<div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
				{sortedData.length === data.length
					? `Showing ${sortedData.length} records`
					: `Showing ${sortedData.length} of ${data.length} records`
				}
			</div>
		</div>
	);
});

export default DataTable;
