// /backend/src/routes/order.js

import express from "express";
import { createPurchaseOrder, createPOFromOrderItems, receivePurchaseOrderItems, getOpenPurchaseOrders, getReceivingLog, getReceivingLogEntry } from "../services/orders.js";
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
// ENHANCED: Now includes smart consolidation and duplicate prevention
router.post("/from-order-items", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);

		// Validate request body
		const { supplierName, supplierId, expectedDeliveryDate, notes, orderItemIds } = req.body;

		if (!supplierName && !supplierId) {
			return res.status(400).json({ error: "Supplier name or ID is required" });
		}

		if (!orderItemIds || !Array.isArray(orderItemIds) || orderItemIds.length === 0) {
			return res.status(400).json({
				error: "Order item IDs array is required and must not be empty"
			});
		}

		// Create PO from order items with automatic linking and smart features
		const poData = {
			restaurant_id: restaurantId,
			supplierName: supplierName || 'Unknown Supplier',
			supplierId,
			expectedDeliveryDate,
			notes,
			createdBy: req.user.id,
		};

		const result = await createPOFromOrderItems(poData, orderItemIds);

		// Return appropriate status code based on whether PO was created or merged
		const statusCode = result.merged ? 200 : 201;
		res.status(statusCode).json(result);
	} catch (error) {
		console.error("❌ Create PO from order items error:", error);
		res.status(500).json({ error: error.message });
	}
});

// POST /api/orders/populate-po-lines - Get items ready for PO generation
router.post("/populate-po-lines", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const { vendorId } = req.body;

		// Import the populatePOLines function
		const { populatePOLines } = await import("../services/orders.js");

		const result = await populatePOLines(restaurantId, vendorId || null);

		res.json({
			success: true,
			...result
		});
	} catch (error) {
		console.error("❌ Populate PO lines error:", error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// POST /api/orders/generate-pos - Generate POs from pending orders (ENHANCED)
router.post("/generate-pos", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const { vendorIds, orderIds } = req.body;

		// Import required functions
		const { populatePOLines, createPOFromOrderItems } = await import("../services/orders.js");

		// Get all items ready for PO generation
		const populateResult = await populatePOLines(restaurantId, null);

		if (!populateResult.vendors || populateResult.vendors.length === 0) {
			return res.json({
				message: "No items ready for PO generation",
				created: [],
				merged: []
			});
		}

		const created = [];
		const merged = [];
		const errors = [];

		// Filter vendors if specific vendors requested
		let vendorsToProcess = populateResult.vendors;
		if (vendorIds && Array.isArray(vendorIds) && vendorIds.length > 0) {
			vendorsToProcess = populateResult.vendors.filter(vendor =>
				vendorIds.includes(vendor.vendor_id) || vendorIds.includes(vendor.vendor_name)
			);
		}

		// Filter by specific orders if requested
		if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
			vendorsToProcess = vendorsToProcess.map(vendor => ({
				...vendor,
				items: vendor.items.filter(item => orderIds.includes(item.order_id))
			})).filter(vendor => vendor.items.length > 0);
		}

		// Process each vendor
		for (const vendor of vendorsToProcess) {
			try {
				if (!vendor.items || vendor.items.length === 0) {
					continue;
				}

				// Get all order item IDs for this vendor
				const orderItemIds = vendor.items.map(item => item.id);

				// Create or merge PO
				const poData = {
					restaurant_id: restaurantId,
					supplierName: vendor.vendor_name,
					supplierId: vendor.vendor_id,
					notes: `Auto-generated PO from ${vendor.items.length} order items`,
					createdBy: req.user.id,
				};

				const result = await createPOFromOrderItems(poData, orderItemIds);

				if (result.merged) {
					merged.push({
						po_id: result.purchaseOrder.id,
						po_number: result.purchaseOrder.order_number,
						vendor: vendor.vendor_name,
						lines_added: result.linesAdded || 0,
						lines_updated: result.linesUpdated || 0,
						total: result.purchaseOrder.total,
						message: result.message || "Added to existing draft PO"
					});
				} else {
					created.push({
						po_id: result.purchaseOrder.id,
						po_number: result.purchaseOrder.order_number,
						vendor: vendor.vendor_name,
						line_count: result.items ? result.items.length : 0,
						total: result.purchaseOrder.total,
						status: result.purchaseOrder.status
					});
				}
			} catch (error) {
				console.error(`Error processing vendor ${vendor.vendor_name}:`, error);
				errors.push({
					vendor: vendor.vendor_name,
					error: error.message
				});
			}
		}

		res.json({
			message: `Processed ${vendorsToProcess.length} vendor(s)`,
			created,
			merged,
			errors: errors.length > 0 ? errors : undefined
		});
	} catch (error) {
		console.error("❌ Generate POs error:", error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// POST /api/orders/purchase-orders/:id/receive - ENHANCED receiving with proportional distribution
router.post("/purchase-orders/:id/receive", async (req, res) => {
	try {
		const { id } = req.params;
		const { items } = req.body;
		const restaurantId = await getRestaurantId(req.businessId);

		// Validate items array
		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({
				error: "Items array is required and must not be empty"
			});
		}

		// Validate each item
		for (const item of items) {
			if (!item.po_item_id) {
				return res.status(400).json({
					error: "Each item must have a po_item_id"
				});
			}
			if (!item.quantity_received || item.quantity_received <= 0) {
				return res.status(400).json({
					error: "Each item must have a positive quantity_received"
				});
			}
		}

		// Receive the items with enhanced workflow
		const userInfo = {
			userId: req.user?.id || null,
			userName: req.userDetails?.firstName || null,
		};
		const result = await receivePurchaseOrderItems(id, items, restaurantId, userInfo);

		res.json(result);
	} catch (error) {
		console.error("❌ Receive PO items error:", error);

		// Send appropriate status code based on error
		const statusCode = error.message.includes("not found") ? 404
			: error.message.includes("does not belong") ? 403
			: error.message.includes("Cannot receive") ? 400
			: 500;

		res.status(statusCode).json({
			success: false,
			error: error.message
		});
	}
});

// GET /api/orders/purchase-orders/:id/receiving-status - Get receiving status for a PO
router.get("/purchase-orders/:id/receiving-status", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		// Get PO with items
		const { data: po, error: poError } = await supabase
			.from("purchase_orders")
			.select(`
				id,
				order_number,
				status,
				supplier_name,
				order_date,
				expected_delivery_date,
				purchase_order_items(
					id,
					item_name,
					ingredient_id,
					quantity_ordered,
					quantity_received,
					unit,
					unit_price,
					ingredient:ingredient_library(id, name)
				)
			`)
			.eq("id", id)
			.eq("restaurant_id", restaurantId)
			.single();

		if (poError || !po) {
			return res.status(404).json({ error: "Purchase order not found" });
		}

		// Calculate receiving status for each item
		const items = po.purchase_order_items.map(item => {
			const ordered = parseFloat(item.quantity_ordered || 0);
			const received = parseFloat(item.quantity_received || 0);
			const remaining = ordered - received;
			const percentComplete = ordered > 0 ? Math.round((received / ordered) * 100) : 0;

			return {
				po_item_id: item.id,
				ingredient_id: item.ingredient_id || item.ingredient?.id,
				item_name: item.item_name || item.ingredient?.name || "Unknown",
				quantity_ordered: ordered,
				quantity_received: received,
				remaining: parseFloat(remaining.toFixed(4)),
				percent_complete: percentComplete,
				unit: item.unit,
				unit_price: parseFloat(item.unit_price || 0),
			};
		});

		// Calculate overall completion
		const totalOrdered = items.reduce((sum, item) => sum + item.quantity_ordered, 0);
		const totalReceived = items.reduce((sum, item) => sum + item.quantity_received, 0);
		const overallPercentComplete = totalOrdered > 0
			? Math.round((totalReceived / totalOrdered) * 100)
			: 0;

		res.json({
			po_id: po.id,
			po_number: po.order_number,
			supplier_name: po.supplier_name,
			status: po.status,
			order_date: po.order_date,
			expected_delivery: po.expected_delivery_date,
			items,
			overall_percent_complete: overallPercentComplete,
		});
	} catch (error) {
		console.error("❌ Get receiving status error:", error);
		res.status(500).json({ error: error.message });
	}
});

// PUT /api/orders/purchase-orders/:id/status - Update PO status manually
router.put("/purchase-orders/:id/status", async (req, res) => {
	try {
		const { id } = req.params;
		const { status, notes } = req.body;
		const restaurantId = await getRestaurantId(req.businessId);

		// Validate status
		const validStatuses = ["draft", "backordered", "complete", "cancelled"];
		if (!status || !validStatuses.includes(status)) {
			return res.status(400).json({
				error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
			});
		}

		// Verify PO exists and belongs to restaurant
		const { data: po, error: poError } = await supabase
			.from("purchase_orders")
			.select("id, restaurant_id, status")
			.eq("id", id)
			.eq("restaurant_id", restaurantId)
			.single();

		if (poError || !po) {
			return res.status(404).json({ error: "Purchase order not found" });
		}

		// Update PO status
		const updateData = {
			status,
			updated_at: new Date().toISOString(),
		};

		if (notes) {
			updateData.notes = notes;
		}

		// If cancelling, update source order items
		if (status === "cancelled" && po.status !== "cancelled") {
			// Get all PO items to find source order items
			const { data: poItems } = await supabase
				.from("purchase_order_items")
				.select("source_order_item_ids")
				.eq("purchase_order_id", id);

			if (poItems) {
				const allSourceItemIds = poItems.flatMap(item => item.source_order_item_ids || []);

				// Reset source order items to pending
				if (allSourceItemIds.length > 0) {
					await supabase
						.from("restaurant_order_items")
						.update({
							status: "pending",
							po_id: null,
							po_number: null,
							quantity_on_po: 0,
							updated_at: new Date().toISOString(),
						})
						.in("id", allSourceItemIds);
				}
			}
		}

		const { data: updated, error: updateError } = await supabase
			.from("purchase_orders")
			.update(updateData)
			.eq("id", id)
			.select()
			.single();

		if (updateError) throw updateError;

		res.json({
			success: true,
			message: `PO status updated to ${status}`,
			purchaseOrder: updated,
		});
	} catch (error) {
		console.error("❌ Update PO status error:", error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// DELETE /api/orders/purchase-orders/:id - Delete a purchase order
router.delete("/purchase-orders/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		// Verify PO exists and belongs to restaurant
		const { data: po, error: poError } = await supabase
			.from("purchase_orders")
			.select("id, restaurant_id, status")
			.eq("id", id)
			.eq("restaurant_id", restaurantId)
			.single();

		if (poError || !po) {
			return res.status(404).json({ error: "Purchase order not found" });
		}

		// Get all PO items to find source order items
		const { data: poItems } = await supabase
			.from("purchase_order_items")
			.select("source_order_item_ids")
			.eq("purchase_order_id", id);

		// Reset source order items to pending if they exist
		if (poItems) {
			const allSourceItemIds = poItems.flatMap(item => item.source_order_item_ids || []);

			if (allSourceItemIds.length > 0) {
				await supabase
					.from("restaurant_order_items")
					.update({
						status: "pending",
						po_id: null,
						po_number: null,
						quantity_on_po: 0,
						updated_at: new Date().toISOString(),
					})
					.in("id", allSourceItemIds);
			}
		}

		// Delete or update restaurant_order_items that reference this PO (safety net)
		// This catches any items that might not be in source_order_item_ids
		await supabase
			.from("restaurant_order_items")
			.update({
				status: "pending",
				po_id: null,
				po_number: null,
				quantity_on_po: 0,
				updated_at: new Date().toISOString(),
			})
			.eq("po_id", id);

		// Delete PO items first (foreign key constraint)
		await supabase
			.from("purchase_order_items")
			.delete()
			.eq("purchase_order_id", id);

		// Delete the purchase order
		const { error: deleteError } = await supabase
			.from("purchase_orders")
			.delete()
			.eq("id", id)
			.eq("restaurant_id", restaurantId);

		if (deleteError) {
			throw deleteError;
		}

		res.json({
			success: true,
			message: "Purchase order deleted successfully"
		});
	} catch (error) {
		console.error("❌ Delete PO error:", error);
		res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// ============================================
// RECEIVING LOG & OPEN POS
// ============================================

// GET /api/orders/open-pos - Get POs eligible for receiving
router.get("/open-pos", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const { search } = req.query;

		const result = await getOpenPurchaseOrders(restaurantId, { search });
		res.json(result);
	} catch (error) {
		console.error("❌ Get open POs error:", error);
		res.status(500).json({ error: error.message });
	}
});

// GET /api/orders/receiving-log - Get receiving history
router.get("/receiving-log", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const { poId, vendor, startDate, endDate, limit, offset } = req.query;

		const result = await getReceivingLog(restaurantId, {
			poId,
			vendor,
			startDate,
			endDate,
			limit: limit ? parseInt(limit) : 50,
			offset: offset ? parseInt(offset) : 0,
		});

		res.json(result);
	} catch (error) {
		console.error("❌ Get receiving log error:", error);
		res.status(500).json({ error: error.message });
	}
});

// GET /api/orders/receiving-log/:id - Get single receiving log entry
router.get("/receiving-log/:id", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const entry = await getReceivingLogEntry(req.params.id, restaurantId);

		if (!entry) {
			return res.status(404).json({ error: "Receiving log entry not found" });
		}

		res.json(entry);
	} catch (error) {
		console.error("❌ Get receiving log entry error:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
