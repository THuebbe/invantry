// VendorTabs.jsx - Horizontal tab navigation for vendor detail page
// Based on CreateQuickPOs.jsx tab pattern (lines 728-751)

import {
  FileText,
  MapPin,
  Users,
  CreditCard,
  FileCheck,
  TrendingUp,
  Package,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "documents", label: "Documents", icon: FileCheck },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "items", label: "Items", icon: Package },
];

export default function VendorTabs({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-6 overflow-x-auto px-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-3 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "text-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
