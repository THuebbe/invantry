// /backend/src/routes/order.js

import express from "express";
import { createPurchaseOrder, createPOFromOrderItems } from "../services/orders.js";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * Helper function to get restaurant ID from business ID
 */
async function getRestaurantId(businessId) {
	const { data: restaurant, error } = await supabase
		.from("restaurants")
		.select("id")
		.eq("business_id", businessId)
		.single();

	if (error || !restaurant) {
		throw new Error("No restaurant found for this business");
	}

	return restaurant.id;
}

// GET /api/orders/purchase-orders - Get all purchase orders
router.get("/purchase-orders", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);

		let query = supabase
			.from("purchase_orders")
			.select(`
				*,
				purchase_order_items(count)
			`)
			.eq("restaurant_id", restaurantId);

		// Apply filters if provided
		if (req.query.status) {
			query = query.eq("status", req.query.status);
		}
		if (req.query.supplier) {
			query = query.eq("supplier_name", req.query.supplier);
		}

		// Order by creation date (newest first)
		query = query.order("created_at", { ascending: false });

		const { data, error } = await query;
		if (error) throw error;

		// Add item count to each PO
		const purchaseOrders = data.map(po => ({
			...po,
			item_count: po.purchase_order_items[0]?.count || 0,
		}));

		res.json(purchaseOrders);
	} catch (error) {
		console.error("❌ Get purchase orders error:", error);
		res.status(500).json({ error: error.message });
	}
});

// GET /api/orders/purchase-orders/:id - Get specific purchase order
router.get("/purchase-orders/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		// Get purchase order with items
		const { data: po, error: poError } = await supabase
			.from("purchase_orders")
			.select(`
				*,
				purchase_order_items(
					*,
					ingredient:ingredient_library(
						id,
						name,
						category
					)
				)
			`)
			.eq("id", id)
			.eq("restaurant_id", restaurantId)
			.single();

		if (poError) throw poError;
		if (!po) {
			return res.status(404).json({ error: "Purchase order not found" });
		}

		// Format the response
		const formattedPO = {
			...po,
			items: po.purchase_order_items.map(item => ({
				id: item.id,
				ingredient_id: item.ingredient_id,
				ingredient_name: item.ingredient?.name,
				category: item.ingredient?.category,
				quantity_ordered: parseFloat(item.quantity_ordered),
				quantity_received: parseFloat(item.quantity_received || 0),
				unit: item.unit,
				unit_price: parseFloat(item.unit_price),
				line_total: parseFloat(item.line_total),
				expiration_date: item.expiration_date,
				batch_number: item.batch_number,
			})),
		};

		res.json(formattedPO);
	} catch (error) {
		console.error("❌ Get purchase order error:", error);
		res.status(500).json({ error: error.message });
	}
});

// POST /api/orders (create purchase order)
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

// POST /api/orders/from-order-items (create PO from existing order items)
router.post("/from-order-items", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);

		// Validate request body
		const { supplierName, expectedDeliveryDate, notes, orderItemIds } = req.body;

		if (!supplierName) {
			return res.status(400).json({ error: "Supplier name is required" });
		}

		if (!orderItemIds || !Array.isArray(orderItemIds) || orderItemIds.length === 0) {
			return res.status(400).json({ 
				error: "Order item IDs array is required and must not be empty" 
			});
		}

		// Create PO from order items with automatic linking
		const poData = {
			restaurant_id: restaurantId,
			supplierName,
			expectedDeliveryDate,
			notes,
			createdBy: req.user.id,
		};

		const result = await createPOFromOrderItems(poData, orderItemIds);
		res.status(201).json(result);
	} catch (error) {
		console.error("❌ Create PO from order items error:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
