// /backend/src/services/vendorAPPayments.js

import { supabase } from "./supabase.js";

/**
 * Get all AP payments for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @param {Object} filters - Optional filters (date range, etc.)
 * @returns {Promise<Array>} Array of payment objects
 */
export async function getVendorPayments(vendorId, restaurantId, filters = {}) {
	try {
		let query = supabase
			.from("vendor_payments")
			.select(`
				*,
				vendor:vendors(id, name, vendor_code),
				invoice:vendor_invoices(id, invoice_number, amount, balance, status)
			`)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId);

		// Apply date range filters
		if (filters.from_date) {
			query = query.gte("payment_date", filters.from_date);
		}
		if (filters.to_date) {
			query = query.lte("payment_date", filters.to_date);
		}

		// Apply payment method filter
		if (filters.payment_method) {
			query = query.eq("payment_method", filters.payment_method);
		}

		// Order by payment date (most recent first)
		query = query.order("payment_date", { ascending: false })
			.order("created_at", { ascending: false });

		const { data, error } = await query;
		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching vendor payments:", error);
		throw new Error(`Failed to fetch vendor payments: ${error.message}`);
	}
}

/**
 * Get a single payment by ID
 * @param {string} paymentId - Payment UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Payment object
 */
export async function getVendorPaymentById(paymentId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_payments")
			.select(`
				*,
				vendor:vendors(id, name, vendor_code),
				invoice:vendor_invoices(id, invoice_number, amount, balance, status, due_date)
			`)
			.eq("id", paymentId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new Error("Payment not found");
			}
			throw error;
		}

		return data;
	} catch (error) {
		console.error("Error fetching payment:", error);
		throw error;
	}
}

/**
 * Create a new vendor payment
 * @param {string} vendorId - Vendor UUID
 * @param {Object} paymentData - Payment data
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @param {string} userId - User ID for audit trail
 * @returns {Promise<Object>} Created payment object
 */
export async function createVendorPayment(vendorId, paymentData, restaurantId, userId) {
	try {
		const {
			payment_date,
			amount,
			payment_method = "Check",
			reference_number,
			invoice_id,
			currency = "USD",
			notes,
		} = paymentData;

		// Validation
		if (!amount || parseFloat(amount) <= 0) {
			throw new Error("Payment amount must be greater than zero");
		}

		// Validate payment method
		const validMethods = ["ACH", "Wire", "Check", "Credit Card", "Cash", "PayPal", "Other"];
		if (!validMethods.includes(payment_method)) {
			throw new Error(`Invalid payment method. Must be one of: ${validMethods.join(", ")}`);
		}

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

		// Determine which invoice to apply payment to
		let targetInvoiceId = invoice_id;

		// If no invoice specified, auto-apply to oldest outstanding invoice
		if (!targetInvoiceId) {
			const { data: oldestInvoice, error: oldestError } = await supabase
				.from("vendor_invoices")
				.select("id, invoice_number, balance")
				.eq("vendor_id", vendorId)
				.eq("restaurant_id", restaurantId)
				.in("status", ["pending", "partial", "overdue"])
				.gt("balance", 0)
				.order("due_date", { ascending: true })
				.limit(1)
				.maybeSingle();

			if (oldestError) throw oldestError;

			if (oldestInvoice) {
				targetInvoiceId = oldestInvoice.id;
				console.log(`Auto-applying payment to oldest invoice: ${oldestInvoice.invoice_number}`);
			}
		}

		// Verify invoice if we have one (either provided or auto-selected)
		if (targetInvoiceId) {
			const { data: invoice, error: invoiceError } = await supabase
				.from("vendor_invoices")
				.select("id, invoice_number, vendor_id, amount, balance, status")
				.eq("id", targetInvoiceId)
				.eq("restaurant_id", restaurantId)
				.single();

			if (invoiceError) {
				if (invoiceError.code === "PGRST116") {
					throw new Error("Invoice not found");
				}
				throw invoiceError;
			}

			// Verify invoice belongs to the same vendor
			if (invoice.vendor_id !== vendorId) {
				throw new Error("Invoice does not belong to this vendor");
			}

			// Check if invoice is in a valid status for payment
			if (invoice.status === "cancelled") {
				throw new Error("Cannot apply payment to a cancelled invoice");
			}

			if (invoice.status === "paid") {
				throw new Error("Invoice is already fully paid");
			}

			// Warn if payment exceeds balance (but allow it)
			if (parseFloat(amount) > invoice.balance) {
				console.warn(`Payment of ${amount} exceeds invoice balance of ${invoice.balance}`);
			}
		}

		// Create payment
		const { data, error } = await supabase
			.from("vendor_payments")
			.insert({
				vendor_id: vendorId,
				restaurant_id: restaurantId,
				payment_date: payment_date || new Date().toISOString().split("T")[0],
				amount: parseFloat(amount),
				payment_method: payment_method,
				reference_number: reference_number?.trim() || null,
				invoice_id: targetInvoiceId || null,
				currency: currency,
				notes: notes?.trim() || null,
				created_by: userId,
			})
			.select(`
				*,
				vendor:vendors(id, name, vendor_code),
				invoice:vendor_invoices(id, invoice_number, amount, balance, status)
			`)
			.single();

		if (error) throw error;

		console.log(`Created payment of ${data.amount} for vendor ${vendor.name} (ID: ${data.id})`);
		return data;
	} catch (error) {
		console.error("Error creating vendor payment:", error);
		throw error;
	}
}

/**
 * Void (delete) a vendor payment
 * Note: The database trigger will automatically update the invoice amount_paid and status
 * @param {string} paymentId - Payment UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Success message
 */
export async function voidVendorPayment(paymentId, restaurantId) {
	try {
		// Verify payment exists and belongs to restaurant
		const { data: payment, error: checkError } = await supabase
			.from("vendor_payments")
			.select("id, amount, invoice_id, payment_date, reference_number")
			.eq("id", paymentId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Payment not found");
			}
			throw checkError;
		}

		// Delete the payment (trigger will update invoice)
		const { error } = await supabase
			.from("vendor_payments")
			.delete()
			.eq("id", paymentId)
			.eq("restaurant_id", restaurantId);

		if (error) throw error;

		console.log(`Voided payment of ${payment.amount} (ID: ${paymentId})`);
		return {
			message: "Payment voided successfully",
			voided_payment: {
				id: paymentId,
				amount: payment.amount,
				invoice_id: payment.invoice_id,
			},
		};
	} catch (error) {
		console.error("Error voiding vendor payment:", error);
		throw error;
	}
}

/**
 * Get all payments for a restaurant (across all vendors)
 * @param {string} restaurantId - Restaurant UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of payment objects
 */
export async function getAllRestaurantPayments(restaurantId, filters = {}) {
	try {
		let query = supabase
			.from("vendor_payments")
			.select(`
				*,
				vendor:vendors(id, name, vendor_code),
				invoice:vendor_invoices(id, invoice_number)
			`)
			.eq("restaurant_id", restaurantId);

		// Apply date range filters
		if (filters.from_date) {
			query = query.gte("payment_date", filters.from_date);
		}
		if (filters.to_date) {
			query = query.lte("payment_date", filters.to_date);
		}

		// Apply payment method filter
		if (filters.payment_method) {
			query = query.eq("payment_method", filters.payment_method);
		}

		// Order by payment date (most recent first)
		query = query.order("payment_date", { ascending: false });

		const { data, error } = await query;
		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching restaurant payments:", error);
		throw new Error(`Failed to fetch payments: ${error.message}`);
	}
}

/**
 * Get payments summary for a date range
 * @param {string} restaurantId - Restaurant UUID
 * @param {string} fromDate - Start date
 * @param {string} toDate - End date
 * @returns {Promise<Object>} Summary of payments
 */
export async function getPaymentsSummary(restaurantId, fromDate, toDate) {
	try {
		const { data, error } = await supabase
			.from("vendor_payments")
			.select("amount, payment_method")
			.eq("restaurant_id", restaurantId)
			.gte("payment_date", fromDate)
			.lte("payment_date", toDate);

		if (error) throw error;

		// Calculate summary
		const summary = {
			total_amount: 0,
			payment_count: data?.length || 0,
			by_method: {},
		};

		(data || []).forEach(payment => {
			summary.total_amount += parseFloat(payment.amount);
			const method = payment.payment_method;
			if (!summary.by_method[method]) {
				summary.by_method[method] = { count: 0, amount: 0 };
			}
			summary.by_method[method].count++;
			summary.by_method[method].amount += parseFloat(payment.amount);
		});

		return summary;
	} catch (error) {
		console.error("Error fetching payments summary:", error);
		throw new Error(`Failed to fetch payments summary: ${error.message}`);
	}
}
