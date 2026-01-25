// /backend/src/routes/vendorInvoices.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";
import {
	getVendorInvoices,
	getVendorInvoiceById,
	createVendorInvoice,
	updateVendorInvoice,
	deleteVendorInvoice,
	getAllRestaurantInvoices,
} from "../services/vendorInvoices.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * Helper function to get restaurant ID from business ID
 */
async function getRestaurantId(businessId) {
	const { data: restaurant, error } = await supabase
		.from("restaurants")
		.select("id")
		.eq("business_id", businessId)
		.single();

	if (error || !restaurant) {
		throw new Error("No restaurant found for this business");
	}

	return restaurant.id;
}

/**
 * GET /api/vendors/:vendorId/invoices
 * List all invoices for a vendor
 * Query params: status, from_date, to_date, due_from, due_to
 */
router.get("/:vendorId/invoices", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		// Build filters from query params
		const filters = {};
		if (req.query.status) {
			filters.status = req.query.status;
		}
		if (req.query.from_date) {
			filters.from_date = req.query.from_date;
		}
		if (req.query.to_date) {
			filters.to_date = req.query.to_date;
		}
		if (req.query.due_from) {
			filters.due_from = req.query.due_from;
		}
		if (req.query.due_to) {
			filters.due_to = req.query.due_to;
		}

		const invoices = await getVendorInvoices(vendorId, restaurantId, filters);

		// Add count to headers
		res.setHeader("X-Total-Count", invoices.length);
		res.json(invoices);
	} catch (error) {
		console.error("Error fetching vendor invoices:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:vendorId/invoices/:id
 * Get a single invoice by ID with associated payments
 */
router.get("/:vendorId/invoices/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const invoice = await getVendorInvoiceById(id, restaurantId);
		res.json(invoice);
	} catch (error) {
		console.error("Error fetching invoice:", error);

		if (error.message === "Invoice not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/vendors/:vendorId/invoices
 * Create a new invoice for a vendor
 */
router.post("/:vendorId/invoices", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const invoiceData = req.body;

		const invoice = await createVendorInvoice(
			vendorId,
			invoiceData,
			restaurantId,
			req.user.id
		);
		res.status(201).json(invoice);
	} catch (error) {
		console.error("Error creating invoice:", error);

		if (error.message === "Vendor not found" || error.message === "Purchase order not found") {
			return res.status(404).json({ error: error.message });
		}
		if (error.message.includes("already exists")) {
			return res.status(409).json({ error: error.message });
		}
		if (
			error.message.includes("required") ||
			error.message.includes("must be") ||
			error.message.includes("Cannot create")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/vendors/:vendorId/invoices/:id
 * Update an invoice
 */
router.put("/:vendorId/invoices/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const updates = req.body;

		const invoice = await updateVendorInvoice(id, updates, restaurantId);
		res.json(invoice);
	} catch (error) {
		console.error("Error updating invoice:", error);

		if (error.message === "Invoice not found") {
			return res.status(404).json({ error: error.message });
		}
		if (error.message.includes("already exists")) {
			return res.status(409).json({ error: error.message });
		}
		if (
			error.message.includes("cannot") ||
			error.message.includes("Cannot") ||
			error.message.includes("must be") ||
			error.message.includes("Invalid")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * DELETE /api/vendors/:vendorId/invoices/:id
 * Cancel (soft delete) an invoice
 */
router.delete("/:vendorId/invoices/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const result = await deleteVendorInvoice(id, restaurantId);
		res.json(result);
	} catch (error) {
		console.error("Error cancelling invoice:", error);

		if (error.message === "Invoice not found") {
			return res.status(404).json({ error: error.message });
		}
		if (
			error.message.includes("Cannot cancel") ||
			error.message.includes("already cancelled")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

export default router;
