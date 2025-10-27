import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import SidebarSubItem from "./SidebarSubItem";

export default function SidebarItem({ item, isExpanded, onToggle }) {
	const location = useLocation();
	const Icon = item.icon;
	const hasSubItems = item.subItems && item.subItems.length > 0;

	const isParentActive = () => {
		if (location.pathname === item.path) return true;
		return item.subItems.some((sub) => location.pathname === sub.path);
	};

	const parentActive = isParentActive();

	return (
		<div>
			{/* Main Menu Item */}
			<div
				className={`
          flex items-center justify-between p-3 rounded-lg cursor-pointer
          transition-colors
          ${
						parentActive
							? "bg-green-50 text-green-700 font-medium"
							: "text-gray-700 hover:bg-gray-50"
					}
        `}
				onClick={() => (hasSubItems ? onToggle() : null)}
			>
				<Link
					to={item.path}
					className="flex items-center gap-3 flex-1"
					onClick={(e) => hasSubItems && e.preventDefault()}
				>
					<Icon size={20} />
					<span>{item.label}</span>
				</Link>

				{hasSubItems && (
					<span className="text-gray-400">
						{isExpanded ? (
							<ChevronDown size={16} />
						) : (
							<ChevronRight size={16} />
						)}
					</span>
				)}
			</div>

			{/* Sub Items */}
			{hasSubItems && isExpanded && (
				<div className="ml-8 mt-1 space-y-1">
					{item.subItems.map((subItem) => (
						<SidebarSubItem
							key={subItem.id}
							subItem={subItem}
						/>
					))}
				</div>
			)}
		</div>
	);
}
