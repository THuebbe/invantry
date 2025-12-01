// /frontend/src/components/dashboard/content/OrdersContent.jsx

import ViewOrders from "./orders/ViewOrders";
import CreateQuickOrder from "./orders/CreateQuickOrder";
import CreateCustomOrder from "./orders/CreateCustomOrder";
import ViewPurchaseOrders from "./orders/ViewPurchaseOrders";
import CreateQuickPOs from "./orders/CreateQuickPOs";
import CreateCustomPO from "./orders/CreateCustomPO";
import ReceivePurchaseOrder from "./orders/ReceivePurchaseOrder";
import EditPurchaseOrder from "./orders/EditPurchaseOrder";

export default function OrdersContent({ subsection, params }) {
	// Route to specific order component based on subsection
	switch (subsection) {
		case "view-orders":
			return <ViewOrders />;
		case "create-quick-order":
			return <CreateQuickOrder />;
		case "create-custom-order":
			return <CreateCustomOrder />;
		case "view-purchase-orders":
			return <ViewPurchaseOrders />;
		case "create-quick-pos":
			return <CreateQuickPOs />;
		case "create-custom-po":
			return <CreateCustomPO />;
		case "receive-po":
			return <ReceivePurchaseOrder poId={params?.poId} />;
		case "edit-po":
			return <EditPurchaseOrder poId={params?.poId} />;
		default:
			return <OrdersOverview />;
	}
}

// Orders Overview - shows when clicking main "Orders" menu item
function OrdersOverview() {
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6">
			<h2 className="text-2xl font-bold text-gray-900 mb-4">
				Orders Overview
			</h2>
			<p className="text-gray-600 mb-6">
				Manage your restaurant orders and purchase orders. Create orders for restocking, generate purchase orders by vendor, and track fulfillment.
			</p>

			<div className="grid grid-cols-2 gap-4">
				<OrderCard
					title="View Orders"
					description="See and sort through all orders by type, date, and status"
					icon="📋"
					path="/orders/view-orders"
					color="blue"
				/>
				<OrderCard
					title="Create Quick Order"
					description="Auto-populate order with all low stock items for fast restocking"
					icon="⚡"
					path="/orders/create-quick-order"
					color="green"
				/>
				<OrderCard
					title="Create Custom Order"
					description="Build orders from scratch with complete ingredient selection"
					icon="🛠️"
					path="/orders/create-custom-order"
					color="blue"
				/>
				<OrderCard
					title="View Purchase Orders"
					description="Manage purchase orders organized by vendor and supplier"
					icon="📦"
					path="/orders/view-purchase-orders"
					color="purple"
				/>
				<OrderCard
					title="Create Quick Purchase Orders"
					description="Auto-generate POs for all open orders grouped by vendor"
					icon="🚀"
					path="/orders/create-quick-pos"
					color="green"
				/>
				<OrderCard
					title="Create Custom Purchase Order"
					description="Build purchase orders from scratch for specific vendors"
					icon="📝"
					path="/orders/create-custom-po"
					color="purple"
				/>
			</div>
		</div>
	);
}

function OrderCard({ title, description, icon, path, color = "blue" }) {
	const colorClasses = {
		blue: "hover:border-blue-300 hover:shadow-blue-50",
		green: "hover:border-green-300 hover:shadow-green-50",
		purple: "hover:border-purple-300 hover:shadow-purple-50",
	};

	const handleClick = () => {
		// Update URL without full page reload - use React Router pattern
		window.history.pushState({}, "", path);
		// Trigger a custom event to notify the app of the route change
		window.dispatchEvent(new PopStateEvent("popstate"));
	};

	return (
		<button
			onClick={handleClick}
			className={`block w-full text-left p-6 bg-white border border-gray-200 rounded-lg ${colorClasses[color]} hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500`}
		>
			<div className="text-4xl mb-3">{icon}</div>
			<h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
			<p className="text-sm text-gray-600">{description}</p>
		</button>
	);
}
