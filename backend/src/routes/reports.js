// /backend/src/routes/reports.js

import express from "express";
import { supabase } from "../services/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Parse time period and return start/end dates
 */
function parsePeriod(period) {
	const now = new Date();
	let startDate, endDate;

	switch (period) {
		case "today":
			startDate = new Date(now.setHours(0, 0, 0, 0));
			endDate = new Date(now.setHours(23, 59, 59, 999));
			break;

		case "week":
			startDate = new Date(now.setDate(now.getDate() - now.getDay()));
			startDate.setHours(0, 0, 0, 0);
			endDate = new Date();
			break;

		case "month":
			startDate = new Date(now.getFullYear(), now.getMonth(), 1);
			endDate = new Date();
			break;

		case "quarter":
			const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
			startDate = new Date(now.getFullYear(), quarterMonth, 1);
			endDate = new Date();
			break;

		case "year":
			startDate = new Date(now.getFullYear(), 0, 1);
			endDate = new Date();
			break;

		default:
			// Default to week
			startDate = new Date(now.setDate(now.getDate() - now.getDay()));
			startDate.setHours(0, 0, 0, 0);
			endDate = new Date();
	}

	return { startDate, endDate };
}

/**
 * Get comparison period dates
 */
function getComparisonPeriod(startDate, endDate) {
	const duration = endDate - startDate;
	const comparisonEnd = new Date(startDate);
	const comparisonStart = new Date(startDate - duration);

	return { comparisonStart, comparisonEnd };
}

/**
 * Get restaurant ID from auth
 */
async function getRestaurantId(businessId) {
	const { data: restaurant, error } = await supabase
		.from("restaurants")
		.select("id")
		.eq("business_id", businessId)
		.single();

	if (error) throw error;
	if (!restaurant) throw new Error("No restaurant found for this business");

	return restaurant.id;
}

// =====================================================
// WASTE TRACKING ENDPOINTS
// =====================================================

/**
 * GET /api/reports/waste/summary
 * Overall waste summary with optional comparison
 *
 * Query params:
 * - period: 'today', 'week', 'month', 'quarter', 'year' (default: 'week')
 * - compare: 'true' or 'false' (default: 'false')
 * - start: Custom start date (YYYY-MM-DD)
 * - end: Custom end date (YYYY-MM-DD)
 */
router.get("/waste/summary", async (req, res) => {
	try {
		const restaurant_id = await getRestaurantId(req.businessId);
		const period = req.query.period || "week";
		const compare = req.query.compare === "true";

		let startDate, endDate;

		// Custom date range
		if (req.query.start && req.query.end) {
			startDate = new Date(req.query.start);
			endDate = new Date(req.query.end);
		} else {
			({ startDate, endDate } = parsePeriod(period));
		}

		// Current period waste data
		const { data: currentWaste, error: currentError } = await supabase
			.from("waste_log")
			.select("quantity, cost_value, reason, category")
			.eq("restaurant_id", restaurant_id)
			.eq("category", "waste")
			.gte("logged_at", startDate.toISOString())
			.lte("logged_at", endDate.toISOString());

		if (currentError) throw currentError;

		const totalWasteValue = currentWaste.reduce(
			(sum, item) => sum + parseFloat(item.cost_value || 0),
			0
		);
		const totalWasteCount = currentWaste.length;

		// Get all reductions (including donations, usage, etc.)
		const { data: allReductions, error: reductionsError } = await supabase
			.from("waste_log")
			.select("cost_value")
			.eq("restaurant_id", restaurant_id)
			.gte("logged_at", startDate.toISOString())
			.lte("logged_at", endDate.toISOString());

		if (reductionsError) throw reductionsError;

		const totalReductionsValue = allReductions.reduce(
			(sum, item) => sum + parseFloat(item.cost_value || 0),
			0
		);

		// Build response
		const response = {
			period: {
				type: period,
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			},
			waste: {
				total_value: parseFloat(totalWasteValue.toFixed(2)),
				total_count: totalWasteCount,
				avg_per_incident:
					totalWasteCount > 0
						? parseFloat((totalWasteValue / totalWasteCount).toFixed(2))
						: 0,
			},
			all_reductions: {
				total_value: parseFloat(totalReductionsValue.toFixed(2)),
			},
		};

		// Add comparison data if requested
		if (compare) {
			const { comparisonStart, comparisonEnd } = getComparisonPeriod(
				startDate,
				endDate
			);

			const { data: previousWaste, error: previousError } = await supabase
				.from("waste_log")
				.select("cost_value")
				.eq("restaurant_id", restaurant_id)
				.eq("category", "waste")
				.gte("logged_at", comparisonStart.toISOString())
				.lte("logged_at", comparisonEnd.toISOString());

			if (previousError) throw previousError;

			const previousWasteValue = previousWaste.reduce(
				(sum, item) => sum + parseFloat(item.cost_value || 0),
				0
			);

			const changeValue = totalWasteValue - previousWasteValue;
			const changePercent =
				previousWasteValue > 0
					? ((changeValue / previousWasteValue) * 100).toFixed(1)
					: 0;

			response.comparison = {
				previous_period: {
					start: comparisonStart.toISOString(),
					end: comparisonEnd.toISOString(),
					total_value: parseFloat(previousWasteValue.toFixed(2)),
				},
				change: {
					value: parseFloat(changeValue.toFixed(2)),
					percent: parseFloat(changePercent),
					direction:
						changeValue > 0
							? "increased"
							: changeValue < 0
							? "decreased"
							: "unchanged",
				},
			};
		}

		res.json(response);
	} catch (error) {
		console.error("Waste summary error:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/reports/waste/by-category
 * Waste breakdown by ingredient category (protein, produce, etc.)
 */
router.get("/waste/by-category", async (req, res) => {
	try {
		const restaurant_id = await getRestaurantId(req.businessId);
		const period = req.query.period || "week";

		let startDate, endDate;

		if (req.query.start && req.query.end) {
			startDate = new Date(req.query.start);
			endDate = new Date(req.query.end);
		} else {
			({ startDate, endDate } = parsePeriod(period));
		}

		// Get waste by ingredient category
		const { data: wasteData, error } = await supabase
			.from("waste_log")
			.select(
				`
				cost_value,
				quantity,
				unit,
				ingredient:ingredient_library(category)
			`
			)
			.eq("restaurant_id", restaurant_id)
			.eq("category", "waste")
			.gte("logged_at", startDate.toISOString())
			.lte("logged_at", endDate.toISOString());

		if (error) throw error;

		// Group by category
		const categoryMap = {};

		wasteData.forEach((item) => {
			const category = item.ingredient?.category || "uncategorized";
			if (!categoryMap[category]) {
				categoryMap[category] = {
					category: category,
					total_value: 0,
					count: 0,
				};
			}
			categoryMap[category].total_value += parseFloat(item.cost_value || 0);
			categoryMap[category].count++;
		});

		// Convert to array and sort by value
		const categories = Object.values(categoryMap)
			.map((cat) => ({
				...cat,
				total_value: parseFloat(cat.total_value.toFixed(2)),
			}))
			.sort((a, b) => b.total_value - a.total_value);

		const totalWaste = categories.reduce(
			(sum, cat) => sum + cat.total_value,
			0
		);

		res.json({
			period: {
				type: period,
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			},
			total_waste: parseFloat(totalWaste.toFixed(2)),
			categories: categories,
		});
	} catch (error) {
		console.error("Waste by category error:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/reports/waste/by-reason
 * Waste breakdown by reason (spoilage, expired, etc.)
 */
router.get("/waste/by-reason", async (req, res) => {
	try {
		const restaurant_id = await getRestaurantId(req.businessId);
		const period = req.query.period || "week";

		let startDate, endDate;

		if (req.query.start && req.query.end) {
			startDate = new Date(req.query.start);
			endDate = new Date(req.query.end);
		} else {
			({ startDate, endDate } = parsePeriod(period));
		}

		// Get waste by reason
		const { data: wasteData, error } = await supabase
			.from("waste_log")
			.select("reason, cost_value")
			.eq("restaurant_id", restaurant_id)
			.eq("category", "waste")
			.gte("logged_at", startDate.toISOString())
			.lte("logged_at", endDate.toISOString());

		if (error) throw error;

		// Group by reason
		const reasonMap = {};

		wasteData.forEach((item) => {
			if (!reasonMap[item.reason]) {
				reasonMap[item.reason] = {
					reason: item.reason,
					total_value: 0,
					count: 0,
				};
			}
			reasonMap[item.reason].total_value += parseFloat(item.cost_value || 0);
			reasonMap[item.reason].count++;
		});

		// Convert to array and sort by value
		const reasons = Object.values(reasonMap)
			.map((r) => ({
				...r,
				total_value: parseFloat(r.total_value.toFixed(2)),
			}))
			.sort((a, b) => b.total_value - a.total_value);

		const totalWaste = reasons.reduce((sum, r) => sum + r.total_value, 0);

		res.json({
			period: {
				type: period,
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			},
			total_waste: parseFloat(totalWaste.toFixed(2)),
			reasons: reasons,
		});
	} catch (error) {
		console.error("Waste by reason error:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/reports/waste/by-item
 * Top wasted items
 */
router.get("/waste/by-item", async (req, res) => {
	try {
		const restaurant_id = await getRestaurantId(req.businessId);
		const period = req.query.period || "week";
		const limit = parseInt(req.query.limit || "20");

		let startDate, endDate;

		if (req.query.start && req.query.end) {
			startDate = new Date(req.query.start);
			endDate = new Date(req.query.end);
		} else {
			({ startDate, endDate } = parsePeriod(period));
		}

		// Get waste by item
		const { data: wasteData, error } = await supabase
			.from("waste_log")
			.select(
				`
				quantity,
				unit,
				cost_value,
				ingredient:ingredient_library(id, name, category)
			`
			)
			.eq("restaurant_id", restaurant_id)
			.eq("category", "waste")
			.gte("logged_at", startDate.toISOString())
			.lte("logged_at", endDate.toISOString());

		if (error) throw error;

		// Group by ingredient
		const itemMap = {};

		wasteData.forEach((item) => {
			const ingredientId = item.ingredient?.id;
			if (!ingredientId) return;

			if (!itemMap[ingredientId]) {
				itemMap[ingredientId] = {
					ingredient_id: ingredientId,
					ingredient_name: item.ingredient.name,
					category: item.ingredient.category,
					total_quantity: 0,
					total_value: 0,
					count: 0,
					unit: item.unit,
				};
			}
			itemMap[ingredientId].total_quantity += parseFloat(item.quantity || 0);
			itemMap[ingredientId].total_value += parseFloat(item.cost_value || 0);
			itemMap[ingredientId].count++;
		});

		// Convert to array, sort by value, and limit
		const items = Object.values(itemMap)
			.map((item) => ({
				...item,
				total_quantity: parseFloat(item.total_quantity.toFixed(2)),
				total_value: parseFloat(item.total_value.toFixed(2)),
			}))
			.sort((a, b) => b.total_value - a.total_value)
			.slice(0, limit);

		res.json({
			period: {
				type: period,
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			},
			items: items,
		});
	} catch (error) {
		console.error("Waste by item error:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/reports/waste/trends
 * Historical waste trends (for charts)
 */
router.get("/waste/trends", async (req, res) => {
	try {
		const restaurant_id = await getRestaurantId(req.businessId);
		const period = req.query.period || "month";
		const groupBy = req.query.groupBy || "day"; // day, week, month

		let startDate, endDate;

		if (req.query.start && req.query.end) {
			startDate = new Date(req.query.start);
			endDate = new Date(req.query.end);
		} else {
			({ startDate, endDate } = parsePeriod(period));
		}

		// Get all waste data for period
		const { data: wasteData, error } = await supabase
			.from("waste_log")
			.select("logged_at, cost_value")
			.eq("restaurant_id", restaurant_id)
			.eq("category", "waste")
			.gte("logged_at", startDate.toISOString())
			.lte("logged_at", endDate.toISOString())
			.order("logged_at", { ascending: true });

		if (error) throw error;

		// Group by time period
		const trendsMap = {};

		wasteData.forEach((item) => {
			const date = new Date(item.logged_at);
			let key;

			if (groupBy === "day") {
				key = date.toISOString().split("T")[0];
			} else if (groupBy === "week") {
				const weekStart = new Date(date);
				weekStart.setDate(date.getDate() - date.getDay());
				key = weekStart.toISOString().split("T")[0];
			} else if (groupBy === "month") {
				key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
					2,
					"0"
				)}`;
			}

			if (!trendsMap[key]) {
				trendsMap[key] = {
					date: key,
					total_value: 0,
					count: 0,
				};
			}
			trendsMap[key].total_value += parseFloat(item.cost_value || 0);
			trendsMap[key].count++;
		});

		// Convert to array and sort by date
		const trends = Object.values(trendsMap)
			.map((t) => ({
				...t,
				total_value: parseFloat(t.total_value.toFixed(2)),
			}))
			.sort((a, b) => new Date(a.date) - new Date(b.date));

		res.json({
			period: {
				type: period,
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			},
			group_by: groupBy,
			trends: trends,
		});
	} catch (error) {
		console.error("Waste trends error:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/reports/food-cost
 * Detailed food cost analysis
 */
router.get("/food-cost", async (req, res) => {
	try {
		const restaurant_id = await getRestaurantId(req.businessId);
		const period = req.query.period || "month";
		const compare = req.query.compare === "true";

		let startDate, endDate;

		if (req.query.start && req.query.end) {
			startDate = new Date(req.query.start);
			endDate = new Date(req.query.end);
		} else {
			({ startDate, endDate } = parsePeriod(period));
		}

		// Get total waste cost
		const { data: wasteData, error: wasteError } = await supabase
			.from("waste_log")
			.select("cost_value")
			.eq("restaurant_id", restaurant_id)
			.eq("category", "waste")
			.gte("logged_at", startDate.toISOString())
			.lte("logged_at", endDate.toISOString());

		if (wasteError) throw wasteError;

		const totalWaste = wasteData.reduce(
			(sum, item) => sum + parseFloat(item.cost_value || 0),
			0
		);

		// Get total inventory value (approximate COGS)
		const { data: inventoryData, error: inventoryError } = await supabase
			.from("restaurant_inventory")
			.select("quantity, cost_per_unit")
			.eq("restaurant_id", restaurant_id);

		if (inventoryError) throw inventoryError;

		const totalInventoryValue = inventoryData.reduce(
			(sum, item) =>
				sum +
				parseFloat(item.quantity || 0) * parseFloat(item.cost_per_unit || 0),
			0
		);

		// Calculate food cost percentage (mock for now - need sales data for real calculation)
		// For MVP, using waste as a % of inventory
		const wastePercentage =
			totalInventoryValue > 0 ? (totalWaste / totalInventoryValue) * 100 : 0;

		const response = {
			period: {
				type: period,
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			},
			waste_cost: parseFloat(totalWaste.toFixed(2)),
			total_inventory_value: parseFloat(totalInventoryValue.toFixed(2)),
			waste_percentage: parseFloat(wastePercentage.toFixed(2)),
			note: "Food cost % calculation requires sales data (coming in future release)",
		};

		// Add comparison if requested
		if (compare) {
			const { comparisonStart, comparisonEnd } = getComparisonPeriod(
				startDate,
				endDate
			);

			const { data: previousWaste } = await supabase
				.from("waste_log")
				.select("cost_value")
				.eq("restaurant_id", restaurant_id)
				.eq("category", "waste")
				.gte("logged_at", comparisonStart.toISOString())
				.lte("logged_at", comparisonEnd.toISOString());

			const previousWasteValue = previousWaste.reduce(
				(sum, item) => sum + parseFloat(item.cost_value || 0),
				0
			);

			const changeValue = totalWaste - previousWasteValue;
			const changePercent =
				previousWasteValue > 0
					? ((changeValue / previousWasteValue) * 100).toFixed(1)
					: 0;

			response.comparison = {
				previous_period: {
					start: comparisonStart.toISOString(),
					end: comparisonEnd.toISOString(),
					waste_cost: parseFloat(previousWasteValue.toFixed(2)),
				},
				change: {
					value: parseFloat(changeValue.toFixed(2)),
					percent: parseFloat(changePercent),
					direction:
						changeValue > 0
							? "increased"
							: changeValue < 0
							? "decreased"
							: "unchanged",
				},
			};
		}

		res.json(response);
	} catch (error) {
		console.error("Food cost error:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
