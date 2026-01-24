// /backend/src/services/vendors.js

import { supabase } from "./supabase.js";

/**
 * Get all vendors for a restaurant with optional filtering
 * @param {string} restaurantId - Restaurant UUID
 * @param {Object} filters - Optional filters (is_active)
 * @returns {Promise<Array>} Array of vendor objects
 */
export async function getVendors(restaurantId, filters = {}) {
	try {
		let query = supabase
			.from("vendors")
			.select("*")
			.eq("restaurant_id", restaurantId);

		// Apply filters
		if (filters.is_active !== undefined) {
			query = query.eq("is_active", filters.is_active);
		}

		// Order by name
		query = query.order("name", { ascending: true });

		const { data, error } = await query;
		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching vendors:", error);
		throw new Error(`Failed to fetch vendors: ${error.message}`);
	}
}

/**
 * Get vendor by ID with statistics
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for validation
 * @returns {Promise<Object>} Vendor object with stats
 */
export async function getVendorById(vendorId, restaurantId) {
	try {
		// Get vendor details
		const { data: vendor, error } = await supabase
			.from("vendors")
			.select("*")
			.eq("id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new Error("Vendor not found");
			}
			throw error;
		}

		// Get vendor stats
		// Count ingredients
		const { count: ingredientCount, error: ingredientError } = await supabase
			.from("ingredient_vendor_mapping")
			.select("*", { count: "exact", head: true })
			.eq("vendor_id", vendorId);

		if (ingredientError) {
			console.warn("Error counting ingredients:", ingredientError);
		}

		// Count purchase orders (would need purchase_orders table)
		// For now, we'll leave this as 0
		const poCount = 0;
		const totalSpend = 0;

		return {
			...vendor,
			stats: {
				ingredient_count: ingredientCount || 0,
				po_count: poCount,
				total_spend: totalSpend,
			},
		};
	} catch (error) {
		console.error("Error fetching vendor:", error);
		throw error;
	}
}

/**
 * Create a new vendor
 * @param {Object} vendorData - Vendor data
 * @param {string} restaurantId - Restaurant UUID
 * @param {string} userId - User ID (not currently stored in database, reserved for future use)
 * @returns {Promise<Object>} Created vendor object
 */
export async function createVendor(vendorData, restaurantId, userId) {
	try {
		const {
			name,
			vendor_code,
			legal_name,
			trade_name,
			contact_name,
			phone,
			email,
			address,
			payment_terms,
			account_number,
			notes,
			status,
		} = vendorData;

		// Validation
		if (!name || name.trim().length === 0) {
			throw new Error("Vendor name is required");
		}

		if (name.length > 255) {
			throw new Error("Vendor name must be 255 characters or less");
		}

		// Validate vendor_code if provided
		if (vendor_code && vendor_code.trim().length > 0) {
			// Vendor code format validation (alphanumeric and hyphens)
			const codeRegex = /^[A-Z0-9-]+$/i;
			if (!codeRegex.test(vendor_code.trim())) {
				throw new Error("Vendor code can only contain letters, numbers, and hyphens");
			}

			// Check for duplicate vendor_code in this restaurant
			const { data: existingCode, error: codeError } = await supabase
				.from("vendors")
				.select("id, name")
				.eq("restaurant_id", restaurantId)
				.eq("vendor_code", vendor_code.trim().toUpperCase())
				.maybeSingle();

			if (codeError) throw codeError;
			if (existingCode) {
				throw new Error(`A vendor with code "${vendor_code.toUpperCase()}" already exists (${existingCode.name})`);
			}
		}

		// Validate email format if provided
		if (email && email.trim().length > 0) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				throw new Error("Invalid email format");
			}
		}

		// Check for duplicate vendor name in this restaurant
		const { data: existing, error: duplicateError } = await supabase
			.from("vendors")
			.select("id")
			.eq("restaurant_id", restaurantId)
			.eq("name", name.trim())
			.maybeSingle();

		if (duplicateError) throw duplicateError;
		if (existing) {
			throw new Error("A vendor with this name already exists");
		}

		// Determine is_active based on status field
		const isActive = status === 'inactive' ? false : true;

		// Insert vendor
		const { data, error } = await supabase
			.from("vendors")
			.insert({
				restaurant_id: restaurantId,
				name: name.trim(),
				vendor_code: vendor_code?.trim()?.toUpperCase() || null,
				legal_name: legal_name?.trim() || null,
				trade_name: trade_name?.trim() || null,
				contact_name: contact_name?.trim() || null,
				phone: phone?.trim() || null,
				email: email?.trim() || null,
				address: address?.trim() || null,
				payment_terms: payment_terms?.trim() || null,
				account_number: account_number?.trim() || null,
				notes: notes?.trim() || null,
				is_active: isActive,
			})
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Created vendor: ${data.name} (ID: ${data.id}, Code: ${data.vendor_code || 'N/A'})`);
		return data;
	} catch (error) {
		console.error("Error creating vendor:", error);
		throw error;
	}
}

/**
 * Update vendor information
 * @param {string} vendorId - Vendor UUID
 * @param {Object} updates - Fields to update
 * @param {string} restaurantId - Restaurant UUID for validation
 * @returns {Promise<Object>} Updated vendor object
 */
export async function updateVendor(vendorId, updates, restaurantId) {
	try {
		// Verify vendor exists and belongs to restaurant
		const { data: existing, error: checkError } = await supabase
			.from("vendors")
			.select("id, name, vendor_code")
			.eq("id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor not found");
			}
			throw checkError;
		}

		// Validate updates
		if (updates.name !== undefined) {
			if (!updates.name || updates.name.trim().length === 0) {
				throw new Error("Vendor name cannot be empty");
			}
			if (updates.name.length > 255) {
				throw new Error("Vendor name must be 255 characters or less");
			}

			// Check for duplicate name (excluding current vendor)
			const { data: duplicate, error: dupError } = await supabase
				.from("vendors")
				.select("id")
				.eq("restaurant_id", restaurantId)
				.eq("name", updates.name.trim())
				.neq("id", vendorId)
				.maybeSingle();

			if (dupError) throw dupError;
			if (duplicate) {
				throw new Error("A vendor with this name already exists");
			}
		}

		// Validate vendor_code if provided
		if (updates.vendor_code !== undefined && updates.vendor_code !== null) {
			const codeValue = updates.vendor_code.trim();

			if (codeValue.length > 0) {
				// Vendor code format validation (alphanumeric and hyphens)
				const codeRegex = /^[A-Z0-9-]+$/i;
				if (!codeRegex.test(codeValue)) {
					throw new Error("Vendor code can only contain letters, numbers, and hyphens");
				}

				// Check for duplicate vendor_code (excluding current vendor)
				const { data: existingCode, error: codeError } = await supabase
					.from("vendors")
					.select("id, name")
					.eq("restaurant_id", restaurantId)
					.eq("vendor_code", codeValue.toUpperCase())
					.neq("id", vendorId)
					.maybeSingle();

				if (codeError) throw codeError;
				if (existingCode) {
					throw new Error(`A vendor with code "${codeValue.toUpperCase()}" already exists (${existingCode.name})`);
				}

				// Normalize to uppercase
				updates.vendor_code = codeValue.toUpperCase();
			}
		}

		// Validate email if provided
		if (updates.email && updates.email.trim().length > 0) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(updates.email)) {
				throw new Error("Invalid email format");
			}
		}

		// Handle status -> is_active conversion
		if (updates.status !== undefined) {
			updates.is_active = updates.status !== 'inactive';
			delete updates.status;
		}

		// Prevent changing restaurant_id
		delete updates.restaurant_id;
		delete updates.created_by;
		delete updates.created_at;

		// Prepare update object with trimmed strings
		const updateData = {};
		Object.keys(updates).forEach((key) => {
			if (updates[key] !== undefined) {
				updateData[key] =
					typeof updates[key] === "string"
						? updates[key].trim()
						: updates[key];
			}
		});

		updateData.updated_at = new Date().toISOString();

		// Perform update
		const { data, error } = await supabase
			.from("vendors")
			.update(updateData)
			.eq("id", vendorId)
			.eq("restaurant_id", restaurantId)
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Updated vendor: ${data.name} (ID: ${data.id}, Code: ${data.vendor_code || 'N/A'})`);
		return data;
	} catch (error) {
		console.error("Error updating vendor:", error);
		throw error;
	}
}

/**
 * Soft delete vendor (set is_active = false)
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for validation
 * @returns {Promise<Object>} Success message
 */
export async function deleteVendor(vendorId, restaurantId) {
	try {
		// Verify vendor exists and belongs to restaurant
		const { data: vendor, error: checkError } = await supabase
			.from("vendors")
			.select("id, name, is_active")
			.eq("id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor not found");
			}
			throw checkError;
		}

		// Check if vendor has open POs
		// For now, we'll just mark as inactive
		// In future, add check for open purchase orders

		// Soft delete
		const { error } = await supabase
			.from("vendors")
			.update({
				is_active: false,
				updated_at: new Date().toISOString(),
			})
			.eq("id", vendorId)
			.eq("restaurant_id", restaurantId);

		if (error) throw error;

		console.log(`✅ Deleted vendor: ${vendor.name} (ID: ${vendorId})`);
		return { message: "Vendor deleted successfully" };
	} catch (error) {
		console.error("Error deleting vendor:", error);
		throw error;
	}
}

/**
 * Get all vendors for a specific ingredient
 * @param {string} ingredientId - Ingredient UUID
 * @param {string} restaurantId - Restaurant UUID for validation
 * @returns {Promise<Array>} Array of vendors with pricing info
 */
export async function getVendorsForIngredient(ingredientId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("ingredient_vendor_mapping")
			.select(
				`
				*,
				vendor:vendors(*)
			`
			)
			.eq("ingredient_id", ingredientId);

		if (error) throw error;

		// Filter to only include vendors from this restaurant and active vendors
		const filteredData = (data || [])
			.filter(
				(mapping) =>
					mapping.vendor &&
					mapping.vendor.restaurant_id === restaurantId &&
					mapping.vendor.is_active
			)
			.map((mapping) => ({
				...mapping.vendor,
				mapping_info: {
					is_preferred: mapping.is_preferred,
					vendor_item_number: mapping.vendor_item_number,
					unit_cost: parseFloat(mapping.unit_cost || 0),
					lead_time_days: mapping.lead_time_days,
					minimum_order_qty: parseFloat(mapping.minimum_order_qty || 0),
					notes: mapping.notes,
				},
			}));

		return filteredData;
	} catch (error) {
		console.error("Error fetching vendors for ingredient:", error);
		throw new Error(
			`Failed to fetch vendors for ingredient: ${error.message}`
		);
	}
}

/**
 * Get the preferred vendor for a specific ingredient
 * @param {string} ingredientId - Ingredient UUID
 * @param {string} restaurantId - Restaurant UUID for validation
 * @returns {Promise<Object|null>} Preferred vendor with pricing, or null
 */
export async function getPreferredVendorForIngredient(
	ingredientId,
	restaurantId
) {
	try {
		const { data, error } = await supabase
			.from("ingredient_vendor_mapping")
			.select(
				`
				*,
				vendor:vendors(*)
			`
			)
			.eq("ingredient_id", ingredientId)
			.eq("is_preferred", true)
			.maybeSingle();

		if (error) throw error;

		// Verify vendor belongs to restaurant and is active
		if (
			!data ||
			!data.vendor ||
			data.vendor.restaurant_id !== restaurantId ||
			!data.vendor.is_active
		) {
			return null;
		}

		return {
			...data.vendor,
			mapping_info: {
				is_preferred: true,
				vendor_item_number: data.vendor_item_number,
				unit_cost: parseFloat(data.unit_cost || 0),
				lead_time_days: data.lead_time_days,
				minimum_order_qty: parseFloat(data.minimum_order_qty || 0),
				notes: data.notes,
			},
		};
	} catch (error) {
		console.error("Error fetching preferred vendor:", error);
		throw new Error(`Failed to fetch preferred vendor: ${error.message}`);
	}
}

/**
 * Create ingredient-vendor mapping
 * @param {string} vendorId - Vendor UUID
 * @param {string} ingredientId - Ingredient UUID
 * @param {Object} mappingData - Mapping data
 * @param {string} restaurantId - Restaurant UUID for validation
 * @returns {Promise<Object>} Created mapping object
 */
export async function createIngredientVendorMapping(
	vendorId,
	ingredientId,
	mappingData,
	restaurantId
) {
	try {
		// Verify vendor exists and belongs to restaurant
		const { data: vendor, error: vendorError } = await supabase
			.from("vendors")
			.select("id, name, is_active")
			.eq("id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (vendorError) {
			if (vendorError.code === "PGRST116") {
				throw new Error("Vendor not found");
			}
			throw vendorError;
		}

		if (!vendor.is_active) {
			throw new Error("Cannot add mapping to inactive vendor");
		}

		// Verify ingredient exists
		const { data: ingredient, error: ingredientError } = await supabase
			.from("ingredient_library")
			.select("id, name")
			.eq("id", ingredientId)
			.single();

		if (ingredientError) {
			if (ingredientError.code === "PGRST116") {
				throw new Error("Ingredient not found");
			}
			throw ingredientError;
		}

		// Check if mapping already exists
		const { data: existing, error: existError } = await supabase
			.from("ingredient_vendor_mapping")
			.select("id")
			.eq("vendor_id", vendorId)
			.eq("ingredient_id", ingredientId)
			.maybeSingle();

		if (existError) throw existError;
		if (existing) {
			throw new Error("This ingredient-vendor mapping already exists");
		}

		// Validate mappingData
		const {
			is_preferred = false,
			vendor_item_number,
			unit_cost,
			lead_time_days,
			minimum_order_qty,
			notes,
		} = mappingData;

		if (unit_cost !== undefined && unit_cost !== null) {
			const cost = parseFloat(unit_cost);
			if (isNaN(cost) || cost < 0) {
				throw new Error("Unit cost must be a positive number");
			}
		}

		if (lead_time_days !== undefined && lead_time_days !== null) {
			const leadTime = parseInt(lead_time_days);
			if (isNaN(leadTime) || leadTime < 0) {
				throw new Error("Lead time must be a positive integer");
			}
		}

		if (
			minimum_order_qty !== undefined &&
			minimum_order_qty !== null
		) {
			const minQty = parseFloat(minimum_order_qty);
			if (isNaN(minQty) || minQty < 0) {
				throw new Error("Minimum order quantity must be a positive number");
			}
		}

		// If is_preferred is true, unset other preferred vendors for this ingredient
		if (is_preferred) {
			const { error: unsetError } = await supabase
				.from("ingredient_vendor_mapping")
				.update({ is_preferred: false })
				.eq("ingredient_id", ingredientId)
				.eq("is_preferred", true);

			if (unsetError) {
				console.warn("Error unsetting other preferred vendors:", unsetError);
			}
		}

		// Create mapping
		const { data, error } = await supabase
			.from("ingredient_vendor_mapping")
			.insert({
				vendor_id: vendorId,
				ingredient_id: ingredientId,
				is_preferred,
				vendor_item_number: vendor_item_number?.trim() || null,
				unit_cost: unit_cost !== undefined ? parseFloat(unit_cost) : null,
				lead_time_days:
					lead_time_days !== undefined ? parseInt(lead_time_days) : null,
				minimum_order_qty:
					minimum_order_qty !== undefined
						? parseFloat(minimum_order_qty)
						: null,
				notes: notes?.trim() || null,
			})
			.select()
			.single();

		if (error) throw error;

		console.log(
			`✅ Created mapping: Ingredient ${ingredient.name} <-> Vendor ${vendor.name}`
		);
		return data;
	} catch (error) {
		console.error("Error creating ingredient-vendor mapping:", error);
		throw error;
	}
}

/**
 * Update ingredient-vendor mapping
 * @param {string} vendorId - Vendor UUID
 * @param {string} ingredientId - Ingredient UUID
 * @param {Object} updates - Fields to update
 * @param {string} restaurantId - Restaurant UUID for validation
 * @returns {Promise<Object>} Updated mapping object
 */
export async function updateIngredientVendorMapping(
	vendorId,
	ingredientId,
	updates,
	restaurantId
) {
	try {
		// Verify vendor belongs to restaurant
		const { data: vendor, error: vendorError } = await supabase
			.from("vendors")
			.select("id, name")
			.eq("id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (vendorError) {
			if (vendorError.code === "PGRST116") {
				throw new Error("Vendor not found");
			}
			throw vendorError;
		}

		// Verify mapping exists
		const { data: existing, error: existError } = await supabase
			.from("ingredient_vendor_mapping")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("ingredient_id", ingredientId)
			.single();

		if (existError) {
			if (existError.code === "PGRST116") {
				throw new Error("Ingredient-vendor mapping not found");
			}
			throw existError;
		}

		// Validate updates
		if (updates.unit_cost !== undefined && updates.unit_cost !== null) {
			const cost = parseFloat(updates.unit_cost);
			if (isNaN(cost) || cost < 0) {
				throw new Error("Unit cost must be a positive number");
			}
		}

		if (
			updates.lead_time_days !== undefined &&
			updates.lead_time_days !== null
		) {
			const leadTime = parseInt(updates.lead_time_days);
			if (isNaN(leadTime) || leadTime < 0) {
				throw new Error("Lead time must be a positive integer");
			}
		}

		if (
			updates.minimum_order_qty !== undefined &&
			updates.minimum_order_qty !== null
		) {
			const minQty = parseFloat(updates.minimum_order_qty);
			if (isNaN(minQty) || minQty < 0) {
				throw new Error("Minimum order quantity must be a positive number");
			}
		}

		// If is_preferred is being set to true, unset other preferred vendors
		if (updates.is_preferred === true && !existing.is_preferred) {
			const { error: unsetError } = await supabase
				.from("ingredient_vendor_mapping")
				.update({ is_preferred: false })
				.eq("ingredient_id", ingredientId)
				.eq("is_preferred", true)
				.neq("vendor_id", vendorId);

			if (unsetError) {
				console.warn("Error unsetting other preferred vendors:", unsetError);
			}
		}

		// Prepare update data
		const updateData = {};
		if (updates.is_preferred !== undefined) {
			updateData.is_preferred = updates.is_preferred;
		}
		if (updates.vendor_item_number !== undefined) {
			updateData.vendor_item_number = updates.vendor_item_number?.trim() || null;
		}
		if (updates.unit_cost !== undefined) {
			updateData.unit_cost =
				updates.unit_cost !== null ? parseFloat(updates.unit_cost) : null;
		}
		if (updates.lead_time_days !== undefined) {
			updateData.lead_time_days =
				updates.lead_time_days !== null
					? parseInt(updates.lead_time_days)
					: null;
		}
		if (updates.minimum_order_qty !== undefined) {
			updateData.minimum_order_qty =
				updates.minimum_order_qty !== null
					? parseFloat(updates.minimum_order_qty)
					: null;
		}
		if (updates.notes !== undefined) {
			updateData.notes = updates.notes?.trim() || null;
		}

		// Perform update
		const { data, error } = await supabase
			.from("ingredient_vendor_mapping")
			.update(updateData)
			.eq("vendor_id", vendorId)
			.eq("ingredient_id", ingredientId)
			.select()
			.single();

		if (error) throw error;

		console.log(
			`✅ Updated mapping: Vendor ${vendorId} <-> Ingredient ${ingredientId}`
		);
		return data;
	} catch (error) {
		console.error("Error updating ingredient-vendor mapping:", error);
		throw error;
	}
}

/**
 * Delete ingredient-vendor mapping
 * @param {string} vendorId - Vendor UUID
 * @param {string} ingredientId - Ingredient UUID
 * @param {string} restaurantId - Restaurant UUID for validation
 * @returns {Promise<Object>} Success message
 */
export async function deleteIngredientVendorMapping(
	vendorId,
	ingredientId,
	restaurantId
) {
	try {
		// Verify vendor belongs to restaurant
		const { data: vendor, error: vendorError } = await supabase
			.from("vendors")
			.select("id")
			.eq("id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (vendorError) {
			if (vendorError.code === "PGRST116") {
				throw new Error("Vendor not found");
			}
			throw vendorError;
		}

		// Delete mapping
		const { error } = await supabase
			.from("ingredient_vendor_mapping")
			.delete()
			.eq("vendor_id", vendorId)
			.eq("ingredient_id", ingredientId);

		if (error) throw error;

		console.log(
			`✅ Deleted mapping: Vendor ${vendorId} <-> Ingredient ${ingredientId}`
		);
		return { message: "Ingredient-vendor mapping deleted successfully" };
	} catch (error) {
		console.error("Error deleting ingredient-vendor mapping:", error);
		throw error;
	}
}

/**
 * Get comprehensive vendor summary with ALL related data
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for validation
 * @returns {Promise<Object>} Vendor with addresses, contacts, payment info, items, documents, scorecards
 */
export async function getVendorSummary(vendorId, restaurantId) {
	try {
		// Get vendor details
		const { data: vendor, error: vendorError } = await supabase
			.from("vendors")
			.select("*")
			.eq("id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (vendorError) {
			if (vendorError.code === "PGRST116") {
				throw new Error("Vendor not found");
			}
			throw vendorError;
		}

		// Get addresses
		const { data: addresses, error: addressError } = await supabase
			.from("vendor_addresses")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.order("is_primary", { ascending: false });

		if (addressError) {
			console.warn("Error fetching addresses:", addressError);
		}

		// Get contacts
		const { data: contacts, error: contactError } = await supabase
			.from("vendor_contacts")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.order("is_primary", { ascending: false });

		if (contactError) {
			console.warn("Error fetching contacts:", contactError);
		}

		// Get payment info (with masked banking data)
		const { data: paymentInfo, error: paymentError } = await supabase
			.from("vendor_payment_info")
			.select(
				`
				*,
				payment_terms!vendor_payment_info_payment_terms_id_fkey(id, name, days, description)
			`
			)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.maybeSingle();

		if (paymentError) {
			console.warn("Error fetching payment info:", paymentError);
		}

		// Transform and mask payment info to match PaymentTab expectations
		let maskedPaymentInfo = null;
		if (paymentInfo) {
			maskedPaymentInfo = {
				id: paymentInfo.id,
				vendor_id: paymentInfo.vendor_id,
				restaurant_id: paymentInfo.restaurant_id,
				// Payment terms - transformed for display
				payment_terms_id: paymentInfo.payment_terms_id || null,
				payment_term: paymentInfo.payment_terms?.name || "N/A",
				payment_method: paymentInfo.preferred_payment_method || "N/A",
				credit_limit: paymentInfo.credit_limit || 0,
				current_balance: 0, // TODO: Calculate from purchase orders
				// Tax info
				tax_id_type: paymentInfo.tax_id ? "EIN" : "N/A",
				tax_id_number: paymentInfo.tax_id || "N/A",
				// Banking info - masked for security
				bank_name: paymentInfo.bank_name || "N/A",
				bank_account_type: "Checking",
				bank_routing_number: paymentInfo.routing_number
					? "*".repeat(Math.max(0, paymentInfo.routing_number.length - 4)) +
					  paymentInfo.routing_number.slice(-4)
					: "N/A",
				bank_account_number: paymentInfo.account_number
					? "*".repeat(Math.max(0, paymentInfo.account_number.length - 4)) +
					  paymentInfo.account_number.slice(-4)
					: "N/A",
				notes: paymentInfo.notes || null,
				created_at: paymentInfo.created_at,
				updated_at: paymentInfo.updated_at,
			};
		}

		// Get purchasing data
		const { data: purchasingData, error: purchasingError } = await supabase
			.from("vendor_purchasing_data")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.maybeSingle();

		if (purchasingError) {
			console.warn("Error fetching purchasing data:", purchasingError);
		}

		// Get ingredient mappings (vendor items)
		const { data: items, error: itemsError } = await supabase
			.from("ingredient_vendor_mapping")
			.select(
				`
				*,
				ingredient:ingredient_library(*)
			`
			)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId);

		if (itemsError) {
			console.warn("Error fetching items:", itemsError);
		}

		// Get documents
		const { data: documents, error: documentsError } = await supabase
			.from("vendor_documents")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.order("created_at", { ascending: false });

		if (documentsError) {
			console.warn("Error fetching documents:", documentsError);
		}

		// Get scorecards
		const { data: scorecards, error: scorecardsError } = await supabase
			.from("vendor_scorecards")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.order("calculation_date", { ascending: false });

		if (scorecardsError) {
			console.warn("Error fetching scorecards:", scorecardsError);
		}

		// Get purchasing stats (from purchase_orders if exists)
		// For now, return basic stats
		const stats = {
			total_items: items?.length || 0,
			active_items: items?.filter((i) => i.is_active !== false).length || 0,
			preferred_items: items?.filter((i) => i.is_preferred).length || 0,
			total_documents: documents?.length || 0,
			expired_documents:
				documents?.filter((d) => d.is_expired === true).length || 0,
			addresses_count: addresses?.length || 0,
			contacts_count: contacts?.length || 0,
		};

		return {
			...vendor,
			addresses: addresses || [],
			contacts: contacts || [],
			payment_info: maskedPaymentInfo,
			purchasing_data: purchasingData,
			items: items || [],
			documents: documents || [],
			scorecards: scorecards || [],
			stats,
		};
	} catch (error) {
		console.error("Error fetching vendor summary:", error);
		throw error;
	}
}

/**
 * Get vendor dashboard metrics for a restaurant
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<Object>} Object with 4 vendor metrics
 */
export async function getVendorMetrics(restaurantId) {
	try {
		// 1. Active Vendors Count
		const { count: activeVendorsCount, error: activeError } = await supabase
			.from("vendors")
			.select("*", { count: "exact", head: true })
			.eq("restaurant_id", restaurantId)
			.eq("is_active", true);

		if (activeError) {
			console.warn("Error counting active vendors:", activeError);
		}

		// 2. Average Lead Time Days
		const { data: purchasingData, error: purchasingError } = await supabase
			.from("vendor_purchasing_data")
			.select("lead_time_days")
			.eq("restaurant_id", restaurantId);

		if (purchasingError) {
			console.warn("Error fetching purchasing data:", purchasingError);
		}

		let avgLeadTimeDays = 0;
		if (purchasingData && purchasingData.length > 0) {
			const validLeadTimes = purchasingData
				.filter((d) => d.lead_time_days !== null)
				.map((d) => d.lead_time_days);

			if (validLeadTimes.length > 0) {
				avgLeadTimeDays = Math.round(
					validLeadTimes.reduce((a, b) => a + b, 0) / validLeadTimes.length
				);
			}
		}

		// 3. Top Vendor by Spend (from purchase_orders - placeholder for now)
		// TODO: Calculate from actual PO data when available
		const topVendorBySpend = "Not available yet";

		// 4. Expiring Documents Count (within 30 days)
		const today = new Date();
		const futureDate = new Date();
		futureDate.setDate(today.getDate() + 30);

		const { count: expiringDocumentsCount, error: expiringError } =
			await supabase
				.from("vendor_documents")
				.select("*", { count: "exact", head: true })
				.eq("restaurant_id", restaurantId)
				.not("expiration_date", "is", null)
				.gte("expiration_date", today.toISOString())
				.lte("expiration_date", futureDate.toISOString());

		if (expiringError) {
			console.warn("Error counting expiring documents:", expiringError);
		}

		return {
			activeVendorsCount: activeVendorsCount || 0,
			avgLeadTimeDays: avgLeadTimeDays,
			topVendorBySpend: topVendorBySpend,
			expiringDocumentsCount: expiringDocumentsCount || 0,
		};
	} catch (error) {
		console.error("Error fetching vendor metrics:", error);
		throw new Error(`Failed to fetch vendor metrics: ${error.message}`);
	}
}
