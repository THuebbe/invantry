// src/utils/scoring.js
// PURE FUNCTIONS - no imports needed except maybe lodash/helper libs

/**
 * Calculate best practice score from questions 1-10
 */
export function calculateBestPracticeScore(answers, questions) {
	let totalPoints = 0;
	let maxPossiblePoints = 0;

	questions.forEach((question) => {
		const answer = answers[question.id];
		if (!answer) return;

		const selectedOption = question.options.find(
			(opt) => opt.value === answer.value
		);

		if (selectedOption) {
			totalPoints += selectedOption.points || 0;
			maxPossiblePoints += 10; // Each question worth 10 max
		}
	});

	// Return score out of 100
	return maxPossiblePoints > 0
		? Math.round((totalPoints / maxPossiblePoints) * 100)
		: 0;
}

/**
 * Calculate qualification score from questions 11-15
 */
export function calculateQualificationScore(answers, questions) {
	let totalScore = 0;
	let maxPossibleScore = 0;

	questions.forEach((question) => {
		const answer = answers[question.id];

		// Skip if no answer or no scoring (like Q15 open-ended)
		if (!answer || question.qualificationScore === null) return;

		const selectedOption = question.options.find(
			(opt) => opt.value === answer.value
		);

		if (selectedOption && selectedOption.qualificationScore !== undefined) {
			const weightedScore =
				selectedOption.qualificationScore * question.scoringWeight;
			totalScore += weightedScore;
			maxPossibleScore += 10 * question.scoringWeight;
		}
	});

	return maxPossibleScore > 0
		? Math.round((totalScore / maxPossibleScore) * 100)
		: 0;
}

/**
 * Determine qualification tier (high/medium/low)
 */
export function determineTier(qualificationScore, resultsConfig) {
	const tiers = resultsConfig.qualificationTiers;

	if (qualificationScore >= tiers.high.threshold) return "high";
	if (qualificationScore >= tiers.medium.threshold) return "medium";
	return "low";
}

/**
 * Generate personalized insights based on answers
 */
export function generateInsights(answers, insightRules) {
	const matchingInsights = [];

	insightRules.forEach((rule) => {
		const { triggerConditions, insight } = rule;

		// Check if this rule should trigger
		const shouldTrigger = triggerConditions.questions.some((questionId) => {
			const answer = answers[questionId];
			if (!answer) return false;

			return triggerConditions.answerValues.includes(answer.value);
		});

		if (shouldTrigger) {
			// Calculate any dynamic values if needed
			const processedInsight = {
				...insight,
				body:
					typeof insight.bodyTemplate === "function"
						? insight.bodyTemplate(answers)
						: insight.bodyTemplate,
			};

			matchingInsights.push(processedInsight);
		}
	});

	// Sort by impact level and return top 3
	const impactOrder = { high: 3, medium: 2, low: 1 };
	return matchingInsights
		.sort((a, b) => impactOrder[b.impactLevel] - impactOrder[a.impactLevel])
		.slice(0, 3);
}

/**
 * Extract lead metadata for CRM
 */
export function extractLeadMetadata(answers, questions) {
	const metadata = {
		role: null,
		isDecisionMaker: false,
		primaryGoal: null,
		primaryChallenge: null,
		desiredNextStep: null,
		urgency: null,
		budget: null,
		readyToBuy: false,
	};

	questions.forEach((question) => {
		const answer = answers[question.id];
		if (!answer) return;

		const selectedOption = question.options?.find(
			(opt) => opt.value === answer.value
		);
		if (!selectedOption) return;

		// Extract metadata based on question ID
		switch (question.id) {
			case "q11":
				metadata.role = selectedOption.value;
				metadata.isDecisionMaker = selectedOption.decisionMaker;
				metadata.budget = selectedOption.budget;
				break;
			case "q12":
				metadata.primaryGoal = selectedOption.value;
				metadata.urgency = selectedOption.urgency;
				break;
			case "q13":
				metadata.primaryChallenge = selectedOption.value;
				break;
			case "q14":
				metadata.desiredNextStep = selectedOption.value;
				metadata.readyToBuy = selectedOption.readyToBuy;
				break;
		}
	});

	return metadata;
}
