// /frontend/src/components/dashboard/MainContent.jsx

import { useLocation } from "react-router-dom";
import DashboardContent from "./content/DashboardContent";
import InventoryContent from "./content/InventoryContent";
import ReceivingContent from "./content/ReceivingContent";
import OrdersContent from "./content/OrdersContent";
import ReportsContent from "./content/ReportsContent";
import WasteContent from "./content/WasteContent";

export default function MainContent() {
	const location = useLocation();

	// Extract section from pathname
	// /inventory/low-stock → 'inventory'
	// /orders → 'orders'
	// / or /dashboard → 'dashboard'
	const pathParts = location.pathname.split("/").filter(Boolean);
	const section = pathParts[0] || "dashboard";
	const subsection = pathParts[1]; // e.g., 'low-stock', 'new', etc.

	// Route to appropriate content component
	switch (section) {
		case "inventory":
			return <InventoryContent subsection={subsection} />;
		case "receiving":
			return <ReceivingContent subsection={subsection} />;
		case "orders":
			return <OrdersContent subsection={subsection} />;
		case "reports":
			return <ReportsContent subsection={subsection} />;
		case "waste":
			return <WasteContent subsection={subsection} />;
		case "dashboard":
		default:
			return <DashboardContent />;
	}
}
