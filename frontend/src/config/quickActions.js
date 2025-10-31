// /frontend/src/components/dashboard/layout/quickActions.js

import {
	PackagePlus,
	PackageMinus,
	ShoppingCart,
	UtensilsCrossed,
} from "lucide-react";

export const quickActions = [
	{
		id: "receive-order",
		label: "Receive Order",
		icon: PackagePlus,
		path: "/receiving/new",
		color: "green", // We can use this to customize card colors
		description: "Check in deliveries", // Optional: for tooltips or subtitles
	},
	{
		id: "remove-stock",
		label: "Remove Stock",
		icon: PackageMinus,
		path: "/inventory/remove",
		color: "red",
		description: "Record waste or usage",
	},
	{
		id: "quick-order",
		label: "Quick Order",
		icon: ShoppingCart,
		path: "/orders/new",
		color: "blue",
		description: "Create purchase order",
	},
	{
		id: "add-recipe",
		label: "Add Recipe",
		icon: UtensilsCrossed,
		path: "/recipes/new",
		color: "purple",
		description: "Add menu item recipe",
	},
];
