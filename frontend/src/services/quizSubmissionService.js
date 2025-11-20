// src/services/quizSubmissionService.js
// This makes API calls to your backend

import api from "./api";

export async function submitQuizResults(payload) {
	try {
		const response = await api.post("/quiz-submissions", payload);
		return response.data;
	} catch (error) {
		console.error("Failed to submit quiz:", error);
		throw error;
	}
}
