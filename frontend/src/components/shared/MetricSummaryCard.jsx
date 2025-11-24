// frontend/src/components/shared/MetricSummaryCard.jsx

import { memo, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * MetricSummaryCard - Displays a key metric with icon, value, and trend indicator
 * Used across all report components for consistent metric display
 *
 * Performance: Memoized to prevent unnecessary re-renders when props don't change
 *
 * @component
 * @example
 * <MetricSummaryCard
 *   title="Total Waste"
 *   value="$1,234.56"
 *   icon={Trash2}
 *   trend={{ direction: 'up', value: '12%', isGood: false }}
 *   color="red"
 * />
 */
const MetricSummaryCard = memo(function MetricSummaryCard({
	title = "",
	value = "--",
	icon: Icon = null,
	trend = null,
	color = "blue",
	loading = false,
	error = false,
}) {
	// Color scheme definitions
	const colorSchemes = {
		red: {
			icon: "text-red-600 bg-red-50",
			border: "border-red-100",
			accent: "text-red-600",
		},
		green: {
			icon: "text-green-600 bg-green-50",
			border: "border-green-100",
			accent: "text-green-600",
		},
		blue: {
			icon: "text-blue-600 bg-blue-50",
			border: "border-blue-100",
			accent: "text-blue-600",
		},
		yellow: {
			icon: "text-yellow-600 bg-yellow-50",
			border: "border-yellow-100",
			accent: "text-yellow-600",
		},
		purple: {
			icon: "text-purple-600 bg-purple-50",
			border: "border-purple-100",
			accent: "text-purple-600",
		},
	};

	// Memoize color scheme to prevent recalculation
	const scheme = useMemo(
		() => colorSchemes[color] || colorSchemes.blue,
		[color]
	);

	// Memoize trend color calculation
	const trendColor = useMemo(() => {
		if (!trend) return "text-gray-600";
		return trend.isGood ? "text-green-600" : "text-red-600";
	}, [trend]);

	// Memoize trend icon to prevent recreation
	const trendIcon = useMemo(() => {
		if (!trend) return null;
		if (trend.direction === "up")
			return <TrendingUp size={16} className="inline mr-1" />;
		if (trend.direction === "down")
			return <TrendingDown size={16} className="inline mr-1" />;
		return <Minus size={16} className="inline mr-1" />;
	}, [trend]);

	// Loading skeleton
	if (loading) {
		return (
			<div
				className={`bg-white border border-gray-200 rounded-lg p-6 animate-pulse`}
				role="status"
				aria-label="Loading metric card"
			>
				<div className="flex items-start justify-between mb-4">
					<div className="h-6 bg-gray-200 rounded w-24"></div>
				</div>
				<div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
				<div className="h-4 bg-gray-100 rounded w-20"></div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div
				className="bg-red-50 border border-red-200 rounded-lg p-6"
				role="alert"
				aria-label="Error loading metric"
			>
				<div className="text-sm text-red-600 font-medium">Error loading metric</div>
				<div className="text-gray-500 text-xs mt-2">Please try again</div>
			</div>
		);
	}

	return (
		<div
			className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${scheme.border}`}
			role="region"
			aria-label={`${title} metric card`}
		>
			{/* Header with icon */}
			<div className="flex items-start justify-between mb-4">
				{Icon && (
					<div
						className={`w-10 h-10 rounded-lg ${scheme.icon} flex items-center justify-center flex-shrink-0`}
						aria-hidden="true"
					>
						<Icon size={20} />
					</div>
				)}
				<div className="flex-1 ml-3">
					<h3
						className="text-sm font-medium text-gray-600"
						id={`${title.replace(/\s+/g, "-")}-label`}
					>
						{title}
					</h3>
				</div>
			</div>

			{/* Metric value */}
			<div className="mb-3">
				<div
					className="text-3xl font-bold text-gray-900"
					role="status"
					aria-label={`${title} value: ${value}`}
				>
					{value}
				</div>
			</div>

			{/* Trend indicator */}
			{trend && (
				<div
					className={`text-sm font-medium ${trendColor}`}
					aria-label={`${title} trend: ${trend.direction} ${trend.value}`}
				>
					{trendIcon}
					<span>{trend.value}</span>
					{trend.label && (
						<span className="text-gray-500 font-normal ml-1">
							{trend.label}
						</span>
					)}
				</div>
			)}

			{/* Optional description or comparison text */}
			{trend?.description && (
				<p className="text-xs text-gray-500 mt-2">{trend.description}</p>
			)}
		</div>
	);
});

export default MetricSummaryCard;
