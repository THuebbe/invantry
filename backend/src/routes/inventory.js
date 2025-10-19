import express from "express";
import { getData } from "../services/supabase.js";
import { supabase } from "../services/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

// GET inventory - use businessId from auth instead of URL param
router.get("/", async (req, res) => {
	try {
		const { data: restaurant, error: restaurantError } = await supabase
			.from("restaurants")
			.select("*")
			.eq("business_id", req.businessId)
			.single();

		if (restaurantError) throw restaurantError;

		const { restaurant_id } = restaurant.id;

		const { data, error } = await supabase
			.from("restaurant_inventory")
			.select(
				`
				*,
				ingredient:ingredient_library(*)
			`
			)
			.eq("restaurant_id", restaurant_id);

		if (error) throw error;

		const inventory = data.map((item) => ({
			id: item.id,
			ingredient_id: item.ingredient_id,
			ingredient_name: item.ingredient.name,
			category: item.ingredient.category,
			quantity: item.quantity,
			unit: item.unit,
			minimum_quantity: item.minimum_quantity,
			cost_per_unit: item.cost_per_unit,
			location: item.location,
			expiration_date: item.expiration_date,
			last_restocked: item.last_restocked,
		}));

		res.json(inventory);
	} catch (error) {
		console.error("Inventory error: ", error);
		res.status(500).json({ error: error.message });
	}
});

router.get("/lookup", async (req, res) => {
	try {
		const { barcode } = req.query;

		const { data, error } = await supabase
			.from("ingredient_library")
			.select("*")
			.eq("barcode", barcode)
			.single();

		if (error) throw error;

		res.json(data);
	} catch (error) {
		res.status(404).json({ error: "Ingredient not found" });
	}
});

router.post("/receive", async (req, res) => {
	try {
		const { items } = req.body;

		console.log("📦 Receiving items: ", items);

		const { data: restaurant, error: restaurantError } = await supabase
			.from("restaurants")
			.select("id")
			.eq("business_id", req.businessId)
			.single();

		if (restaurantError) throw restaurantError;

		const restaurant_id = restaurant.id;

		const results = [];

		for (const item of items) {
			// Check if inventory already exists
			const { data: existing, error: find_error } = await supabase
				.from("restaurant_inventory")
				.select("*")
				.eq("restaurant_id", restaurant_id)
				.eq("ingredient_id", item.ingredientId)
				.maybeSingle();

			if (find_error) throw find_error;

			if (existing) {
				// Update existing inventory
				const { data: updated, error: update_error } = await supabase
					.from("restaurant_inventory")
					.update({
						quantity: parseFloat(existing.quantity) + parseFloat(item.quantity),
						last_restocked: new Date().toISOString(),
						expiration_date: item.expiration_date,
					})
					.eq("id", existing.id)
					.select()
					.single();

				if (update_error) throw update_error;

				results.push(updated);
			} else {
				// Create inventory record
				const { data: created, error: create_error } = await supabase
					.from("restaurant_inventory")
					.insert({
						restaurant_id: restaurant_id,
						ingredient_id: item.ingredient_id,
						quantity: parseFloat(item.quantity),
						unit: item.unit,
						location: item.location,
						expiration_date: item.expiration_date,
						last_restocked: new Date().toISOString(),
					})
					.select()
					.single();

				if (create_error) throw create_error;

				results.push(created);
			}
		}

		console.log("✅ Successfully received", results.length, "items");

		res.json({
			success: true,
			message: `Received ${results.length} items`,
			items: results,
		});
	} catch (error) {
		console.error("❌ Receive error: ", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
