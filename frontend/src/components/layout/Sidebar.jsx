// frontend\src\components\layout\Sidebar.jsx

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import { menuItems } from "../../config/menuItems";

export default function Sidebar({ isMobileMenuOpen, onCloseMobileMenu }) {
	const location = useLocation();
	const [openSubmenu, setOpenSubmenu] = useState(null);

	const isActive = (path) => {
		return location.pathname === path;
	};

	const isParentActive = (item) => {
		if (location.pathname === item.path) return true;
		return item.subItems.some((sub) => location.pathname === sub.path);
	};

	const handleItemClick = (item) => {
		if (item.subItems && item.subItems.length > 0) {
			// Toggle submenu
			setOpenSubmenu(openSubmenu === item.id ? null : item.id);
		}
	};

	const closeSubmenu = () => {
		setOpenSubmenu(null);
	};

	const handleNavigation = () => {
		closeSubmenu();
		// Close mobile menu when navigating
		if (onCloseMobileMenu) {
			onCloseMobileMenu();
		}
	};

	const SidebarContent = () => (
		<nav className="flex-1 p-4 overflow-y-auto">
			<div className="space-y-1">
				{menuItems.map((item) => {
					const Icon = item.icon;
					const hasSubItems = item.subItems && item.subItems.length > 0;
					const parentActive = isParentActive(item);

					const isSubmenuOpen = openSubmenu === item.id;

					return (
						<div key={item.id}>
							{hasSubItems ? (
								// Parent item with subitems - clickable for both navigation AND submenu
								<>
									<div className="relative">
										<Link
											to={item.path}
											className={`
                        flex items-center gap-3 p-3 rounded-lg
                        transition-colors flex-1
                        ${
													parentActive
														? "bg-green-50 text-green-700 font-medium"
														: "text-gray-700 hover:bg-gray-50"
												}
                      `}
											onClick={handleNavigation}
										>
											<Icon size={20} />
											<span>{item.label}</span>
										</Link>

										{/* Chevron button - opens submenu */}
										<button
											onClick={() => handleItemClick(item)}
											className={`
                        absolute right-2 top-1/2 -translate-y-1/2
                        w-8 h-8 rounded-lg flex items-center justify-center
                        hover:bg-gray-100 transition-colors
                        ${parentActive ? "text-green-700" : "text-gray-400"}
                      `}
										>
											<ChevronRight
												size={16}
												className={`transform transition-transform ${
													isSubmenuOpen ? "rotate-90" : ""
												}`}
											/>
										</button>
									</div>

									{/* Mobile inline submenu */}
									{isSubmenuOpen && (
										<div className="md:hidden ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
											{item.subItems.map((subItem) => (
												<Link
													key={subItem.id}
													to={subItem.path}
													onClick={handleNavigation}
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
								</>
							) : (
								// Regular item without subitems
								<Link
									to={item.path}
									className={`
                    flex items-center gap-3 p-3 rounded-lg
                    transition-colors
                    ${
											parentActive
												? "bg-green-50 text-green-700 font-medium"
												: "text-gray-700 hover:bg-gray-50"
										}
                  `}
									onClick={handleNavigation}
								>
									<Icon size={20} />
									<span>{item.label}</span>
								</Link>
							)}
						</div>
					);
				})}
			</div>
		</nav>
	);

	return (
		<>
			{/* Desktop Sidebar - hidden on mobile */}
			<aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-full">
				<SidebarContent />
			</aside>

			{/* Mobile Sidebar Overlay */}
			{isMobileMenuOpen && (
				<div
					className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
					onClick={onCloseMobileMenu}
				/>
			)}

			{/* Mobile Sidebar Drawer */}
			<aside
				className={`
					md:hidden fixed top-0 left-0 h-full w-64 bg-white z-50
					transform transition-transform duration-300 ease-in-out
					${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
				`}
			>
				{/* Mobile sidebar header */}
				<div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
							P
						</div>
						<span className="font-semibold text-gray-900">Pantry Pro</span>
					</div>
					<button
						onClick={onCloseMobileMenu}
						className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
					>
						<X size={20} />
					</button>
				</div>
				<SidebarContent />
			</aside>

			{/* Overlay for secondary submenu - Desktop only */}
			{openSubmenu && (
				<div
					className="hidden md:block fixed inset-0 bg-black bg-opacity-20 z-20"
					style={{ left: "256px" }}
					onClick={closeSubmenu}
				/>
			)}

			{/* Secondary Sidebar - Desktop only */}
			{openSubmenu && (
				<div
					className="hidden md:block fixed top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-xl z-30 transform transition-transform duration-300 ease-in-out"
					style={{ left: "256px" }}
				>
					<div className="p-4">
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

						<div className="space-y-1">
							{menuItems
								.find((item) => item.id === openSubmenu)
								?.subItems.map((subItem) => (
									<Link
										key={subItem.id}
										to={subItem.path}
										onClick={handleNavigation}
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
