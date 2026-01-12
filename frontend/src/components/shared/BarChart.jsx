// frontend/src/components/shared/BarChart.jsx

import { memo, useState, useMemo, useCallback } from "react";

/**
 * BarChart - Custom bar chart using CSS/divs (no external libraries)
 * Supports horizontal and vertical orientations
 * Includes hover tooltips and responsive scaling
 *
 * Performance: Memoized to prevent unnecessary re-renders when props don't change
 * Uses useMemo for expensive calculations and useCallback for event handlers
 *
 * @component
 * @example
 * <BarChart
 *   data={[
 *     { label: 'Produce', value: 456.78, color: 'bg-red-500' },
 *     { label: 'Protein', value: 345.67, color: 'bg-blue-500' }
 *   ]}
 *   orientation="vertical"
 *   showValues={true}
 * />
 */
const BarChart = memo(function BarChart({
	data = [],
	orientation = "vertical", // 'vertical' or 'horizontal'
	maxValue = null,
	showValues = true,
	height = 300,
	width = "100%",
	emptyMessage = "No data available",
	loading = false,
	valueFormat = "currency", // 'currency', 'number', 'percentage', 'custom'
	customFormatter = null, // Function for custom formatting
}) {
	const [hoveredIndex, setHoveredIndex] = useState(null);

	// Memoize the maximum value calculation
	const calculatedMaxValue = useMemo(
		() => maxValue || (data.length > 0 ? Math.max(...data.map((d) => d.value)) : 100),
		[maxValue, data]
	);

	// Memoize format value function
	const formatValue = useCallback((value) => {
		if (value == null) return "--";

		// Custom formatter takes priority
		if (valueFormat === "custom" && customFormatter) {
			return customFormatter(value);
		}

		switch (valueFormat) {
			case "currency":
				if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
				if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
				return `$${value.toFixed(0)}`;

			case "number":
				if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
				if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
				return value.toLocaleString();

			case "percentage":
				return `${value.toFixed(1)}%`;

			default:
				return String(value);
		}
	}, [valueFormat, customFormatter]);

	// Memoize hover handlers to prevent recreating on each render
	const handleMouseEnter = useCallback((index) => {
		setHoveredIndex(index);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setHoveredIndex(null);
	}, []);

	// Loading state
	if (loading) {
		return (
			<div
				className="w-full bg-white border border-gray-200 rounded-lg p-6"
				role="status"
				aria-label="Loading chart"
			>
				<div className="animate-pulse space-y-4">
					<div className="h-4 bg-gray-200 rounded w-3/4"></div>
					<div className="h-48 bg-gray-100 rounded"></div>
				</div>
			</div>
		);
	}

	// Empty state
	if (!data || data.length === 0) {
		return (
			<div
				className="w-full bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-center min-h-[200px]"
				role="region"
				aria-label="Empty chart"
			>
				<p className="text-gray-500 text-sm">{emptyMessage}</p>
			</div>
		);
	}

	// Vertical Bar Chart
	if (orientation === "vertical") {
		return (
			<div
				className="w-full bg-white border border-gray-200 rounded-lg p-6"
				role="region"
				aria-label="Vertical bar chart"
			>
				<div
					className="flex items-end justify-around gap-4"
					style={{
						height: `${height}px`,
						alignItems: "flex-end",
					}}
				>
					{data.map((item, index) => {
						const percentage = (item.value / calculatedMaxValue) * 100;
						const barColor = item.color || "bg-green-500";

						return (
							<div
								key={index}
								className="flex flex-col items-center justify-end flex-1 gap-0 relative group"
								onMouseEnter={() => handleMouseEnter(index)}
								onMouseLeave={handleMouseLeave}
								role="article"
								aria-label={`${item.label}: ${formatValue(item.value)}`}
								style={{ height: '100%' }}
							>
								{/* Tooltip */}
								{hoveredIndex === index && (
									<div
										className="absolute bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10"
										role="tooltip"
									>
										{formatValue(item.value)}
									</div>
								)}

								{/* Value above bar (optional) */}
								{showValues && (
									<span className="text-xs font-semibold text-gray-700 text-center mb-1">
										{formatValue(item.value)}
									</span>
								)}

								{/* Bar */}
								<div
									className={`w-full ${barColor} rounded-t-lg transition-all duration-200 cursor-pointer hover:opacity-80`}
									style={{
										height: `${Math.max(percentage, 5)}%`,
										minHeight: "8px",
									}}
									aria-valuenow={item.value}
									aria-valuemin="0"
									aria-valuemax={calculatedMaxValue}
									role="presentation"
								/>

								{/* Label */}
								<span className="text-xs font-medium text-gray-600 text-center break-words max-w-full mt-2 px-1">
									{item.label}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	// Horizontal Bar Chart
	return (
		<div
			className="w-full bg-white border border-gray-200 rounded-lg p-6"
			role="region"
			aria-label="Horizontal bar chart"
		>
			<div className="space-y-4">
				{data.map((item, index) => {
					const percentage = (item.value / calculatedMaxValue) * 100;
					const barColor = item.color || "bg-blue-500";

					return (
						<div
							key={index}
							className="flex items-center gap-4"
							role="article"
							aria-label={`${item.label}: ${formatValue(item.value)}`}
						>
							{/* Label */}
							<div className="w-24 text-sm font-medium text-gray-700 truncate">
								{item.label}
							</div>

							{/* Bar Container */}
							<div className="flex-1 relative group">
								<div
									className={`${barColor} rounded-lg h-8 transition-all duration-200 cursor-pointer hover:opacity-80 flex items-center justify-end pr-3`}
									style={{
										width: `${Math.max(percentage, 5)}%`,
										minWidth: "40px",
									}}
									onMouseEnter={() => handleMouseEnter(index)}
									onMouseLeave={handleMouseLeave}
									role="progressbar"
									aria-label={`${item.label} progress`}
									aria-valuenow={item.value}
									aria-valuemin="0"
									aria-valuemax={calculatedMaxValue}
								>
									{showValues && percentage > 20 && (
										<span className="text-xs font-semibold text-white text-right">
											{formatValue(item.value)}
										</span>
									)}
									{hoveredIndex === index && (
										<div
											className="absolute left-1/2 -translate-x-1/2 -top-8 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10"
											role="tooltip"
										>
											{formatValue(item.value)}
										</div>
									)}
								</div>

								{/* Value outside bar if bar is too small */}
								{showValues && percentage <= 20 && (
									<span className="text-xs font-semibold text-gray-700 ml-2 absolute right-0">
										{formatValue(item.value)}
									</span>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
});

export default BarChart;
