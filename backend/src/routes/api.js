// routes/api.js
const express = require("express");
const { fetchFromTable } = require("../utils/dbFetcher");
const router = express.Router();

router.get("/data", async (req, res) => {
	try {
		const { table, columns, filters } = req.query;

		const result = await fetchFromTable(table, {
			columns: columns || "*",
			filters: filters ? JSON.parse(filters) : {},
		});

		if (result.success) {
			res.json(result.data);
		} else {
			res.status(500).json({ error: result.error });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
