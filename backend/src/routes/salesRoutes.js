// /backend/src/routes/salesRoutes.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
	syncSalesFromPOS,
	getSales,
	getSaleById,
	getSalesSummary,
	getTopSellingItems,
	getSyncStatus,
} from "../services/salesDataService.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * POST /api/sales/sync
 * Trigger sales sync from POS
 *
 * Body:
 * {
 *   "posSystem": "toast",
 *   "startDate": "2024-01-01", // optional
 *   "endDate": "2024-01-31"    // optional
 * }
 */
router.post("/sync", async (req, res) => {
	try {
		const restaurantId = req.restaurantId || req.userDetails?.businessId;

		if (!restaurantId) {
			return res.status(400).json({ error: "Restaurant ID not found" });
		}

		const { posSystem, startDate, endDate } = req.body;

		if (!posSystem) {
			return res.status(400).json({ error: "posSystem is required" });
		}

		const result = await syncSalesFromPOS(restaurantId, posSystem, {
			startDate,
			endDate,
		});

		res.json(result);
	} catch (error) {
		console.error("Error in POST /api/sales/sync:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/sales
 * Get sales list with filters
 *
 * Query params:
 * - startDate: Filter start date
 * - endDate: Filter end date
 * - status: Filter by status (open, closed, voided)
 * - limit: Maximum results (default: 50)
 */
router.get("/", async (req, res) => {
	try {
		const restaurantId = req.restaurantId || req.userDetails?.businessId;

		if (!restaurantId) {
			return res.status(400).json({ error: "Restaurant ID not found" });
		}

		const { startDate, endDate, status, limit } = req.query;

		const sales = await getSales(restaurantId, {
			startDate,
			endDate,
			status,
			limit: limit ? parseInt(limit) : 50,
		});

		res.json({ sales });
	} catch (error) {
		console.error("Error in GET /api/sales:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/sales/summary
 * Get sales summary for a date range
 *
 * Query params:
 * - startDate: Summary start date
 * - endDate: Summary end date
 */
router.get("/summary", async (req, res) => {
	try {
		const restaurantId = req.restaurantId || req.userDetails?.businessId;

		if (!restaurantId) {
			return res.status(400).json({ error: "Restaurant ID not found" });
		}

		const { startDate, endDate } = req.query;

		const summary = await getSalesSummary(restaurantId, {
			startDate,
			endDate,
		});

		res.json(summary);
	} catch (error) {
		console.error("Error in GET /api/sales/summary:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/sales/top-items
 * Get top selling items for a date range
 *
 * Query params:
 * - startDate: Date range start
 * - endDate: Date range end
 * - limit: Number of items to return (default: 10)
 */
router.get("/top-items", async (req, res) => {
	try {
		const restaurantId = req.restaurantId || req.userDetails?.businessId;

		if (!restaurantId) {
			return res.status(400).json({ error: "Restaurant ID not found" });
		}

		const { startDate, endDate, limit } = req.query;

		const topItems = await getTopSellingItems(restaurantId, {
			startDate,
			endDate,
			limit: limit ? parseInt(limit) : 10,
		});

		res.json({ topItems });
	} catch (error) {
		console.error("Error in GET /api/sales/top-items:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/sales/sync-status
 * Get POS sync status
 */
router.get("/sync-status", async (req, res) => {
	try {
		const restaurantId = req.restaurantId || req.userDetails?.businessId;

		if (!restaurantId) {
			return res.status(400).json({ error: "Restaurant ID not found" });
		}

		const status = await getSyncStatus(restaurantId);

		res.json(status);
	} catch (error) {
		console.error("Error in GET /api/sales/sync-status:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/sales/:id
 * Get single sale details
 */
router.get("/:id", async (req, res) => {
	try {
		const restaurantId = req.restaurantId || req.userDetails?.businessId;

		if (!restaurantId) {
			return res.status(400).json({ error: "Restaurant ID not found" });
		}

		const { id } = req.params;

		const sale = await getSaleById(restaurantId, id);

		if (!sale) {
			return res.status(404).json({ error: "Sale not found" });
		}

		res.json(sale);
	} catch (error) {
		console.error("Error in GET /api/sales/:id:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
