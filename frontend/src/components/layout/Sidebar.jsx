// /frontend/src/components/dashboard/layout/Sidebar.jsx

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { menuItems } from "../../config/menuItems";

export default function Sidebar() {
	const location = useLocation();
	const [openSubmenu, setOpenSubmenu] = useState(null); // Track which submenu is open

	const isActive = (path) => {
		return location.pathname === path;
	};

	const isParentActive = (item) => {
		if (location.pathname === item.path) return true;
		return item.subItems.some((sub) => location.pathname === sub.path);
	};

	const handleItemClick = (item) => {
		if (item.subItems && item.subItems.length > 0) {
			setOpenSubmenu(openSubmenu === item.id ? null : item.id); // Toggle submenu
		}
	};

	const closeSubmenu = () => {
		setOpenSubmenu(null);
	};

	return (
		<>
			{/* Main Sidebar */}
			<aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
				<nav className="flex-1 p-4 overflow-y-auto">
					<div className="space-y-1">
						{menuItems.map((item) => {
							const Icon = item.icon;
							const hasSubItems = item.subItems && item.subItems.length > 0;
							const parentActive = isParentActive(item);

							return (
								<div key={item.id}>
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
										onClick={() => handleItemClick(item)}
									>
										{hasSubItems ? (
											<div className="flex items-center gap-3 flex-1">
												<Icon size={20} />
												<span>{item.label}</span>
											</div>
										) : (
											<Link
												to={item.path}
												className="flex items-center gap-3 flex-1"
											>
												<Icon size={20} />
												<span>{item.label}</span>
											</Link>
										)}

										{hasSubItems && (
											<ChevronRight
												size={16}
												className="text-gray-400"
											/>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</nav>
			</aside>

			{/* Overlay - appears when submenu is open */}
			{openSubmenu && (
				<div
					className="fixed inset-0 bg-black bg-opacity-20 z-20"
					style={{ left: "256px" }} // Start after main sidebar (64 * 4 = 256px)
					onClick={closeSubmenu}
				/>
			)}

			{/* Secondary Sidebar - slides in from left */}
			{openSubmenu && (
				<div
					className="fixed top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-xl z-30 transform transition-transform duration-300 ease-in-out"
					style={{ left: "256px" }} // Position next to main sidebar
				>
					<div className="p-4">
						{/* Submenu Header */}
						<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
							<h3 className="font-semibold text-gray-900">
								{menuItems.find((item) => item.id === openSubmenu)?.label}
							</h3>
							<button
								onClick={closeSubmenu}
								className="text-gray-400 hover:text-gray-600"
							>
								✕
							</button>
						</div>

						{/* Submenu Items */}
						<div className="space-y-1">
							{menuItems
								.find((item) => item.id === openSubmenu)
								?.subItems.map((subItem) => (
									<Link
										key={subItem.id}
										to={subItem.path}
										onClick={closeSubmenu}
										className={`
                      block p-3 rounded-lg text-sm transition-colors
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
					</div>
				</div>
			)}
		</>
	);
}
