// /backend/src/routes/vendorAddresses.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";
import {
	getVendorAddresses,
	getVendorAddress,
	createVendorAddress,
	updateVendorAddress,
	deleteVendorAddress,
	getPrimaryAddress,
	setPrimaryAddress,
} from "../services/vendorAddresses.js";

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
 * GET /api/vendors/:vendorId/addresses
 * List all addresses for a vendor
 */
router.get("/:vendorId/addresses", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const addresses = await getVendorAddresses(vendorId, restaurantId);
		res.json(addresses);
	} catch (error) {
		console.error("Error fetching vendor addresses:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/vendors/:vendorId/addresses
 * Create a new address for a vendor
 */
router.post("/:vendorId/addresses", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const addressData = req.body;

		const address = await createVendorAddress(
			addressData,
			vendorId,
			restaurantId
		);
		res.status(201).json(address);
	} catch (error) {
		console.error("Error creating vendor address:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}
		if (
			error.message.includes("already exists") ||
			error.message.includes("duplicate")
		) {
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
 * GET /api/vendors/:vendorId/addresses/primary
 * Get primary address for a vendor
 * IMPORTANT: This must come BEFORE /:id route to avoid Express matching "primary" as an ID
 */
router.get("/:vendorId/addresses/primary", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const address = await getPrimaryAddress(vendorId, restaurantId);

		if (!address) {
			return res.status(404).json({ error: "No primary address found" });
		}

		res.json(address);
	} catch (error) {
		console.error("Error fetching primary address:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:vendorId/addresses/:id
 * Get specific address by ID
 */
router.get("/:vendorId/addresses/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const address = await getVendorAddress(id, vendorId, restaurantId);
		res.json(address);
	} catch (error) {
		console.error("Error fetching vendor address:", error);

		if (error.message === "Address not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/vendors/:vendorId/addresses/:id/set-primary
 * Set address as primary
 * IMPORTANT: This must come BEFORE the generic /:id route
 */
router.put("/:vendorId/addresses/:id/set-primary", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const address = await setPrimaryAddress(id, vendorId, restaurantId);
		res.json(address);
	} catch (error) {
		console.error("Error setting primary address:", error);

		if (error.message === "Address not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/vendors/:vendorId/addresses/:id
 * Update vendor address
 */
router.put("/:vendorId/addresses/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const updates = req.body;

		const address = await updateVendorAddress(
			id,
			updates,
			vendorId,
			restaurantId
		);
		res.json(address);
	} catch (error) {
		console.error("Error updating vendor address:", error);

		if (error.message === "Address not found") {
			return res.status(404).json({ error: error.message });
		}
		if (
			error.message.includes("already exists") ||
			error.message.includes("duplicate")
		) {
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
 * DELETE /api/vendors/:vendorId/addresses/:id
 * Delete vendor address
 */
router.delete("/:vendorId/addresses/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const result = await deleteVendorAddress(id, vendorId, restaurantId);
		res.json(result);
	} catch (error) {
		console.error("Error deleting vendor address:", error);

		if (error.message === "Address not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

export default router;
