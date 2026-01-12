// /backend/src/services/paymentTerms.js

import { supabase } from "./supabase.js";

/**
 * Get all active payment terms (READ-ONLY platform-wide reference table)
 * @param {Object} filters - Optional filters (is_active)
 * @returns {Promise<Array>} Array of payment term objects
 */
export async function getPaymentTerms(filters = {}) {
	try {
		let query = supabase.from("payment_terms").select("*");

		// Apply filters
		if (filters.is_active !== undefined) {
			query = query.eq("is_active", filters.is_active);
		} else {
			// Default to only active terms
			query = query.eq("is_active", true);
		}

		// Order by days ascending (Net 15, Net 30, Net 45, etc.)
		query = query.order("days", { ascending: true });

		const { data, error } = await query;
		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching payment terms:", error);
		throw new Error(`Failed to fetch payment terms: ${error.message}`);
	}
}

/**
 * Get payment term by ID
 * @param {string} id - Payment term UUID
 * @returns {Promise<Object>} Payment term object
 */
export async function getPaymentTermById(id) {
	try {
		const { data, error } = await supabase
			.from("payment_terms")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new Error("Payment term not found");
			}
			throw error;
		}

		return data;
	} catch (error) {
		console.error("Error fetching payment term:", error);
		throw error;
	}
}
