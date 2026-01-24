// /frontend/src/components/dashboard/content/RecipesContent.jsx

import AddRecipe from "./recipes/AddRecipe.jsx";

export default function RecipesContent({ subsection }) {
	// Route to specific order component based on subsection
	switch (subsection) {
		case "new":
			return <AddRecipe />;
		default:
			return <RecipesOverview />;
	}
}

// Orders Overview - shows when clicking main "Orders" menu item
function RecipesOverview(subsection) {
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">
				Recipes {subsection ? `- ${subsection}` : ""}
			</h2>
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
				<p className="text-blue-700">Recipe section coming soon!</p>
			</div>
		</div>
	);
}
