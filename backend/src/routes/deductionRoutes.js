// /backend/src/routes/deductionRoutes.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
	deductInventoryForSale,
	processUndeductedSales,
	reverseDeductionsForSale,
	getDeductionHistory,
	getDeductionSummary,
} from "../services/inventoryDeductionService.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * POST /api/deductions/process
 * Process all undeducted sales
 */
router.post("/process", async (req, res) => {
	try {
		const restaurantId = req.restaurantId || req.userDetails?.businessId;

		if (!restaurantId) {
			return res.status(400).json({ error: "Restaurant ID not found" });
		}

		const result = await processUndeductedSales(restaurantId);

		res.json(result);
	} catch (error) {
		console.error("Error in POST /api/deductions/process:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/deductions/sale/:saleId
 * Deduct inventory for a specific sale
 */
router.post("/sale/:saleId", async (req, res) => {
	try {
		const restaurantId = req.restaurantId || req.userDetails?.businessId;

		if (!restaurantId) {
			return res.status(400).json({ error: "Restaurant ID not found" });
		}

		const { saleId } = req.params;
		const result = await deductInventoryForSale(restaurantId, saleId);

		res.json(result);
	} catch (error) {
		console.error("Error in POST /api/deductions/sale/:saleId:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/deductions/reverse/:saleId
 * Reverse deductions for a sale (e.g., voided order)
 */
router.post("/reverse/:saleId", async (req, res) => {
	try {
		const restaurantId = req.restaurantId || req.userDetails?.businessId;

		if (!restaurantId) {
			return res.status(400).json({ error: "Restaurant ID not found" });
		}

		const { saleId } = req.params;
		const userId = req.userDetails?.id;

		const result = await reverseDeductionsForSale(restaurantId, saleId, userId);

		res.json(result);
	} catch (error) {
		console.error("Error in POST /api/deductions/reverse/:saleId:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/deductions
 * Get deduction history
 *
 * Query params:
 * - startDate: Filter start date
 * - endDate: Filter end date
 * - ingredientId: Filter by ingredient
 * - limit: Maximum results (default: 100)
 */
router.get("/", async (req, res) => {
	try {
		const restaurantId = req.restaurantId || req.userDetails?.businessId;

		if (!restaurantId) {
			return res.status(400).json({ error: "Restaurant ID not found" });
		}

		const { startDate, endDate, ingredientId, limit } = req.query;

		const deductions = await getDeductionHistory(restaurantId, {
			startDate,
			endDate,
			ingredientId,
			limit: limit ? parseInt(limit) : undefined,
		});

		res.json({ deductions });
	} catch (error) {
		console.error("Error in GET /api/deductions:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/deductions/summary
 * Get deduction summary grouped by ingredient
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

		const summary = await getDeductionSummary(restaurantId, {
			startDate,
			endDate,
		});

		res.json({ summary });
	} catch (error) {
		console.error("Error in GET /api/deductions/summary:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
