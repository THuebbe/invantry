// VendorDetail.jsx - Main vendor detail page (full width layout)
// Mobile: Sticky tabs at bottom, scrollable content
// Desktop: Tabs above content, traditional layout

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
  const scrollContainerRef = useRef(null);
  const tabContentRef = useRef(null);

  // Get vendor ID from props or query params
  const vendorId = propVendorId || searchParams.get("vendorId");

  // Active tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Handle tab change - scroll to show tab content at top of visible area
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);

    // On mobile, scroll the tab content into view
    // Small delay to ensure content has rendered
    setTimeout(() => {
      if (tabContentRef.current && scrollContainerRef.current) {
        // Get the position of the tab content relative to the scroll container
        const container = scrollContainerRef.current;
        const tabContent = tabContentRef.current;
        const containerRect = container.getBoundingClientRect();
        const contentRect = tabContent.getBoundingClientRect();

        // Calculate how much to scroll to put tab content at top
        const scrollOffset = contentRect.top - containerRect.top + container.scrollTop;

        container.scrollTo({
          top: scrollOffset - 8, // Small padding
          behavior: "smooth",
        });
      }
    }, 50);
  };

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
    <div className="flex flex-col h-full relative">
      {/* Back Button and Title - Sticky on mobile */}
      <div className="flex items-center gap-3 mb-3 md:mb-4 flex-shrink-0 sticky top-0 bg-gray-50 z-10 -mx-3 md:mx-0 px-3 md:px-0 py-2 md:py-0 md:static md:bg-transparent">
        <button
          onClick={() => navigate("/vendors")}
          className="text-gray-600 hover:text-gray-900"
          aria-label="Back to vendors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Vendor Details</h2>
      </div>

      {/* Main scrollable content area - add padding bottom for mobile tab bar */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {/* Vendor Info Form */}
        <div className="mb-4">
          <VendorInfoForm vendor={vendor} />
        </div>

        {/* Tab Navigation - DESKTOP ONLY (above content) */}
        <div className="hidden md:block flex-shrink-0 bg-white border border-gray-200 rounded-t-lg">
          <VendorTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Tab Content */}
        <div
          ref={tabContentRef}
          className="bg-white border border-gray-200 md:border-t-0 rounded-lg md:rounded-t-none"
        >
          <div className="p-3 md:p-4">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Tab Navigation - MOBILE ONLY (sticky bottom bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <VendorTabs activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}
