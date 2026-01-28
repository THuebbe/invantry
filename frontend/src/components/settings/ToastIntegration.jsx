// Toast POS Integration - Configuration and connection management

import { useState } from "react";
import {
	usePOSVerify,
	usePOSSaveCredentials,
	usePOSImportPreview,
} from "../../hooks/usePOSImport";
import {
	ArrowLeft,
	CheckCircle,
	XCircle,
	Loader2,
	ExternalLink,
	AlertCircle,
	Eye,
	EyeOff,
	RefreshCw,
	BookOpen,
} from "lucide-react";

export default function ToastIntegration({ onBack, onConnectionChange, onStartPreview }) {
	const [credentials, setCredentials] = useState({
		restaurantGuid: "",
		clientId: "",
		clientSecret: "",
		apiUrl: "https://ws-sandbox-api.toasttab.com",
	});
	const [showSecret, setShowSecret] = useState(false);
	const [showGuide, setShowGuide] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState(null);

	const verifyMutation = usePOSVerify();
	const saveCredentialsMutation = usePOSSaveCredentials();
	const previewQuery = usePOSImportPreview("toast", connectionStatus === "connected");

	const handleInputChange = (field, value) => {
		setCredentials((prev) => ({ ...prev, [field]: value }));
		setConnectionStatus(null);
	};

	const handleTestConnection = async () => {
		if (!credentials.restaurantGuid || !credentials.clientId || !credentials.clientSecret) {
			setConnectionStatus("missing_fields");
			return;
		}

		try {
			// First save credentials, then verify
			await saveCredentialsMutation.mutateAsync({
				posSystem: "toast",
				credentials: {
					restaurantGuid: credentials.restaurantGuid,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					apiUrl: credentials.apiUrl,
				},
			});

			const result = await verifyMutation.mutateAsync({ posSystem: "toast" });

			if (result.connected) {
				setConnectionStatus("connected");
				onConnectionChange?.(true);
			} else {
				setConnectionStatus("failed");
				onConnectionChange?.(false);
			}
		} catch (error) {
			console.error("Connection test failed:", error);
			setConnectionStatus("error");
			onConnectionChange?.(false);
		}
	};

	const isLoading = verifyMutation.isPending || saveCredentialsMutation.isPending;

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<button
					onClick={onBack}
					className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<ArrowLeft className="w-5 h-5 text-gray-600" />
				</button>
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
						<span className="text-xl font-bold text-orange-600">T</span>
					</div>
					<div>
						<h2 className="text-xl font-bold text-gray-900">Toast POS</h2>
						<p className="text-sm text-gray-600">
							Connect to sync menus and track sales
						</p>
					</div>
				</div>
			</div>

			{/* Setup Guide Toggle */}
			<button
				onClick={() => setShowGuide(!showGuide)}
				className="w-full flex items-center justify-between p-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
			>
				<div className="flex items-center gap-3">
					<BookOpen className="w-5 h-5 text-blue-600" />
					<span className="font-medium text-blue-900">
						How to get Toast API credentials
					</span>
				</div>
				<span className="text-blue-600">{showGuide ? "Hide" : "Show"}</span>
			</button>

			{/* Setup Guide Content */}
			{showGuide && (
				<div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
					<h3 className="font-semibold text-gray-900 mb-3">
						Getting Started with Toast Integration
					</h3>
					<ol className="space-y-4 text-sm text-gray-700">
						<li className="flex gap-3">
							<span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
								1
							</span>
							<div>
								<p className="font-medium">Apply to Toast Partner Program</p>
								<p className="text-gray-600 mt-1">
									Visit{" "}
									<a
										href="https://pos.toasttab.com/partners"
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:underline inline-flex items-center gap-1"
									>
										pos.toasttab.com/partners
										<ExternalLink className="w-3 h-3" />
									</a>{" "}
									and apply as an "Integration Partner". Describe your use case
									as inventory management for menu and sales sync.
								</p>
							</div>
						</li>
						<li className="flex gap-3">
							<span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
								2
							</span>
							<div>
								<p className="font-medium">Create an App in Developer Portal</p>
								<p className="text-gray-600 mt-1">
									Once approved, access the Toast Developer Portal and create a
									new application. This generates your Client ID and Client
									Secret.
								</p>
							</div>
						</li>
						<li className="flex gap-3">
							<span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
								3
							</span>
							<div>
								<p className="font-medium">Find Your Restaurant GUID</p>
								<p className="text-gray-600 mt-1">
									The Restaurant GUID is found in Toast Web under{" "}
									<strong>Admin &gt; Toast API</strong> or provided during
									partner setup. It's a unique identifier for your restaurant.
								</p>
							</div>
						</li>
						<li className="flex gap-3">
							<span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
								4
							</span>
							<div>
								<p className="font-medium">Start with Sandbox (Recommended)</p>
								<p className="text-gray-600 mt-1">
									Use the sandbox API URL for testing before switching to
									production. This allows you to verify the integration without
									affecting real data.
								</p>
							</div>
						</li>
					</ol>
					<div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
						<div className="flex items-start gap-2">
							<AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
							<p className="text-sm text-amber-800">
								<strong>Note:</strong> Partner approval typically takes 1-2
								weeks. You can explore the rest of Invantry while waiting!
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Credentials Form */}
			<div className="space-y-4 mb-6">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Restaurant GUID
					</label>
					<input
						type="text"
						value={credentials.restaurantGuid}
						onChange={(e) => handleInputChange("restaurantGuid", e.target.value)}
						placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					/>
					<p className="mt-1 text-xs text-gray-500">
						Found in Toast Web under Admin &gt; Toast API
					</p>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Client ID
					</label>
					<input
						type="text"
						value={credentials.clientId}
						onChange={(e) => handleInputChange("clientId", e.target.value)}
						placeholder="Your Toast API Client ID"
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Client Secret
					</label>
					<div className="relative">
						<input
							type={showSecret ? "text" : "password"}
							value={credentials.clientSecret}
							onChange={(e) => handleInputChange("clientSecret", e.target.value)}
							placeholder="Your Toast API Client Secret"
							className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						/>
						<button
							type="button"
							onClick={() => setShowSecret(!showSecret)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							{showSecret ? (
								<EyeOff className="w-4 h-4" />
							) : (
								<Eye className="w-4 h-4" />
							)}
						</button>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						API URL
					</label>
					<select
						value={credentials.apiUrl}
						onChange={(e) => handleInputChange("apiUrl", e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					>
						<option value="https://ws-sandbox-api.toasttab.com">
							Sandbox (Testing)
						</option>
						<option value="https://ws-api.toasttab.com">
							Production (Live Data)
						</option>
					</select>
					<p className="mt-1 text-xs text-gray-500">
						Use Sandbox for testing, Production for live restaurant data
					</p>
				</div>
			</div>

			{/* Connection Status */}
			{connectionStatus && (
				<div
					className={`mb-6 p-4 rounded-lg border ${
						connectionStatus === "connected"
							? "bg-green-50 border-green-200"
							: connectionStatus === "missing_fields"
							? "bg-amber-50 border-amber-200"
							: "bg-red-50 border-red-200"
					}`}
				>
					<div className="flex items-center gap-3">
						{connectionStatus === "connected" ? (
							<CheckCircle className="w-5 h-5 text-green-600" />
						) : connectionStatus === "missing_fields" ? (
							<AlertCircle className="w-5 h-5 text-amber-600" />
						) : (
							<XCircle className="w-5 h-5 text-red-600" />
						)}
						<div>
							<p
								className={`font-medium ${
									connectionStatus === "connected"
										? "text-green-800"
										: connectionStatus === "missing_fields"
										? "text-amber-800"
										: "text-red-800"
								}`}
							>
								{connectionStatus === "connected"
									? "Connected Successfully!"
									: connectionStatus === "missing_fields"
									? "Please fill in all required fields"
									: "Connection Failed"}
							</p>
							{connectionStatus === "connected" && previewQuery.data && (
								<p className="text-sm text-green-700 mt-1">
									Found {previewQuery.data.summary?.totalItems || 0} menu items
									ready to import
								</p>
							)}
							{connectionStatus === "failed" && (
								<p className="text-sm text-red-700 mt-1">
									Please check your credentials and try again
								</p>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Actions */}
			<div className="flex gap-3">
				<button
					onClick={handleTestConnection}
					disabled={isLoading}
					className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{isLoading ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Testing Connection...
						</>
					) : (
						<>
							<RefreshCw className="w-4 h-4" />
							Test Connection
						</>
					)}
				</button>
			</div>

			{/* Connected Actions */}
			{connectionStatus === "connected" && (
				<div className="mt-6 pt-6 border-t">
					<h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
					<div className="space-y-2">
						<button
							onClick={onStartPreview}
							className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
						>
							<span className="text-gray-700">Import Menu Items from Toast</span>
							<span className="text-blue-600">Start Import &rarr;</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
