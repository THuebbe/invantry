import express from "express";
import { getData } from "../services/supabase.js";

const router = express.Router();

// Test endpoint to test your getData function
router.get("/query-test", async (req, res) => {
	try {
		const { table, filters, select, orderBy, limit } = req.query;

		console.log("🧪 Test Query Request:");
		console.log("  Table:", table);
		console.log("  Filters:", filters);
		console.log("  Select:", select);
		console.log("  Order:", orderBy);
		console.log("  Limit:", limit);

		// Parse filters from query string if provided
		// Example: ?filters={"isActive":true}
		const parsedFilters = filters ? JSON.parse(filters) : {};

		// Parse orderBy if provided
		// Example: ?orderBy={"column":"createdAt","ascending":false}
		const parsedOrder = orderBy ? JSON.parse(orderBy) : null;

		const results = await getData(table || "restaurants", {
			filters: parsedFilters,
			select: select || "*",
			order: parsedOrder,
			limit: limit ? parseInt(limit) : null,
		});

		console.log("✅ Query successful! Found", results.length, "results");

		res.json({
			success: true,
			count: results.length,
			data: results,
		});
	} catch (error) {
		console.error("❌ Query failed:", error.message);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
});

// Simple health check for this router
router.get("/health", (req, res) => {
	res.json({
		message: "Test routes are working!",
		availableEndpoints: [
			"GET /api/test/health",
			"GET /api/test/query-test?table=TABLE_NAME",
		],
	});
});

export default router;
