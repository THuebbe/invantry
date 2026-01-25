// /backend/src/services/vendorInvoices.js

import { supabase } from "./supabase.js";

/**
 * Get all invoices for a vendor with optional filtering
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @param {Object} filters - Optional filters (status, date range, etc.)
 * @returns {Promise<Array>} Array of invoice objects
 */
export async function getVendorInvoices(vendorId, restaurantId, filters = {}) {
	try {
		let query = supabase
			.from("vendor_invoices")
			.select(`
				*,
				vendor:vendors(id, name, vendor_code),
				purchase_order:purchase_orders(id, order_number)
			`)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.neq("status", "cancelled"); // Exclude soft-deleted invoices by default

		// Apply status filter
		if (filters.status) {
			if (filters.status === "cancelled") {
				// If explicitly requesting cancelled, override the default exclusion
				query = supabase
					.from("vendor_invoices")
					.select(`
						*,
						vendor:vendors(id, name, vendor_code),
						purchase_order:purchase_orders(id, order_number)
					`)
					.eq("vendor_id", vendorId)
					.eq("restaurant_id", restaurantId)
					.eq("status", "cancelled");
			} else if (filters.status === "all") {
				// If requesting all, remove the cancelled exclusion
				query = supabase
					.from("vendor_invoices")
					.select(`
						*,
						vendor:vendors(id, name, vendor_code),
						purchase_order:purchase_orders(id, order_number)
					`)
					.eq("vendor_id", vendorId)
					.eq("restaurant_id", restaurantId);
			} else if (filters.status === "outstanding") {
				// Outstanding = pending, partial, or overdue (not paid, not cancelled)
				query = query.in("status", ["pending", "partial", "overdue"]);
			} else {
				query = query.eq("status", filters.status);
			}
		}

		// Apply date range filters
		if (filters.from_date) {
			query = query.gte("invoice_date", filters.from_date);
		}
		if (filters.to_date) {
			query = query.lte("invoice_date", filters.to_date);
		}

		// Apply due date filters
		if (filters.due_from) {
			query = query.gte("due_date", filters.due_from);
		}
		if (filters.due_to) {
			query = query.lte("due_date", filters.due_to);
		}

		// Order by due date (most urgent first), then by invoice date
		query = query.order("due_date", { ascending: true })
			.order("invoice_date", { ascending: false });

		const { data, error } = await query;
		if (error) throw error;

		// Add aging bucket calculation to each invoice
		const today = new Date();
		const enrichedData = (data || []).map(invoice => {
			const dueDate = new Date(invoice.due_date);
			const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

			let agingBucket = "current";
			if (invoice.status === "paid") {
				agingBucket = "paid";
			} else if (daysDiff > 90) {
				agingBucket = "over90";
			} else if (daysDiff > 60) {
				agingBucket = "61-90";
			} else if (daysDiff > 30) {
				agingBucket = "31-60";
			} else if (daysDiff > 0) {
				agingBucket = "1-30";
			}

			return {
				...invoice,
				aging_bucket: agingBucket,
				days_overdue: daysDiff > 0 ? daysDiff : 0,
			};
		});

		return enrichedData;
	} catch (error) {
		console.error("Error fetching vendor invoices:", error);
		throw new Error(`Failed to fetch vendor invoices: ${error.message}`);
	}
}

/**
 * Get a single invoice by ID
 * @param {string} invoiceId - Invoice UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Invoice object with payments
 */
export async function getVendorInvoiceById(invoiceId, restaurantId) {
	try {
		// Get invoice with vendor and PO info
		const { data: invoice, error } = await supabase
			.from("vendor_invoices")
			.select(`
				*,
				vendor:vendors(id, name, vendor_code, email, phone),
				purchase_order:purchase_orders(id, order_number, created_at)
			`)
			.eq("id", invoiceId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new Error("Invoice not found");
			}
			throw error;
		}

		// Get associated payments
		const { data: payments, error: paymentsError } = await supabase
			.from("vendor_payments")
			.select("*")
			.eq("invoice_id", invoiceId)
			.eq("restaurant_id", restaurantId)
			.order("payment_date", { ascending: false });

		if (paymentsError) {
			console.warn("Error fetching invoice payments:", paymentsError);
		}

		// Calculate aging info
		const today = new Date();
		const dueDate = new Date(invoice.due_date);
		const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

		let agingBucket = "current";
		if (invoice.status === "paid") {
			agingBucket = "paid";
		} else if (daysDiff > 90) {
			agingBucket = "over90";
		} else if (daysDiff > 60) {
			agingBucket = "61-90";
		} else if (daysDiff > 30) {
			agingBucket = "31-60";
		} else if (daysDiff > 0) {
			agingBucket = "1-30";
		}

		return {
			...invoice,
			payments: payments || [],
			aging_bucket: agingBucket,
			days_overdue: daysDiff > 0 ? daysDiff : 0,
		};
	} catch (error) {
		console.error("Error fetching invoice:", error);
		throw error;
	}
}

/**
 * Create a new vendor invoice
 * @param {string} vendorId - Vendor UUID
 * @param {Object} invoiceData - Invoice data
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @param {string} userId - User ID for audit trail
 * @returns {Promise<Object>} Created invoice object
 */
export async function createVendorInvoice(vendorId, invoiceData, restaurantId, userId) {
	try {
		const {
			invoice_number,
			invoice_date,
			due_date,
			received_date,
			amount,
			purchase_order_id,
			currency = "USD",
			notes,
		} = invoiceData;

		// Validation
		if (!invoice_number || invoice_number.trim().length === 0) {
			throw new Error("Invoice number is required");
		}

		if (!invoice_date) {
			throw new Error("Invoice date is required");
		}

		if (!due_date) {
			throw new Error("Due date is required");
		}

		if (!amount || parseFloat(amount) <= 0) {
			throw new Error("Invoice amount must be greater than zero");
		}

		// Validate invoice number length
		if (invoice_number.trim().length > 100) {
			throw new Error("Invoice number must be 100 characters or less");
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

		if (!vendor.is_active) {
			throw new Error("Cannot create invoice for inactive vendor");
		}

		// Check for duplicate invoice number for this vendor
		const { data: existing, error: dupError } = await supabase
			.from("vendor_invoices")
			.select("id")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.eq("invoice_number", invoice_number.trim())
			.maybeSingle();

		if (dupError) throw dupError;
		if (existing) {
			throw new Error(`Invoice number "${invoice_number}" already exists for this vendor`);
		}

		// Verify purchase order if provided
		if (purchase_order_id) {
			const { data: po, error: poError } = await supabase
				.from("purchase_orders")
				.select("id")
				.eq("id", purchase_order_id)
				.eq("restaurant_id", restaurantId)
				.single();

			if (poError) {
				if (poError.code === "PGRST116") {
					throw new Error("Purchase order not found");
				}
				throw poError;
			}
		}

		// Determine initial status based on due date
		const today = new Date();
		const dueDateObj = new Date(due_date);
		const initialStatus = dueDateObj < today ? "overdue" : "pending";

		// Create invoice
		const { data, error } = await supabase
			.from("vendor_invoices")
			.insert({
				vendor_id: vendorId,
				restaurant_id: restaurantId,
				invoice_number: invoice_number.trim(),
				invoice_date: invoice_date,
				due_date: due_date,
				received_date: received_date || new Date().toISOString().split("T")[0],
				amount: parseFloat(amount),
				amount_paid: 0,
				status: initialStatus,
				purchase_order_id: purchase_order_id || null,
				currency: currency,
				notes: notes?.trim() || null,
				created_by: userId,
			})
			.select(`
				*,
				vendor:vendors(id, name, vendor_code)
			`)
			.single();

		if (error) throw error;

		console.log(`Created invoice: ${data.invoice_number} for vendor ${vendor.name} (ID: ${data.id})`);
		return data;
	} catch (error) {
		console.error("Error creating vendor invoice:", error);
		throw error;
	}
}

/**
 * Update a vendor invoice
 * @param {string} invoiceId - Invoice UUID
 * @param {Object} updates - Fields to update
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Updated invoice object
 */
export async function updateVendorInvoice(invoiceId, updates, restaurantId) {
	try {
		// Verify invoice exists and belongs to restaurant
		const { data: existing, error: checkError } = await supabase
			.from("vendor_invoices")
			.select("*")
			.eq("id", invoiceId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Invoice not found");
			}
			throw checkError;
		}

		// Don't allow updates to cancelled invoices
		if (existing.status === "cancelled") {
			throw new Error("Cannot update a cancelled invoice");
		}

		// Don't allow updates to fully paid invoices (except notes and status)
		if (existing.status === "paid") {
			const allowedUpdates = ["notes", "status"];
			const attemptedUpdates = Object.keys(updates);
			const disallowedUpdates = attemptedUpdates.filter(u => !allowedUpdates.includes(u));

			if (disallowedUpdates.length > 0) {
				throw new Error(`Cannot update ${disallowedUpdates.join(", ")} on a paid invoice`);
			}
		}

		// Validate updates
		if (updates.invoice_number !== undefined) {
			if (!updates.invoice_number || updates.invoice_number.trim().length === 0) {
				throw new Error("Invoice number cannot be empty");
			}
			if (updates.invoice_number.trim().length > 100) {
				throw new Error("Invoice number must be 100 characters or less");
			}

			// Check for duplicate invoice number (excluding current)
			const { data: duplicate, error: dupError } = await supabase
				.from("vendor_invoices")
				.select("id")
				.eq("vendor_id", existing.vendor_id)
				.eq("restaurant_id", restaurantId)
				.eq("invoice_number", updates.invoice_number.trim())
				.neq("id", invoiceId)
				.maybeSingle();

			if (dupError) throw dupError;
			if (duplicate) {
				throw new Error(`Invoice number "${updates.invoice_number}" already exists for this vendor`);
			}
		}

		if (updates.amount !== undefined) {
			if (!updates.amount || parseFloat(updates.amount) <= 0) {
				throw new Error("Invoice amount must be greater than zero");
			}
			// Ensure amount is not less than amount_paid
			if (parseFloat(updates.amount) < existing.amount_paid) {
				throw new Error("Invoice amount cannot be less than amount already paid");
			}
		}

		if (updates.status !== undefined) {
			const validStatuses = ["pending", "partial", "paid", "overdue", "disputed", "cancelled"];
			if (!validStatuses.includes(updates.status)) {
				throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
			}
		}

		// Prevent changing certain fields
		delete updates.vendor_id;
		delete updates.restaurant_id;
		delete updates.created_by;
		delete updates.created_at;
		delete updates.amount_paid; // Managed by trigger
		delete updates.balance; // Computed column

		// Prepare update data
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

		// Convert amount to number if present
		if (updateData.amount !== undefined) {
			updateData.amount = parseFloat(updateData.amount);
		}

		updateData.updated_at = new Date().toISOString();

		// Perform update
		const { data, error } = await supabase
			.from("vendor_invoices")
			.update(updateData)
			.eq("id", invoiceId)
			.eq("restaurant_id", restaurantId)
			.select(`
				*,
				vendor:vendors(id, name, vendor_code)
			`)
			.single();

		if (error) throw error;

		console.log(`Updated invoice: ${data.invoice_number} (ID: ${invoiceId})`);
		return data;
	} catch (error) {
		console.error("Error updating vendor invoice:", error);
		throw error;
	}
}

/**
 * Soft delete a vendor invoice (set status to 'cancelled')
 * @param {string} invoiceId - Invoice UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Success message
 */
export async function deleteVendorInvoice(invoiceId, restaurantId) {
	try {
		// Verify invoice exists and belongs to restaurant
		const { data: invoice, error: checkError } = await supabase
			.from("vendor_invoices")
			.select("id, invoice_number, status, amount_paid")
			.eq("id", invoiceId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Invoice not found");
			}
			throw checkError;
		}

		// Don't allow cancelling if payments exist
		if (invoice.amount_paid > 0) {
			throw new Error("Cannot cancel an invoice with existing payments. Void the payments first.");
		}

		// Already cancelled
		if (invoice.status === "cancelled") {
			throw new Error("Invoice is already cancelled");
		}

		// Soft delete by setting status to cancelled
		const { error } = await supabase
			.from("vendor_invoices")
			.update({
				status: "cancelled",
				updated_at: new Date().toISOString(),
			})
			.eq("id", invoiceId)
			.eq("restaurant_id", restaurantId);

		if (error) throw error;

		console.log(`Cancelled invoice: ${invoice.invoice_number} (ID: ${invoiceId})`);
		return { message: "Invoice cancelled successfully" };
	} catch (error) {
		console.error("Error cancelling vendor invoice:", error);
		throw error;
	}
}

/**
 * Get all invoices for a restaurant (across all vendors)
 * @param {string} restaurantId - Restaurant UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of invoice objects
 */
export async function getAllRestaurantInvoices(restaurantId, filters = {}) {
	try {
		let query = supabase
			.from("vendor_invoices")
			.select(`
				*,
				vendor:vendors(id, name, vendor_code)
			`)
			.eq("restaurant_id", restaurantId)
			.neq("status", "cancelled");

		// Apply status filter
		if (filters.status && filters.status !== "all") {
			if (filters.status === "unpaid") {
				query = query.in("status", ["pending", "partial", "overdue"]);
			} else {
				query = query.eq("status", filters.status);
			}
		}

		// Apply date range filters
		if (filters.from_date) {
			query = query.gte("invoice_date", filters.from_date);
		}
		if (filters.to_date) {
			query = query.lte("invoice_date", filters.to_date);
		}

		// Order by due date (most urgent first)
		query = query.order("due_date", { ascending: true });

		const { data, error } = await query;
		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching restaurant invoices:", error);
		throw new Error(`Failed to fetch invoices: ${error.message}`);
	}
}
