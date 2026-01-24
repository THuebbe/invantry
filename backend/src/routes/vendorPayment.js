// /backend/src/routes/vendorPayment.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";
import {
	getVendorPaymentInfo,
	createVendorPaymentInfo,
	updateVendorPaymentInfo,
	deleteVendorPaymentInfo,
} from "../services/vendorPayment.js";

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
 * GET /api/vendors/:vendorId/payment-info
 * Get payment information for a vendor
 */
router.get("/:vendorId/payment-info", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const paymentInfo = await getVendorPaymentInfo(vendorId, restaurantId);

		if (!paymentInfo) {
			return res
				.status(404)
				.json({ error: "Payment information not found" });
		}

		res.json(paymentInfo);
	} catch (error) {
		console.error("Error fetching vendor payment info:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/vendors/:vendorId/payment-info
 * Create payment information for a vendor
 */
router.post("/:vendorId/payment-info", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const paymentData = req.body;

		const paymentInfo = await createVendorPaymentInfo(
			paymentData,
			vendorId,
			restaurantId
		);
		res.status(201).json(paymentInfo);
	} catch (error) {
		console.error("Error creating vendor payment info:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}
		if (error.message.includes("already exists")) {
			return res.status(409).json({ error: error.message });
		}
		if (
			error.message.includes("required") ||
			error.message.includes("Invalid")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/vendors/:vendorId/payment-info
 * Update payment information for a vendor
 */
router.put("/:vendorId/payment-info", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const updates = req.body;

		const paymentInfo = await updateVendorPaymentInfo(
			vendorId,
			updates,
			restaurantId
		);
		res.json(paymentInfo);
	} catch (error) {
		console.error("Error updating vendor payment info:", error);

		if (error.message === "Payment information not found") {
			return res.status(404).json({ error: error.message });
		}
		if (
			error.message.includes("required") ||
			error.message.includes("Invalid")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * DELETE /api/vendors/:vendorId/payment-info
 * Delete payment information for a vendor
 */
router.delete("/:vendorId/payment-info", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const result = await deleteVendorPaymentInfo(vendorId, restaurantId);
		res.json(result);
	} catch (error) {
		console.error("Error deleting vendor payment info:", error);

		if (error.message === "Payment information not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

export default router;
