import {
	LayoutDashboard,
	Package,
	Truck,
	ShoppingCart,
	BarChart3,
	Settings,
	User,
} from "lucide-react";

// Main sidebar navigation items
export const menuItems = [
	{
		id: "dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
		path: "/dashboard",
		subItems: [],
	},
	{
		id: "inventory",
		label: "Inventory",
		icon: Package,
		path: "/inventory",
		subItems: [
			{ id: "all-ingredients", label: "All Ingredients", path: "/inventory" },
			{ id: "low-stock", label: "Low Stock", path: "/inventory/low-stock" },
			{ id: "expiring", label: "Expiring Soon", path: "/inventory/expiring" },
			{ id: "add-ingredient", label: "Add Ingredient", path: "/inventory/add" },
		],
	},
	{
		id: "receiving",
		label: "Receiving",
		icon: Truck,
		path: "/receiving",
		subItems: [
			{
				id: "receive-shipment",
				label: "Receive Shipment",
				path: "/receiving/new",
			},
			{
				id: "recent-deliveries",
				label: "Recent Deliveries",
				path: "/receiving/history",
			},
		],
	},
	{
		id: "orders",
		label: "Orders",
		icon: ShoppingCart,
		path: "/orders",
		subItems: [
			{ id: "create-order", label: "Create Order", path: "/orders/new" },
			{ id: "open-orders", label: "Open Orders", path: "/orders/open" },
			{ id: "order-history", label: "Order History", path: "/orders/history" },
		],
	},
	{
		id: "reports",
		label: "Reports",
		icon: BarChart3,
		path: "/reports",
		subItems: [
			{ id: "food-cost", label: "Food Cost", path: "/reports/food-cost" },
			{ id: "usage", label: "Usage Report", path: "/reports/usage" },
			{ id: "waste", label: "Waste Tracking", path: "/reports/waste" },
		],
	},
];

// Settings/profile menu items (for header dropdown or separate menu)
export const settingsItems = [
	{
		id: "restaurant",
		label: "Restaurant Profile",
		icon: Settings,
		path: "/settings/restaurant",
	},
	{
		id: "users",
		label: "Users & Permissions",
		icon: User,
		path: "/settings/users",
	},
	{
		id: "account",
		label: "My Account",
		icon: User,
		path: "/settings/account",
	},
	{
		id: "logout",
		label: "Logout",
		icon: null, // We'll handle logout separately
		action: "logout", // Special action instead of path
	},
];
