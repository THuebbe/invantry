// /backend/src/routes/restaurantOrders.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";
import {
	createRestaurantOrder,
	getRestaurantOrders,
	getRestaurantOrderById,
	createQuickOrder,
	getOrdersPendingPOs,
	updateOrderStatus,
	updateRestaurantOrder,
	calculateQuantityOnOrder,
	getSuggestedReorderQuantity,
	getLowStockItemsForOrder,
} from "../services/restaurantOrders.js";

const router = express.Router();

// Debug middleware - logs ALL requests to this router
router.use((req, res, next) => {
	console.log(`🔵 RESTAURANT ORDERS ROUTER: ${req.method} ${req.path}`);
	next();
});

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

// GET /api/orders/restaurant-orders - Get all restaurant orders
router.get("/restaurant-orders", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const filters = {
			status: req.query.status,
			orderType: req.query.orderType,
		};

		const orders = await getRestaurantOrders(restaurantId, filters);
		res.json(orders);
	} catch (error) {
		console.error("❌ Get restaurant orders error:", error);
		res.status(500).json({ error: error.message });
	}
});

// GET /api/orders/restaurant-orders/:id - Get specific restaurant order
router.get("/restaurant-orders/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const order = await getRestaurantOrderById(id);

		// Verify order belongs to user's restaurant
		const restaurantId = await getRestaurantId(req.businessId);
		if (order.restaurant_id !== restaurantId) {
			return res.status(403).json({ error: "Access denied" });
		}

		res.json(order);
	} catch (error) {
		console.error("❌ Get restaurant order error:", error);
		res.status(error.message.includes("not found") ? 404 : 500).json({
			error: error.message,
		});
	}
});

// POST /api/orders/restaurant-orders - Create new restaurant order
router.post("/restaurant-orders", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const { orderType, items, notes, status } = req.body;

		// Validation - orderType is now optional
		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({
				error: "Items array is required and must not be empty",
			});
		}

		// Validate each item
		for (const item of items) {
			if (!item.ingredientId) {
				return res.status(400).json({
					error: "Each item must have an ingredientId",
				});
			}
			if (!item.quantity || item.quantity <= 0) {
				return res.status(400).json({
					error: "Each item must have a positive quantity",
				});
			}
			if (!item.unit) {
				return res.status(400).json({
					error: "Each item must have a unit",
				});
			}
		}

		const orderData = {
			restaurant_id: restaurantId,
			orderType,
			items,
			notes,
			status, // Pass status from request body
			createdBy: req.user.id,
		};

		const result = await createRestaurantOrder(orderData);
		res.status(201).json(result);
	} catch (error) {
		console.error("❌ Create restaurant order error:", error);
		res.status(500).json({ error: error.message });
	}
});

// POST /api/orders/quick-order - Create quick order from low stock items
router.post("/quick-order", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const { notes, items } = req.body;

		let result;
		
		if (items && items.length > 0) {
			// Use provided items (from frontend adjustment)
			const orderData = {
				restaurant_id: restaurantId,
				orderType: "quick",
				items,
				notes: notes || "Quick order with adjusted quantities",
				createdBy: req.user.id,
			};
			result = await createRestaurantOrder(orderData);
		} else {
			// Auto-generate from low stock
			result = await createQuickOrder(restaurantId, req.user.id, { notes });
		}

		res.status(201).json(result);
	} catch (error) {
		console.error("❌ Create quick order error:", error);
		res.status(500).json({ error: error.message });
	}
});

// GET /api/orders/pending-for-pos - Get orders that need PO generation
router.get("/pending-for-pos", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const orders = await getOrdersPendingPOs(restaurantId);
		res.json(orders);
	} catch (error) {
		console.error("❌ Get pending PO orders error:", error);
		res.status(500).json({ error: error.message });
	}
});

// PUT /api/orders/restaurant-orders/:id - Update order details
router.put("/restaurant-orders/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { notes, items } = req.body;

		// Verify order belongs to user's restaurant
		const restaurantId = await getRestaurantId(req.businessId);
		const order = await getRestaurantOrderById(id);
		
		if (order.restaurant_id !== restaurantId) {
			return res.status(403).json({ error: "Access denied" });
		}

		// Only allow editing draft orders
		if (order.status !== "draft") {
			return res.status(400).json({ 
				error: "Only draft orders can be edited" 
			});
		}

		const updatedOrder = await updateRestaurantOrder(id, { notes, items });
		res.json(updatedOrder);
	} catch (error) {
		console.error("❌ Update restaurant order error:", error);
		res.status(500).json({ error: error.message });
	}
});

// PUT /api/orders/restaurant-orders/:id/status - Update order status
router.put("/restaurant-orders/:id/status", async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		if (!status) {
			return res.status(400).json({ error: "Status is required" });
		}

		const validStatuses = ["draft", "submitted", "partially_fulfilled", "fulfilled", "cancelled"];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
			});
		}

		// Verify order belongs to user's restaurant
		const restaurantId = await getRestaurantId(req.businessId);
		const order = await getRestaurantOrderById(id);
		
		if (order.restaurant_id !== restaurantId) {
			return res.status(403).json({ error: "Access denied" });
		}

		const updatedOrder = await updateOrderStatus(id, status);
		res.json(updatedOrder);
	} catch (error) {
		console.error("❌ Update order status error:", error);
		res.status(500).json({ error: error.message });
	}
});

// POST /api/orders/generate-pos - Generate POs from pending orders
router.post("/generate-pos", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const { selectedVendors } = req.body;

		if (!selectedVendors || !Array.isArray(selectedVendors)) {
			return res.status(400).json({
				error: "selectedVendors array is required",
			});
		}

		const pendingOrders = await getOrdersPendingPOs(restaurantId);
		const results = [];

		// Group items by vendor
		const vendorGroups = {};
		pendingOrders.forEach((order) => {
			order.items?.forEach((item) => {
				if (!item.po_id) { // Only items without POs
					const vendor = item.supplier_name;
					if (selectedVendors.includes(vendor)) {
						if (!vendorGroups[vendor]) {
							vendorGroups[vendor] = {
								vendor,
								orders: new Set(),
								items: [],
							};
						}
						vendorGroups[vendor].orders.add(order.id);
						vendorGroups[vendor].items.push({
							...item,
							source_order_id: order.id,
						});
					}
				}
			});
		});

		// Create POs for each vendor
		for (const [vendor, group] of Object.entries(vendorGroups)) {
			try {
				// Import the existing PO creation function
				const { createPurchaseOrder } = await import("../services/orders.js");
				
				const poData = {
					restaurant_id: restaurantId,
					supplierName: vendor,
					orderType: "auto_generated",
					items: group.items.map((item) => ({
						ingredientId: item.ingredient_id,
						quantityOrdered: item.quantity,
						unit: item.unit,
						unitPrice: item.estimated_unit_cost || 0,
					})),
					notes: `Auto-generated PO from orders: ${Array.from(group.orders).join(", ")}`,
					createdBy: req.user.id,
				};

				const poResult = await createPurchaseOrder(poData);
				
				// Update order items with PO reference
				for (const item of group.items) {
					await supabase
						.from("restaurant_order_items")
						.update({
							po_id: poResult.purchaseOrder.id,
							po_number: poResult.purchaseOrder.order_number,
							status: "po_created",
							updated_at: new Date().toISOString(),
						})
						.eq("id", item.id);
				}

				results.push({
					vendor,
					po_number: poResult.purchaseOrder.order_number,
					po_id: poResult.purchaseOrder.id,
					total: poResult.purchaseOrder.total,
					items_count: group.items.length,
					success: true,
				});
			} catch (error) {
				console.error(`Error creating PO for vendor ${vendor}:`, error);
				results.push({
					vendor,
					error: error.message,
					success: false,
				});
			}
		}

		res.json({
			message: `Processed ${selectedVendors.length} vendor(s)`,
			results,
		});
	} catch (error) {
		console.error("❌ Generate POs error:", error);
		res.status(500).json({ error: error.message });
	}
});

// TEST ENDPOINT
router.get("/test-logging", (req, res) => {
	console.log("✅ TEST ENDPOINT HIT!");
	res.json({ message: "Backend logging works!", timestamp: new Date().toISOString() });
});

// POST /api/orders/populate-lines - Get suggested order lines from low stock items
router.post("/populate-lines", async (req, res) => {
	try {
		console.log("🎯 POPULATE LINES ROUTE HIT - businessId:", req.businessId);
		const restaurantId = await getRestaurantId(req.businessId);
		console.log("🏪 Restaurant ID:", restaurantId);

		// Get low stock items with suggested quantities (accounts for qty on order)
		const suggestedLines = await getLowStockItemsForOrder(restaurantId);
		console.log("📋 Suggested lines count:", suggestedLines?.length);

		res.json({
			success: true,
			count: suggestedLines.length,
			items: suggestedLines
		});
	} catch (error) {
		console.error("❌ Populate lines error:", error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// GET /api/orders/quantity-on-order/:ingredientId - Get quantity on order for specific ingredient
router.get("/quantity-on-order/:ingredientId", async (req, res) => {
	try {
		const { ingredientId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		// Validate ingredient ID format
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(ingredientId)) {
			return res.status(400).json({
				error: "Invalid ingredient ID format"
			});
		}

		const qtyOnOrder = await calculateQuantityOnOrder(ingredientId, restaurantId);

		// Get ingredient details for response
		const { data: ingredient, error: ingError } = await supabase
			.from('ingredient_library')
			.select('name, unit')
			.eq('id', ingredientId)
			.single();

		if (ingError) {
			return res.status(404).json({
				error: "Ingredient not found"
			});
		}

		res.json({
			success: true,
			ingredient_id: ingredientId,
			ingredient_name: ingredient.name,
			quantity_on_order: qtyOnOrder,
			unit: ingredient.unit
		});
	} catch (error) {
		console.error("❌ Get quantity on order error:", error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// GET /api/orders/suggested-reorder/:ingredientId - Get suggested reorder quantity for ingredient
router.get("/suggested-reorder/:ingredientId", async (req, res) => {
	try {
		const { ingredientId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		// Validate ingredient ID format
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(ingredientId)) {
			return res.status(400).json({
				error: "Invalid ingredient ID format"
			});
		}

		const suggestion = await getSuggestedReorderQuantity(ingredientId, restaurantId);

		// Get ingredient name
		const { data: ingredient, error: ingError } = await supabase
			.from('ingredient_library')
			.select('name')
			.eq('id', ingredientId)
			.single();

		if (ingError) {
			return res.status(404).json({
				error: "Ingredient not found"
			});
		}

		res.json({
			success: true,
			ingredient_name: ingredient.name,
			...suggestion
		});
	} catch (error) {
		console.error("❌ Get suggested reorder error:", error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

export default router;