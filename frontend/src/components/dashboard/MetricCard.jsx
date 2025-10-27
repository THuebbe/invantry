import { useState, useEffect, useRef } from "react";
import { MoreVertical, Check } from "lucide-react";

export default function MetricCard({
	availableMetrics, // Array of all possible metrics for this section
	selectedMetricId, // Which metric is currently displayed
	onMetricChange, // Callback when user selects different metric
	metricData, // The actual data to display
	position, // 'top' or 'bottom' - for identifying which card this is
}) {
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef(null);

	// Find the current metric config
	const currentMetric =
		availableMetrics.find((m) => m.id === selectedMetricId) ||
		availableMetrics[0];
	const Icon = currentMetric?.icon;

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event) {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setShowMenu(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Format the metric value based on format type
	const formatValue = (value, format, suffix = "") => {
		if (value === null || value === undefined) return "--";

		switch (format) {
			case "currency":
				return `$${value.toLocaleString()}`;
			case "percentage":
				return `${value}%`;
			case "number":
				return value.toLocaleString() + suffix;
			case "decimal":
				return value.toFixed(1) + suffix;
			case "text":
				return value;
			default:
				return value;
		}
	};

	const colorClasses = {
		red: "text-red-600 bg-red-50",
		yellow: "text-yellow-600 bg-yellow-50",
		blue: "text-blue-600 bg-blue-50",
		green: "text-green-600 bg-green-50",
		purple: "text-purple-600 bg-purple-50",
	};

	return (
		<div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 relative">
			{/* Three-dot menu button */}
			<div
				className="absolute top-3 right-3"
				ref={menuRef}
			>
				<button
					onClick={() => setShowMenu(!showMenu)}
					className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
				>
					<MoreVertical size={18} />
				</button>

				{/* Dropdown menu */}
				{showMenu && (
					<div className="absolute right-0 top-10 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
						<div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
							Select Metric
						</div>
						{availableMetrics.map((metric) => (
							<button
								key={metric.id}
								onClick={() => {
									onMetricChange(position, metric.id);
									setShowMenu(false);
								}}
								className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
							>
								<span className="text-gray-700">{metric.label}</span>
								{selectedMetricId === metric.id && (
									<Check
										size={16}
										className="text-green-600"
									/>
								)}
							</button>
						))}

						<div className="border-t border-gray-200 mt-2 pt-2 px-3">
							<button className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded text-gray-700">
								🔄 Auto-cycle (Coming Soon)
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Metric Content */}
			<div className="flex flex-col items-center justify-center h-full pt-4">
				{/* Icon */}
				{Icon && (
					<div
						className={`w-12 h-12 rounded-lg ${
							colorClasses[currentMetric.color]
						} flex items-center justify-center mb-3`}
					>
						<Icon size={24} />
					</div>
				)}

				{/* Metric Title */}
				<h3 className="text-sm font-medium text-gray-600 text-center mb-2">
					{currentMetric.label}
				</h3>

				{/* Metric Value */}
				<div className="text-3xl font-bold text-gray-900">
					{formatValue(
						metricData?.[currentMetric.dataKey],
						currentMetric.format,
						currentMetric.suffix
					)}
				</div>

				{/* Description */}
				<p className="text-xs text-gray-500 text-center mt-2">
					{currentMetric.description}
				</p>
			</div>
		</div>
	);
}
