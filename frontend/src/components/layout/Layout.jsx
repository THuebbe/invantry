import Sidebar from "./Sidebar";

export default function Layout({ children, pageTitle }) {
	return (
		<div className="min-h-screen bg-gray-100 flex flex-col">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 shadow-sm">
				<div className="flex items-center gap-4 flex-1">
					{/* Logo */}
					<div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
						RI
					</div>

					{/* App Name */}
					<h1 className="text-xl font-semibold text-gray-900">
						Restaurant Inventory
					</h1>

					{/* Divider */}
					<div className="w-px h-8 bg-gray-300"></div>

					{/* Page Title */}
					<h2 className="text-lg text-gray-600">{pageTitle || "Dashboard"}</h2>
				</div>

				{/* Header Actions (right side) */}
				<div className="flex items-center gap-3">
					{/* Placeholder for icons/actions */}
					<button className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
						🔔
					</button>
					<button className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
						⚙️
					</button>
				</div>
			</header>

			{/* Main Content Area */}
			<div className="flex flex-1">
				{/* Sidebar */}
				<Sidebar />

				{/* Main Content */}
				<main className="flex-1 p-6">{children}</main>
			</div>
		</div>
	);
}
