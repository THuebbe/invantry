import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { menuItems } from "../../config/menuItems";

export default function Sidebar() {
	const location = useLocation();
	const [expandedItems, setExpandedItems] = useState(["dashboard"]); // Default: dashboard expanded

	const toggleExpand = (itemId) => {
		setExpandedItems((prev) =>
			prev.includes(itemId)
				? prev.filter((id) => id !== itemId)
				: [...prev, itemId]
		);
	};

	const isActive = (path) => {
		return location.pathname === path;
	};

	const isParentActive = (item) => {
		// Check if current path matches parent or any sub-item
		if (location.pathname === item.path) return true;
		return item.subItems.some((sub) => location.pathname === sub.path);
	};

	return (
		<aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
			<nav className="flex-1 p-4 overflow-y-auto">
				<div className="space-y-1">
					{menuItems.map((item) => {
						const Icon = item.icon;
						const isExpanded = expandedItems.includes(item.id);
						const hasSubItems = item.subItems && item.subItems.length > 0;
						const parentActive = isParentActive(item);

						return (
							<div key={item.id}>
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
									onClick={() => (hasSubItems ? toggleExpand(item.id) : null)}
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
											<Link
												key={subItem.id}
												to={subItem.path}
												className={`
                          block p-2 rounded-lg text-sm transition-colors
                          ${
														isActive(subItem.path)
															? "bg-green-50 text-green-700 font-medium"
															: "text-gray-600 hover:bg-gray-50"
													}
                        `}
											>
												{subItem.label}
											</Link>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</nav>
		</aside>
	);
}
