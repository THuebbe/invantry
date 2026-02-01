// Vendors routing component - handles all vendor-related views
// Routes to specific vendor components based on subsection

import { useNavigate } from "react-router-dom";
import VendorList from "./VendorList";
import VendorDetail from "./VendorDetail";
import VendorMetricsDashboard from "./VendorMetricsDashboard";
import VendorForm from "./VendorForm";
import { Building2, TrendingUp, Plus, List } from "lucide-react";

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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Vendor Management
      </h2>
      <p className="text-gray-600 mb-6">
        Manage your supplier relationships, track vendor performance, and
        maintain vendor contacts and documentation.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <VendorCard
          title="All Vendors"
          description="View and manage all your suppliers and vendors"
          icon={List}
          path="/vendors/list"
          color="blue"
        />
        <VendorCard
          title="Vendor Metrics"
          description="Track vendor performance and key metrics"
          icon={TrendingUp}
          path="/vendors/metrics"
          color="green"
        />
        <VendorCard
          title="Add Vendor"
          description="Register a new supplier or vendor"
          icon={Plus}
          path="/vendors/add"
          color="purple"
        />
      </div>

      {/* Show vendor list by default */}
      <div className="border-t pt-6">
        <VendorList />
      </div>
    </div>
  );
}

function VendorCard({ title, description, icon: Icon, path, color = "blue" }) {
  const navigate = useNavigate();

  const colorClasses = {
    blue: "hover:border-blue-300 hover:shadow-blue-50",
    green: "hover:border-green-300 hover:shadow-green-50",
    purple: "hover:border-purple-300 hover:shadow-purple-50",
  };

  return (
    <button
      onClick={() => navigate(path)}
      className={`bg-white border border-gray-200 rounded-lg p-4 text-left transition-all hover:shadow-md ${colorClasses[color]}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
}
