// /backend/src/services/vendorContacts.js

import { supabase } from "./supabase.js";

/**
 * Get all contacts for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Array>} Array of vendor contact objects
 */
export async function getVendorContacts(vendorId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_contacts")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.order("is_primary", { ascending: false })
			.order("created_at", { ascending: true });

		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching vendor contacts:", error);
		throw new Error(`Failed to fetch vendor contacts: ${error.message}`);
	}
}

/**
 * Get specific vendor contact by ID
 * @param {string} contactId - Contact UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Vendor contact object
 */
export async function getVendorContact(contactId, vendorId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_contacts")
			.select("*")
			.eq("id", contactId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new Error("Vendor contact not found");
			}
			throw error;
		}

		return data;
	} catch (error) {
		console.error("Error fetching vendor contact:", error);
		throw error;
	}
}

/**
 * Get primary contact for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object|null>} Primary vendor contact or null
 */
export async function getPrimaryContact(vendorId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_contacts")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.eq("is_primary", true)
			.maybeSingle();

		if (error) throw error;

		return data;
	} catch (error) {
		console.error("Error fetching primary contact:", error);
		throw new Error(`Failed to fetch primary contact: ${error.message}`);
	}
}

/**
 * Create a new vendor contact
 * @param {Object} data - Contact data
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Created contact object
 */
export async function createVendorContact(data, vendorId, restaurantId) {
	try {
		const {
			first_name,
			last_name,
			title,
			role,
			email,
			phone,
			mobile,
			is_primary = false,
			receive_orders = false,
			receive_invoices = false,
		} = data;

		// Validation
		if (!first_name || first_name.trim().length === 0) {
			throw new Error("First name is required");
		}

		if (!last_name || last_name.trim().length === 0) {
			throw new Error("Last name is required");
		}

		// Validate email format if provided
		if (email && email.trim().length > 0) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				throw new Error("Invalid email format");
			}
		}

		// Validate role if provided
		if (role) {
			const validRoles = [
				"Sales Rep",
				"Account Manager",
				"Billing Contact",
				"Customer Service",
				"Delivery Coordinator",
				"Other",
			];
			if (!validRoles.includes(role)) {
				throw new Error(
					`Invalid role. Must be one of: ${validRoles.join(", ")}`
				);
			}
		}

		// If is_primary is true, unset existing primary
		if (is_primary) {
			const { error: unsetError } = await supabase
				.from("vendor_contacts")
				.update({ is_primary: false })
				.eq("vendor_id", vendorId)
				.eq("restaurant_id", restaurantId)
				.eq("is_primary", true);

			if (unsetError) {
				console.warn("Error unsetting existing primary contact:", unsetError);
			}
		}

		// Create contact
		const { data: newContact, error } = await supabase
			.from("vendor_contacts")
			.insert({
				vendor_id: vendorId,
				restaurant_id: restaurantId,
				first_name: first_name.trim(),
				last_name: last_name.trim(),
				title: title?.trim() || null,
				role: role || null,
				email: email?.trim() || null,
				phone: phone?.trim() || null,
				mobile: mobile?.trim() || null,
				is_primary,
				receive_orders,
				receive_invoices,
			})
			.select()
			.single();

		if (error) throw error;

		console.log(
			`✅ Created vendor contact: ${newContact.first_name} ${newContact.last_name} for vendor ${vendorId}`
		);
		return newContact;
	} catch (error) {
		console.error("Error creating vendor contact:", error);
		throw error;
	}
}

/**
 * Update vendor contact
 * @param {string} contactId - Contact UUID
 * @param {Object} updates - Fields to update
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Updated contact object
 */
export async function updateVendorContact(
	contactId,
	updates,
	vendorId,
	restaurantId
) {
	try {
		// Verify contact exists and belongs to vendor/restaurant
		const { data: existing, error: checkError } = await supabase
			.from("vendor_contacts")
			.select("*")
			.eq("id", contactId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor contact not found");
			}
			throw checkError;
		}

		// Validate first_name if being updated
		if (updates.first_name !== undefined) {
			if (!updates.first_name || updates.first_name.trim().length === 0) {
				throw new Error("First name cannot be empty");
			}
		}

		// Validate last_name if being updated
		if (updates.last_name !== undefined) {
			if (!updates.last_name || updates.last_name.trim().length === 0) {
				throw new Error("Last name cannot be empty");
			}
		}

		// Validate email if provided
		if (updates.email && updates.email.trim().length > 0) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(updates.email)) {
				throw new Error("Invalid email format");
			}
		}

		// Validate role if provided
		if (updates.role) {
			const validRoles = [
				"Sales Rep",
				"Account Manager",
				"Billing Contact",
				"Customer Service",
				"Delivery Coordinator",
				"Other",
			];
			if (!validRoles.includes(updates.role)) {
				throw new Error(
					`Invalid role. Must be one of: ${validRoles.join(", ")}`
				);
			}
		}

		// If is_primary is being set to true, unset existing primary
		if (updates.is_primary === true && !existing.is_primary) {
			const { error: unsetError } = await supabase
				.from("vendor_contacts")
				.update({ is_primary: false })
				.eq("vendor_id", vendorId)
				.eq("restaurant_id", restaurantId)
				.eq("is_primary", true)
				.neq("id", contactId);

			if (unsetError) {
				console.warn("Error unsetting existing primary contact:", unsetError);
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
			.from("vendor_contacts")
			.update(updateData)
			.eq("id", contactId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Updated vendor contact: ${contactId}`);
		return data;
	} catch (error) {
		console.error("Error updating vendor contact:", error);
		throw error;
	}
}

/**
 * Delete vendor contact
 * @param {string} contactId - Contact UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Success message
 */
export async function deleteVendorContact(contactId, vendorId, restaurantId) {
	try {
		// Verify contact exists
		const { data: contact, error: checkError } = await supabase
			.from("vendor_contacts")
			.select("*")
			.eq("id", contactId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor contact not found");
			}
			throw checkError;
		}

		// Delete contact
		const { error } = await supabase
			.from("vendor_contacts")
			.delete()
			.eq("id", contactId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId);

		if (error) throw error;

		console.log(`✅ Deleted vendor contact: ${contactId}`);
		return { message: "Vendor contact deleted successfully" };
	} catch (error) {
		console.error("Error deleting vendor contact:", error);
		throw error;
	}
}

/**
 * Set contact as primary (unsets other primary contacts)
 * @param {string} contactId - Contact UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Updated contact object
 */
export async function setPrimaryContact(contactId, vendorId, restaurantId) {
	try {
		// Verify contact exists
		const { data: contact, error: checkError } = await supabase
			.from("vendor_contacts")
			.select("*")
			.eq("id", contactId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor contact not found");
			}
			throw checkError;
		}

		// Unset existing primary
		const { error: unsetError } = await supabase
			.from("vendor_contacts")
			.update({ is_primary: false })
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.eq("is_primary", true)
			.neq("id", contactId);

		if (unsetError) {
			console.warn("Error unsetting existing primary contact:", unsetError);
		}

		// Set new primary
		const { data, error } = await supabase
			.from("vendor_contacts")
			.update({
				is_primary: true,
				updated_at: new Date().toISOString(),
			})
			.eq("id", contactId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Set primary contact: ${contactId}`);
		return data;
	} catch (error) {
		console.error("Error setting primary contact:", error);
		throw error;
	}
}
