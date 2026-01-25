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

/**
 * Calculate the current balance (sum of unpaid invoice balances) for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Balance information
 */
export async function calculateVendorBalance(vendorId, restaurantId) {
	try {
		// Verify vendor exists
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

		// Get all unpaid invoices (pending, partial, overdue)
		const { data: invoices, error: invoiceError } = await supabase
			.from("vendor_invoices")
			.select("balance, status")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.in("status", ["pending", "partial", "overdue"]);

		if (invoiceError) throw invoiceError;

		// Calculate total balance
		const totalBalance = (invoices || []).reduce((sum, inv) => {
			return sum + parseFloat(inv.balance || 0);
		}, 0);

		// Count invoices by status
		const statusCounts = {
			pending: 0,
			partial: 0,
			overdue: 0,
		};

		(invoices || []).forEach(inv => {
			if (statusCounts[inv.status] !== undefined) {
				statusCounts[inv.status]++;
			}
		});

		// Calculate overdue total
		const totalOverdue = (invoices || []).reduce((sum, inv) => {
			if (inv.status === 'overdue') {
				return sum + parseFloat(inv.balance || 0);
			}
			return sum;
		}, 0);

		return {
			vendor_id: vendorId,
			vendor_name: vendor.name,
			total_outstanding: totalBalance,
			total_overdue: totalOverdue,
			current_balance: totalBalance, // Keep for backwards compatibility
			invoice_count: invoices?.length || 0,
			invoices_pending: statusCounts.pending,
			invoices_partial: statusCounts.partial,
			invoices_overdue: statusCounts.overdue,
		};
	} catch (error) {
		console.error("Error calculating vendor balance:", error);
		throw error;
	}
}

/**
 * Get aging report for a vendor (breakdown of outstanding balances by age)
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Aging report with buckets
 */
export async function getVendorAgingReport(vendorId, restaurantId) {
	try {
		// Verify vendor exists
		const { data: vendor, error: vendorError } = await supabase
			.from("vendors")
			.select("id, name, vendor_code")
			.eq("id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (vendorError) {
			if (vendorError.code === "PGRST116") {
				throw new Error("Vendor not found");
			}
			throw vendorError;
		}

		// Get all unpaid invoices
		const { data: invoices, error: invoiceError } = await supabase
			.from("vendor_invoices")
			.select("id, invoice_number, due_date, balance, amount, status")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.in("status", ["pending", "partial", "overdue"])
			.order("due_date", { ascending: true });

		if (invoiceError) throw invoiceError;

		// Initialize aging buckets
		const aging = {
			current: { amount: 0, count: 0, invoices: [] },
			days30: { amount: 0, count: 0, invoices: [] },
			days60: { amount: 0, count: 0, invoices: [] },
			days90: { amount: 0, count: 0, invoices: [] },
			over90: { amount: 0, count: 0, invoices: [] },
		};

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Categorize each invoice into aging buckets
		(invoices || []).forEach(invoice => {
			const dueDate = new Date(invoice.due_date);
			dueDate.setHours(0, 0, 0, 0);
			const daysPastDue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
			const balance = parseFloat(invoice.balance || 0);

			const invoiceInfo = {
				id: invoice.id,
				invoice_number: invoice.invoice_number,
				due_date: invoice.due_date,
				balance: balance,
				days_past_due: daysPastDue > 0 ? daysPastDue : 0,
			};

			if (daysPastDue <= 0) {
				// Current (not yet due)
				aging.current.amount += balance;
				aging.current.count++;
				aging.current.invoices.push(invoiceInfo);
			} else if (daysPastDue <= 30) {
				// 1-30 days past due
				aging.days30.amount += balance;
				aging.days30.count++;
				aging.days30.invoices.push(invoiceInfo);
			} else if (daysPastDue <= 60) {
				// 31-60 days past due
				aging.days60.amount += balance;
				aging.days60.count++;
				aging.days60.invoices.push(invoiceInfo);
			} else if (daysPastDue <= 90) {
				// 61-90 days past due
				aging.days90.amount += balance;
				aging.days90.count++;
				aging.days90.invoices.push(invoiceInfo);
			} else {
				// Over 90 days past due
				aging.over90.amount += balance;
				aging.over90.count++;
				aging.over90.invoices.push(invoiceInfo);
			}
		});

		// Calculate totals
		const totalBalance =
			aging.current.amount +
			aging.days30.amount +
			aging.days60.amount +
			aging.days90.amount +
			aging.over90.amount;

		const totalInvoices =
			aging.current.count +
			aging.days30.count +
			aging.days60.count +
			aging.days90.count +
			aging.over90.count;

		// Return flat structure for frontend AgingSummaryCard
		return {
			vendor_id: vendorId,
			vendor_name: vendor.name,
			vendor_code: vendor.vendor_code,
			as_of_date: today.toISOString().split("T")[0],
			// Flat keys matching frontend AGING_BUCKETS
			current: aging.current.amount,
			days_1_30: aging.days30.amount,
			days_31_60: aging.days60.amount,
			days_61_90: aging.days90.amount,
			days_90_plus: aging.over90.amount,
			total: totalBalance,
			total_invoices: totalInvoices,
			// Also include detailed breakdown for other use cases
			details: {
				current: {
					amount: aging.current.amount,
					count: aging.current.count,
					invoices: aging.current.invoices,
				},
				days_1_30: {
					amount: aging.days30.amount,
					count: aging.days30.count,
					invoices: aging.days30.invoices,
				},
				days_31_60: {
					amount: aging.days60.amount,
					count: aging.days60.count,
					invoices: aging.days60.invoices,
				},
				days_61_90: {
					amount: aging.days90.amount,
					count: aging.days90.count,
					invoices: aging.days90.invoices,
				},
				days_90_plus: {
					amount: aging.over90.amount,
					count: aging.over90.count,
					invoices: aging.over90.invoices,
				},
			},
		};
	} catch (error) {
		console.error("Error generating vendor aging report:", error);
		throw error;
	}
}

/**
 * Get aging summary for all vendors in a restaurant
 * @param {string} restaurantId - Restaurant UUID
 * @returns {Promise<Object>} Summary aging report across all vendors
 */
export async function getRestaurantAgingSummary(restaurantId) {
	try {
		// Get all unpaid invoices with vendor info
		const { data: invoices, error: invoiceError } = await supabase
			.from("vendor_invoices")
			.select(`
				id, invoice_number, due_date, balance, vendor_id,
				vendor:vendors(id, name, vendor_code)
			`)
			.eq("restaurant_id", restaurantId)
			.in("status", ["pending", "partial", "overdue"]);

		if (invoiceError) throw invoiceError;

		// Initialize summary
		const summary = {
			current: 0,
			days_1_30: 0,
			days_31_60: 0,
			days_61_90: 0,
			over_90: 0,
			total: 0,
			vendor_count: 0,
			invoice_count: invoices?.length || 0,
		};

		const vendorIds = new Set();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Categorize each invoice
		(invoices || []).forEach(invoice => {
			vendorIds.add(invoice.vendor_id);
			const dueDate = new Date(invoice.due_date);
			dueDate.setHours(0, 0, 0, 0);
			const daysPastDue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
			const balance = parseFloat(invoice.balance || 0);

			summary.total += balance;

			if (daysPastDue <= 0) {
				summary.current += balance;
			} else if (daysPastDue <= 30) {
				summary.days_1_30 += balance;
			} else if (daysPastDue <= 60) {
				summary.days_31_60 += balance;
			} else if (daysPastDue <= 90) {
				summary.days_61_90 += balance;
			} else {
				summary.over_90 += balance;
			}
		});

		summary.vendor_count = vendorIds.size;
		summary.as_of_date = today.toISOString().split("T")[0];

		return summary;
	} catch (error) {
		console.error("Error generating restaurant aging summary:", error);
		throw error;
	}
}
