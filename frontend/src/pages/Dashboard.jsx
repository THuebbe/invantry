// /frontend/src/pages/Daashboard.jsx

import Layout from "../components/layout/Layout";
import QuickActionsCarousel from "../components/dashboard/QuickActionsCarousel";
import MetricsColumn from "../components/dashboard/MetricsColumn";
import MainContent from "../components/dashboard/MainContent";
import { quickActions } from "../config/quickActions";
import { useLocation } from "react-router-dom";

export default function Dashboard() {
	const location = useLocation();

	const getPageTitle = () => {
		const pathParts = location.pathname.split("/").filter(Boolean);
		const section = pathParts[0] || "dashboard";
		const subsection = pathParts[1];

		const titles = {
			dashboard: "Dashboard",
			inventory: subsection
				? `Inventory - ${subsection.replace("-", " ")}`
				: "Inventory",
			receiving: "Receiving",
			orders: "Orders",
			reports: "Reports",
		};

		return titles[section] || "Dashboard";
	};

	return (
		<Layout pageTitle={getPageTitle()}>
			<div className="flex flex-col h-full space-y-4">
				{/* Row 1: Quick Action Cards Carousel */}
				<div className="h-32">
					<QuickActionsCarousel actions={quickActions} />
				</div>

				{/* Rows 2 & 3: Main Content + Metrics */}
				<div className="grid grid-cols-4 gap-4 flex-1">
					<div className="col-span-3 overflow-y-auto">
						<MainContent />
					</div>

					<MetricsColumn />
				</div>
			</div>
		</Layout>
	);
}
