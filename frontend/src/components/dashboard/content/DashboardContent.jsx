export default function DashboardContent() {
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">
				Welcome to Your Dashboard
			</h2>
			<p className="text-gray-600 mb-6">
				Get a quick overview of your restaurant inventory and operations.
			</p>

			<div className="grid grid-cols-2 gap-4">
				<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
					<h3 className="font-semibold text-blue-900 mb-2">Quick Stats</h3>
					<p className="text-sm text-blue-700">
						Check your metrics on the right to see important alerts and trends.
					</p>
				</div>

				<div className="p-4 bg-green-50 rounded-lg border border-green-200">
					<h3 className="font-semibold text-green-900 mb-2">Quick Actions</h3>
					<p className="text-sm text-green-700">
						Use the cards above to receive orders, remove stock, or create
						orders quickly.
					</p>
				</div>

				<div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
					<h3 className="font-semibold text-purple-900 mb-2">Navigation</h3>
					<p className="text-sm text-purple-700">
						Use the sidebar to explore inventory, orders, receiving, and
						reports.
					</p>
				</div>

				<div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
					<h3 className="font-semibold text-yellow-900 mb-2">
						Recent Activity
					</h3>
					<p className="text-sm text-yellow-700">
						Coming soon: See your recent inventory changes and order updates.
					</p>
				</div>
			</div>
		</div>
	);
}
