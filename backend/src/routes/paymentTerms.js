// /backend/src/routes/paymentTerms.js

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * GET /api/payment-terms
 * List all active payment terms (platform-wide reference data)
 */
router.get("/", async (req, res) => {
	try {
		const { data: terms, error } = await supabase
			.from("payment_terms")
			.select("*")
			.eq("is_active", true)
			.order("name");

		if (error) throw error;

		res.json(terms);
	} catch (error) {
		console.error("Error fetching payment terms:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/payment-terms/:id
 * Get specific payment term by ID
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const { data: term, error } = await supabase
			.from("payment_terms")
			.select("*")
			.eq("id", id)
			.single();

		if (error) throw error;

		if (!term) {
			return res.status(404).json({ error: "Payment term not found" });
		}

		res.json(term);
	} catch (error) {
		console.error("Error fetching payment term:", error);

		if (error.message === "Payment term not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

export default router;
