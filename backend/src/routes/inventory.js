import express from "express";
import {
	getInventoryList,
	lookupIngredientByBarcode,
	receiveInventory,
	removeInventory,
} from "../services/inventory.js";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// GET /api/inventory
router.get("/", async (req, res) => {
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

		const inventory = await getInventoryList(restaurant_id);
		res.json(inventory);
	} catch (error) {
		console.error("❌ Get inventory error:", error);
		res.status(500).json({ error: error.message });
	}
});

// GET /api/inventory/lookup?barcode=123456789
router.get("/lookup", async (req, res) => {
	try {
		const { barcode } = req.query;

		if (!barcode) {
			return res.status(400).json({ error: "Barcode parameter is required" });
		}

		const ingredient = await lookupIngredientByBarcode(barcode);
		res.json(ingredient);
	} catch (error) {
		console.error("❌ Lookup ingredient error:", error);
		if (error.message.includes("not found")) {
			res.status(404).json({ error: error.message });
		} else {
			res.status(500).json({ error: error.message });
		}
	}
});

// POST /api/inventory/receive
router.post("/receive", async (req, res) => {
	try {
		const { items } = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: "Items array is required" });
		}

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

		const result = await receiveInventory(restaurant_id, items);
		res.json(result);
	} catch (error) {
		console.error("❌ Receive inventory error:", error);
		res.status(500).json({ error: error.message });
	}
});

// POST /api/inventory/remove
router.post("/remove", async (req, res) => {
	try {
		const { items } = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: "Items array is required" });
		}

		// Validate each item has required fields
		for (const item of items) {
			if (!item.ingredientId) {
				return res
					.status(400)
					.json({ error: "Missing required field: ingredientId" });
			}
			if (!item.quantity || item.quantity <= 0) {
				return res.status(400).json({
					error: "Quantity must be a positive number",
				});
			}
			if (!item.reason) {
				return res
					.status(400)
					.json({ error: "Missing required field: reason" });
			}
		}

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

		const result = await removeInventory(restaurant_id, items);
		res.json(result);
	} catch (error) {
		console.error("❌ Remove inventory error:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
