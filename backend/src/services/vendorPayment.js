// /backend/src/services/vendorPayment.js

import { supabase } from "./supabase.js";

/**
 * Mask account number for display (show last 4 digits only)
 * @param {string} accountNumber - Full account number
 * @returns {string} Masked account number
 */
export function maskAccountNumber(accountNumber) {
	if (!accountNumber || accountNumber.length < 4) return "****";
	return "*".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}

/**
 * Mask routing number for display (show last 4 digits only)
 * @param {string} routingNumber - Full routing number
 * @returns {string} Masked routing number
 */
export function maskRoutingNumber(routingNumber) {
	if (!routingNumber || routingNumber.length < 4) return "****";
	return "*".repeat(routingNumber.length - 4) + routingNumber.slice(-4);
}

/**
 * Get vendor payment info (1:1 relationship with vendor)
 * CRITICAL: Banking data is masked for security
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object|null>} Vendor payment info with masked banking data, or null
 */
export async function getVendorPaymentInfo(vendorId, restaurantId) {
	try {
		const { data, error } = await supabase
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

		if (error) throw error;

		// Return null if no payment info exists
		if (!data) return null;

		// Debug: Log the raw data to see what's being returned
		console.log('📋 Payment info raw data:', JSON.stringify(data, null, 2));

		// Transform data to match frontend expectations
		// Frontend expects field names from the PaymentTab component
		return {
			id: data.id,
			vendor_id: data.vendor_id,
			restaurant_id: data.restaurant_id,
			// Payment terms
			payment_terms_id: data.payment_terms_id || null, // Include ID for editing
			payment_term: data.payment_terms?.name || "N/A",
			payment_method: data.preferred_payment_method || "N/A",
			credit_limit: data.credit_limit || 0,
			current_balance: 0, // TODO: Calculate from purchase orders
			// Tax info - split tax_id into type and number
			tax_id_type: data.tax_id ? (data.tax_id.includes("-") ? "EIN" : "Other") : "N/A",
			tax_id_number: data.tax_id || "N/A",
			// Banking info - masked for security
			bank_name: data.bank_name || "N/A",
			bank_account_type: "Checking", // Default - TODO: Add to schema if needed
			bank_routing_number: data.routing_number
				? maskRoutingNumber(data.routing_number)
				: "N/A",
			bank_account_number: data.account_number
				? maskAccountNumber(data.account_number)
				: "N/A",
			remittance_email: "N/A", // TODO: Add to schema or get from vendor contacts
			notes: data.notes || null,
			created_at: data.created_at,
			updated_at: data.updated_at,
		};
	} catch (error) {
		console.error("Error fetching vendor payment info:", error);
		throw new Error(`Failed to fetch vendor payment info: ${error.message}`);
	}
}

/**
 * Create vendor payment info
 * @param {Object} data - Payment info data
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Created payment info (with masked banking data)
 */
export async function createVendorPaymentInfo(data, vendorId, restaurantId) {
	try {
		const {
			tax_id,
			credit_limit,
			payment_terms_id,
			bank_name,
			account_number,
			routing_number,
			swift_code,
			iban,
			preferred_payment_method,
			default_currency = "USD",
		} = data;

		// Validate payment_terms_id if provided
		if (payment_terms_id) {
			const { data: paymentTerm, error: termError } = await supabase
				.from("payment_terms")
				.select("id")
				.eq("id", payment_terms_id)
				.single();

			if (termError) {
				if (termError.code === "PGRST116") {
					throw new Error("Invalid payment terms ID");
				}
				throw termError;
			}
		}

		// Validate credit_limit if provided
		if (credit_limit !== undefined && credit_limit !== null) {
			const limit = parseFloat(credit_limit);
			if (isNaN(limit) || limit < 0) {
				throw new Error("Credit limit must be a positive number");
			}
		}

		// Validate preferred_payment_method if provided
		if (preferred_payment_method) {
			const validMethods = ["ACH", "Wire", "Check", "Credit Card", "Other"];
			if (!validMethods.includes(preferred_payment_method)) {
				throw new Error(
					`Invalid payment method. Must be one of: ${validMethods.join(", ")}`
				);
			}
		}

		// Check if payment info already exists for this vendor (1:1 relationship)
		const { data: existing, error: existError } = await supabase
			.from("vendor_payment_info")
			.select("id")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.maybeSingle();

		if (existError) throw existError;
		if (existing) {
			throw new Error("Payment info already exists for this vendor");
		}

		// Create payment info
		// NOTE: Banking data stored as-is, relying on Supabase database-level encryption
		const { data: newPaymentInfo, error } = await supabase
			.from("vendor_payment_info")
			.insert({
				vendor_id: vendorId,
				restaurant_id: restaurantId,
				tax_id: tax_id?.trim() || null,
				credit_limit: credit_limit !== undefined ? parseFloat(credit_limit) : null,
				payment_terms_id: payment_terms_id || null,
				bank_name: bank_name?.trim() || null,
				account_number: account_number?.trim() || null,
				routing_number: routing_number?.trim() || null,
				swift_code: swift_code?.trim() || null,
				iban: iban?.trim() || null,
				preferred_payment_method: preferred_payment_method || null,
				default_currency: default_currency,
			})
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Created vendor payment info for vendor ${vendorId}`);

		// Return with masked banking data
		return {
			...newPaymentInfo,
			account_number: newPaymentInfo.account_number
				? maskAccountNumber(newPaymentInfo.account_number)
				: null,
			routing_number: newPaymentInfo.routing_number
				? maskRoutingNumber(newPaymentInfo.routing_number)
				: null,
		};
	} catch (error) {
		console.error("Error creating vendor payment info:", error);
		throw error;
	}
}

/**
 * Update vendor payment info
 * @param {string} vendorId - Vendor UUID
 * @param {Object} updates - Fields to update
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Updated payment info (with masked banking data)
 */
export async function updateVendorPaymentInfo(vendorId, updates, restaurantId) {
	try {
		// Verify payment info exists
		const { data: existing, error: checkError } = await supabase
			.from("vendor_payment_info")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor payment info not found");
			}
			throw checkError;
		}

		// Validate payment_terms_id if being updated
		if (updates.payment_terms_id) {
			const { data: paymentTerm, error: termError } = await supabase
				.from("payment_terms")
				.select("id")
				.eq("id", updates.payment_terms_id)
				.single();

			if (termError) {
				if (termError.code === "PGRST116") {
					throw new Error("Invalid payment terms ID");
				}
				throw termError;
			}
		}

		// Validate credit_limit if being updated
		if (updates.credit_limit !== undefined && updates.credit_limit !== null) {
			const limit = parseFloat(updates.credit_limit);
			if (isNaN(limit) || limit < 0) {
				throw new Error("Credit limit must be a positive number");
			}
		}

		// Validate preferred_payment_method if being updated
		if (updates.preferred_payment_method) {
			const validMethods = ["ACH", "Wire", "Check", "Credit Card", "Other"];
			if (!validMethods.includes(updates.preferred_payment_method)) {
				throw new Error(
					`Invalid payment method. Must be one of: ${validMethods.join(", ")}`
				);
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
				if (typeof updates[key] === "string") {
					updateData[key] = updates[key].trim();
				} else {
					updateData[key] = updates[key];
				}
			}
		});

		updateData.updated_at = new Date().toISOString();

		// Perform update
		const { data, error } = await supabase
			.from("vendor_payment_info")
			.update(updateData)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Updated vendor payment info for vendor ${vendorId}`);

		// Return with masked banking data
		return {
			...data,
			account_number: data.account_number
				? maskAccountNumber(data.account_number)
				: null,
			routing_number: data.routing_number
				? maskRoutingNumber(data.routing_number)
				: null,
		};
	} catch (error) {
		console.error("Error updating vendor payment info:", error);
		throw error;
	}
}

/**
 * Delete vendor payment info
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Success message
 */
export async function deleteVendorPaymentInfo(vendorId, restaurantId) {
	try {
		// Verify payment info exists
		const { data: paymentInfo, error: checkError } = await supabase
			.from("vendor_payment_info")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor payment info not found");
			}
			throw checkError;
		}

		// Delete payment info
		const { error } = await supabase
			.from("vendor_payment_info")
			.delete()
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId);

		if (error) throw error;

		console.log(`✅ Deleted vendor payment info for vendor ${vendorId}`);
		return { message: "Vendor payment info deleted successfully" };
	} catch (error) {
		console.error("Error deleting vendor payment info:", error);
		throw error;
	}
}
