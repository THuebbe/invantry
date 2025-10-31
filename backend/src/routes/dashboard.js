// /backend/src/routes/dashboard.js

import express from "express";
import { getData } from "../services/supabase.js";
import { supabase } from "../services/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
	try {
		// Get restaurant_id from authenticated user's business
		const { data: restaurant, error: restaurantError } = await supabase
			.from("restaurants")
			.select("id")
			.eq("business_id", req.businessId)
			.single();

		if (restaurantError) throw restaurantError;

		const restaurant_id = restaurant.id;

		// Get ALL inventory for this restaurant
		const { data: inventory, error: inventoryError } = await supabase
			.from("restaurant_inventory")
			.select("*")
			.eq("restaurant_id", restaurant_id);

		if (inventoryError) throw inventoryError;

		// Filter low stock count
		const low_stock = inventory.filter(
			(item) => item.quantity <= item.minimum_quantity
		);

		// Get items expiring soon (within 7 days)
		const today = new Date();
		const sevenDaysFromNow = new Date();
		sevenDaysFromNow.setDate(today.getDate() + 7);

		const { data: expiring_soon, error: expiring_error } = await supabase
			.from("restaurant_inventory")
			.select("*")
			.eq("restaurant_id", restaurant_id)
			.lte("expiration_date", sevenDaysFromNow.toISOString().split("T")[0])
			.gte("expiration_date", today.toISOString().split("T")[0]);

		if (expiring_error) throw expiring_error;

		// Calculate food cost percentage (mock for MVP)
		const monthly_food_cost = 28.5; // TODO: Calculate from actual data

		res.json({
			low_stock_alerts: low_stock?.length || 0,
			items_expiring_soon: expiring_soon?.length || 0,
			monthly_food_cost: monthly_food_cost,
		});
	} catch (error) {
		console.error("Dashboard error:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
