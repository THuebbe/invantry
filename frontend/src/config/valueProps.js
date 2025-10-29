import { CircleDollarSign, CloudLightning, Trash2 } from "lucide-react";

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
