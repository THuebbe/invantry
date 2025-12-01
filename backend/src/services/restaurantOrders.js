// /backend/src/services/restaurantOrders.js

import { supabase } from "./supabase.js";
import { getPreferredVendorForIngredient } from "./vendors.js";

/**
 * Generate a unique restaurant order number
 * Uses the database function for consistency
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<string>} Generated order number
 */
async function generateRestaurantOrderNumber(restaurantId) {
	try {
		// Use the database function to generate order number
		const { data, error } = await supabase.rpc("generate_order_number", {
			rest_id: restaurantId,
		});

		if (error) throw error;
		return data;
	} catch (error) {
		// Fallback to manual generation if function doesn't exist
		console.warn(
			"Database function not available, using fallback:",
			error.message
		);

		const { data: restaurant } = await supabase
			.from("restaurants")
			.select("restaurant_code, order_counter")
			.eq("id", restaurantId)
			.single();

		const prefix = restaurant?.restaurant_code || "REST";
		const counter = (restaurant?.order_counter || 0) + 1;

		// Update counter
		await supabase
			.from("restaurants")
			.update({ order_counter: counter })
			.eq("id", restaurantId);

		return `${prefix}-${counter.toString().padStart(3, "0")}`;
	}
}

/**
 * Create a new restaurant order with items
 * @param {Object} orderData - Order data including restaurant_id, orderType (optional), items, etc.
 * @returns {Promise<Object>} Created order with items
 */
export async function createRestaurantOrder(orderData) {
	const {
		restaurant_id,
		orderType = null, // orderType is now optional, defaults to null
		items,
		notes,
		createdBy,
		status = "draft", // Allow status override, default to "draft"
	} = orderData;

	try {
		// Generate unique order number
		const orderNumber = await generateRestaurantOrderNumber(restaurant_id);

		// Calculate estimated total
		let totalEstimatedValue = 0;
		const orderItems = [];

		for (const item of items) {
			const lineTotal =
				parseFloat(item.quantity) * parseFloat(item.estimatedUnitCost || 0);
			totalEstimatedValue += lineTotal;

			orderItems.push({
				ingredient_id: item.ingredientId,
				quantity: parseFloat(item.quantity),
				unit: item.unit,
				estimated_unit_cost: parseFloat(item.estimatedUnitCost || 0),
				estimated_line_total: parseFloat(lineTotal.toFixed(2)),
			});
		}

		// Create the restaurant order
		const { data: order, error: orderError } = await supabase
			.from("restaurant_orders")
			.insert({
				restaurant_id,
				order_number: orderNumber,
				order_type: orderType || null, // Allow null for order_type
				status: status, // Use the provided status or default "draft"
				total_estimated_value: parseFloat(totalEstimatedValue.toFixed(2)),
				notes: notes || null,
				created_by: createdBy,
			})
			.select()
			.single();

		if (orderError) throw orderError;

		// Create order items
		const itemsToInsert = orderItems.map((item) => ({
			order_id: order.id,
			ingredient_id: item.ingredient_id,
			quantity: item.quantity,
			unit: item.unit,
			estimated_unit_cost: item.estimated_unit_cost,
			estimated_line_total: item.estimated_line_total,
		}));

		const { data: createdItems, error: itemsError } = await supabase
			.from("restaurant_order_items")
			.insert(itemsToInsert)
			.select();

		if (itemsError) {
			// Rollback: delete the order if items creation fails
			await supabase.from("restaurant_orders").delete().eq("id", order.id);
			throw itemsError;
		}

		return {
			order: {
				id: order.id,
				order_number: order.order_number,
				order_type: order.order_type,
				status: order.status,
				total_estimated_value: parseFloat(order.total_estimated_value),
				notes: order.notes,
				created_at: order.created_at,
				updated_at: order.updated_at,
				item_count: createdItems.length,
			},
			items: createdItems.map((item) => ({
				id: item.id,
				ingredient_id: item.ingredient_id,
				quantity: parseFloat(item.quantity),
				unit: item.unit,
				estimated_unit_cost: parseFloat(item.estimated_unit_cost),
				estimated_line_total: parseFloat(item.estimated_line_total),
			})),
		};
	} catch (error) {
		console.error("Error creating restaurant order:", error);
		throw new Error(`Failed to create restaurant order: ${error.message}`);
	}
}

/**
 * Get all restaurant orders with optional filtering
 * @param {string} restaurantId - Restaurant UUID
 * @param {Object} filters - Optional filters (status, orderType, etc.)
 * @returns {Promise<Array>} Array of orders with item counts
 */
export async function getRestaurantOrders(restaurantId, filters = {}) {
	try {
		let query = supabase
			.from("restaurant_orders")
			.select(
				`
				*,
				restaurant_order_items(count)
			`
			)
			.eq("restaurant_id", restaurantId);

		// Apply filters
		if (filters.status) {
			query = query.eq("status", filters.status);
		}
		if (filters.orderType) {
			query = query.eq("order_type", filters.orderType);
		}

		// Order by creation date (newest first)
		query = query.order("created_at", { ascending: false });

		const { data, error } = await query;
		if (error) throw error;

		return data.map((order) => ({
			...order,
			item_count: order.restaurant_order_items[0]?.count || 0,
		}));
	} catch (error) {
		console.error("Error fetching restaurant orders:", error);
		throw new Error(`Failed to fetch restaurant orders: ${error.message}`);
	}
}

/**
 * Get a specific restaurant order with its items
 * @param {string} orderId - Order UUID
 * @returns {Promise<Object>} Order with items and ingredient details
 */
export async function getRestaurantOrderById(orderId) {
	try {
		// Get order details
		const { data: order, error: orderError } = await supabase
			.from("restaurant_orders")
			.select("*")
			.eq("id", orderId)
			.single();

		if (orderError) throw orderError;
		if (!order) throw new Error("Order not found");

		// Get order items with ingredient details
		const { data: items, error: itemsError } = await supabase
			.from("restaurant_order_items")
			.select(
				`
				*,
				ingredient:ingredient_library(
					id,
					name,
					category,
					unit
				)
			`
			)
			.eq("order_id", orderId);

		if (itemsError) throw itemsError;

		return {
			...order,
			items: items.map((item) => ({
				id: item.id,
				ingredient_id: item.ingredient_id,
				ingredient_name: item.ingredient?.name,
				category: item.ingredient?.category,
				quantity: parseFloat(item.quantity),
				unit: item.unit,
				estimated_unit_cost: parseFloat(item.estimated_unit_cost),
				estimated_line_total: parseFloat(item.estimated_line_total),
				po_number: item.po_number,
				po_id: item.po_id,
				status: item.status,
			})),
		};
	} catch (error) {
		console.error("Error fetching restaurant order:", error);
		throw new Error(`Failed to fetch restaurant order: ${error.message}`);
	}
}

/**
 * Calculate quantity currently on order for a specific ingredient
 * Uses the database function to sum unfulfilled quantities from open orders/POs
 * @param {string} ingredientId - Ingredient UUID
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<number>} Quantity on order
 */
export async function calculateQuantityOnOrder(ingredientId, restaurantId) {
	try {
		const { data, error } = await supabase.rpc(
			"get_ingredient_quantity_on_order",
			{
				p_ingredient_id: ingredientId,
				p_restaurant_id: restaurantId,
			}
		);

		if (error) {
			console.error("Error calling get_ingredient_quantity_on_order:", error);
			throw error;
		}

		return parseFloat(data) || 0;
	} catch (error) {
		console.error("Error calculating quantity on order:", error);
		// Fallback to 0 on error - don't block operations
		return 0;
	}
}

/**
 * Get suggested reorder quantity for a specific ingredient
 * Formula: (par_level * 2) - current_qty - qty_on_order
 * @param {string} ingredientId - Ingredient UUID
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<Object>} Suggested quantity with breakdown
 */
export async function getSuggestedReorderQuantity(ingredientId, restaurantId) {
	try {
		const { data, error } = await supabase.rpc(
			"calculate_suggested_reorder_quantity",
			{
				p_ingredient_id: ingredientId,
				p_restaurant_id: restaurantId,
			}
		);

		if (error) {
			console.error(
				"Error calling calculate_suggested_reorder_quantity:",
				error
			);
			throw error;
		}

		// Get additional details for the breakdown
		const { data: inventory, error: invError } = await supabase
			.from("restaurant_inventory")
			.select("quantity, minimum_quantity, unit")
			.eq("ingredient_id", ingredientId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (invError) throw invError;

		const qtyOnOrder = await calculateQuantityOnOrder(
			ingredientId,
			restaurantId
		);

		return {
			ingredient_id: ingredientId,
			suggested_qty: parseFloat(data) || 0,
			current_qty: parseFloat(inventory.quantity) || 0,
			par_level: parseFloat(inventory.minimum_quantity) || 0,
			qty_on_order: qtyOnOrder,
			unit: inventory.unit,
		};
	} catch (error) {
		console.error("Error getting suggested reorder quantity:", error);
		throw new Error(
			`Failed to get suggested reorder quantity: ${error.message}`
		);
	}
}

/**
 * Get low stock items for "Populate Lines" feature
 * Uses database function to return items needing reorder with smart quantities
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<Array>} Array of low stock items with suggested quantities
 */
export async function getLowStockItemsForOrder(restaurantId) {
	try {
		const { data, error } = await supabase.rpc("get_low_stock_items", {
			p_restaurant_id: restaurantId,
		});

		if (error) {
			console.error("Error calling get_low_stock_items:", error);
			throw error;
		}

		console.log("🔍 RAW DATABASE RESPONSE:", JSON.stringify(data?.slice(0, 2), null, 2));

		// Format response for API consistency
		const formattedData = (data || []).map((item) => ({
			ingredient_id: item.ingredient_id,
			ingredient_name: item.ingredient_name,
			category: item.category,
			current_qty: parseFloat(item.current_qty) || 0,
			par_level: parseFloat(item.par_level) || 0,
			qty_on_order: parseFloat(item.qty_on_order) || 0,
			suggested_qty: parseFloat(item.suggested_qty) || 0,
			unit: item.unit,
			estimated_unit_cost: parseFloat(item.estimated_cost) || 0,
			preferred_vendor: item.preferred_vendor || "Unknown",
			// Package quantity fields for Item Details display
			pkg_qty: item.package_quantity || 1,
			pkg_uom: item.unit, // Package UOM is same as ingredient unit
			items_per_pkg: item.package_quantity || 1,
			item_qty: item.item_quantity,
			item_uom: item.item_uom,
		}));

		console.log(
			"🔍 LOW STOCK ITEMS RETURNED:",
			JSON.stringify(formattedData.slice(0, 2), null, 2)
		);

		return formattedData;
	} catch (error) {
		console.error("Error fetching low stock items:", error);
		throw new Error(`Failed to fetch low stock items: ${error.message}`);
	}
}

/**
 * Create a quick order from low stock items
 * NOW USES: Database function for smart quantity calculation
 * @param {string} restaurantId - Restaurant UUID
 * @param {string} createdBy - User ID
 * @param {Object} options - Optional parameters like notes
 * @returns {Promise<Object>} Created order
 */
export async function createQuickOrder(restaurantId, createdBy, options = {}) {
	try {
		// Get low stock items using new database function
		const lowStockItems = await getLowStockItemsForOrder(restaurantId);

		if (!lowStockItems || lowStockItems.length === 0) {
			throw new Error("No low stock items found");
		}

		// Create order items with suggested quantities from database
		const items = lowStockItems.map((item) => ({
			ingredientId: item.ingredient_id,
			quantity: item.suggested_qty, // Use smart calculated quantity
			unit: item.unit,
			estimatedUnitCost: item.estimated_unit_cost,
		}));

		const orderData = {
			restaurant_id: restaurantId,
			orderType: "quick",
			items,
			notes:
				options.notes ||
				"Auto-generated quick order for low stock items (accounts for qty on order)",
			createdBy,
			status: "submitted", // Quick orders should be auto-submitted
		};

		return await createRestaurantOrder(orderData);
	} catch (error) {
		console.error("Error creating quick order:", error);
		throw new Error(`Failed to create quick order: ${error.message}`);
	}
}

/**
 * Get orders that are ready for PO generation (submitted orders without POs)
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<Array>} Orders with items that need POs
 */
export async function getOrdersPendingPOs(restaurantId) {
	try {
		const { data: orders, error } = await supabase
			.from("restaurant_orders")
			.select(
				`
				*,
				restaurant_order_items(
					*,
					ingredient:ingredient_library(
						id,
						name,
						category
					)
				)
			`
			)
			.eq("restaurant_id", restaurantId)
			.eq("status", "submitted");

		if (error) throw error;

		// Filter orders that have items without PO assignments
		const pendingOrders = orders.filter((order) => {
			return order.restaurant_order_items.some((item) => !item.po_id);
		});

		// Map orders and get vendor info for each ingredient
		const ordersWithVendors = await Promise.all(
			pendingOrders.map(async (order) => {
				// Only return items that don't have PO assignments
				const pendingItems = order.restaurant_order_items.filter(
					(item) => !item.po_id
				);

				// Get vendor info for each item
				const itemsWithVendors = await Promise.all(
					pendingItems.map(async (item) => {
						let vendorName = "General Supplier"; // Default fallback

						try {
							// Get preferred vendor from database
							const preferredVendor = await getPreferredVendorForIngredient(
								item.ingredient_id,
								restaurantId
							);

							if (preferredVendor) {
								vendorName = preferredVendor.name;
							}
						} catch (error) {
							console.warn(
								`Could not fetch vendor for ingredient ${item.ingredient_id}:`,
								error.message
							);
						}

						return {
							...item,
							ingredient_name: item.ingredient?.name,
							category: item.ingredient?.category,
							supplier_name: vendorName,
						};
					})
				);

				return {
					...order,
					items: itemsWithVendors,
				};
			})
		);

		// Remove orders that have no pending items after filtering
		return ordersWithVendors.filter((order) => order.items.length > 0);
	} catch (error) {
		console.error("Error fetching pending PO orders:", error);
		throw new Error(`Failed to fetch pending PO orders: ${error.message}`);
	}
}

/**
 * Update order status
 * @param {string} orderId - Order UUID
 * @param {string} newStatus - New status
 * @returns {Promise<Object>} Updated order
 */
export async function updateOrderStatus(orderId, newStatus) {
	try {
		const { data, error } = await supabase
			.from("restaurant_orders")
			.update({
				status: newStatus,
				updated_at: new Date().toISOString(),
			})
			.eq("id", orderId)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error("Error updating order status:", error);
		throw new Error(`Failed to update order status: ${error.message}`);
	}
}

/**
 * Update order details (notes and items)
 * @param {string} orderId - Order UUID
 * @param {Object} updateData - Data to update (notes, items)
 * @returns {Promise<Object>} Updated order with items
 */
export async function updateRestaurantOrder(orderId, updateData) {
	const { notes, items } = updateData;

	try {
		// Update order notes
		if (notes !== undefined) {
			const { error: orderError } = await supabase
				.from("restaurant_orders")
				.update({
					notes,
					updated_at: new Date().toISOString(),
				})
				.eq("id", orderId);

			if (orderError) throw orderError;
		}

		// Update order items if provided
		if (items && items.length > 0) {
			let totalEstimatedValue = 0;

			for (const item of items) {
				const lineTotal =
					parseFloat(item.quantity) * parseFloat(item.estimated_unit_cost || 0);
				totalEstimatedValue += lineTotal;

				const { error: itemError } = await supabase
					.from("restaurant_order_items")
					.update({
						quantity: parseFloat(item.quantity),
						unit: item.unit,
						estimated_unit_cost: parseFloat(item.estimated_unit_cost || 0),
						estimated_line_total: parseFloat(lineTotal.toFixed(2)),
						updated_at: new Date().toISOString(),
					})
					.eq("id", item.id);

				if (itemError) throw itemError;
			}

			// Update order total
			const { error: totalError } = await supabase
				.from("restaurant_orders")
				.update({
					total_estimated_value: parseFloat(totalEstimatedValue.toFixed(2)),
					updated_at: new Date().toISOString(),
				})
				.eq("id", orderId);

			if (totalError) throw totalError;
		}

		// Return updated order with items
		return await getRestaurantOrderById(orderId);
	} catch (error) {
		console.error("Error updating restaurant order:", error);
		throw new Error(`Failed to update restaurant order: ${error.message}`);
	}
}
