// /backend/src/services/order.js

import { supabase } from "./supabase.js";

/**
 * Generate a unique order number with collision detection and retry logic
 * Format: PO-YYYY-#### (e.g., PO-2025-0001)
 * @param {string} restaurantId - Restaurant UUID
 * @param {number} attempt - Retry attempt counter (internal use)
 * @returns {Promise<string>} Generated order number
 */
async function generateOrderNumber(restaurantId, attempt = 1) {
	const MAX_ATTEMPTS = 5;
	const year = new Date().getFullYear();
	const prefix = `PO-${year}-`;

	try {
		// Get the highest order number for this year
		const { data: lastOrder, error } = await supabase
			.from("purchase_orders")
			.select("order_number")
			.eq("restaurant_id", restaurantId)
			.like("order_number", `${prefix}%`)
			.order("order_number", { ascending: false })
			.limit(1)
			.single();

		// If no orders exist yet or error, start from 0001
		let nextNumber = 1;

		if (!error && lastOrder) {
			// Extract the number part and increment
			const lastNumber = parseInt(lastOrder.order_number.split("-").pop(), 10);
			nextNumber = lastNumber + 1;
		}

		const orderNumber = `${prefix}${String(nextNumber).padStart(4, "0")}`;

		// CRITICAL: Check if this number already exists (collision detection)
		const { data: existingPO, error: checkError } = await supabase
			.from("purchase_orders")
			.select("id")
			.eq("restaurant_id", restaurantId)
			.eq("order_number", orderNumber)
			.maybeSingle();

		// If collision detected, retry with next number
		if (existingPO) {
			console.warn(`⚠️ PO number collision detected: ${orderNumber} (attempt ${attempt}/${MAX_ATTEMPTS})`);

			if (attempt >= MAX_ATTEMPTS) {
				throw new Error(`Failed to generate unique PO number after ${MAX_ATTEMPTS} attempts`);
			}

			// Add small delay to reduce race condition probability
			await new Promise(resolve => setTimeout(resolve, 50 * attempt));

			// Retry with incremented attempt counter
			return generateOrderNumber(restaurantId, attempt + 1);
		}

		// Number is safe to use
		console.log(`✅ Generated PO number: ${orderNumber} (attempt ${attempt})`);
		return orderNumber;

	} catch (error) {
		// If we get a database error and still have attempts left, retry
		if (attempt < MAX_ATTEMPTS && error.code !== 'PGRST116') {
			console.warn(`⚠️ Error generating PO number (attempt ${attempt}/${MAX_ATTEMPTS}):`, error.message);
			await new Promise(resolve => setTimeout(resolve, 100 * attempt));
			return generateOrderNumber(restaurantId, attempt + 1);
		}

		throw new Error(`Failed to generate PO number: ${error.message}`);
	}
}

/**
 * Create a new purchase order with items and link back to source order items
 * @param {Object} orderData - Order data including restaurant_id, supplierName, items, sourceOrderItems, etc.
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
		status = 'draft', // Default to draft, but allow override
		sourceOrderItemIds = [], // Array of restaurant_order_item IDs to link back
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
				status: status, // Use provided status parameter
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

		// Link source order items to this PO (if provided)
		if (sourceOrderItemIds.length > 0) {
			try {
				// Update restaurant_order_items with PO reference and quantity tracking
				const { error: linkError } = await supabase
					.from("restaurant_order_items")
					.update({
						po_id: purchaseOrder.id,
						po_number: purchaseOrder.order_number,
						status: "on_po", // Mark as on PO (new status for tracking)
						quantity_on_po: supabase.raw("quantity"), // Set quantity_on_po to the ordered quantity
						updated_at: new Date().toISOString()
					})
					.in("id", sourceOrderItemIds);

				if (linkError) {
					console.error("Warning: Failed to link order items to PO:", linkError);
					// Don't throw error here - PO was created successfully
				}
			} catch (linkingError) {
				console.error("Warning: Error during order item linking:", linkingError);
				// Continue - PO creation was successful
			}
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

/**
 * Create a PO from restaurant order items with automatic linking
 * ENHANCED: Now includes smart consolidation and duplicate PO prevention
 * @param {Object} poData - PO creation data
 * @param {Array} orderItemIds - Array of restaurant_order_item IDs to include
 * @returns {Promise<Object>} Created or updated PO with linked order items
 */
export async function createPOFromOrderItems(poData, orderItemIds) {
	const {
		restaurant_id,
		supplierName,
		supplierId,
		expectedDeliveryDate,
		notes,
		createdBy,
	} = poData;

	try {
		// 1. Get the order items details to build PO items
		const { data: orderItems, error: fetchError } = await supabase
			.from("restaurant_order_items")
			.select(`
				*,
				ingredient:ingredient_library(
					id,
					name,
					unit,
					category
				),
				order:restaurant_orders(
					id,
					order_number
				)
			`)
			.in("id", orderItemIds);

		if (fetchError) throw fetchError;
		if (!orderItems.length) throw new Error("No eligible order items found");

		// Filter to only items with available quantity
		const eligibleItems = orderItems.filter(item => {
			const qty = parseFloat(item.quantity || 0);
			const qtyOnPO = parseFloat(item.quantity_on_po || 0);
			return (qty - qtyOnPO) > 0;
		});

		if (!eligibleItems.length) {
			throw new Error("No items with available quantity found");
		}

		// 2. Check for existing draft PO for this vendor
		const vendorIdentifier = supplierId || supplierName;
		const existingDraftPO = await findExistingDraftPO(restaurant_id, vendorIdentifier);

		// 3. Consolidate line items
		const consolidatedItems = await consolidateLineItems(eligibleItems);

		// 4. Either merge into existing draft or create new PO
		if (existingDraftPO) {
			console.log(`📦 Found existing draft PO ${existingDraftPO.order_number}, merging lines...`);

			// Add lines to existing PO
			const result = await addLinesToExistingPO(existingDraftPO.id, consolidatedItems);

			// Update source order items
			const allSourceItemIds = consolidatedItems.flatMap(item => item.source_order_item_ids);
			await updateOrderItemsStatus(allSourceItemIds, existingDraftPO.id, existingDraftPO.order_number);

			// Check if source orders can be marked as 'open'
			const uniqueOrderIds = [...new Set(eligibleItems.map(item => item.order.id))];
			for (const orderId of uniqueOrderIds) {
				await updateOrderStatusFromItems(orderId);
			}

			return {
				...result,
				message: `Added ${result.linesAdded} new lines and updated ${result.linesUpdated} existing lines to existing draft PO`,
			};
		} else {
			console.log(`📦 Creating new PO for vendor ${supplierName}...`);

			// Calculate totals
			const subtotal = consolidatedItems.reduce((sum, item) => sum + item.line_total, 0);
			const tax = subtotal * 0.09; // 9% tax
			const total = subtotal + tax;

			// Generate order number with retry logic
			let orderNumber;
			let purchaseOrder;
			let insertAttempt = 0;
			const MAX_INSERT_ATTEMPTS = 3;

			// Retry loop for handling race conditions on insert
			while (insertAttempt < MAX_INSERT_ATTEMPTS) {
				try {
					orderNumber = await generateOrderNumber(restaurant_id);

					// Create new PO
					const { data: po, error: orderError } = await supabase
						.from("purchase_orders")
						.insert({
							restaurant_id,
							order_number: orderNumber,
							status: "draft",
							supplier_id: supplierId || null,
							supplier_name: supplierName,
							order_date: new Date().toISOString(),
							expected_delivery_date: expectedDeliveryDate || null,
							subtotal: parseFloat(subtotal.toFixed(2)),
							tax: parseFloat(tax.toFixed(2)),
							total: parseFloat(total.toFixed(2)),
							notes: notes || null,
							created_by: createdBy || null,
						})
						.select()
						.single();

					if (orderError) {
						// Check if it's a duplicate key error
						if (orderError.code === '23505' || orderError.message?.includes('duplicate key')) {
							console.warn(`⚠️ Duplicate PO number on insert: ${orderNumber} (attempt ${insertAttempt + 1}/${MAX_INSERT_ATTEMPTS})`);
							insertAttempt++;

							if (insertAttempt >= MAX_INSERT_ATTEMPTS) {
								throw new Error(`Failed to create PO after ${MAX_INSERT_ATTEMPTS} attempts due to number collisions`);
							}

							// Wait before retry
							await new Promise(resolve => setTimeout(resolve, 100 * insertAttempt));
							continue; // Retry the loop
						}

						// Other error - throw immediately
						throw orderError;
					}

					// Success! Break out of retry loop
					purchaseOrder = po;
					break;

				} catch (err) {
					if (insertAttempt >= MAX_INSERT_ATTEMPTS - 1) {
						throw err;
					}
					insertAttempt++;
					await new Promise(resolve => setTimeout(resolve, 100 * insertAttempt));
				}
			}

			// Create PO items with source tracking
			const itemsToInsert = consolidatedItems.map(item => ({
				purchase_order_id: purchaseOrder.id,
				ingredient_id: item.ingredient_id,
				item_name: item.item_name,
				quantity_ordered: item.quantity_ordered,
				quantity_received: 0,
				unit: item.unit,
				unit_price: item.unit_price,
				line_total: item.line_total,
				source_order_item_ids: item.source_order_item_ids,
			}));

			const { data: createdItems, error: itemsError } = await supabase
				.from("purchase_order_items")
				.insert(itemsToInsert)
				.select();

			if (itemsError) {
				// Rollback: delete the order if items creation fails
				await supabase
					.from("purchase_orders")
					.delete()
					.eq("id", purchaseOrder.id);
				throw itemsError;
			}

			// Update source order items
			const allSourceItemIds = consolidatedItems.flatMap(item => item.source_order_item_ids);
			await updateOrderItemsStatus(allSourceItemIds, purchaseOrder.id, purchaseOrder.order_number);

			// Check if source orders can be marked as 'open'
			const uniqueOrderIds = [...new Set(eligibleItems.map(item => item.order.id))];
			for (const orderId of uniqueOrderIds) {
				await updateOrderStatusFromItems(orderId);
			}

			console.log(`✅ Created PO ${purchaseOrder.order_number} with ${createdItems.length} consolidated lines`);

			return {
				purchaseOrder: {
					id: purchaseOrder.id,
					order_number: purchaseOrder.order_number,
					status: purchaseOrder.status,
					supplier_name: purchaseOrder.supplier_name,
					supplier_id: purchaseOrder.supplier_id,
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
					item_name: item.item_name,
					quantity_ordered: parseFloat(item.quantity_ordered),
					quantity_received: parseFloat(item.quantity_received || 0),
					unit: item.unit,
					unit_price: parseFloat(item.unit_price),
					line_total: parseFloat(item.line_total),
					source_order_item_ids: item.source_order_item_ids,
				})),
				merged: false,
			};
		}
	} catch (error) {
		console.error("Error creating PO from order items:", error);
		throw new Error(`Failed to create PO from order items: ${error.message}`);
	}
}

/**
 * Consolidate line items from multiple orders
 * Groups by ingredient_id, sums quantities, tracks source order item IDs
 * @param {Array} orderItems - Array of order items (potentially from multiple orders)
 * @returns {Array} Consolidated items with source_order_item_ids tracking
 */
export async function consolidateLineItems(orderItems) {
	try {
		const consolidationMap = new Map();

		for (const item of orderItems) {
			const key = item.ingredient_id;

			if (!key) {
				console.warn('Skipping item without ingredient_id:', item.id);
				continue;
			}

			if (consolidationMap.has(key)) {
				// Item already exists - consolidate
				const existing = consolidationMap.get(key);

				// Sum quantities
				existing.quantity_ordered += parseFloat(item.quantity || item.quantity_ordered || 0);

				// Track source order item IDs
				existing.source_order_item_ids.push(item.id);

				// Use weighted average for unit price (most recent price gets more weight)
				// Alternative: could use most recent price or simple average
				const totalQty = existing.quantity_ordered;
				const itemQty = parseFloat(item.quantity || item.quantity_ordered || 0);
				const itemPrice = parseFloat(item.estimated_unit_cost || item.unit_price || 0);

				// Weighted average: (existing_total + new_cost) / total_qty
				existing.unit_price = ((existing.line_total + (itemQty * itemPrice)) / totalQty);
				existing.line_total = existing.quantity_ordered * existing.unit_price;

			} else {
				// First occurrence of this ingredient
				const quantity = parseFloat(item.quantity || item.quantity_ordered || 0);
				const unitPrice = parseFloat(item.estimated_unit_cost || item.unit_price || 0);

				consolidationMap.set(key, {
					ingredient_id: item.ingredient_id,
					item_name: item.ingredient?.name || item.ingredient_name || item.item_name || 'Unknown Item',
					quantity_ordered: quantity,
					unit: item.unit,
					unit_price: unitPrice,
					line_total: quantity * unitPrice,
					source_order_item_ids: [item.id],
					category: item.ingredient?.category || item.category,
				});
			}
		}

		// Convert map to array
		const consolidated = Array.from(consolidationMap.values()).map(item => ({
			...item,
			quantity_ordered: parseFloat(item.quantity_ordered.toFixed(2)),
			unit_price: parseFloat(item.unit_price.toFixed(2)),
			line_total: parseFloat(item.line_total.toFixed(2)),
		}));

		console.log(`✅ Consolidated ${orderItems.length} items into ${consolidated.length} PO lines`);
		return consolidated;
	} catch (error) {
		console.error('Error consolidating line items:', error);
		throw new Error(`Failed to consolidate line items: ${error.message}`);
	}
}

/**
 * Find existing draft PO for a vendor to prevent duplicates
 * @param {string} restaurantId - Restaurant UUID
 * @param {string} supplierId - Supplier/Vendor UUID or name
 * @returns {Promise<Object|null>} Existing draft PO or null
 */
export async function findExistingDraftPO(restaurantId, supplierId) {
	try {
		let query = supabase
			.from('purchase_orders')
			.select('*')
			.eq('restaurant_id', restaurantId)
			.eq('status', 'draft');

		// Support both supplier_id (UUID) and supplier_name (string)
		if (supplierId) {
			// Check if supplierId is a UUID
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			if (uuidRegex.test(supplierId)) {
				query = query.eq('supplier_id', supplierId);
			} else {
				query = query.eq('supplier_name', supplierId);
			}
		}

		const { data, error } = await query.maybeSingle();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error finding existing draft PO:', error);
		throw new Error(`Failed to find existing draft PO: ${error.message}`);
	}
}

/**
 * Add consolidated lines to an existing PO
 * @param {string} poId - Purchase Order UUID
 * @param {Array} consolidatedItems - Consolidated line items
 * @returns {Promise<Object>} Updated PO with merged items
 */
async function addLinesToExistingPO(poId, consolidatedItems) {
	try {
		// Get existing PO
		const { data: po, error: poError } = await supabase
			.from('purchase_orders')
			.select('*')
			.eq('id', poId)
			.single();

		if (poError) throw poError;

		// Get existing PO items
		const { data: existingItems, error: itemsError } = await supabase
			.from('purchase_order_items')
			.select('*')
			.eq('purchase_order_id', poId);

		if (itemsError) throw itemsError;

		// Further consolidate with existing items
		const existingMap = new Map();
		existingItems.forEach(item => {
			existingMap.set(item.ingredient_id, item);
		});

		const itemsToInsert = [];
		const itemsToUpdate = [];

		for (const newItem of consolidatedItems) {
			if (existingMap.has(newItem.ingredient_id)) {
				// Merge with existing line
				const existing = existingMap.get(newItem.ingredient_id);
				const updatedQty = parseFloat(existing.quantity_ordered) + parseFloat(newItem.quantity_ordered);
				const updatedTotal = updatedQty * parseFloat(existing.unit_price);

				// Merge source_order_item_ids
				const mergedSourceIds = [
					...(existing.source_order_item_ids || []),
					...newItem.source_order_item_ids
				];

				itemsToUpdate.push({
					id: existing.id,
					quantity_ordered: updatedQty,
					line_total: updatedTotal,
					source_order_item_ids: mergedSourceIds,
				});
			} else {
				// New line for this PO
				itemsToInsert.push({
					purchase_order_id: poId,
					ingredient_id: newItem.ingredient_id,
					item_name: newItem.item_name,
					quantity_ordered: newItem.quantity_ordered,
					quantity_received: 0,
					unit: newItem.unit,
					unit_price: newItem.unit_price,
					line_total: newItem.line_total,
					source_order_item_ids: newItem.source_order_item_ids,
				});
			}
		}

		// Insert new items
		if (itemsToInsert.length > 0) {
			const { error: insertError } = await supabase
				.from('purchase_order_items')
				.insert(itemsToInsert);

			if (insertError) throw insertError;
		}

		// Update existing items
		for (const update of itemsToUpdate) {
			const { error: updateError } = await supabase
				.from('purchase_order_items')
				.update({
					quantity_ordered: update.quantity_ordered,
					line_total: update.line_total,
					source_order_item_ids: update.source_order_item_ids,
				})
				.eq('id', update.id);

			if (updateError) throw updateError;
		}

		// Recalculate PO totals
		const { data: allItems, error: allItemsError } = await supabase
			.from('purchase_order_items')
			.select('line_total')
			.eq('purchase_order_id', poId);

		if (allItemsError) throw allItemsError;

		const subtotal = allItems.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
		const tax = subtotal * 0.09; // 9% tax
		const total = subtotal + tax;

		// Update PO totals
		const { data: updatedPO, error: updatePOError } = await supabase
			.from('purchase_orders')
			.update({
				subtotal: parseFloat(subtotal.toFixed(2)),
				tax: parseFloat(tax.toFixed(2)),
				total: parseFloat(total.toFixed(2)),
				updated_at: new Date().toISOString(),
			})
			.eq('id', poId)
			.select()
			.single();

		if (updatePOError) throw updatePOError;

		console.log(`✅ Added ${itemsToInsert.length} new lines and updated ${itemsToUpdate.length} existing lines to PO ${po.order_number}`);

		return {
			purchaseOrder: updatedPO,
			linesAdded: itemsToInsert.length,
			linesUpdated: itemsToUpdate.length,
			merged: true,
		};
	} catch (error) {
		console.error('Error adding lines to existing PO:', error);
		throw new Error(`Failed to add lines to existing PO: ${error.message}`);
	}
}

/**
 * Populate PO lines for a vendor (or all vendors)
 * Returns order items ready for PO generation
 * @param {string} restaurantId - Restaurant UUID
 * @param {string} vendorId - Vendor UUID or vendor name (optional)
 * @returns {Promise<Object|Array>} Items grouped by vendor or for specific vendor
 */
export async function populatePOLines(restaurantId, vendorId = null) {
	try {
		// Get all order items with available quantity
		let query = supabase
			.from('restaurant_order_items')
			.select(`
				*,
				order:restaurant_orders!inner(
					id,
					order_number,
					order_type,
					status,
					restaurant_id
				),
				ingredient:ingredient_library(
					id,
					name,
					category,
					unit,
					package_quantity,
					item_quantity,
					item_uom
				)
			`)
			.eq('order.restaurant_id', restaurantId)
			.in('order.status', ['submitted', 'open'])
			.in('status', ['pending', 'on_po']);

		const { data: orderItems, error } = await query;

		if (error) throw error;

		// Filter items with available quantity
		const availableItems = orderItems.filter(item => {
			const quantity = parseFloat(item.quantity || 0);
			const qtyOnPO = parseFloat(item.quantity_on_po || 0);
			return (quantity - qtyOnPO) > 0;
		});

		// Get vendor info for each item using the vendor service
		const { getPreferredVendorForIngredient } = await import('./vendors.js');

		const itemsWithVendors = await Promise.all(
			availableItems.map(async (item) => {
				let vendorName = 'General Supplier';
				let vendorIdForItem = null;

				try {
					if (item.ingredient_id) {
						const preferredVendor = await getPreferredVendorForIngredient(
							item.ingredient_id,
							restaurantId
						);

						if (preferredVendor) {
							vendorName = preferredVendor.name;
							vendorIdForItem = preferredVendor.id;
						}
					} else if (item.preferred_vendor) {
						vendorName = item.preferred_vendor;
					}
				} catch (error) {
					console.warn(`Could not fetch vendor for item ${item.id}:`, error.message);
				}

				const quantity = parseFloat(item.quantity || 0);
				const qtyOnPO = parseFloat(item.quantity_on_po || 0);
				const availableQty = quantity - qtyOnPO;

				return {
					...item,
					order_id: item.order.id,
					order_number: item.order.order_number,
					ingredient_name: item.ingredient?.name || item.item_name || 'Unknown Item',
					category: item.ingredient?.category || item.category,
					available_qty: availableQty,
					vendor_name: vendorName,
					vendor_id: vendorIdForItem,
					// Package quantity fields
					pkg_qty: item.ingredient?.package_quantity || 1,
					pkg_uom: item.ingredient?.unit,
					items_per_pkg: item.ingredient?.package_quantity || 1,
					item_qty: item.ingredient?.item_quantity,
					item_uom: item.ingredient?.item_uom,
				};
			})
		);

		// If vendor specified, filter to that vendor only
		if (vendorId) {
			// Check if vendorId is UUID or name
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			const isUUID = uuidRegex.test(vendorId);

			const filteredItems = itemsWithVendors.filter(item =>
				isUUID ? item.vendor_id === vendorId : item.vendor_name === vendorId
			);

			// Get vendor details
			const vendorInfo = filteredItems.length > 0
				? { id: filteredItems[0].vendor_id, name: filteredItems[0].vendor_name }
				: { id: vendorId, name: vendorId };

			return {
				vendor: vendorInfo,
				items: filteredItems,
			};
		} else {
			// Group by vendor
			const vendorGroups = {};

			itemsWithVendors.forEach(item => {
				const vendorKey = item.vendor_name;

				if (!vendorGroups[vendorKey]) {
					vendorGroups[vendorKey] = {
						vendor_id: item.vendor_id,
						vendor_name: vendorKey,
						items: [],
					};
				}

				vendorGroups[vendorKey].items.push(item);
			});

			// Convert to array
			const vendors = Object.values(vendorGroups).map(group => ({
				...group,
				total_items: group.items.length,
			}));

			// Debug logging
			console.log(`📦 Grouped ${itemsWithVendors.length} items into ${vendors.length} vendors`);
			vendors.forEach(vendor => {
				console.log(`📦 Vendor: ${vendor.vendor_name} (${vendor.vendor_id})`);
				vendor.items.forEach(item => {
					console.log(`  - ${item.ingredient_name}: ${item.quantity} ${item.unit} @ $${item.estimated_unit_cost}/${item.unit}`);
				});
			});

			return { vendors };
		}
	} catch (error) {
		console.error('Error populating PO lines:', error);
		throw new Error(`Failed to populate PO lines: ${error.message}`);
	}
}

/**
 * Update order status based on all items being assigned to POs
 * @param {string} orderId - Order UUID
 * @returns {Promise<boolean>} Whether status was updated
 */
export async function updateOrderStatusFromItems(orderId) {
	try {
		// Get all order items
		const { data: orderItems, error: itemsError } = await supabase
			.from('restaurant_order_items')
			.select('id, status, quantity, quantity_on_po')
			.eq('order_id', orderId);

		if (itemsError) throw itemsError;

		if (!orderItems || orderItems.length === 0) {
			return false;
		}

		// Check if all items are on PO or received
		const allItemsAssigned = orderItems.every(item => {
			const qty = parseFloat(item.quantity || 0);
			const qtyOnPO = parseFloat(item.quantity_on_po || 0);
			return qtyOnPO >= qty || ['on_po', 'partially_received', 'received'].includes(item.status);
		});

		if (allItemsAssigned) {
			// Update order status to 'open' (all items assigned to POs)
			const { error: updateError } = await supabase
				.from('restaurant_orders')
				.update({
					status: 'open',
					updated_at: new Date().toISOString()
				})
				.eq('id', orderId);

			if (updateError) throw updateError;

			console.log(`✅ Updated order ${orderId} status to 'open'`);
			return true;
		}

		return false;
	} catch (error) {
		console.error('Error updating order status from items:', error);
		return false;
	}
}

/**
 * Update source order items after PO creation
 * @param {Array} orderItemIds - Array of order item IDs
 * @param {string} poId - Purchase Order ID
 * @param {string} poNumber - Purchase Order number
 * @returns {Promise<void>}
 */
async function updateOrderItemsStatus(orderItemIds, poId, poNumber) {
	try {
		for (const itemId of orderItemIds) {
			// Get current item
			const { data: item, error: getError } = await supabase
				.from('restaurant_order_items')
				.select('quantity, quantity_on_po')
				.eq('id', itemId)
				.single();

			if (getError) {
				console.error(`Error fetching item ${itemId}:`, getError);
				continue;
			}

			const quantity = parseFloat(item.quantity || 0);
			const currentQtyOnPO = parseFloat(item.quantity_on_po || 0);
			const newQtyOnPO = quantity; // Assign full quantity to PO

			// Update item
			const { error: updateError } = await supabase
				.from('restaurant_order_items')
				.update({
					po_id: poId,
					po_number: poNumber,
					quantity_on_po: newQtyOnPO,
					status: 'on_po',
					updated_at: new Date().toISOString(),
				})
				.eq('id', itemId);

			if (updateError) {
				console.error(`Error updating item ${itemId}:`, updateError);
			}
		}
	} catch (error) {
		console.error('Error updating order items status:', error);
		throw error;
	}
}

/**
 * Distribute received quantity proportionally to source order items
 * @param {Object} poItem - PO item with source_order_item_ids
 * @param {number} receivedQty - Quantity received this delivery
 * @returns {Promise<Array>} Array of {orderItemId, distributedQty}
 */
async function distributeReceivedQuantity(poItem, receivedQty) {
	try {
		if (!poItem.source_order_item_ids || poItem.source_order_item_ids.length === 0) {
			console.warn(`PO item ${poItem.id} has no source_order_item_ids`);
			return [];
		}

		// Get all source order items
		const { data: sourceItems, error } = await supabase
			.from("restaurant_order_items")
			.select("id, quantity, quantity_on_po, quantity_received")
			.in("id", poItem.source_order_item_ids);

		if (error) throw error;
		if (!sourceItems || sourceItems.length === 0) {
			console.warn(`No source items found for PO item ${poItem.id}`);
			return [];
		}

		// Calculate total ordered quantity across all source items
		const totalOrdered = sourceItems.reduce((sum, item) => {
			return sum + parseFloat(item.quantity_on_po || item.quantity || 0);
		}, 0);

		if (totalOrdered === 0) {
			console.warn(`Total ordered is 0 for PO item ${poItem.id}`);
			return [];
		}

		// Distribute received quantity proportionally
		const distributions = sourceItems.map((sourceItem, index) => {
			const itemQty = parseFloat(sourceItem.quantity_on_po || sourceItem.quantity || 0);
			const proportion = itemQty / totalOrdered;
			let distributedQty = receivedQty * proportion;

			// For the last item, use remainder to avoid rounding errors
			if (index === sourceItems.length - 1) {
				const alreadyDistributed = distributions.reduce((sum, d) => sum + (d.distributedQty || 0), 0);
				distributedQty = receivedQty - alreadyDistributed;
			}

			return {
				orderItemId: sourceItem.id,
				distributedQty: parseFloat(distributedQty.toFixed(4)),
				currentReceived: parseFloat(sourceItem.quantity_received || 0),
				qtyOnPO: parseFloat(sourceItem.quantity_on_po || sourceItem.quantity || 0),
			};
		});

		return distributions;
	} catch (error) {
		console.error("Error distributing received quantity:", error);
		throw error;
	}
}

/**
 * Update order item with received quantity and status
 * @param {string} orderItemId - Order item UUID
 * @param {number} distributedQty - Quantity to add to received
 * @returns {Promise<Object>} Updated order item
 */
async function updateOrderItemReceived(orderItemId, distributedQty) {
	try {
		// Get current state
		const { data: orderItem, error: getError } = await supabase
			.from("restaurant_order_items")
			.select("id, quantity, quantity_on_po, quantity_received")
			.eq("id", orderItemId)
			.single();

		if (getError) throw getError;

		const currentReceived = parseFloat(orderItem.quantity_received || 0);
		const newReceived = currentReceived + distributedQty;
		const qtyOnPO = parseFloat(orderItem.quantity_on_po || orderItem.quantity || 0);

		// Determine new status
		let newStatus = "on_po";
		if (newReceived >= qtyOnPO) {
			newStatus = "received";
		} else if (newReceived > 0) {
			newStatus = "partially_received";
		}

		// Update order item
		const { data: updated, error: updateError } = await supabase
			.from("restaurant_order_items")
			.update({
				quantity_received: parseFloat(newReceived.toFixed(4)),
				status: newStatus,
				updated_at: new Date().toISOString(),
			})
			.eq("id", orderItemId)
			.select()
			.single();

		if (updateError) throw updateError;

		return updated;
	} catch (error) {
		console.error(`Error updating order item ${orderItemId}:`, error);
		throw error;
	}
}

/**
 * Check if all PO items are fully received
 * @param {string} poId - Purchase Order UUID
 * @returns {Promise<boolean>} True if all items fully received
 */
async function areAllPOItemsReceived(poId) {
	try {
		const { data: items, error } = await supabase
			.from("purchase_order_items")
			.select("quantity_ordered, quantity_received")
			.eq("purchase_order_id", poId);

		if (error) throw error;
		if (!items || items.length === 0) return false;

		return items.every(item => {
			const ordered = parseFloat(item.quantity_ordered || 0);
			const received = parseFloat(item.quantity_received || 0);
			return received >= ordered;
		});
	} catch (error) {
		console.error("Error checking PO items completion:", error);
		return false;
	}
}

/**
 * Check if all order items are fully received
 * @param {string} orderId - Restaurant Order UUID
 * @returns {Promise<boolean>} True if all items fully received
 */
async function areAllOrderItemsReceived(orderId) {
	try {
		const { data: items, error } = await supabase
			.from("restaurant_order_items")
			.select("quantity, quantity_on_po, quantity_received")
			.eq("order_id", orderId);

		if (error) throw error;
		if (!items || items.length === 0) return false;

		return items.every(item => {
			const qtyOnPO = parseFloat(item.quantity_on_po || item.quantity || 0);
			const received = parseFloat(item.quantity_received || 0);
			return received >= qtyOnPO;
		});
	} catch (error) {
		console.error("Error checking order items completion:", error);
		return false;
	}
}

/**
 * ENHANCED: Receive items for a purchase order with proportional distribution
 * Supports partial fulfillment with accurate tracking across source orders
 * @param {string} purchaseOrderId - PO UUID
 * @param {Array} receivedItems - Array of {po_item_id, quantity_received, expiration_date?, batch_number?}
 * @param {string} restaurantId - Restaurant UUID for validation
 * @returns {Promise<Object>} Detailed receiving result
 */
export async function receivePurchaseOrderItems(purchaseOrderId, receivedItems, restaurantId, userInfo = {}) {
	try {
		// Validate PO exists and belongs to restaurant
		const { data: po, error: poError } = await supabase
			.from("purchase_orders")
			.select("id, order_number, status, restaurant_id, supplier_name")
			.eq("id", purchaseOrderId)
			.single();

		if (poError || !po) {
			throw new Error("Purchase order not found");
		}

		if (restaurantId && po.restaurant_id !== restaurantId) {
			throw new Error("Purchase order does not belong to this restaurant");
		}

		// Validate PO status
		if (po.status === "cancelled") {
			throw new Error("Cannot receive items on cancelled PO");
		}

		if (po.status === "complete") {
			throw new Error("PO is already complete - all items received");
		}

		// Set status to backordered if it's draft
		if (po.status === "draft") {
			await supabase
				.from("purchase_orders")
				.update({ status: "backordered", updated_at: new Date().toISOString() })
				.eq("id", purchaseOrderId);
		}

		const processedItems = [];
		const ordersUpdated = new Set();

		// Process each received item
		for (const receivedItem of receivedItems) {
			const { po_item_id, quantity_received, expiration_date, batch_number } = receivedItem;

			if (!po_item_id || !quantity_received || quantity_received <= 0) {
				console.warn("Skipping invalid received item:", receivedItem);
				continue;
			}

			// Get current PO item details
			const { data: poItem, error: getError } = await supabase
				.from("purchase_order_items")
				.select("*")
				.eq("id", po_item_id)
				.eq("purchase_order_id", purchaseOrderId)
				.single();

			if (getError) {
				console.error(`Error fetching PO item ${po_item_id}:`, getError);
				throw new Error(`PO item not found: ${po_item_id}`);
			}

			// Validate not over-receiving
			const currentReceived = parseFloat(poItem.quantity_received || 0);
			const newTotalReceived = currentReceived + parseFloat(quantity_received);
			const quantityOrdered = parseFloat(poItem.quantity_ordered);

			if (newTotalReceived > quantityOrdered) {
				throw new Error(
					`Cannot receive ${quantity_received} ${poItem.unit} - only ${quantityOrdered - currentReceived} ${poItem.unit} remaining to receive`
				);
			}

			// Update PO item
			const updateData = {
				quantity_received: parseFloat(newTotalReceived.toFixed(4)),
				updated_at: new Date().toISOString(),
			};

			if (expiration_date) updateData.expiration_date = expiration_date;
			if (batch_number) updateData.batch_number = batch_number;

			const { error: updateError } = await supabase
				.from("purchase_order_items")
				.update(updateData)
				.eq("id", po_item_id);

			if (updateError) throw updateError;

			// Distribute to source order items proportionally
			const distributions = await distributeReceivedQuantity(poItem, parseFloat(quantity_received));

			for (const distribution of distributions) {
				const updated = await updateOrderItemReceived(
					distribution.orderItemId,
					distribution.distributedQty
				);

				// Track which orders were affected
				const { data: orderItem } = await supabase
					.from("restaurant_order_items")
					.select("order_id")
					.eq("id", distribution.orderItemId)
					.single();

				if (orderItem) {
					ordersUpdated.add(orderItem.order_id);
				}
			}

			processedItems.push({
				po_item_id: poItem.id,
				item_name: poItem.item_name || "Unknown",
				quantity_ordered: quantityOrdered,
				quantity_received: newTotalReceived,
				remaining: parseFloat((quantityOrdered - newTotalReceived).toFixed(4)),
				status: newTotalReceived >= quantityOrdered ? "complete" : "partial",
			});
		}

		// Update inventory with received items
		await updateInventoryFromReceiving(processedItems, purchaseOrderId, restaurantId);

		// Check if PO is now complete
		const allReceived = await areAllPOItemsReceived(purchaseOrderId);
		if (allReceived) {
			await supabase
				.from("purchase_orders")
				.update({
					status: "complete",
					actual_delivery_date: new Date().toISOString().split("T")[0],
					updated_at: new Date().toISOString(),
				})
				.eq("id", purchaseOrderId);
		}

		// Check if source orders are now complete
		const completedOrders = [];
		for (const orderId of ordersUpdated) {
			const orderComplete = await areAllOrderItemsReceived(orderId);
			if (orderComplete) {
				await supabase
					.from("restaurant_orders")
					.update({
						status: "complete",
						updated_at: new Date().toISOString(),
					})
					.eq("id", orderId);

				const { data: order } = await supabase
					.from("restaurant_orders")
					.select("order_number")
					.eq("id", orderId)
					.single();

				if (order) {
					completedOrders.push({
						order_id: orderId,
						order_number: order.order_number,
						status: "complete",
					});
				}
			}
		}

		// Log this receiving event (non-fatal if it fails)
		try {
			const logItems = processedItems.map(item => {
				const sourceItem = receivedItems.find(r => r.po_item_id === item.po_item_id);
				return {
					po_item_id: item.po_item_id,
					ingredient_name: item.item_name,
					quantity_received: sourceItem?.quantity_received || 0,
					unit: sourceItem?.unit || null,
					unit_price: sourceItem?.unit_price || 0,
					expiration_date: sourceItem?.expiration_date || null,
					batch_number: sourceItem?.batch_number || null,
					notes: sourceItem?.notes || null,
				};
			});

			await createReceivingLogEntry({
				restaurantId: restaurantId || po.restaurant_id,
				purchaseOrderId,
				poNumber: po.order_number,
				vendorName: po.supplier_name,
				receivedBy: userInfo.userId || null,
				receivedByName: userInfo.userName || null,
				itemsReceived: logItems,
			});
		} catch (logError) {
			console.warn("Failed to create receiving log entry:", logError.message);
		}

		return {
			success: true,
			po_id: purchaseOrderId,
			po_number: po.order_number,
			status: allReceived ? "complete" : "backordered",
			items_received: processedItems,
			orders_updated: completedOrders,
			inventory_updated: true,
		};
	} catch (error) {
		console.error("Error receiving purchase order items:", error);
		throw error;
	}
}

/**
 * Update inventory with received PO items
 * @param {Array} poItems - Processed PO items
 * @param {string} poId - Purchase Order UUID
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<void>}
 */
async function updateInventoryFromReceiving(poItems, poId, restaurantId) {
	try {
		// Get full PO item details with ingredient info
		const { data: fullItems, error } = await supabase
			.from("purchase_order_items")
			.select(`
				*,
				ingredient:ingredient_library(id, name)
			`)
			.eq("purchase_order_id", poId);

		if (error) throw error;

		for (const processedItem of poItems) {
			const fullItem = fullItems.find(item => item.id === processedItem.po_item_id);
			if (!fullItem || !fullItem.ingredient_id) continue;

			// Calculate quantity to add (only the new received amount)
			const qtyToAdd = processedItem.remaining < 0
				? processedItem.quantity_ordered
				: processedItem.quantity_received - (processedItem.quantity_ordered - processedItem.remaining - processedItem.quantity_received);

			if (qtyToAdd <= 0) continue;

			// Check if inventory item exists
			const { data: existing, error: findError } = await supabase
				.from("restaurant_inventory")
				.select("*")
				.eq("restaurant_id", restaurantId)
				.eq("ingredient_id", fullItem.ingredient_id)
				.maybeSingle();

			if (findError && findError.code !== "PGRST116") throw findError;

			const now = new Date().toISOString();

			if (existing) {
				// Update existing inventory
				const newQuantity = parseFloat(existing.quantity) + parseFloat(qtyToAdd);

				await supabase
					.from("restaurant_inventory")
					.update({
						quantity: parseFloat(newQuantity.toFixed(4)),
						last_restocked: now,
						expiration_date: fullItem.expiration_date || existing.expiration_date,
						updated_at: now,
					})
					.eq("id", existing.id);
			} else {
				// Create new inventory record
				await supabase
					.from("restaurant_inventory")
					.insert({
						restaurant_id: restaurantId,
						ingredient_id: fullItem.ingredient_id,
						quantity: parseFloat(qtyToAdd.toFixed(4)),
						unit: fullItem.unit,
						expiration_date: fullItem.expiration_date,
						last_restocked: now,
						created_at: now,
						updated_at: now,
					});
			}
		}
	} catch (error) {
		console.error("Error updating inventory from receiving:", error);
		// Don't throw - inventory update is non-critical for receiving workflow
		console.warn("Continuing despite inventory update error");
	}
}

// ============================================
// RECEIVING LOG FUNCTIONS
// ============================================

/**
 * Create a receiving log entry
 * @param {Object} params
 * @returns {Promise<Object>} Created receiving_log row
 */
export async function createReceivingLogEntry({
	restaurantId,
	purchaseOrderId,
	poNumber,
	vendorName,
	receivedBy,
	receivedByName,
	itemsReceived,
	notes,
}) {
	const totalItemsCount = itemsReceived.length;
	const totalValue = itemsReceived.reduce(
		(sum, item) => sum + (parseFloat(item.quantity_received) || 0) * (parseFloat(item.unit_price) || 0),
		0
	);

	const { data, error } = await supabase
		.from("receiving_log")
		.insert({
			restaurant_id: restaurantId,
			purchase_order_id: purchaseOrderId,
			po_number: poNumber,
			vendor_name: vendorName,
			received_by: receivedBy,
			received_by_name: receivedByName,
			items_received: itemsReceived,
			total_items_count: totalItemsCount,
			total_value: parseFloat(totalValue.toFixed(2)),
			notes: notes || null,
		})
		.select()
		.single();

	if (error) throw error;
	return data;
}

/**
 * Get receiving log entries with optional filters
 * @param {string} restaurantId - Restaurant UUID
 * @param {Object} filters
 * @returns {Promise<{entries: Array, total: number}>}
 */
export async function getReceivingLog(restaurantId, filters = {}) {
	const { poId, vendor, startDate, endDate, limit = 50, offset = 0 } = filters;

	let query = supabase
		.from("receiving_log")
		.select("*", { count: "exact" })
		.eq("restaurant_id", restaurantId)
		.order("received_at", { ascending: false });

	if (poId) {
		query = query.eq("purchase_order_id", poId);
	}
	if (vendor) {
		query = query.ilike("vendor_name", `%${vendor}%`);
	}
	if (startDate) {
		query = query.gte("received_at", startDate);
	}
	if (endDate) {
		query = query.lte("received_at", endDate + "T23:59:59.999Z");
	}

	query = query.range(offset, offset + limit - 1);

	const { data, error, count } = await query;
	if (error) throw error;

	return { entries: data || [], total: count || 0 };
}

/**
 * Get a single receiving log entry
 * @param {string} logId - receiving_log UUID
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<Object>}
 */
export async function getReceivingLogEntry(logId, restaurantId) {
	const { data, error } = await supabase
		.from("receiving_log")
		.select("*")
		.eq("id", logId)
		.eq("restaurant_id", restaurantId)
		.single();

	if (error) throw error;
	return data;
}

/**
 * Get purchase orders that are open for receiving
 * @param {string} restaurantId - Restaurant UUID
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
export async function getOpenPurchaseOrders(restaurantId, filters = {}) {
	const { search } = filters;

	let query = supabase
		.from("purchase_orders")
		.select(`
			*,
			purchase_order_items(
				id,
				item_name,
				quantity_ordered,
				quantity_received,
				unit,
				ingredient:ingredient_library(name)
			)
		`)
		.eq("restaurant_id", restaurantId)
		.in("status", ["draft", "ordered", "backordered"])
		.order("created_at", { ascending: false });

	if (search) {
		query = query.or(`order_number.ilike.%${search}%,supplier_name.ilike.%${search}%`);
	}

	const { data, error } = await query;
	if (error) throw error;

	// Calculate receiving progress for each PO
	return (data || []).map(po => {
		const items = po.purchase_order_items || [];
		const totalOrdered = items.reduce((sum, item) => sum + parseFloat(item.quantity_ordered || 0), 0);
		const totalReceived = items.reduce((sum, item) => sum + parseFloat(item.quantity_received || 0), 0);
		const percentComplete = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

		return {
			id: po.id,
			order_number: po.order_number,
			supplier_name: po.supplier_name,
			status: po.status,
			order_date: po.order_date,
			expected_delivery_date: po.expected_delivery_date,
			total: po.total,
			item_count: items.length,
			total_ordered: totalOrdered,
			total_received: totalReceived,
			percent_complete: percentComplete,
			items: items.map(item => ({
				id: item.id,
				item_name: item.item_name || item.ingredient?.name || "Unknown",
				quantity_ordered: parseFloat(item.quantity_ordered || 0),
				quantity_received: parseFloat(item.quantity_received || 0),
				unit: item.unit,
			})),
		};
	});
}
