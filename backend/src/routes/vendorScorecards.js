// /backend/src/routes/vendorScorecards.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";
import {
	getVendorScorecards,
	getVendorScorecard,
	createVendorScorecard,
	updateVendorScorecard,
	deleteVendorScorecard,
	getMetricHistory,
} from "../services/vendorScorecards.js";

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
 * GET /api/vendors/:vendorId/scorecards
 * List all scorecards for a vendor
 */
router.get("/:vendorId/scorecards", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const scorecards = await getVendorScorecards(vendorId, restaurantId);
		res.json(scorecards);
	} catch (error) {
		console.error("Error fetching vendor scorecards:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/vendors/:vendorId/scorecards
 * Create a new scorecard for a vendor
 */
router.post("/:vendorId/scorecards", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const scorecardData = req.body;

		const scorecard = await createVendorScorecard(
			scorecardData,
			vendorId,
			restaurantId
		);
		res.status(201).json(scorecard);
	} catch (error) {
		console.error("Error creating vendor scorecard:", error);

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
 * GET /api/vendors/:vendorId/scorecards/metric/:name
 * Get history for a specific metric
 * IMPORTANT: This must come BEFORE /:id route to avoid Express matching "metric" as an ID
 */
router.get("/:vendorId/scorecards/metric/:name", async (req, res) => {
	try {
		const { vendorId, name } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const history = await getMetricHistory(vendorId, name, restaurantId);
		res.json(history);
	} catch (error) {
		console.error("Error fetching metric history:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:vendorId/scorecards/:id
 * Get specific scorecard by ID
 */
router.get("/:vendorId/scorecards/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const scorecard = await getVendorScorecard(
			id,
			vendorId,
			restaurantId
		);
		res.json(scorecard);
	} catch (error) {
		console.error("Error fetching vendor scorecard:", error);

		if (error.message === "Scorecard not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/vendors/:vendorId/scorecards/:id
 * Update vendor scorecard
 */
router.put("/:vendorId/scorecards/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const updates = req.body;

		const scorecard = await updateVendorScorecard(
			id,
			updates,
			vendorId,
			restaurantId
		);
		res.json(scorecard);
	} catch (error) {
		console.error("Error updating vendor scorecard:", error);

		if (error.message === "Scorecard not found") {
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
 * DELETE /api/vendors/:vendorId/scorecards/:id
 * Delete vendor scorecard
 */
router.delete("/:vendorId/scorecards/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const result = await deleteVendorScorecard(id, vendorId, restaurantId);
		res.json(result);
	} catch (error) {
		console.error("Error deleting vendor scorecard:", error);

		if (error.message === "Scorecard not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

export default router;
