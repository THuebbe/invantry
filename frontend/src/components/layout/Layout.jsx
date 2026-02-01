// /frontend/src/components/dashboard/layout/Layout.jsx

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

export default function Layout({ children, pageTitle }) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	return (
		<div className="h-screen flex flex-col overflow-hidden max-w-none w-full text-left p-0">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 h-14 md:h-16 flex items-center px-3 md:px-6 shadow-sm flex-shrink-0">
				<div className="flex items-center gap-2 md:gap-4 flex-1">
					{/* Hamburger menu - mobile only */}
					<button
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="md:hidden w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
					>
						{isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
					</button>
					<div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base">
						P
					</div>
					<h1 className="text-base md:text-xl font-semibold text-gray-900">Pantry Pro</h1>
					<div className="hidden md:block w-px h-8 bg-gray-300"></div>
					<h2 className="hidden md:block text-lg text-gray-600">{pageTitle || "Dashboard"}</h2>
				</div>
				<div className="flex items-center gap-2 md:gap-3">
					<button className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
						🔔
					</button>
					<button className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
						⚙️
					</button>
				</div>
			</header>
			{/* Main Content Area */}
			<div className="flex flex-1 overflow-hidden relative">
				<Sidebar
					isMobileMenuOpen={isMobileMenuOpen}
					onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
				/>
				<main className="flex-1 p-3 md:p-6 overflow-y-auto bg-gray-50">
					{children}
				</main>
			</div>
		</div>
	);
}
