// frontend\src\components\dashboard\content\ReportsContent.jsx

import DashboardOverviewReport from "./reports/DashboardOverviewReport";
import WasteAnalysisReport from "./reports/WasteAnalysisReport";
import FoodCostReport from "./reports/FoodCostReport";
import InventoryHealthReport from "./reports/InventoryHealthReport";
import OrderPerformanceReport from "./reports/OrderPerformanceReport";

export default function ReportsContent({ subsection }) {
	// Route to specific report based on subsection
	switch (subsection) {
		case "dashboard":
			return <DashboardOverviewReport />;
		case "waste":
			return <WasteAnalysisReport />;
		case "food-cost":
			return <FoodCostReport />;
		case "inventory-health":
			return <InventoryHealthReport />;
		case "order-performance":
			return <OrderPerformanceReport />;
		default:
			return <ReportsOverview />;
	}
}

// Reports Overview - shows when clicking main "Reports" menu item
function ReportsOverview() {
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">
				Reports Overview
			</h2>

			<div className="grid grid-cols-2 gap-4">
				<ReportCard
					title="Dashboard Overview"
					description="Key metrics and performance indicators"
					icon="📊"
					path="/dashboard/reports/dashboard"
				/>
				<ReportCard
					title="Waste Analysis"
					description="Track waste trends and identify problem areas"
					icon="🗑️"
					path="/dashboard/reports/waste"
				/>
				<ReportCard
					title="Food Cost Analysis"
					description="Monitor food cost percentages and variances"
					icon="💰"
					path="/dashboard/reports/food-cost"
				/>
				<ReportCard
					title="Inventory Health"
					description="Stock levels, turnover, and reorder insights"
					icon="📦"
					path="/dashboard/reports/inventory-health"
				/>
				<ReportCard
					title="Order Performance"
					description="Supplier reliability and order fulfillment"
					icon="📋"
					path="/dashboard/reports/order-performance"
				/>
			</div>
		</div>
	);
}

function ReportCard({ title, description, icon, path }) {
	return (
		<a
			href={path}
			className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all"
		>
			<div className="text-4xl mb-3">{icon}</div>
			<h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
			<p className="text-sm text-gray-600">{description}</p>
		</a>
	);
}
