// /backend/src/routes/business.js

import express from "express";
import { createBusiness } from "../services/business.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/create", async (req, res) => {
	try {
		const businessData = {
			name: req.body.name,
			domain: req.body.domain,
			address: req.body.address,
			city: req.body.city,
		};

		const result = await createBusiness(businessData, req.user.id);

		res.status(201).json(result);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

export default router;
