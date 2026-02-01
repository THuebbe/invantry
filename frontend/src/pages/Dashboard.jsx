// /frontend/src/pages/Dashboard.jsx
// Mobile: Slim quick actions bar at top (icons only)
// Desktop: Card carousel with metrics column

import Layout from "../components/layout/Layout";
import QuickActionsCarousel from "../components/dashboard/QuickActionsCarousel";
import QuickActionsBar from "../components/dashboard/QuickActionsBar";
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
			<div className="flex flex-col h-full">
				{/* Quick Actions - Slim bar on mobile, carousel on desktop */}

				{/* Mobile: Slim icon bar */}
				<div className="md:hidden sticky top-0 z-10 -mx-3 flex-shrink-0">
					<QuickActionsBar actions={quickActions} />
				</div>

				{/* Desktop: Full carousel */}
				<div className="hidden md:block mb-4 flex-shrink-0">
					<div className="h-32">
						<QuickActionsCarousel actions={quickActions} />
					</div>
				</div>

				{/* Main Content Area */}
				<div className="flex-1 min-h-0 mt-2 md:mt-0">
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
						<div className="lg:col-span-3 flex flex-col min-h-0">
							<MainContent />
						</div>

						{/* Hide metrics on mobile, show on large screens */}
						<div className="hidden lg:block">
							<MetricsColumn />
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
