// /backend/src/routes/waste.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * GET /api/waste/reasons
 * Returns list of valid waste reasons for dropdown menus
 *
 * This endpoint provides the standard waste reason options that users
 * can select when removing inventory items. These align with the
 * reasons validated in the removeInventory service function.
 */
router.get("/reasons", async (req, res) => {
	try {
		const reasons = {
			waste: [
				{
					value: "spoilage",
					label: "Spoilage",
					description: "Went bad in storage",
				},
				{
					value: "expired",
					label: "Expired",
					description: "Past expiration date",
				},
				{
					value: "damaged",
					label: "Damaged",
					description: "Physical damage during shipping/storage",
				},
				{
					value: "over-prep",
					label: "Over-Preparation",
					description: "Made too much, had to discard",
				},
				{
					value: "prep-waste",
					label: "Prep Waste",
					description: "Trim, peels, unusable parts",
				},
				{
					value: "poor-quality",
					label: "Poor Quality",
					description: "Didn't meet quality standards",
				},
				{
					value: "short-life",
					label: "Short Life",
					description: "Delivered too close to expiration",
				},
			],
			reduction: [
				{
					value: "usage",
					label: "Usage",
					description: "Used for cooking (normal consumption)",
				},
				{
					value: "donation",
					label: "Donation",
					description: "Donated to charity",
				},
				{
					value: "discontinued",
					label: "Discontinued",
					description: "Menu item discontinued",
				},
			],
		};

		res.json(reasons);
	} catch (error) {
		console.error("Error getting waste reasons:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/waste/categories
 * Returns list of waste categories
 *
 * This is a helper endpoint that returns the two main categories
 * used in waste tracking: actual waste vs. other reductions
 */
router.get("/categories", async (req, res) => {
	try {
		const categories = [
			{
				value: "waste",
				label: "Waste",
				description:
					"Items that were thrown away (spoilage, damage, expiration, etc.)",
			},
			{
				value: "reduction",
				label: "Reduction",
				description:
					"Items removed but not wasted (usage, donation, discontinuation)",
			},
		];

		res.json(categories);
	} catch (error) {
		console.error("Error getting waste categories:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
