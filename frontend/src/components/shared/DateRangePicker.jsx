// frontend/src/components/shared/DateRangePicker.jsx

import { memo, useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * DateRangePicker - Period selection with presets and custom date range
 * Supports: Today, Week, Month, Quarter, Year presets
 * Plus optional comparison toggle
 *
 * Performance: Memoized to prevent unnecessary re-renders when props don't change
 * Uses useMemo for date calculations and useCallback for event handlers
 *
 * @component
 * @example
 * <DateRangePicker
 *   selected="week"
 *   onSelect={(period) => console.log(period)}
 *   showComparison={true}
 *   onComparisonToggle={(enabled) => console.log(enabled)}
 * />
 */
const DateRangePicker = memo(function DateRangePicker({
	selected = "week",
	onSelect = () => {},
	customRange = null,
	onCustomRangeChange = () => {},
	showComparison = false,
	onComparisonToggle = () => {},
	comparisonEnabled = false,
}) {
	const [showCustom, setShowCustom] = useState(false);
	const [startDate, setStartDate] = useState(customRange?.start || "");
	const [endDate, setEndDate] = useState(customRange?.end || "");
	const [dateError, setDateError] = useState("");
	const dropdownRef = useRef(null);

	// Memoize click outside handler
	const handleClickOutside = useCallback((event) => {
		if (
			dropdownRef.current &&
			!dropdownRef.current.contains(event.target)
		) {
			setShowCustom(false);
		}
	}, []);

	// Close dropdown when clicking outside
	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [handleClickOutside]);

	// Memoize date range calculation function
	const getDateRange = useCallback((period) => {
		const today = new Date();
		const startOfWeek = new Date(today);
		startOfWeek.setDate(today.getDate() - today.getDay());
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		const startOfQuarter = new Date(
			today.getFullYear(),
			Math.floor(today.getMonth() / 3) * 3,
			1
		);
		const startOfYear = new Date(today.getFullYear(), 0, 1);

		const formatDate = (date) =>
			date.toISOString().split("T")[0];

		switch (period) {
			case "today":
				return {
					start: formatDate(today),
					end: formatDate(today),
				};
			case "week":
				return {
					start: formatDate(startOfWeek),
					end: formatDate(today),
				};
			case "month":
				return {
					start: formatDate(startOfMonth),
					end: formatDate(today),
				};
			case "quarter":
				return {
					start: formatDate(startOfQuarter),
					end: formatDate(today),
				};
			case "year":
				return {
					start: formatDate(startOfYear),
					end: formatDate(today),
				};
			default:
				return null;
		}
	}, []);

	// Memoize preset buttons configuration
	const presets = useMemo(() => [
		{ id: "today", label: "Today" },
		{ id: "week", label: "This Week" },
		{ id: "month", label: "This Month" },
		{ id: "quarter", label: "This Quarter" },
		{ id: "year", label: "This Year" },
		{ id: "custom", label: "Custom" },
	], []);

	// Memoize event handlers
	const handlePresetSelect = useCallback((presetId) => {
		if (presetId === "custom") {
			setShowCustom(true);
		} else {
			onSelect(presetId);
			setShowCustom(false);
		}
	}, [onSelect]);

	const handleCustomRangeApply = useCallback(() => {
		// Validate dates
		if (!startDate || !endDate) {
			setDateError("Both start and end dates are required");
			return;
		}

		if (new Date(startDate) > new Date(endDate)) {
			setDateError("Start date must be before or equal to end date");
			return;
		}

		// Clear error and apply
		setDateError("");
		onCustomRangeChange({ start: startDate, end: endDate });
		onSelect("custom");
		setShowCustom(false);
	}, [startDate, endDate, onCustomRangeChange, onSelect]);

	const handleCustomRangeCancel = useCallback(() => {
		// Reset to original values or clear
		if (selected === "custom" && customRange) {
			setStartDate(customRange.start);
			setEndDate(customRange.end);
		} else {
			setStartDate("");
			setEndDate("");
		}
		setDateError("");
		setShowCustom(false);
	}, [selected, customRange]);

	// Memoize calculated values
	const dateRange = useMemo(
		() => selected !== "custom" ? getDateRange(selected) : customRange,
		[selected, customRange, getDateRange]
	);
	const displayLabel =
		presets.find((p) => p.id === selected)?.label || "Custom";
	const displayDates =
		dateRange &&
		`${formatDisplayDate(dateRange.start)} - ${formatDisplayDate(dateRange.end)}`;

	function formatDisplayDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	}

	return (
		<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
			{/* Date Range Display */}
			<div
				className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm font-medium"
				role="region"
				aria-label="Selected date range"
			>
				<Calendar size={18} className="text-gray-500" />
				<span>{displayLabel}</span>
				{displayDates && (
					<span className="text-gray-500 ml-2">({displayDates})</span>
				)}
			</div>

			{/* Preset Buttons */}
			<div className="flex gap-2 flex-wrap">
				{presets.map((preset) => (
					<button
						key={preset.id}
						onClick={() => handlePresetSelect(preset.id)}
						className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
							selected === preset.id
								? "bg-green-600 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
						aria-pressed={selected === preset.id}
						aria-label={`Select ${preset.label}`}
					>
						{preset.label}
					</button>
				))}
			</div>

			{/* Custom Date Range Picker */}
			{showCustom && (
				<div
					ref={dropdownRef}
					className="w-full sm:w-auto bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10"
					role="dialog"
					aria-label="Custom date range picker"
				>
					<div className="space-y-4">
						{/* Start Date */}
						<div>
							<label
								htmlFor="start-date"
								className="block text-xs font-medium text-gray-600 mb-2"
							>
								Start Date
							</label>
							<input
								id="start-date"
								type="date"
								value={startDate}
								onChange={(e) => {
									setStartDate(e.target.value);
									setDateError("");
								}}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
								max={new Date().toISOString().split("T")[0]}
							/>
						</div>

						{/* End Date */}
						<div>
							<label
								htmlFor="end-date"
								className="block text-xs font-medium text-gray-600 mb-2"
							>
								End Date
							</label>
							<input
								id="end-date"
								type="date"
								value={endDate}
								onChange={(e) => {
									setEndDate(e.target.value);
									setDateError("");
								}}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
								max={new Date().toISOString().split("T")[0]}
							/>
						</div>

						{/* Validation Error */}
						{dateError && (
							<div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1" role="alert">
								{dateError}
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex gap-2 pt-2">
							<button
								onClick={handleCustomRangeApply}
								className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
								aria-label="Apply custom date range"
							>
								Apply
							</button>
							<button
								onClick={handleCustomRangeCancel}
								className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
								aria-label="Cancel custom date range"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Comparison Toggle */}
			{showComparison && (
				<div className="flex items-center gap-2 pl-3 border-l border-gray-200">
					<label
						htmlFor="comparison-toggle"
						className="flex items-center gap-2 cursor-pointer"
					>
						<input
							id="comparison-toggle"
							type="checkbox"
							checked={comparisonEnabled}
							onChange={(e) => onComparisonToggle(e.target.checked)}
							className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500"
							aria-label="Enable comparison with previous period"
						/>
						<span className="text-sm text-gray-700 font-medium">
							Compare
						</span>
					</label>
				</div>
			)}
		</div>
	);
});

export default DateRangePicker;
