// Integrations Settings - POS system connections and third-party integrations

import { useState } from "react";
import ToastIntegration from "./ToastIntegration";
import MenuImportPreview from "./MenuImportPreview";
import MenuImportExecutor from "./MenuImportExecutor";
import { Plug, CheckCircle, XCircle, ChevronRight } from "lucide-react";

const POS_SYSTEMS = [
	{
		id: "toast",
		name: "Toast POS",
		description: "Sync menus and sales data from Toast",
		logo: "/toast-logo.png",
		color: "orange",
	},
	{
		id: "square",
		name: "Square",
		description: "Connect your Square POS for menu and sales sync",
		logo: "/square-logo.png",
		color: "black",
		comingSoon: true,
	},
	{
		id: "clover",
		name: "Clover",
		description: "Integrate with Clover POS systems",
		logo: "/clover-logo.png",
		color: "green",
		comingSoon: true,
	},
];

// View states for the integration flow
const VIEWS = {
	LIST: "list",
	CONNECT: "connect",
	PREVIEW: "preview",
	IMPORT: "import",
};

export default function IntegrationsSettings({ params }) {
	const [selectedPOS, setSelectedPOS] = useState(null);
	const [currentView, setCurrentView] = useState(VIEWS.LIST);
	const [connections, setConnections] = useState({});

	const handleSelectPOS = (posId) => {
		setSelectedPOS(posId);
		setCurrentView(VIEWS.CONNECT);
	};

	const handleBack = () => {
		if (currentView === VIEWS.IMPORT) {
			setCurrentView(VIEWS.PREVIEW);
		} else if (currentView === VIEWS.PREVIEW) {
			setCurrentView(VIEWS.CONNECT);
		} else {
			setSelectedPOS(null);
			setCurrentView(VIEWS.LIST);
		}
	};

	const handleConnectionChange = (posId, connected) => {
		setConnections((prev) => ({ ...prev, [posId]: connected }));
	};

	const handleStartPreview = () => {
		setCurrentView(VIEWS.PREVIEW);
	};

	const handleStartImport = () => {
		setCurrentView(VIEWS.IMPORT);
	};

	const handleImportComplete = () => {
		// Could show a success message or refresh data
	};

	// Render based on current view and selected POS
	if (selectedPOS === "toast") {
		switch (currentView) {
			case VIEWS.IMPORT:
				return (
					<MenuImportExecutor
						posSystem="toast"
						onBack={handleBack}
						onComplete={handleImportComplete}
					/>
				);
			case VIEWS.PREVIEW:
				return (
					<MenuImportPreview
						posSystem="toast"
						onBack={handleBack}
						onStartImport={handleStartImport}
					/>
				);
			case VIEWS.CONNECT:
			default:
				return (
					<ToastIntegration
						onBack={() => {
							setSelectedPOS(null);
							setCurrentView(VIEWS.LIST);
						}}
						onConnectionChange={(connected) =>
							handleConnectionChange("toast", connected)
						}
						onStartPreview={handleStartPreview}
					/>
				);
		}
	}

	// Default: POS list view
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-2 bg-blue-100 rounded-lg">
					<Plug className="w-6 h-6 text-blue-600" />
				</div>
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
					<p className="text-gray-600">
						Connect your POS system to sync menus and track sales
					</p>
				</div>
			</div>

			<div className="mb-8">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Point of Sale Systems
				</h3>
				<div className="space-y-3">
					{POS_SYSTEMS.map((pos) => (
						<POSCard
							key={pos.id}
							pos={pos}
							isConnected={connections[pos.id]}
							onSelect={() => !pos.comingSoon && handleSelectPOS(pos.id)}
						/>
					))}
				</div>
			</div>

			<div className="border-t pt-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">
					Why Connect Your POS?
				</h3>
				<ul className="space-y-2 text-gray-600">
					<li className="flex items-start gap-2">
						<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
						<span>Automatically sync menu items from your POS</span>
					</li>
					<li className="flex items-start gap-2">
						<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
						<span>Track sales and automatically deduct inventory</span>
					</li>
					<li className="flex items-start gap-2">
						<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
						<span>Get accurate food cost calculations</span>
					</li>
					<li className="flex items-start gap-2">
						<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
						<span>Reduce manual data entry errors</span>
					</li>
				</ul>
			</div>
		</div>
	);
}

function POSCard({ pos, isConnected, onSelect }) {
	const colorClasses = {
		orange: "border-orange-200 bg-orange-50",
		black: "border-gray-200 bg-gray-50",
		green: "border-green-200 bg-green-50",
	};

	return (
		<button
			onClick={onSelect}
			disabled={pos.comingSoon}
			className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
				pos.comingSoon
					? "opacity-60 cursor-not-allowed bg-gray-50"
					: "hover:shadow-md cursor-pointer bg-white"
			}`}
		>
			<div className="flex items-center gap-4">
				<div
					className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[pos.color]}`}
				>
					<span className="text-lg font-bold">{pos.name.charAt(0)}</span>
				</div>
				<div className="text-left">
					<div className="flex items-center gap-2">
						<h4 className="font-semibold text-gray-900">{pos.name}</h4>
						{pos.comingSoon && (
							<span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
								Coming Soon
							</span>
						)}
						{isConnected && (
							<span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
								<CheckCircle className="w-3 h-3" />
								Connected
							</span>
						)}
					</div>
					<p className="text-sm text-gray-600">{pos.description}</p>
				</div>
			</div>
			{!pos.comingSoon && (
				<ChevronRight className="w-5 h-5 text-gray-400" />
			)}
		</button>
	);
}
