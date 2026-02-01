// /frontend/src/components/dashboard/QuickActionCard.jsx

import { Link } from "react-router-dom";

export default function QuickActionCard({ action }) {
	const Icon = action.icon;

	// Color mapping for different action types
	const colorClasses = {
		green: "bg-green-50 hover:bg-green-100 border-green-200 text-green-700",
		red: "bg-red-50 hover:bg-red-100 border-red-200 text-red-700",
		blue: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700",
		purple:
			"bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700",
	};

	return (
		<Link
			to={action.path}
			className={`
        bg-white border-2 rounded-lg p-3 md:p-6 h-20 md:h-32
        flex flex-col items-center justify-center gap-1 md:gap-2
        transition-all hover:shadow-md cursor-pointer
        ${
					colorClasses[action.color] ||
					"bg-gray-50 hover:bg-gray-100 border-gray-200"
				}
      `}
		>
			<Icon size={24} className="md:w-8 md:h-8" />
			<span className="font-semibold text-center text-xs md:text-base leading-tight">{action.label}</span>
		</Link>
	);
}
