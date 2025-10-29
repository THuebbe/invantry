import express from "express";
import { createPurchaseOrder } from "../services/orders.js";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// POST /api/orders (or /api/purchase-orders)
router.post("/", async (req, res) => {
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

		// Validate request body
		const { supplierName, expectedDeliveryDate, items, notes } = req.body;

		if (!supplierName) {
			return res.status(400).json({ error: "Supplier name is required" });
		}

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res
				.status(400)
				.json({ error: "Items array is required and must not be empty" });
		}

		// Validate each item
		for (const item of items) {
			if (!item.ingredientId) {
				return res
					.status(400)
					.json({ error: "Each item must have an ingredientId" });
			}
			if (!item.quantityOrdered || item.quantityOrdered <= 0) {
				return res
					.status(400)
					.json({ error: "Each item must have a positive quantityOrdered" });
			}
			if (!item.unit) {
				return res.status(400).json({ error: "Each item must have a unit" });
			}
			if (!item.unitPrice || item.unitPrice < 0) {
				return res
					.status(400)
					.json({ error: "Each item must have a valid unitPrice" });
			}
		}

		// Create the purchase order
		const orderData = {
			restaurant_id,
			supplierName,
			expectedDeliveryDate,
			items,
			notes,
			createdBy: req.user.id,
		};

		const result = await createPurchaseOrder(orderData);
		res.status(201).json(result);
	} catch (error) {
		console.error("❌ Create purchase order error:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
