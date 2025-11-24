// Mock data for testing report components

export const mockMetricData = {
	wasteMetrics: [
		{
			title: "Total Waste Cost",
			value: "$2,347.89",
			icon: "TrendingDown",
			color: "red",
			trend: {
				direction: "down",
				value: "12%",
				isGood: true,
				description: "vs last week"
			}
		},
		{
			title: "Waste Items",
			value: "156",
			icon: "Package",
			color: "yellow"
		}
	],
	inventoryMetrics: [
		{
			title: "Total Inventory Value",
			value: "$45,678.90",
			icon: "Package",
			color: "blue"
		},
		{
			title: "Low Stock Items",
			value: "12",
			icon: "AlertTriangle",
			color: "red"
		}
	]
};

export const mockChartData = [
	{ label: "Produce", value: 456.78, color: "bg-red-500" },
	{ label: "Protein", value: 345.67, color: "bg-blue-500" },
	{ label: "Dairy", value: 234.56, color: "bg-green-500" },
	{ label: "Dry Goods", value: 123.45, color: "bg-yellow-500" },
	{ label: "Beverages", value: 89.12, color: "bg-purple-500" }
];

export const mockTableData = [
	{
		id: 1,
		name: "Fresh Tomatoes",
		category: "Produce",
		quantity: 25,
		unit: "lbs",
		cost: 125.50,
		date: "2025-11-20",
		status: "active"
	},
	{
		id: 2,
		name: "Chicken Breast",
		category: "Protein",
		quantity: 40,
		unit: "lbs",
		cost: 280.00,
		date: "2025-11-21",
		status: "active"
	},
	{
		id: 3,
		name: "Milk (Whole)",
		category: "Dairy",
		quantity: 10,
		unit: "gallons",
		cost: 45.00,
		date: "2025-11-22",
		status: "low"
	},
	{
		id: 4,
		name: "Rice (Jasmine)",
		category: "Dry Goods",
		quantity: 50,
		unit: "lbs",
		cost: 75.00,
		date: "2025-11-19",
		status: "active"
	}
];

export const mockTableColumns = [
	{ key: "name", label: "Item Name", sortable: true, format: "text" },
	{ key: "category", label: "Category", sortable: true, format: "text" },
	{ key: "quantity", label: "Quantity", sortable: true, format: "number" },
	{ key: "cost", label: "Cost", sortable: true, format: "currency" },
	{ key: "date", label: "Date", sortable: true, format: "date" }
];

export const mockWasteData = {
	summary: {
		totalCost: 2347.89,
		totalItems: 156,
		avgPerDay: 335.41
	},
	byCategory: mockChartData,
	byReason: [
		{ label: "Spoiled", value: 890.45, color: "bg-red-500" },
		{ label: "Expired", value: 567.23, color: "bg-orange-500" },
		{ label: "Overproduction", value: 456.12, color: "bg-yellow-500" },
		{ label: "Damaged", value: 234.09, color: "bg-purple-500" }
	],
	items: mockTableData
};

export const mockInventoryData = {
	totalValue: 45678.90,
	lowStockCount: 12,
	expiringCount: 8,
	totalItems: 234,
	lowStockItems: [
		{
			id: 1,
			name: "Milk (Whole)",
			category: "Dairy",
			currentStock: 5,
			minLevel: 10,
			unit: "gallons"
		},
		{
			id: 2,
			name: "Eggs (Large)",
			category: "Dairy",
			currentStock: 3,
			minLevel: 12,
			unit: "dozen"
		}
	],
	expiringItems: [
		{
			id: 3,
			name: "Fresh Salmon",
			category: "Protein",
			expiryDate: "2025-11-25",
			quantity: 8,
			unit: "lbs"
		}
	]
};

export const mockDateRange = {
	start: "2025-11-01",
	end: "2025-11-23"
};

export const mockFoodCostData = {
	totalSales: 45000.00,
	totalCost: 13500.00,
	foodCostPercentage: 30.0,
	byCategory: mockChartData
};
