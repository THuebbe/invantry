// VendorDetail.jsx - Main vendor detail page (full width layout)
// Layout: Vendor info (fixed) + Tabs (fixed) + Tab content (scrollable)
// Metrics are displayed in the Dashboard's right sidebar via MetricsColumn

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useVendorSummary } from "../../hooks/useVendors";
import VendorInfoForm from "./VendorInfoForm";
import VendorTabs from "./VendorTabs";
import VendorDetailSkeleton from "./VendorDetailSkeleton";

// Tab content components
import OverviewTab from "./tabs/OverviewTab";
import AddressesTab from "./tabs/AddressesTab";
import ContactsTab from "./tabs/ContactsTab";
import PaymentTab from "./tabs/PaymentTab";
import DocumentsTab from "./tabs/DocumentsTab";
import PerformanceTab from "./tabs/PerformanceTab";
import ItemsTab from "./tabs/ItemsTab";

export default function VendorDetail({ vendorId: propVendorId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabContentRef = useRef(null);

  // Get vendor ID from props or query params
  const vendorId = propVendorId || searchParams.get("vendorId");

  // Active tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Scroll to top when tab changes
  useEffect(() => {
    if (tabContentRef.current) {
      tabContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  // Fetch vendor summary with all related data (items, addresses, contacts, etc.)
  const { data: vendor, isLoading, error, refetch } = useVendorSummary(vendorId);

  // Loading state
  if (isLoading) {
    return <VendorDetailSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/vendors")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Error Loading Vendor</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">
            {error.message || 'An error occurred while loading vendor details. Please try again.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm rounded"
          >
            Retry
          </button>
          <button
            onClick={() => navigate("/vendors")}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 text-sm rounded"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  // If vendor not found, show error
  if (!vendor) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/vendors")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Vendor Not Found</h2>
        </div>
        <p className="text-gray-600 mb-4">
          The vendor you're looking for could not be found.
        </p>
        <button
          onClick={() => navigate("/vendors")}
          className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm rounded"
        >
          Back to Vendors
        </button>
      </div>
    );
  }

  // Render tab content based on active tab
  // Pass vendor summary data to tabs to avoid redundant API calls
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab vendorId={vendorId} vendor={vendor} />;
      case "addresses":
        return <AddressesTab vendorId={vendorId} initialAddresses={vendor?.addresses} onRefetch={refetch} />;
      case "contacts":
        return <ContactsTab vendorId={vendorId} initialContacts={vendor?.contacts} onRefetch={refetch} />;
      case "payment":
        return <PaymentTab vendorId={vendorId} initialPaymentInfo={vendor?.payment_info} onRefetch={refetch} />;
      case "documents":
        return <DocumentsTab vendorId={vendorId} />;
      case "performance":
        return <PerformanceTab vendorId={vendorId} />;
      case "items":
        return <ItemsTab vendorId={vendorId} vendor={vendor} />;
      default:
        return <OverviewTab vendorId={vendorId} vendor={vendor} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back Button and Title */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <button
          onClick={() => navigate("/vendors")}
          className="text-gray-600 hover:text-gray-900"
          aria-label="Back to vendors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Vendor Details</h2>
      </div>

      {/* Vendor Info - ALWAYS VISIBLE */}
      <div className="flex-shrink-0 mb-4">
        <VendorInfoForm vendor={vendor} />
      </div>

      {/* Tab Navigation - ALWAYS VISIBLE */}
      <div className="flex-shrink-0 bg-white border border-gray-200 rounded-t-lg">
        <VendorTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Tab Content - SCROLLABLE */}
      <div ref={tabContentRef} className="flex-1 overflow-y-auto bg-white border-x border-b border-gray-200 rounded-b-lg">
        <div className="p-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
