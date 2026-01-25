// /backend/src/routes/vendors.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";
import {
	getVendors,
	getVendorById,
	createVendor,
	updateVendor,
	deleteVendor,
	getVendorsForIngredient,
	getPreferredVendorForIngredient,
	createIngredientVendorMapping,
	updateIngredientVendorMapping,
	deleteIngredientVendorMapping,
	getVendorSummary,
	getVendorMetrics,
} from "../services/vendors.js";
import {
	calculateVendorBalance,
	getVendorAgingReport,
	getRestaurantAgingSummary,
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
 * GET /api/vendors
 * List all vendors for the authenticated restaurant
 */
router.get("/", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const filters = {};

		// Parse is_active filter
		if (req.query.is_active !== undefined) {
			filters.is_active = req.query.is_active === "true";
		}

		const vendors = await getVendors(restaurantId, filters);

		// Add vendor count to headers
		res.setHeader("X-Total-Count", vendors.length);
		res.json(vendors);
	} catch (error) {
		console.error("Error fetching vendors:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/vendors
 * Create a new vendor
 */
router.post("/", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);
		const vendorData = req.body;

		// Basic validation
		if (!vendorData.name || vendorData.name.trim().length === 0) {
			return res.status(400).json({ error: "Vendor name is required" });
		}

		const vendor = await createVendor(
			vendorData,
			restaurantId,
			req.user.id
		);
		res.status(201).json(vendor);
	} catch (error) {
		console.error("Error creating vendor:", error);

		// Return appropriate status code based on error
		if (error.message.includes("already exists")) {
			return res.status(409).json({ error: error.message });
		}
		if (
			error.message.includes("required") ||
			error.message.includes("Invalid") ||
			error.message.includes("can only contain")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/metrics
 * Get 4 dashboard metrics for vendors
 * IMPORTANT: This must come BEFORE /:id route to avoid Express matching "metrics" as an ID
 */
router.get("/metrics", async (req, res) => {
	try {
		const restaurantId = await getRestaurantId(req.businessId);

		const metrics = await getVendorMetrics(restaurantId);
		res.json(metrics);
	} catch (error) {
		console.error("Error fetching vendor metrics:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:id/summary
 * Get vendor with all related data (addresses, contacts, payment info, items, etc.)
 * IMPORTANT: This must come BEFORE /:id route to avoid Express matching ":id/summary" incorrectly
 */
router.get("/:id/summary", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const summary = await getVendorSummary(id, restaurantId);
		res.json(summary);
	} catch (error) {
		console.error("Error fetching vendor summary:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:vendorId/balance
 * Get current balance (sum of unpaid invoice balances) for a vendor
 * IMPORTANT: This must come BEFORE /:id route to avoid Express matching incorrectly
 */
router.get("/:vendorId/balance", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const balance = await calculateVendorBalance(vendorId, restaurantId);
		res.json(balance);
	} catch (error) {
		console.error("Error fetching vendor balance:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:vendorId/aging
 * Get aging report (breakdown of outstanding balances by age) for a vendor
 * IMPORTANT: This must come BEFORE /:id route to avoid Express matching incorrectly
 */
router.get("/:vendorId/aging", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const agingReport = await getVendorAgingReport(vendorId, restaurantId);
		res.json(agingReport);
	} catch (error) {
		console.error("Error fetching vendor aging report:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:id
 * Get specific vendor by ID with statistics
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const vendor = await getVendorById(id, restaurantId);
		res.json(vendor);
	} catch (error) {
		console.error("Error fetching vendor:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/vendors/:id
 * Update vendor information
 */
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const updates = req.body;

		const vendor = await updateVendor(id, updates, restaurantId);
		res.json(vendor);
	} catch (error) {
		console.error("Error updating vendor:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}
		if (error.message.includes("already exists")) {
			return res.status(409).json({ error: error.message });
		}
		if (
			error.message.includes("required") ||
			error.message.includes("Invalid") ||
			error.message.includes("cannot be empty") ||
			error.message.includes("can only contain")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * DELETE /api/vendors/:id
 * Soft delete vendor (set is_active = false)
 */
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const result = await deleteVendor(id, restaurantId);
		res.json(result);
	} catch (error) {
		console.error("Error deleting vendor:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}
		if (error.message.includes("open POs")) {
			return res.status(409).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/for-ingredient/:ingredientId
 * Get all vendors for a specific ingredient
 */
router.get("/for-ingredient/:ingredientId", async (req, res) => {
	try {
		const { ingredientId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const vendors = await getVendorsForIngredient(ingredientId, restaurantId);
		res.json(vendors);
	} catch (error) {
		console.error("Error fetching vendors for ingredient:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/preferred-for-ingredient/:ingredientId
 * Get the preferred vendor for a specific ingredient
 */
router.get("/preferred-for-ingredient/:ingredientId", async (req, res) => {
	try {
		const { ingredientId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const vendor = await getPreferredVendorForIngredient(
			ingredientId,
			restaurantId
		);

		if (!vendor) {
			return res.status(404).json({
				error: "No preferred vendor found for this ingredient",
			});
		}

		res.json(vendor);
	} catch (error) {
		console.error("Error fetching preferred vendor:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/vendors/:vendorId/ingredients/:ingredientId
 * Create ingredient-vendor mapping
 */
router.post("/:vendorId/ingredients/:ingredientId", async (req, res) => {
	try {
		const { vendorId, ingredientId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const mappingData = req.body;

		const mapping = await createIngredientVendorMapping(
			vendorId,
			ingredientId,
			mappingData,
			restaurantId
		);
		res.status(201).json(mapping);
	} catch (error) {
		console.error("Error creating ingredient-vendor mapping:", error);

		if (
			error.message === "Vendor not found" ||
			error.message === "Ingredient not found"
		) {
			return res.status(404).json({ error: error.message });
		}
		if (error.message.includes("already exists")) {
			return res.status(409).json({ error: error.message });
		}
		if (
			error.message.includes("must be") ||
			error.message.includes("Cannot add")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/vendors/:vendorId/ingredients/:ingredientId
 * Update ingredient-vendor mapping
 */
router.put("/:vendorId/ingredients/:ingredientId", async (req, res) => {
	try {
		const { vendorId, ingredientId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const updates = req.body;

		const mapping = await updateIngredientVendorMapping(
			vendorId,
			ingredientId,
			updates,
			restaurantId
		);
		res.json(mapping);
	} catch (error) {
		console.error("Error updating ingredient-vendor mapping:", error);

		if (
			error.message === "Vendor not found" ||
			error.message === "Ingredient-vendor mapping not found"
		) {
			return res.status(404).json({ error: error.message });
		}
		if (error.message.includes("must be")) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * DELETE /api/vendors/:vendorId/ingredients/:ingredientId
 * Remove ingredient-vendor mapping
 */
router.delete("/:vendorId/ingredients/:ingredientId", async (req, res) => {
	try {
		const { vendorId, ingredientId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const result = await deleteIngredientVendorMapping(
			vendorId,
			ingredientId,
			restaurantId
		);
		res.json(result);
	} catch (error) {
		console.error("Error deleting ingredient-vendor mapping:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

export default router;
