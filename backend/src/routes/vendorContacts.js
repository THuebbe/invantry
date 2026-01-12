// /backend/src/routes/vendorContacts.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";
import {
	getVendorContacts,
	getVendorContact,
	createVendorContact,
	updateVendorContact,
	deleteVendorContact,
	getPrimaryContact,
	setPrimaryContact,
} from "../services/vendorContacts.js";

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
 * GET /api/vendors/:vendorId/contacts
 * List all contacts for a vendor
 */
router.get("/:vendorId/contacts", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const contacts = await getVendorContacts(vendorId, restaurantId);
		res.json(contacts);
	} catch (error) {
		console.error("Error fetching vendor contacts:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/vendors/:vendorId/contacts
 * Create a new contact for a vendor
 */
router.post("/:vendorId/contacts", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const contactData = req.body;

		const contact = await createVendorContact(
			contactData,
			vendorId,
			restaurantId
		);
		res.status(201).json(contact);
	} catch (error) {
		console.error("Error creating vendor contact:", error);

		if (error.message === "Vendor not found") {
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
 * GET /api/vendors/:vendorId/contacts/primary
 * Get primary contact for a vendor
 * IMPORTANT: This must come BEFORE /:id route to avoid Express matching "primary" as an ID
 */
router.get("/:vendorId/contacts/primary", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const contact = await getPrimaryContact(vendorId, restaurantId);

		if (!contact) {
			return res.status(404).json({ error: "No primary contact found" });
		}

		res.json(contact);
	} catch (error) {
		console.error("Error fetching primary contact:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:vendorId/contacts/:id
 * Get specific contact by ID
 */
router.get("/:vendorId/contacts/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const contact = await getVendorContact(id, vendorId, restaurantId);
		res.json(contact);
	} catch (error) {
		console.error("Error fetching vendor contact:", error);

		if (error.message === "Contact not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/vendors/:vendorId/contacts/:id/set-primary
 * Set contact as primary
 * IMPORTANT: This must come BEFORE the generic /:id route
 */
router.put("/:vendorId/contacts/:id/set-primary", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const contact = await setPrimaryContact(id, vendorId, restaurantId);
		res.json(contact);
	} catch (error) {
		console.error("Error setting primary contact:", error);

		if (error.message === "Contact not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/vendors/:vendorId/contacts/:id
 * Update vendor contact
 */
router.put("/:vendorId/contacts/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const updates = req.body;

		const contact = await updateVendorContact(
			id,
			updates,
			vendorId,
			restaurantId
		);
		res.json(contact);
	} catch (error) {
		console.error("Error updating vendor contact:", error);

		if (error.message === "Contact not found") {
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
 * DELETE /api/vendors/:vendorId/contacts/:id
 * Delete vendor contact
 */
router.delete("/:vendorId/contacts/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const result = await deleteVendorContact(id, vendorId, restaurantId);
		res.json(result);
	} catch (error) {
		console.error("Error deleting vendor contact:", error);

		if (error.message === "Contact not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

export default router;
