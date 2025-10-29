import { supabase } from "./supabase.js";

/**
 * Get dashboard overview metrics
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<Object>} Dashboard metrics
 */
export async function getDashboardMetrics(restaurantId) {
	if (!restaurantId) {
		throw new Error("Restaurant ID is required");
	}

	try {
		// Get all inventory items to check low stock
		const { data: allInventory, error: inventoryError } = await supabase
			.from("restaurant_inventory")
			.select("quantity, minimum_quantity")
			.eq("restaurant_id", restaurantId);

		if (inventoryError) throw inventoryError;

		// Filter for low stock in JavaScript
		const lowStockCount =
			allInventory?.filter(
				(item) =>
					parseFloat(item.quantity) <= parseFloat(item.minimum_quantity || 0)
			).length || 0;

		// Get expiring items count (expires within next 7 days)
		const today = new Date();
		const sevenDaysFromNow = new Date();
		sevenDaysFromNow.setDate(today.getDate() + 7);

		const { count: expiringCount, error: expiringError } = await supabase
			.from("restaurant_inventory")
			.select("id", { count: "exact", head: true })
			.eq("restaurant_id", restaurantId)
			.gte("expiration_date", today.toISOString().split("T")[0])
			.lte("expiration_date", sevenDaysFromNow.toISOString().split("T")[0]);

		if (expiringError) throw expiringError;

		// Get open orders count (status = 'draft' OR 'ordered')
		const { count: openOrdersCount, error: ordersError } = await supabase
			.from("purchase_orders")
			.select("id", { count: "exact", head: true })
			.eq("restaurant_id", restaurantId)
			.in("status", ["draft", "ordered"]);

		if (ordersError) throw ordersError;

		// Mock food cost percentage for MVP
		// TODO: Calculate from actual sales data in future
		const weeklyFoodCostPercent = 28.5;

		return {
			lowStockCount: lowStockCount,
			expiringItemsCount: expiringCount || 0,
			openOrdersCount: openOrdersCount || 0,
			weeklyFoodCostPercent,
		};
	} catch (error) {
		console.error("Error getting dashboard metrics:", error);
		throw new Error(`Failed to get dashboard metrics: ${error.message}`);
	}
}

/**
 * Get inventory-specific metrics
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<Object>} Inventory metrics
 */
export async function getInventoryMetrics(restaurantId) {
	if (!restaurantId) {
		throw new Error("Restaurant ID is required");
	}

	try {
		// Get all inventory to check below reorder point
		// Note: We can't compare two columns directly in Supabase JS, so we fetch and filter
		const { data: allInventory, error: inventoryError } = await supabase
			.from("restaurant_inventory")
			.select("quantity, minimum_quantity")
			.eq("restaurant_id", restaurantId);

		if (inventoryError) throw inventoryError;

		// Filter for below reorder in JavaScript
		const belowReorderCount =
			allInventory?.filter(
				(item) =>
					parseFloat(item.quantity) <= parseFloat(item.minimum_quantity || 0)
			).length || 0;

		// Get expiring this week (next 7 days)
		const today = new Date();
		const sevenDaysFromNow = new Date();
		sevenDaysFromNow.setDate(today.getDate() + 7);

		const { count: expiringThisWeek, error: expiringError } = await supabase
			.from("restaurant_inventory")
			.select("id", { count: "exact", head: true })
			.eq("restaurant_id", restaurantId)
			.gte("expiration_date", today.toISOString().split("T")[0])
			.lte("expiration_date", sevenDaysFromNow.toISOString().split("T")[0]);

		if (expiringError) throw expiringError;

		// Get top used ingredient
		// For MVP, we'll query the ingredient that appears most in inventory
		// TODO: Track actual usage data in future
		const { data: ingredients, error: ingredientsError } = await supabase
			.from("restaurant_inventory")
			.select(
				`
        ingredient_id,
        ingredient_library!inner(name)
      `
			)
			.eq("restaurant_id", restaurantId)
			.limit(100); // Reasonable limit for analysis

		if (ingredientsError) throw ingredientsError;

		// Count occurrences and find most common
		let topUsedIngredient = "Chicken Breast"; // Default fallback
		if (ingredients && ingredients.length > 0) {
			const ingredientCounts = {};
			ingredients.forEach((item) => {
				const name = item.ingredient_library?.name;
				if (name) {
					ingredientCounts[name] = (ingredientCounts[name] || 0) + 1;
				}
			});

			const sortedIngredients = Object.entries(ingredientCounts).sort(
				(a, b) => b[1] - a[1]
			);
			if (sortedIngredients.length > 0) {
				topUsedIngredient = sortedIngredients[0][0];
			}
		}

		// Mock inventory turnover rate for MVP
		// TODO: Calculate from actual usage data: (Cost of Goods Used / Average Inventory Value)
		const inventoryTurnoverRate = 2.3;

		return {
			belowReorderCount: belowReorderCount,
			expiringThisWeek: expiringThisWeek || 0,
			topUsedIngredient,
			inventoryTurnoverRate,
		};
	} catch (error) {
		console.error("Error getting inventory metrics:", error);
		throw new Error(`Failed to get inventory metrics: ${error.message}`);
	}
}
