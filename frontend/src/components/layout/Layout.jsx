import Sidebar from "./Sidebar";

export default function Layout({ children, pageTitle }) {
	return (
		<div className="h-screen flex flex-col overflow-hidden">
			{" "}
			{/* 👈 CHANGE: h-screen and overflow-hidden */}
			{/* Header */}
			<header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 shadow-sm flex-shrink-0">
				{" "}
				{/* 👈 ADD: flex-shrink-0 */}
				<div className="flex items-center gap-4 flex-1">
					<div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
						RI
					</div>
					<h1 className="text-xl font-semibold text-gray-900">
						Restaurant Inventory
					</h1>
					<div className="w-px h-8 bg-gray-300"></div>
					<h2 className="text-lg text-gray-600">{pageTitle || "Dashboard"}</h2>
				</div>
				<div className="flex items-center gap-3">
					<button className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
						🔔
					</button>
					<button className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
						⚙️
					</button>
				</div>
			</header>
			{/* Main Content Area */}
			<div className="flex flex-1 overflow-hidden relative">
				{" "}
				{/* 👈 CHANGE: added relative and overflow-hidden */}
				<Sidebar />
				<main className="flex-1 p-6 overflow-y-auto bg-gray-50">
					{" "}
					{/* 👈 CHANGE: added bg-gray-50 */}
					{children}
				</main>
			</div>
		</div>
	);
}
