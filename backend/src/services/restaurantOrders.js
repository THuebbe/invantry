// /backend/src/services/restaurantOrders.js

import { supabase } from "./supabase.js";

/**
 * Generate a unique restaurant order number
 * Uses the database function for consistency
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<string>} Generated order number
 */
async function generateRestaurantOrderNumber(restaurantId) {
	try {
		// Use the database function to generate order number
		const { data, error } = await supabase.rpc('generate_order_number', {
			rest_id: restaurantId
		});

		if (error) throw error;
		return data;
	} catch (error) {
		// Fallback to manual generation if function doesn't exist
		console.warn("Database function not available, using fallback:", error.message);
		
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

		return `${prefix}-${counter.toString().padStart(3, '0')}`;
	}
}

/**
 * Create a new restaurant order with items
 * @param {Object} orderData - Order data including restaurant_id, orderType, items, etc.
 * @returns {Promise<Object>} Created order with items
 */
export async function createRestaurantOrder(orderData) {
	const {
		restaurant_id,
		orderType,
		items,
		notes,
		createdBy,
	} = orderData;

	try {
		// Generate unique order number
		const orderNumber = await generateRestaurantOrderNumber(restaurant_id);

		// Calculate estimated total
		let totalEstimatedValue = 0;
		const orderItems = [];

		for (const item of items) {
			const lineTotal = parseFloat(item.quantity) * parseFloat(item.estimatedUnitCost || 0);
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
				order_type: orderType,
				status: "draft",
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
			await supabase
				.from("restaurant_orders")
				.delete()
				.eq("id", order.id);
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
			.select(`
				*,
				restaurant_order_items(count)
			`)
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

		return data.map(order => ({
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
			.select(`
				*,
				ingredient:ingredient_library(
					id,
					name,
					category,
					unit as default_unit
				)
			`)
			.eq("order_id", orderId);

		if (itemsError) throw itemsError;

		return {
			...order,
			items: items.map(item => ({
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
 * Create a quick order from low stock items
 * @param {string} restaurantId - Restaurant UUID
 * @param {string} createdBy - User ID
 * @param {Object} options - Optional parameters like notes
 * @returns {Promise<Object>} Created order
 */
export async function createQuickOrder(restaurantId, createdBy, options = {}) {
	try {
		// Get low stock items
		const { data: inventory, error: inventoryError } = await supabase
			.from("restaurant_inventory")
			.select(`
				*,
				ingredient:ingredient_library(
					id,
					name,
					category,
					unit
				)
			`)
			.eq("restaurant_id", restaurantId)
			.filter("quantity", "lte", supabase.raw("minimum_quantity"));

		if (inventoryError) throw inventoryError;

		if (!inventory || inventory.length === 0) {
			throw new Error("No low stock items found");
		}

		// Create order items with suggested quantities
		const items = inventory.map(item => {
			const suggestedQuantity = Math.max(
				(item.minimum_quantity || 10) * 2 - item.quantity,
				1
			);

			return {
				ingredientId: item.ingredient_id,
				quantity: suggestedQuantity,
				unit: item.unit || item.ingredient.unit,
				estimatedUnitCost: item.cost_per_unit || 0,
			};
		});

		const orderData = {
			restaurant_id: restaurantId,
			orderType: "quick",
			items,
			notes: options.notes || "Auto-generated quick order for low stock items",
			createdBy,
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
			.select(`
				*,
				restaurant_order_items(
					*,
					ingredient:ingredient_library(
						name,
						category
					)
				)
			`)
			.eq("restaurant_id", restaurantId)
			.eq("status", "submitted");

		if (error) throw error;

		// Filter orders that have items without PO assignments
		const pendingOrders = orders.filter(order => {
			return order.restaurant_order_items.some(item => !item.po_id);
		});

		return pendingOrders.map(order => ({
			...order,
			items: order.restaurant_order_items.map(item => ({
				...item,
				ingredient_name: item.ingredient?.name,
				category: item.ingredient?.category,
				// Add supplier info if available (would come from ingredient or business rules)
				supplier_name: getSupplierForIngredient(item.ingredient?.category),
			})),
		}));
	} catch (error) {
		console.error("Error fetching pending PO orders:", error);
		throw new Error(`Failed to fetch pending PO orders: ${error.message}`);
	}
}

/**
 * Helper function to determine supplier based on ingredient category
 * This is a simple implementation - in real world this would come from supplier management
 * @param {string} category - Ingredient category
 * @returns {string} Supplier name
 */
function getSupplierForIngredient(category) {
	const supplierMap = {
		"protein": "Sysco Foods",
		"produce": "Local Produce Co",
		"dairy": "Dairy Fresh",
		"dry goods": "Restaurant Depot",
		"alcohol": "Wine & Spirits Co",
		"beverages": "Beverage Supply",
		"supplies": "Restaurant Supply Co",
	};

	return supplierMap[category] || "General Supplier";
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
				updated_at: new Date().toISOString()
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