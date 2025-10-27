import { Link, useLocation } from "react-router-dom";

export default function SidebarSubItem({ subItem }) {
	const location = useLocation();

	const isActive = location.pathname === subItem.path;

	return (
		<Link
			to={subItem.path}
			className={`
        block p-2 rounded-lg text-sm transition-colors
        ${
					isActive
						? "bg-green-50 text-green-700 font-medium"
						: "text-gray-600 hover:bg-gray-50"
				}
      `}
		>
			{subItem.label}
		</Link>
	);
}
