// backend/src/routes/quizRoutes.js

import express from "express";

const router = express.Router();

router.post("/quiz-submissions", async (req, res) => {
	const { contact, scores, answers, metadata } = req.body;

	// Save to Supabase
	const { data, error } = await supabase.from("quiz_submissions").insert({
		email: contact.email,
		first_name: contact.firstName,
		scores: scores,
		answers: answers,
		metadata: metadata,
		created_at: new Date(),
	});

	if (error) {
		return res.status(500).json({ error: error.message });
	}

	res.json({ success: true, data });
});

export default router;
