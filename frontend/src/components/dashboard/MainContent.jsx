// /frontend/src/components/dashboard/MainContent.jsx

import { useLocation } from "react-router-dom";
import DashboardContent from "./content/DashboardContent";
import InventoryContent from "./content/InventoryContent";
import ReceivingContent from "./content/ReceivingContent";
import OrdersContent from "./content/OrdersContent";
import ReportsContent from "./content/ReportsContent";
import MenuItemsContent from "./content/MenuItemsContent";
import RecipeBuilder from "../menu-items/RecipeBuilder";

export default function MainContent() {
	const location = useLocation();
	const pathParts = location.pathname.split("/").filter(Boolean);

	// Handle /dashboard prefix in URLs
	const offset = pathParts[0] === "dashboard" ? 1 : 0;
	const section = pathParts[offset] || "dashboard";
	const subsection = pathParts[offset + 1];
	const thirdPart = pathParts[offset + 2];
	const fourthPart = pathParts[offset + 3];

	// Parse query parameters
	const searchParams = new URLSearchParams(location.search);
	const queryParams = Object.fromEntries(searchParams.entries());

	// Build params object for components that need route params
	const params = {
		...queryParams,
		// For routes like /dashboard/orders/edit-po/:id, extract the id from path
		...(thirdPart && { poId: thirdPart })
	};

	// Handle recipe builder FIRST: /menu-items/:id/recipe
	if (section === "menu-items" && subsection && thirdPart === "recipe") {
		return <RecipeBuilder />;
	}

	// Then handle other routes
	switch (section) {
		case "inventory":
			return <InventoryContent subsection={subsection} />;
		case "menu-items":
			return <MenuItemsContent subsection={subsection} />;
		case "receiving":
			return <ReceivingContent subsection={subsection} />;
		case "orders":
			return <OrdersContent subsection={subsection} params={params} />;
		case "reports":
			return <ReportsContent subsection={subsection} />;
		case "dashboard":
		default:
			return <DashboardContent />;
	}
}
