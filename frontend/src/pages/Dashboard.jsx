import Layout from "../components/layout/Layout";
import QuickActionsCarousel from "../components/dashboard/QuickActionsCarousel";
import { quickActions } from "../config/quickActions";
import MetricsColumn from "../components/dashboard/MetricsColumn";

export default function Dashboard() {
	return (
		<Layout pageTitle="Dashboard">
			<div className="flex flex-col h-full space-y-4">
				{/* Row 1: Quick Action Cards Carousel */}
				<div className="h-32">
					<QuickActionsCarousel actions={quickActions} />
				</div>

				{/* Rows 2 & 3: Main Content + Metrics */}
				<div className="grid grid-cols-4 gap-4 flex-1">
					<div className="col-span-3 bg-white border-2 border-dashed border-green-300 rounded-lg p-6 flex items-center justify-center text-green-600 font-medium">
						Main List Area
						<br />
						(Ingredients, Reports, etc.)
					</div>

					<MetricsColumn />
				</div>
			</div>
		</Layout>
	);
}
