import express from "express";
import {
	getDashboardMetrics,
	getInventoryMetrics,
	getOrderMetrics,
	getReceivingMetrics,
} from "../services/metrics.js";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// GET /api/metrics/dashboard
router.get("/dashboard", async (req, res) => {
	try {
		// Get restaurant_id from authenticated user's business (matches existing pattern)
		const { data: restaurant, error: restaurantError } = await supabase
			.from("restaurants")
			.select("id")
			.eq("business_id", req.businessId)
			.single();

		if (restaurantError) throw restaurantError;
		if (!restaurant) {
			return res.status(404).json({
				error: "No restaurant found for this business. Please contact support.",
			});
		}

		const restaurant_id = restaurant.id;

		const metrics = await getDashboardMetrics(restaurant_id);
		res.json(metrics);
	} catch (error) {
		console.error("❌ Dashboard metrics error:", error);
		res.status(500).json({ error: error.message });
	}
});

// GET /api/metrics/inventory
router.get("/inventory", async (req, res) => {
	try {
		// Get restaurant_id from authenticated user's business (matches existing pattern)
		const { data: restaurant, error: restaurantError } = await supabase
			.from("restaurants")
			.select("id")
			.eq("business_id", req.businessId)
			.single();

		if (restaurantError) throw restaurantError;
		if (!restaurant) {
			return res.status(404).json({
				error: "No restaurant found for this business. Please contact support.",
			});
		}

		const restaurant_id = restaurant.id;

		const metrics = await getInventoryMetrics(restaurant_id);
		res.json(metrics);
	} catch (error) {
		console.error("❌ Inventory metrics error:", error);
		res.status(500).json({ error: error.message });
	}
});

// GET /api/metrics/orders (NEW - Phase 2)
router.get("/orders", async (req, res) => {
	try {
		// Get restaurant_id from authenticated user's business
		const { data: restaurant, error: restaurantError } = await supabase
			.from("restaurants")
			.select("id")
			.eq("business_id", req.businessId)
			.single();

		if (restaurantError) throw restaurantError;
		if (!restaurant) {
			return res.status(404).json({
				error: "No restaurant found for this business. Please contact support.",
			});
		}

		const restaurant_id = restaurant.id;

		const metrics = await getOrderMetrics(restaurant_id);
		res.json(metrics);
	} catch (error) {
		console.error("❌ Order metrics error:", error);
		res.status(500).json({ error: error.message });
	}
});

// GET /api/metrics/receiving (NEW - Phase 2)
router.get("/receiving", async (req, res) => {
	try {
		// Get restaurant_id from authenticated user's business
		const { data: restaurant, error: restaurantError } = await supabase
			.from("restaurants")
			.select("id")
			.eq("business_id", req.businessId)
			.single();

		if (restaurantError) throw restaurantError;
		if (!restaurant) {
			return res.status(404).json({
				error: "No restaurant found for this business. Please contact support.",
			});
		}

		const restaurant_id = restaurant.id;

		const metrics = await getReceivingMetrics(restaurant_id);
		res.json(metrics);
	} catch (error) {
		console.error("❌ Receiving metrics error:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
