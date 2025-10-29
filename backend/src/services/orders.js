import { supabase } from "./supabase.js";

/**
 * Generate a unique order number
 * Format: PO-YYYY-### (e.g., PO-2025-001)
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<string>} Generated order number
 */
async function generateOrderNumber(restaurantId) {
	const year = new Date().getFullYear();
	const prefix = `PO-${year}-`;

	// Get the highest order number for this year
	const { data: lastOrder, error } = await supabase
		.from("purchase_orders")
		.select("order_number")
		.eq("restaurant_id", restaurantId)
		.like("order_number", `${prefix}%`)
		.order("order_number", { ascending: false })
		.limit(1)
		.single();

	// If no orders exist yet or error, start from 001
	if (error || !lastOrder) {
		return `${prefix}001`;
	}

	// Extract the number part and increment
	const lastNumber = parseInt(lastOrder.order_number.split("-").pop(), 10);
	const nextNumber = (lastNumber + 1).toString().padStart(4, "0");

	return `${prefix}${nextNumber}`;
}

/**
 * Create a new purchase order with items
 * @param {Object} orderData - Order data including restaurant_id, supplierName, items, etc.
 * @returns {Promise<Object>} Created purchase order with items
 */
export async function createPurchaseOrder(orderData) {
	const {
		restaurant_id,
		supplierName,
		expectedDeliveryDate,
		items,
		notes,
		createdBy,
	} = orderData;

	try {
		// Generate unique order number
		const orderNumber = await generateOrderNumber(restaurant_id);

		// Calculate totals
		let subtotal = 0;
		const orderItems = [];

		for (const item of items) {
			const lineTotal =
				parseFloat(item.quantityOrdered) * parseFloat(item.unitPrice);
			subtotal += lineTotal;

			orderItems.push({
				ingredientId: item.ingredientId,
				quantityOrdered: parseFloat(item.quantityOrdered),
				quantityReceived: 0, // Not received yet
				unit: item.unit,
				unitPrice: parseFloat(item.unitPrice),
				lineTotal: parseFloat(lineTotal.toFixed(2)),
			});
		}

		// For MVP, tax is 0 (can be calculated later)
		const taxRate = 0.09;

		const tax = subtotal * taxRate;
		const total = subtotal + tax;

		// Create the purchase order
		const { data: purchaseOrder, error: orderError } = await supabase
			.from("purchase_orders")
			.insert({
				restaurant_id,
				order_number: orderNumber,
				status: "draft",
				supplier_name: supplierName,
				order_date: new Date().toISOString(),
				expected_delivery_date: expectedDeliveryDate || null,
				subtotal: parseFloat(subtotal.toFixed(2)),
				tax: parseFloat(tax.toFixed(2)),
				total: parseFloat(total.toFixed(2)),
				notes: notes || null,
				created_by: createdBy || null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (orderError) throw orderError;

		// Create order items
		const itemsToInsert = orderItems.map((item) => ({
			purchase_order_id: purchaseOrder.id,
			ingredient_id: item.ingredientId,
			quantity_ordered: item.quantityOrdered,
			quantity_received: item.quantityReceived,
			unit: item.unit,
			unit_price: item.unitPrice,
			line_total: item.lineTotal,
		}));

		const { data: createdItems, error: itemsError } = await supabase
			.from("purchase_order_items")
			.insert(itemsToInsert)
			.select();

		if (itemsError) {
			// If items creation fails, we should delete the order (rollback)
			await supabase
				.from("purchase_orders")
				.delete()
				.eq("id", purchaseOrder.id);
			throw itemsError;
		}

		return {
			purchaseOrder: {
				id: purchaseOrder.id,
				order_number: purchaseOrder.order_number,
				status: purchaseOrder.status,
				supplier_name: purchaseOrder.supplier_name,
				order_date: purchaseOrder.order_date,
				expected_delivery_date: purchaseOrder.expected_delivery_date,
				subtotal: parseFloat(purchaseOrder.subtotal),
				tax: parseFloat(purchaseOrder.tax),
				total: parseFloat(purchaseOrder.total),
				notes: purchaseOrder.notes,
				created_at: purchaseOrder.created_at,
			},
			items: createdItems.map((item) => ({
				id: item.id,
				ingredient_id: item.ingredient_id,
				quantity_ordered: parseFloat(item.quantity_ordered),
				quantity_received: parseFloat(item.quantity_received || 0),
				unit: item.unit,
				unit_price: parseFloat(item.unit_price),
				line_total: parseFloat(item.line_total),
			})),
		};
	} catch (error) {
		console.error("Error creating purchase order:", error);
		throw new Error(`Failed to create purchase order: ${error.message}`);
	}
}
