// frontend/src/components/dashboard/content/reports/OrderPerformanceReport.jsx

import { TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";

/**
 * OrderPerformanceReport - Supplier performance and order fulfillment tracking
 * Currently a professional placeholder for Phase 2 implementation
 *
 * Planned features:
 * - On-time delivery metrics
 * - Order accuracy tracking
 * - Supplier performance scorecards
 * - Lead time analysis
 */
export default function OrderPerformanceReport() {
	const plannedFeatures = [
		{
			icon: TrendingUp,
			title: "On-Time Delivery Rate",
			description: "Track supplier reliability and delivery consistency",
			status: "Coming Soon",
		},
		{
			icon: CheckCircle,
			title: "Order Accuracy",
			description: "Monitor order correctness and item accuracy rates",
			status: "Coming Soon",
		},
		{
			icon: AlertCircle,
			title: "Supplier Scorecards",
			description: "Performance ratings and rankings by supplier",
			status: "Coming Soon",
		},
		{
			icon: Clock,
			title: "Lead Time Analysis",
			description: "Average delivery times and trend analysis",
			status: "Coming Soon",
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Order Performance
				</h1>
				<p className="text-gray-600">
					Supplier reliability and order fulfillment analytics
				</p>
			</div>

			{/* Coming Soon Card */}
			<div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8">
				<div className="flex flex-col items-center text-center max-w-md mx-auto">
					{/* Icon */}
					<div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
						<TrendingUp size={32} className="text-blue-600" />
					</div>

					{/* Title */}
					<h2 className="text-2xl font-bold text-blue-900 mb-2">
						Coming Soon!
					</h2>

					{/* Description */}
					<p className="text-blue-800 mb-4">
						Order Performance Analytics will help you track supplier
						reliability, delivery times, and order accuracy to optimize
						your supply chain.
					</p>

					{/* Version Info */}
					<div className="inline-block bg-white rounded-lg px-4 py-2 text-sm font-medium text-blue-700">
						Planned for Phase 2
					</div>
				</div>
			</div>

			{/* Planned Features Preview */}
			<div>
				<h2 className="text-lg font-semibold text-gray-900 mb-4">
					Planned Features
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{plannedFeatures.map((feature, index) => {
						const IconComponent = feature.icon;
						return (
							<div
								key={index}
								className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
							>
								<div className="flex items-start gap-4">
									<div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
										<IconComponent
											size={24}
											className="text-blue-600"
										/>
									</div>
									<div className="flex-1">
										<h3 className="font-semibold text-gray-900 mb-1">
											{feature.title}
										</h3>
										<p className="text-sm text-gray-600 mb-3">
											{feature.description}
										</p>
										<span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
											{feature.status}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Information Box */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
				<h3 className="font-semibold text-blue-900 mb-2">
					Want this feature sooner?
				</h3>
				<p className="text-blue-800 text-sm mb-4">
					Order performance analytics help restaurants optimize supplier
					relationships and reduce lead times. This feature is scheduled for
					Phase 2 development.
				</p>
				<p className="text-blue-700 text-xs">
					In the meantime, you can track orders in the{" "}
					<a href="/dashboard/orders" className="font-semibold hover:underline">
						Orders section
					</a>
				</p>
			</div>

			{/* Tech Stack Info */}
			<div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
				<p className="text-xs text-gray-600">
					This placeholder is part of the Invantry Reports Module architecture
					• Phase 2 Feature
				</p>
			</div>
		</div>
	);
}
