// frontend/src/components/shared/ComparisonBadge.jsx

import { memo, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * ComparisonBadge - Shows trend indicators with color coding
 * Displays percentage or value changes with visual direction indicator
 *
 * Performance: Memoized to prevent unnecessary re-renders when props don't change
 *
 * @component
 * @example
 * <ComparisonBadge direction="up" value="23%" isPositive={false} />
 * <ComparisonBadge direction="down" value="-$45.50" isPositive={true} />
 */
const ComparisonBadge = memo(function ComparisonBadge({
	direction = "neutral", // 'up', 'down', 'neutral'
	value = "0%",
	isPositive = true,
	label = null,
	size = "md", // 'sm', 'md', 'lg'
}) {
	// Memoize color class calculation
	const colorClass = useMemo(() => {
		if (direction === "neutral") return "bg-gray-100 text-gray-600";
		if (isPositive) return "bg-green-100 text-green-700";
		return "bg-red-100 text-red-700";
	}, [direction, isPositive]);

	// Memoize size classes
	const sizeClass = useMemo(() => {
		const sizeClasses = {
			sm: "px-2 py-1 text-xs",
			md: "px-3 py-1.5 text-sm",
			lg: "px-4 py-2 text-base",
		};
		return sizeClasses[size];
	}, [size]);

	// Memoize icon component
	const icon = useMemo(() => {
		const iconSizes = {
			sm: 12,
			md: 16,
			lg: 18,
		};
		const iconSize = iconSizes[size];

		switch (direction) {
			case "up":
				return <TrendingUp size={iconSize} />;
			case "down":
				return <TrendingDown size={iconSize} />;
			case "neutral":
			default:
				return <Minus size={iconSize} />;
		}
	}, [direction, size]);

	return (
		<div
			className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${colorClass} ${sizeClass} transition-colors`}
			role="status"
			aria-label={`Comparison: ${direction} ${value}${label ? ` ${label}` : ""}`}
		>
			<span aria-hidden="true">{icon}</span>
			<span>{value}</span>
			{label && <span className="ml-0.5 text-opacity-75">{label}</span>}
		</div>
	);
});

export default ComparisonBadge;
