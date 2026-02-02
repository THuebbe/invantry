// Vendors routing component - handles all vendor-related views
// Routes to specific vendor components based on subsection

import VendorList from "./VendorList";
import VendorDetail from "./VendorDetail";
import VendorMetricsDashboard from "./VendorMetricsDashboard";
import VendorForm from "./VendorForm";

export default function VendorsContent({ subsection, params }) {
  // Route to specific vendor component based on subsection
  switch (subsection) {
    case "detail":
      return <VendorDetail vendorId={params?.vendorId} />;
    case "metrics":
      return <VendorMetricsDashboard />;
    case "add":
      return <VendorForm mode="add" />;
    case "edit":
      return <VendorForm mode="edit" vendorId={params?.vendorId} />;
    default:
      return <VendorsOverview />;
  }
}

// Vendors Overview - shows when clicking main "Vendors" menu item
function VendorsOverview() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <VendorList title="Vendor Management" />
    </div>
  );
}
