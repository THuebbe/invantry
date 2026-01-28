// Sales routing component - handles all sales-related views
// Routes to specific sales components based on subsection

import { useNavigate } from "react-router-dom";
import TodaySales from "../../sales/TodaySales";
import SalesHistory from "../../sales/SalesHistory";
import InventoryImpact from "../../sales/InventoryImpact";
import { DollarSign, Calendar, TrendingDown, AlertCircle } from "lucide-react";

export default function SalesContent({ subsection, params }) {
	// Route to specific sales component based on subsection
	switch (subsection) {
		case "today":
			return <TodaySales />;
		case "history":
			return <SalesHistory />;
		case "impact":
			return <InventoryImpact />;
		default:
			return <SalesOverview />;
	}
}

// Sales Overview - shows when clicking main "Sales" menu item
function SalesOverview() {
	const navigate = useNavigate();

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">Sales</h2>
			<p className="text-gray-600 mb-6">
				Track sales from your POS system and monitor inventory deductions.
			</p>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<SalesCard
					title="Today's Sales"
					description="View today's orders and sales summary"
					icon={DollarSign}
					path="/sales/today"
					color="green"
				/>
				<SalesCard
					title="Sales History"
					description="Browse historical sales data"
					icon={Calendar}
					path="/sales/history"
					color="blue"
				/>
				<SalesCard
					title="Inventory Impact"
					description="See how sales affect inventory levels"
					icon={TrendingDown}
					path="/sales/impact"
					color="purple"
				/>
			</div>

			{/* Placeholder for when POS is not connected */}
			<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
				<div className="flex items-start gap-3">
					<AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
					<div>
						<h3 className="font-medium text-amber-800">POS Connection Required</h3>
						<p className="text-sm text-amber-700 mt-1">
							Connect your POS system in{" "}
							<button
								onClick={() => navigate("/settings/integrations")}
								className="underline hover:text-amber-900"
							>
								Settings &gt; Integrations
							</button>{" "}
							to view sales data.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function SalesCard({ title, description, icon: Icon, path, color = "blue" }) {
	const navigate = useNavigate();

	const colorClasses = {
		blue: "hover:border-blue-300 hover:shadow-blue-50",
		green: "hover:border-green-300 hover:shadow-green-50",
		purple: "hover:border-purple-300 hover:shadow-purple-50",
	};

	return (
		<button
			onClick={() => navigate(path)}
			className={`bg-white border border-gray-200 rounded-lg p-4 text-left transition-all hover:shadow-md ${colorClasses[color]}`}
		>
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0">
					<Icon className="w-6 h-6 text-gray-600" />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="text-base font-semibold text-gray-900 mb-1">
						{title}
					</h3>
					<p className="text-sm text-gray-600">{description}</p>
				</div>
			</div>
		</button>
	);
}
