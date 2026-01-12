// /backend/src/services/vendorAddresses.js

import { supabase } from "./supabase.js";

/**
 * Get all addresses for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Array>} Array of vendor address objects
 */
export async function getVendorAddresses(vendorId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_addresses")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.order("is_primary", { ascending: false })
			.order("created_at", { ascending: true });

		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching vendor addresses:", error);
		throw new Error(`Failed to fetch vendor addresses: ${error.message}`);
	}
}

/**
 * Get specific vendor address by ID
 * @param {string} addressId - Address UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Vendor address object
 */
export async function getVendorAddress(addressId, vendorId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_addresses")
			.select("*")
			.eq("id", addressId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new Error("Vendor address not found");
			}
			throw error;
		}

		return data;
	} catch (error) {
		console.error("Error fetching vendor address:", error);
		throw error;
	}
}

/**
 * Get primary address for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object|null>} Primary vendor address or null
 */
export async function getPrimaryAddress(vendorId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_addresses")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.eq("is_primary", true)
			.maybeSingle();

		if (error) throw error;

		return data;
	} catch (error) {
		console.error("Error fetching primary address:", error);
		throw new Error(`Failed to fetch primary address: ${error.message}`);
	}
}

/**
 * Create a new vendor address
 * @param {Object} data - Address data
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Created address object
 */
export async function createVendorAddress(data, vendorId, restaurantId) {
	try {
		const {
			address_type,
			is_primary = false,
			address_line1,
			address_line2,
			city,
			state,
			postal_code,
			country = "USA",
			phone,
			email,
			website,
		} = data;

		// Validation
		if (!address_type) {
			throw new Error("Address type is required");
		}

		const validTypes = [
			"billing",
			"remittance",
			"ship_from",
			"warehouse",
			"primary",
			"other",
		];
		if (!validTypes.includes(address_type)) {
			throw new Error(`Invalid address type. Must be one of: ${validTypes.join(", ")}`);
		}

		if (!address_line1 || address_line1.trim().length === 0) {
			throw new Error("Address line 1 is required");
		}

		if (!city || city.trim().length === 0) {
			throw new Error("City is required");
		}

		if (!state || state.trim().length === 0) {
			throw new Error("State is required");
		}

		if (!postal_code || postal_code.trim().length === 0) {
			throw new Error("Postal code is required");
		}

		// Validate email format if provided
		if (email && email.trim().length > 0) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				throw new Error("Invalid email format");
			}
		}

		// Check for duplicate address_type (except 'warehouse' and 'other')
		if (!["warehouse", "other"].includes(address_type)) {
			const { data: existing, error: duplicateError } = await supabase
				.from("vendor_addresses")
				.select("id")
				.eq("vendor_id", vendorId)
				.eq("restaurant_id", restaurantId)
				.eq("address_type", address_type)
				.maybeSingle();

			if (duplicateError) throw duplicateError;
			if (existing) {
				throw new Error(
					`An address with type '${address_type}' already exists for this vendor`
				);
			}
		}

		// If is_primary is true, unset existing primary
		if (is_primary) {
			const { error: unsetError } = await supabase
				.from("vendor_addresses")
				.update({ is_primary: false })
				.eq("vendor_id", vendorId)
				.eq("restaurant_id", restaurantId)
				.eq("is_primary", true);

			if (unsetError) {
				console.warn("Error unsetting existing primary address:", unsetError);
			}
		}

		// Create address
		const { data: newAddress, error } = await supabase
			.from("vendor_addresses")
			.insert({
				vendor_id: vendorId,
				restaurant_id: restaurantId,
				address_type,
				is_primary,
				address_line1: address_line1.trim(),
				address_line2: address_line2?.trim() || null,
				city: city.trim(),
				state: state.trim(),
				postal_code: postal_code.trim(),
				country: country.trim(),
				phone: phone?.trim() || null,
				email: email?.trim() || null,
				website: website?.trim() || null,
			})
			.select()
			.single();

		if (error) throw error;

		console.log(
			`✅ Created vendor address: ${address_type} for vendor ${vendorId}`
		);
		return newAddress;
	} catch (error) {
		console.error("Error creating vendor address:", error);
		throw error;
	}
}

/**
 * Update vendor address
 * @param {string} addressId - Address UUID
 * @param {Object} updates - Fields to update
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Updated address object
 */
export async function updateVendorAddress(
	addressId,
	updates,
	vendorId,
	restaurantId
) {
	try {
		// Verify address exists and belongs to vendor/restaurant
		const { data: existing, error: checkError } = await supabase
			.from("vendor_addresses")
			.select("*")
			.eq("id", addressId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor address not found");
			}
			throw checkError;
		}

		// Validate address_type if being updated
		if (updates.address_type) {
			const validTypes = [
				"billing",
				"remittance",
				"ship_from",
				"warehouse",
				"primary",
				"other",
			];
			if (!validTypes.includes(updates.address_type)) {
				throw new Error(
					`Invalid address type. Must be one of: ${validTypes.join(", ")}`
				);
			}

			// Check for duplicate address_type (except warehouse and other)
			if (
				!["warehouse", "other"].includes(updates.address_type) &&
				updates.address_type !== existing.address_type
			) {
				const { data: duplicate, error: dupError } = await supabase
					.from("vendor_addresses")
					.select("id")
					.eq("vendor_id", vendorId)
					.eq("restaurant_id", restaurantId)
					.eq("address_type", updates.address_type)
					.neq("id", addressId)
					.maybeSingle();

				if (dupError) throw dupError;
				if (duplicate) {
					throw new Error(
						`An address with type '${updates.address_type}' already exists`
					);
				}
			}
		}

		// Validate email if provided
		if (updates.email && updates.email.trim().length > 0) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(updates.email)) {
				throw new Error("Invalid email format");
			}
		}

		// If is_primary is being set to true, unset existing primary
		if (updates.is_primary === true && !existing.is_primary) {
			const { error: unsetError } = await supabase
				.from("vendor_addresses")
				.update({ is_primary: false })
				.eq("vendor_id", vendorId)
				.eq("restaurant_id", restaurantId)
				.eq("is_primary", true)
				.neq("id", addressId);

			if (unsetError) {
				console.warn("Error unsetting existing primary address:", unsetError);
			}
		}

		// Prevent changing vendor_id or restaurant_id
		delete updates.vendor_id;
		delete updates.restaurant_id;
		delete updates.created_at;

		// Prepare update data with trimmed strings
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
			.from("vendor_addresses")
			.update(updateData)
			.eq("id", addressId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Updated vendor address: ${addressId}`);
		return data;
	} catch (error) {
		console.error("Error updating vendor address:", error);
		throw error;
	}
}

/**
 * Delete vendor address
 * @param {string} addressId - Address UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Success message
 */
export async function deleteVendorAddress(addressId, vendorId, restaurantId) {
	try {
		// Verify address exists
		const { data: address, error: checkError } = await supabase
			.from("vendor_addresses")
			.select("*")
			.eq("id", addressId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor address not found");
			}
			throw checkError;
		}

		// Delete address
		const { error } = await supabase
			.from("vendor_addresses")
			.delete()
			.eq("id", addressId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId);

		if (error) throw error;

		console.log(`✅ Deleted vendor address: ${addressId}`);
		return { message: "Vendor address deleted successfully" };
	} catch (error) {
		console.error("Error deleting vendor address:", error);
		throw error;
	}
}

/**
 * Set address as primary (unsets other primary addresses)
 * @param {string} addressId - Address UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Updated address object
 */
export async function setPrimaryAddress(addressId, vendorId, restaurantId) {
	try {
		// Verify address exists
		const { data: address, error: checkError } = await supabase
			.from("vendor_addresses")
			.select("*")
			.eq("id", addressId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor address not found");
			}
			throw checkError;
		}

		// Unset existing primary
		const { error: unsetError } = await supabase
			.from("vendor_addresses")
			.update({ is_primary: false })
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.eq("is_primary", true)
			.neq("id", addressId);

		if (unsetError) {
			console.warn("Error unsetting existing primary address:", unsetError);
		}

		// Set new primary
		const { data, error } = await supabase
			.from("vendor_addresses")
			.update({
				is_primary: true,
				updated_at: new Date().toISOString(),
			})
			.eq("id", addressId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Set primary address: ${addressId}`);
		return data;
	} catch (error) {
		console.error("Error setting primary address:", error);
		throw error;
	}
}
