// Receiving routing component - handles all receiving-related views

import ReceivingDashboard from "../../receiving/ReceivingDashboard";
import ReceiveShipment from "../../receiving/ReceiveShipment";
import ReceivingHistory from "../../receiving/ReceivingHistory";

export default function ReceivingContent({ subsection, params }) {
	switch (subsection) {
		case "new":
			return <ReceiveShipment params={params} />;
		case "history":
			return <ReceivingHistory />;
		default:
			return <ReceivingDashboard />;
	}
}
