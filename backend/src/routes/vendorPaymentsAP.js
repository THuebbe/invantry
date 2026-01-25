// /backend/src/routes/vendorPaymentsAP.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";
import {
	getVendorPayments,
	getVendorPaymentById,
	createVendorPayment,
	voidVendorPayment,
	getAllRestaurantPayments,
	getPaymentsSummary,
} from "../services/vendorAPPayments.js";

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
 * GET /api/vendors/:vendorId/ap-payments
 * List all AP payments for a vendor
 * Query params: from_date, to_date, payment_method
 */
router.get("/:vendorId/ap-payments", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		// Build filters from query params
		const filters = {};
		if (req.query.from_date) {
			filters.from_date = req.query.from_date;
		}
		if (req.query.to_date) {
			filters.to_date = req.query.to_date;
		}
		if (req.query.payment_method) {
			filters.payment_method = req.query.payment_method;
		}

		const payments = await getVendorPayments(vendorId, restaurantId, filters);

		// Add count to headers
		res.setHeader("X-Total-Count", payments.length);
		res.json(payments);
	} catch (error) {
		console.error("Error fetching vendor payments:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:vendorId/ap-payments/:id
 * Get a single payment by ID
 */
router.get("/:vendorId/ap-payments/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const payment = await getVendorPaymentById(id, restaurantId);
		res.json(payment);
	} catch (error) {
		console.error("Error fetching payment:", error);

		if (error.message === "Payment not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/vendors/:vendorId/ap-payments
 * Record a new payment for a vendor
 */
router.post("/:vendorId/ap-payments", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const paymentData = req.body;

		const payment = await createVendorPayment(
			vendorId,
			paymentData,
			restaurantId,
			req.user.id
		);
		res.status(201).json(payment);
	} catch (error) {
		console.error("Error creating payment:", error);

		if (
			error.message === "Vendor not found" ||
			error.message === "Invoice not found"
		) {
			return res.status(404).json({ error: error.message });
		}
		if (
			error.message.includes("must be") ||
			error.message.includes("Invalid") ||
			error.message.includes("Cannot apply") ||
			error.message.includes("already") ||
			error.message.includes("does not belong")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * DELETE /api/vendors/:vendorId/ap-payments/:id
 * Void (delete) a payment
 */
router.delete("/:vendorId/ap-payments/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const result = await voidVendorPayment(id, restaurantId);
		res.json(result);
	} catch (error) {
		console.error("Error voiding payment:", error);

		if (error.message === "Payment not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

export default router;
