// /frontend/src/components/dashboard/layout/valueProps.js

import { CircleDollarSign, CloudLightning, Trash2, Check } from "lucide-react";

export const hook = [
	{
		title: "Ready to Master Your Kitchen's Inventory in 90 Days or Less?",
		subtitle:
			"Take our 3-minute Restaurant Readiness Assessment to discover your personalized path to cutting food costs and eliminating waste",
		ctaButton: "Take Quiz Now",
		backgroundImage: "",
	},
];

export const valueProps = [
	{
		id: "predictable",
		icon: CircleDollarSign,
		title: "Predictable Food Costs",
		bullets: [
			"Get your food cost percentage under 30% (industry best practice)",
			"Know exactly what you're spending before you spend it",
			"Turn inventory from a guessing game into a profit center",
		],
	},
	{
		id: "shortages",
		icon: CloudLightning,
		title: "Zero Surprise Shortages",
		bullets: [
			"Never scramble to find emergency suppliers mid-service again",
			"Automatic alerts before you hit reorder points",
			"Sleep easy knowing tomorrow's prep is covered",
		],
	},
	{
		id: "waste",
		icon: Trash2,
		title: "Waste That Actually Goes to Zero",
		bullets: [
			"Stop throwing away hundreds (or thousands) in spoiled product",
			"Track expiration dates automatically",
			"Turn your walk-in from a black hole into a money-making machine",
		],
	},
];

export const credentials = [
	{
		headline: "Why We Built This",
		bodyCopy:
			"After dozens of conversations with restaurant operators—from single-location independents to multi-unit managers—we kept hearing the same frustration - I know I'm losing money on inventory, but I don't have time to fix it.",
		problem:
			"It's not that managers don't care. It's that existing solutions were built for retail warehouses, not restaurant kitchens. They're too complex, too time-consuming, and don't account for the chaos of service.",
		difference: [
			"Built specifically for restaurant workflows (not adapted from retail)",
			"Designed for speed—because you don't have 30 minutes for inventory counts",
			"Focuses on what matters: food cost, waste, and never running out mid-shift",
		],
		mission:
			"Give independent restaurants the inventory intelligence that only enterprise chains could afford—until now.",
	},
];

export const cta = {
	headline: "Start Your Free Assessment",
	buttonText: "Discover My Inventory Score",
	reasons: [
		{
			icon: Check,
			heading: "Takes just 3 minutes",
			body: "No lengthy forms or complicated setup",
		},
		{
			icon: Check,
			heading: "100% Free. No Credit Card.",
			body: "Get your personalized recommendations with zero commitment",
		},
		{
			icon: Check,
			heading: "Instant Results",
			body: "See your Restaurant Readiness Score and get your custom action plan immediately",
		},
	],
	closing: "🔒 Your information is secure and will never be shared",
};

export const capture = {
	headline: "Let's Get You Your Results",
	button: "Start Assessment →",
	subtext: "Takes 3 minutes • Your data is private • Instant results",
};

export const quiz = {
	quiz: {
		introScreen: {
			headline:
				"Let's see how your current system stacks up against industry best practices.",
			body: "These 10 questions will help us understand what's already working for you.",
		},

		bestPracticeQuestions: [
			{
				id: "q1",
				number: 1,
				text: "How do you currently track inventory levels?",
				answerType: "radio",
				options: [
					{
						text: "Automated system with real-time updates",
						value: "automated",
						points: 10,
					},
					{
						text: "Spreadsheets updated weekly",
						value: "spreadsheet-weekly",
						points: 6,
					},
					{
						text: "Spreadsheets when I remember",
						value: "spreadsheet-adhoc",
						points: 3,
					},
					{ text: "Mental notes and experience", value: "mental", points: 1 },
				],
				scoringWeight: 1,
				insightTriggers: {
					mental: "automation-insight",
					"spreadsheet-adhoc": "consistency-insight",
				},
			},

			{
				id: "q2",
				number: 2,
				text: "How do you handle expiration date tracking?",
				answerType: "radio",
				options: [
					{
						text: "Automated alerts before items expire",
						value: "automated-alerts",
						points: 10,
					},
					{
						text: "Date labels checked daily",
						value: "daily-manual-check",
						points: 7,
					},
					{
						text: "Date labels checked when we remember",
						value: "occasional-check",
						points: 4,
					},
					{
						text: "We check as we use items",
						value: "check-on-use",
						points: 1,
					},
				],
				scoringWeight: 1,
				insightTriggers: {
					"check-on-use": "expiration-loss-insight",
					"occasional-check": "expiration-loss-insight",
				},
			},

			{
				id: "q3",
				number: 3,
				text: "How often do you discover you're out of a key ingredient during service?",
				answerType: "radio",
				options: [
					{
						text: "Never - we have early warning alerts",
						value: "never-alerts",
						points: 10,
					},
					{ text: "Rarely - maybe once a month", value: "rarely", points: 7 },
					{
						text: "Occasionally - few times a month",
						value: "occasionally",
						points: 4,
					},
					{ text: "Often - at least weekly", value: "often", points: 1 },
				],
				scoringWeight: 1,
				insightTriggers: {
					often: "stockout-prevention-insight",
					occasionally: "stockout-prevention-insight",
				},
			},

			{
				id: "q4",
				number: 4,
				text: "Do you know your target food cost percentage?",
				answerType: "radio",
				options: [
					{
						text: "Yes, and I track it daily/weekly",
						value: "track-daily",
						points: 10,
					},
					{
						text: "Yes, and I review it monthly",
						value: "track-monthly",
						points: 7,
					},
					{
						text: "I know it but don't track it regularly",
						value: "know-no-track",
						points: 4,
					},
					{
						text: "I'm not sure what it should be",
						value: "unsure",
						points: 1,
					},
				],
				scoringWeight: 1,
				insightTriggers: {
					unsure: "food-cost-blindness-insight",
					"know-no-track": "food-cost-tracking-insight",
				},
			},

			{
				id: "q5",
				number: 5,
				text: "How do you currently receive and log deliveries?",
				answerType: "radio",
				options: [
					{
						text: "Scan/digital entry with automatic inventory updates",
						value: "automated-receiving",
						points: 10,
					},
					{
						text: "Manual entry into a system same day",
						value: "manual-same-day",
						points: 7,
					},
					{
						text: "Write it down, enter later",
						value: "delayed-entry",
						points: 4,
					},
					{
						text: "Sign the invoice and put it away",
						value: "invoice-only",
						points: 1,
					},
				],
				scoringWeight: 1,
				insightTriggers: {
					"invoice-only": "receiving-bottleneck-insight",
					"delayed-entry": "receiving-bottleneck-insight",
				},
			},

			{
				id: "q6",
				number: 6,
				text: "How do you handle inventory during menu costing?",
				answerType: "radio",
				options: [
					{
						text: "Automated recipe costing with live ingredient prices",
						value: "automated-costing",
						points: 10,
					},
					{
						text: "Spreadsheet with ingredient costs updated regularly",
						value: "spreadsheet-regular",
						points: 7,
					},
					{
						text: "Estimate based on invoice prices",
						value: "estimate-invoices",
						points: 4,
					},
					{
						text: "Use industry averages or gut feeling",
						value: "gut-feeling",
						points: 1,
					},
				],
				scoringWeight: 1,
				insightTriggers: {
					"gut-feeling": "menu-costing-accuracy-insight",
					"estimate-invoices": "menu-costing-accuracy-insight",
				},
			},

			{
				id: "q7",
				number: 7,
				text: "Where is your inventory data stored?",
				answerType: "radio",
				options: [
					{
						text: "Cloud-based system accessible anywhere",
						value: "cloud-based",
						points: 10,
					},
					{
						text: "Computer at restaurant location",
						value: "local-computer",
						points: 6,
					},
					{
						text: "Spreadsheets on my laptop",
						value: "laptop-spreadsheet",
						points: 3,
					},
					{ text: "Paper files/binders", value: "paper-files", points: 1 },
				],
				scoringWeight: 1,
				insightTriggers: {
					"paper-files": "accessibility-insight",
					"laptop-spreadsheet": "accessibility-insight",
				},
			},

			{
				id: "q8",
				number: 8,
				text: "How do you currently handle low stock alerts?",
				answerType: "radio",
				options: [
					{
						text: "Automatic alerts when hitting reorder points",
						value: "automated-alerts",
						points: 10,
					},
					{
						text: "Weekly checks against par levels",
						value: "weekly-checks",
						points: 6,
					},
					{
						text: "We check when doing orders",
						value: "check-during-orders",
						points: 3,
					},
					{
						text: "We realize it when we're out",
						value: "realize-when-out",
						points: 1,
					},
				],
				scoringWeight: 1,
				insightTriggers: {
					"realize-when-out": "proactive-ordering-insight",
					"check-during-orders": "proactive-ordering-insight",
				},
			},

			{
				id: "q9",
				number: 9,
				text: "Can you see your inventory value in real-time?",
				answerType: "radio",
				options: [
					{ text: "Yes, always current", value: "realtime", points: 10 },
					{
						text: "Updated after weekly counts",
						value: "weekly-update",
						points: 6,
					},
					{
						text: "Updated after monthly counts",
						value: "monthly-update",
						points: 3,
					},
					{
						text: "Not really sure of current value",
						value: "unsure",
						points: 1,
					},
				],
				scoringWeight: 1,
				insightTriggers: {
					unsure: "inventory-visibility-insight",
					"monthly-update": "inventory-visibility-insight",
				},
			},

			{
				id: "q10",
				number: 10,
				text: "How do you identify your highest-waste ingredients?",
				answerType: "radio",
				options: [
					{
						text: "Automated waste tracking and reports",
						value: "automated-tracking",
						points: 10,
					},
					{
						text: "Track waste manually and analyze",
						value: "manual-tracking",
						points: 7,
					},
					{
						text: "Notice patterns but don't track formally",
						value: "informal-patterns",
						points: 4,
					},
					{
						text: "Don't currently track waste",
						value: "no-tracking",
						points: 1,
					},
				],
				scoringWeight: 1,
				insightTriggers: {
					"no-tracking": "waste-tracking-insight",
					"informal-patterns": "waste-tracking-insight",
				},
			},
		],

		qualificationQuestions: [
			{
				id: "q11",
				number: 11,
				text: "Which best describes your role?",
				answerType: "radio",
				options: [
					{
						text: "Owner/Operator",
						value: "owner",
						qualificationScore: 10,
						decisionMaker: true,
						budget: "high",
					},
					{
						text: "General Manager",
						value: "gm",
						qualificationScore: 8,
						decisionMaker: true,
						budget: "medium-high",
					},
					{
						text: "Kitchen Manager/Chef",
						value: "km",
						qualificationScore: 6,
						decisionMaker: false,
						budget: "medium",
					},
					{
						text: "Multi-Unit Manager/Supervisor",
						value: "multi-unit",
						qualificationScore: 10,
						decisionMaker: true,
						budget: "high",
					},
					{
						text: "Assistant Manager",
						value: "assistant",
						qualificationScore: 4,
						decisionMaker: false,
						budget: "low",
					},
					{
						text: "Other",
						value: "other",
						qualificationScore: 3,
						decisionMaker: false,
						budget: "unknown",
					},
				],
				scoringWeight: 2.5, // Very important - decision maker identification
				segmentationTags: ["role"],
				crmField: "role",
			},

			{
				id: "q12",
				number: 12,
				text: "What's your biggest inventory goal for the next 90 days?",
				answerType: "radio",
				options: [
					{
						text: "Reduce food cost percentage by 3-5%",
						value: "reduce-food-cost",
						qualificationScore: 10,
						urgency: "high",
						painPoint: "profitability",
					},
					{
						text: "Eliminate stock-outs during service",
						value: "eliminate-stockouts",
						qualificationScore: 9,
						urgency: "high",
						painPoint: "operations",
					},
					{
						text: "Cut waste/spoilage in half",
						value: "reduce-waste",
						qualificationScore: 9,
						urgency: "high",
						painPoint: "waste",
					},
					{
						text: "Save 5+ hours per week on inventory tasks",
						value: "save-time",
						qualificationScore: 7,
						urgency: "medium",
						painPoint: "efficiency",
					},
					{
						text: "Get real-time visibility into inventory value",
						value: "visibility",
						qualificationScore: 6,
						urgency: "medium",
						painPoint: "visibility",
					},
					{
						text: "Just want to understand my options",
						value: "exploring",
						qualificationScore: 3,
						urgency: "low",
						painPoint: "awareness",
					},
					{
						text: "Other",
						value: "other",
						qualificationScore: 5,
						urgency: "medium",
						painPoint: "unknown",
					},
				],
				scoringWeight: 2, // High importance - indicates urgency/pain
				segmentationTags: ["goal", "pain-point"],
				crmField: "primary_goal",
			},

			{
				id: "q13",
				number: 13,
				text: "What's been your biggest challenge with inventory management?",
				answerType: "radio",
				options: [
					{
						text: "Takes too much time",
						value: "time-consuming",
						qualificationScore: 8,
						challenge: "efficiency",
						willPayFor: "automation",
					},
					{
						text: "Hard to keep track manually",
						value: "manual-difficulty",
						qualificationScore: 9,
						challenge: "accuracy",
						willPayFor: "automation",
					},
					{
						text: "Staff doesn't follow the system",
						value: "staff-compliance",
						qualificationScore: 7,
						challenge: "adoption",
						willPayFor: "simplicity",
					},
					{
						text: "Don't have a good system in place",
						value: "no-system",
						qualificationScore: 10,
						challenge: "foundational",
						willPayFor: "complete-solution",
					},
					{
						text: "Current software doesn't fit restaurant needs",
						value: "wrong-software",
						qualificationScore: 9,
						challenge: "fit",
						willPayFor: "restaurant-specific",
					},
					{
						text: "Not sure where to start",
						value: "unsure",
						qualificationScore: 4,
						challenge: "awareness",
						willPayFor: "education",
					},
					{
						text: "Other",
						value: "other",
						qualificationScore: 6,
						challenge: "unknown",
						willPayFor: "unknown",
					},
				],
				scoringWeight: 1.5,
				segmentationTags: ["challenge", "objection"],
				crmField: "primary_challenge",
			},

			{
				id: "q14",
				number: 14,
				text: "What would be most valuable to you right now?",
				answerType: "radio",
				options: [
					{
						text: "Talk to someone about my specific situation (15-min call)",
						value: "call",
						qualificationScore: 10,
						intent: "very-high",
						budget: "high",
						readyToBuy: true,
						nextStepType: "demo-call",
					},
					{
						text: "See a demo of how it works for restaurants like mine",
						value: "demo",
						qualificationScore: 8,
						intent: "high",
						budget: "medium-high",
						readyToBuy: true,
						nextStepType: "demo-video",
					},
					{
						text: "Free trial to test it out myself",
						value: "trial",
						qualificationScore: 7,
						intent: "medium-high",
						budget: "medium",
						readyToBuy: false,
						nextStepType: "trial-signup",
					},
					{
						text: "Read case studies from similar restaurants",
						value: "case-studies",
						qualificationScore: 6,
						intent: "medium",
						budget: "medium",
						readyToBuy: false,
						nextStepType: "nurture-content",
					},
					{
						text: "Just want to see pricing information first",
						value: "pricing",
						qualificationScore: 5,
						intent: "medium",
						budget: "price-conscious",
						readyToBuy: false,
						nextStepType: "pricing-page",
					},
					{
						text: "Download helpful resources/templates to use on my own",
						value: "diy-resources",
						qualificationScore: 3,
						intent: "low",
						budget: "low",
						readyToBuy: false,
						nextStepType: "free-resources",
					},
					{
						text: "Not ready for any of these yet",
						value: "not-ready",
						qualificationScore: 1,
						intent: "very-low",
						budget: "none",
						readyToBuy: false,
						nextStepType: "email-nurture",
					},
				],
				scoringWeight: 3, // MOST IMPORTANT - directly indicates buying intent
				segmentationTags: ["intent", "next-step"],
				crmField: "desired_next_step",
			},

			{
				id: "q15",
				number: 15,
				text: "Is there anything else we should know about your situation or goals?",
				answerType: "text",
				placeholder:
					"Optional - share any additional context that would help us provide better recommendations...",
				maxLength: 500,
				required: false,
				qualificationScore: null, // No scoring for open-ended
				scoringWeight: 0,
				segmentationTags: ["additional-context"],
				crmField: "additional_notes",
				aiAnalysis: true, // Flag for potential AI sentiment/intent analysis
			},
		],

		transitionMessages: {
			beforeQualification: "Great! Now just 5 more questions...",
		},
	},

	results: {
		scoreRanges: [
			{
				min: 0,
				max: 40,
				zone: "red",
				label: "Time to Level Up",
				message: "🎯 Huge opportunity here! You scored {score}/100...",
				emoji: "🎯",
			},
			{
				min: 41,
				max: 70,
				zone: "yellow",
				label: "You're On Track",
				message: "💪 Solid foundation! You scored {score}/100...",
				emoji: "💪",
			},
			{
				min: 71,
				max: 100,
				zone: "green",
				label: "Best-in-Class",
				message: "🌟 Impressive! You scored {score}/100...",
				emoji: "🌟",
			},
		],

		insightsHeadline: "3 Things to Focus On Right Now",

		// Insight generation rules
		insightRules: [
			{
				id: "automation-insight",
				triggerConditions: {
					questions: ["q1"],
					answerValues: ["mental"],
					minImpact: "high",
				},
				insight: {
					icon: "🤖",
					title: "Automation Could Save You 10+ Hours Per Week",
					bodyTemplate: (answers) => {
						return "Without a tracking system, you're likely spending 2-3 hours per day on inventory management across ordering, receiving, and counts. Automated inventory tracking typically saves managers 10-15 hours weekly - that's 500+ hours per year back in your schedule.";
					},
					calculation: (answers) => {
						return { hoursPerWeek: 10, hoursPerYear: 520 };
					},
					impactLevel: "high",
					priority: 1,
				},
			},

			{
				id: "consistency-insight",
				triggerConditions: {
					questions: ["q1"],
					answerValues: ["spreadsheet-adhoc"],
					minImpact: "medium",
				},
				insight: {
					icon: "📊",
					title: "Inconsistent Tracking Is Costing You Money",
					bodyTemplate: (answers) => {
						return "When inventory tracking happens 'when you remember,' you're flying blind on ordering decisions, food costs, and waste patterns. Restaurants with consistent tracking report 15-20% better control over food costs within the first 90 days.";
					},
					calculation: (answers) => {
						return { potentialSavings: "15-20%" };
					},
					impactLevel: "medium",
					priority: 2,
				},
			},

			{
				id: "expiration-loss-insight",
				triggerConditions: {
					questions: ["q2"],
					answerValues: ["occasional-check", "check-on-use"],
					minImpact: "high",
				},
				insight: {
					icon: "📅",
					title: "You're Losing Money to Expiration",
					bodyTemplate: (answers) => {
						return "Without proactive expiration tracking, the average restaurant loses $800-2,500 per month to spoilage. Automated expiration alerts catch items 3-5 days before they expire, allowing you to use them creatively or discount them rather than toss them. This single change typically cuts spoilage in half within 30 days.";
					},
					calculation: (answers) => {
						return { monthlyLoss: "$800-2,500", potentialSavings: "50%" };
					},
					impactLevel: "high",
					priority: 1,
				},
			},

			{
				id: "stockout-prevention-insight",
				triggerConditions: {
					questions: ["q3"],
					answerValues: ["often", "occasionally"],
					minImpact: "high",
				},
				insight: {
					icon: "🚨",
					title: "Stock-Outs Are Killing Your Revenue",
					bodyTemplate: (answers) => {
						const frequency =
							answers["q3"]?.value === "often"
								? "weekly"
								: "multiple times per month";
						return `Running out of ingredients ${frequency} means you're either sending customers away disappointed or scrambling to pay premium prices for emergency orders. Early warning alerts set at your reorder points prevent 90%+ of stock-outs and save you from paying 20-30% premiums on rush deliveries.`;
					},
					calculation: (answers) => {
						return { preventableStockouts: "90%+", emergencyPremium: "20-30%" };
					},
					impactLevel: "high",
					priority: 1,
				},
			},

			{
				id: "food-cost-blindness-insight",
				triggerConditions: {
					questions: ["q4"],
					answerValues: ["unsure"],
					minImpact: "high",
				},
				insight: {
					icon: "💰",
					title: "You Can't Manage What You Don't Measure",
					bodyTemplate: (answers) => {
						return "Not knowing your target food cost percentage is like driving without a speedometer. Industry best practice is 28-35% for most concepts. Without tracking this metric, you can't price your menu accurately, negotiate with vendors effectively, or identify your most (or least) profitable items. Most operators discover they were underpricing 3-5 menu items once they start tracking properly.";
					},
					calculation: (answers) => {
						return {
							targetRange: "28-35%",
							typicalIssues: "3-5 mispriced items",
						};
					},
					impactLevel: "high",
					priority: 1,
				},
			},

			{
				id: "food-cost-tracking-insight",
				triggerConditions: {
					questions: ["q4"],
					answerValues: ["know-no-track"],
					minImpact: "medium",
				},
				insight: {
					icon: "📈",
					title: "Tracking Food Cost Weekly Drives Better Decisions",
					bodyTemplate: (answers) => {
						return "You know your target, but monthly tracking means you're getting data too late to act on it. The restaurants that track food cost weekly or daily can spot trends immediately - a price spike from a vendor, unusual waste from a prep station, or theft. Weekly tracking allows you to course-correct before small problems become expensive ones.";
					},
					calculation: (answers) => {
						return { responseTime: "weeks vs months" };
					},
					impactLevel: "medium",
					priority: 2,
				},
			},

			{
				id: "receiving-bottleneck-insight",
				triggerConditions: {
					questions: ["q5"],
					answerValues: ["invoice-only", "delayed-entry"],
					minImpact: "high",
				},
				insight: {
					icon: "📦",
					title: "Your Receiving Process Is a Time Sink",
					bodyTemplate: (answers) => {
						const severity =
							answers["q5"]?.value === "invoice-only"
								? "massive"
								: "significant";
						return `Manual receiving creates a ${severity} bottleneck. Each delivery takes 15-30 minutes to log manually, and if you're not entering it immediately, you lose visibility into what you actually have in stock. Barcode scanning or digital receiving reduces this to 2-5 minutes per delivery - saving 4-6 hours per week for most operations.`;
					},
					calculation: (answers) => {
						return {
							timeSavings: "4-6 hours/week",
							perDelivery: "10-25 minutes",
						};
					},
					impactLevel: "high",
					priority: 1,
				},
			},

			{
				id: "menu-costing-accuracy-insight",
				triggerConditions: {
					questions: ["q6"],
					answerValues: ["gut-feeling", "estimate-invoices"],
					minImpact: "high",
				},
				insight: {
					icon: "📋",
					title: "Guessing at Recipe Costs Kills Profitability",
					bodyTemplate: (answers) => {
						const method =
							answers["q6"]?.value === "gut-feeling"
								? "gut feeling"
								: "rough estimates";
						return `Using ${method} for menu costing means you're likely off by 10-20% on many items. This compounds over time - what you think is a 30% food cost item might actually be 38%, destroying your margins. Accurate recipe costing reveals which items are truly profitable, which need price adjustments, and which should be removed from the menu entirely.`;
					},
					calculation: (answers) => {
						return { typicalError: "10-20%", impactOnMargins: "significant" };
					},
					impactLevel: "high",
					priority: 1,
				},
			},

			{
				id: "accessibility-insight",
				triggerConditions: {
					questions: ["q7"],
					answerValues: ["paper-files", "laptop-spreadsheet"],
					minImpact: "medium",
				},
				insight: {
					icon: "☁️",
					title: "Your Data Is Trapped",
					bodyTemplate: (answers) => {
						const location =
							answers["q7"]?.value === "paper-files"
								? "paper files"
								: "a single laptop";
						return `Keeping inventory in ${location} means you can only manage it from one place at one time. Cloud-based systems let you check inventory from home, place orders from your phone, and give your team access to the information they need without hunting down a binder or waiting for you to open your laptop. Plus, you'll never lose data to a spilled drink or crashed hard drive again.`;
					},
					calculation: (answers) => {
						return { accessibility: "anywhere, anytime" };
					},
					impactLevel: "medium",
					priority: 2,
				},
			},

			{
				id: "proactive-ordering-insight",
				triggerConditions: {
					questions: ["q8"],
					answerValues: ["realize-when-out", "check-during-orders"],
					minImpact: "high",
				},
				insight: {
					icon: "⚡",
					title: "Reactive Ordering Is Expensive",
					bodyTemplate: (answers) => {
						const severity =
							answers["q8"]?.value === "realize-when-out"
								? "discovering you're out during service"
								: "only checking when placing orders";
						return `${
							severity === "discovering you're out during service"
								? "By the time you"
								: "When you"
						} realize you need something, it's too late for optimal ordering. You end up paying for rush deliveries, accepting whatever price you can get, or making do without. Automated low-stock alerts at your reorder points give you 2-3 days' notice, so you can order on your regular schedule at regular prices. This alone saves most restaurants $200-500 per month.`;
					},
					calculation: (answers) => {
						return { monthlySavings: "$200-500", leadTime: "2-3 days notice" };
					},
					impactLevel: "high",
					priority: 1,
				},
			},

			{
				id: "inventory-visibility-insight",
				triggerConditions: {
					questions: ["q9"],
					answerValues: ["unsure", "monthly-update"],
					minImpact: "medium",
				},
				insight: {
					icon: "👁️",
					title: "Real-Time Visibility Changes Everything",
					bodyTemplate: (answers) => {
						const updateFrequency =
							answers["q9"]?.value === "unsure"
								? "don't know"
								: "only know monthly";
						return `When you ${updateFrequency} your inventory value, you can't make informed decisions about purchasing, menu pricing, or cash flow. Real-time inventory visibility means you always know exactly what you own, what it's worth, and whether you're hitting your targets. This is especially critical for multi-location operations or when you need to provide financial reports to partners or lenders.`;
					},
					calculation: (answers) => {
						return { visibility: "real-time vs delayed" };
					},
					impactLevel: "medium",
					priority: 2,
				},
			},

			{
				id: "waste-tracking-insight",
				triggerConditions: {
					questions: ["q10"],
					answerValues: ["no-tracking", "informal-patterns"],
					minImpact: "high",
				},
				insight: {
					icon: "🗑️",
					title: "Hidden Waste Is Destroying Your Margins",
					bodyTemplate: (answers) => {
						const trackingLevel =
							answers["q10"]?.value === "no-tracking"
								? "aren't tracking waste at all"
								: "only notice patterns informally";
						return `The fact that you ${trackingLevel} means money is walking out your back door and you don't even know how much. Industry data shows restaurants waste 4-10% of food purchased. That's $4,000-10,000 per year for every $100k in revenue. Waste tracking reveals exactly which items are being tossed, why, and how much it's costing you. Armed with this data, most restaurants cut waste by 40-60% in the first quarter.`;
					},
					calculation: (answers) => {
						return {
							industryWaste: "4-10%",
							annualImpact: "$4k-10k per $100k revenue",
							potentialReduction: "40-60%",
						};
					},
					impactLevel: "high",
					priority: 1,
				},
			},
		],

		// Dynamic CTA logic
		qualificationTiers: {
			high: {
				threshold: 70, // Combined score from qualification Qs
				headline: "You're Ready. Let's Do This.",
				ctaText: "Schedule Your Free 15-Min Demo",
				ctaLink: "/schedule-demo",
				secondaryText: "We'll show you exactly how this works for {role}...",
			},
			medium: {
				threshold: 40,
				headline: "See Exactly How This Works",
				demo: {
					title: "Watch 5-Minute Demo",
					link: "/demo-video",
				},
				guide: {
					title: "Download: '10 Inventory Hacks from Top Performers'",
					link: "/download-guide",
				},
			},
			low: {
				threshold: 0,
				headline: "Resources to Get Started",
				freeResources: [
					{
						title: "30-Day Inventory Transformation Roadmap",
						link: "/guide-1",
					},
					{
						title: "Restaurant Inventory Tracking Spreadsheet",
						link: "/template",
					},
					{ title: "Food Cost Percentage Calculator", link: "/calculator" },
				],
				newsletter: {
					ctaText: "Join 1,200+ restaurant operators getting weekly tips",
					emailCapture: true,
				},
			},
		},

		highIntent: {
			/* expanded config from qualificationTiers.high */
		},
		mediumIntent: {
			/* ... */
		},
		lowIntent: {
			/* ... */
		},
	},

	footer: {
		headline: "Questions? We're Here to Help",
		contactMethods: [
			{
				icon: "📧",
				label: "Email",
				value: "hello@example.com",
				link: "mailto:...",
			},
			{ icon: "📱", label: "Text", value: "(555) 123-4567", link: "sms:..." },
			{ icon: "💬", label: "Live Chat", value: "Chat now", action: "openChat" },
		],
		socialLinks: [
			{ platform: "instagram", handle: "@restaurantinventory", url: "..." },
			{ platform: "linkedin", handle: "Company Page", url: "..." },
			{ platform: "youtube", handle: "Video tutorials", url: "..." },
		],
		trustElements: [
			"🔒 SOC 2 Certified - Your data is secure",
			"⭐ 4.8/5 stars from 200+ restaurants",
		],
	},

	// Business logic
	scoring: {
		bestPracticeWeight: 0.7, // 70% of total score
		qualificationWeight: 0.3, // 30% of total score
		maxScore: 100,
	},

	// Analytics/tracking
	tracking: {
		landingPageView: "funnel_landing_view",
		ctaClick: "funnel_cta_click",
		contactCaptureComplete: "funnel_contact_captured",
		quizStart: "funnel_quiz_start",
		quizComplete: "funnel_quiz_complete",
		resultsView: "funnel_results_view",
		nextStepCTA: "funnel_nextstep_click",
	},
};
