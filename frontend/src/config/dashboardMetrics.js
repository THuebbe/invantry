// /frontend/src/config/dashboardMetrics.js

import {
	AlertTriangle,
	Calendar,
	ShoppingCart,
	DollarSign,
	TrendingUp,
	Package,
	Clock,
	Trash2,
	Users,
	BarChart3,
} from "lucide-react";

// Dashboard (overview) metrics
export const dashboardMetrics = [
	{
		id: "low-stock-alerts",
		label: "Low Stock Alerts",
		icon: AlertTriangle,
		color: "red",
		dataKey: "lowStockCount", // Key to fetch from API
		format: "number", // number, percentage, currency
		description: "Items below reorder point",
	},
	{
		id: "expiring-soon",
		label: "Expiring Soon",
		icon: Calendar,
		color: "yellow",
		dataKey: "expiringItemsCount",
		format: "number",
		description: "Items expiring within 7 days",
	},
	{
		id: "open-orders",
		label: "Open Orders",
		icon: ShoppingCart,
		color: "blue",
		dataKey: "openOrdersCount",
		format: "number",
		description: "Pending purchase orders",
	},
	{
		id: "weekly-food-cost",
		label: "Food Cost %",
		icon: DollarSign,
		color: "green",
		dataKey: "weeklyFoodCostPercent",
		format: "percentage",
		description: "This week's food cost percentage",
	},
];

// Inventory section metrics
export const inventoryMetrics = [
	{
		id: "below-reorder",
		label: "Below Reorder Point",
		icon: AlertTriangle,
		color: "red",
		dataKey: "belowReorderCount",
		format: "number",
		description: "Items needing restock",
	},
	{
		id: "expiring-items",
		label: "Expiring This Week",
		icon: Calendar,
		color: "yellow",
		dataKey: "expiringThisWeek",
		format: "number",
		description: "Use or lose items",
	},
	{
		id: "most-used",
		label: "Most Used This Month",
		icon: TrendingUp,
		color: "blue",
		dataKey: "topUsedIngredient",
		format: "text", // Special format for ingredient name
		description: "Highest usage ingredient",
	},
	{
		id: "inventory-turnover",
		label: "Inventory Turnover",
		icon: Package,
		color: "green",
		dataKey: "inventoryTurnoverRate",
		format: "decimal", // e.g., 2.5x
		description: "Average turnover rate",
		suffix: "x", // Add 'x' after the number
	},
];

// Orders section metrics
export const ordersMetrics = [
	{
		id: "pending-value",
		label: "Pending Orders Value",
		icon: DollarSign,
		color: "blue",
		dataKey: "pendingOrdersValue",
		format: "currency",
		description: "Total value of open orders",
	},
	{
		id: "overdue-deliveries",
		label: "Overdue Deliveries",
		icon: Clock,
		color: "red",
		dataKey: "overdueDeliveriesCount",
		format: "number",
		description: "Late deliveries",
	},
	{
		id: "top-supplier",
		label: "Top Supplier",
		icon: Users,
		color: "green",
		dataKey: "topSupplierName",
		format: "text",
		description: "Most orders this month",
	},
	{
		id: "avg-fulfillment",
		label: "Avg Fulfillment Time",
		icon: TrendingUp,
		color: "purple",
		dataKey: "avgFulfillmentDays",
		format: "number",
		description: "Average days to delivery",
		suffix: " days",
	},
];

// Reports section metrics
export const reportsMetrics = [
	{
		id: "monthly-food-cost",
		label: "Monthly Food Cost",
		icon: DollarSign,
		color: "blue",
		dataKey: "monthlyFoodCostPercent",
		format: "percentage",
		description: "Current month food cost %",
	},
	{
		id: "waste-percentage",
		label: "Waste Percentage",
		icon: Trash2,
		color: "red",
		dataKey: "wastePercent",
		format: "percentage",
		description: "Monthly waste rate",
	},
	{
		id: "top-waste-category",
		label: "Top Waste Category",
		icon: BarChart3,
		color: "yellow",
		dataKey: "topWasteCategory",
		format: "text",
		description: "Highest waste category",
	},
	{
		id: "cost-per-plate",
		label: "Avg Cost Per Plate",
		icon: TrendingUp,
		color: "green",
		dataKey: "avgCostPerPlate",
		format: "currency",
		description: "Average ingredient cost",
	},
];

// Receiving section metrics (bonus - if you want it)
export const receivingMetrics = [
	{
		id: "pending-shipments",
		label: "Pending Shipments",
		icon: Package,
		color: "blue",
		dataKey: "pendingShipmentsCount",
		format: "number",
		description: "Awaiting delivery",
	},
	{
		id: "received-today",
		label: "Received Today",
		icon: Calendar,
		color: "green",
		dataKey: "receivedTodayCount",
		format: "number",
		description: "Items checked in today",
	},
	{
		id: "quality-issues",
		label: "Quality Issues",
		icon: AlertTriangle,
		color: "red",
		dataKey: "qualityIssuesCount",
		format: "number",
		description: "Items with issues this month",
	},
	{
		id: "on-time-delivery",
		label: "On-Time Delivery Rate",
		icon: TrendingUp,
		color: "purple",
		dataKey: "onTimeDeliveryPercent",
		format: "percentage",
		description: "Supplier performance",
	},
];

// Map sections to their metrics
export const metricsBySection = {
	"/dashboard": dashboardMetrics,
	"/inventory": inventoryMetrics,
	"/orders": ordersMetrics,
	"/reports": reportsMetrics,
	"/receiving": receivingMetrics,
};

// Helper function to get metrics for current route
export function getMetricsForRoute(pathname) {
	// Match the base path (e.g., /inventory/low-stock → /inventory)
	const basePath = "/" + pathname.split("/")[1];
	return metricsBySection[basePath] || dashboardMetrics;
}
