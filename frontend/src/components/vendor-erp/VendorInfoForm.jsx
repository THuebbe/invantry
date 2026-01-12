// VendorInfoForm.jsx - Top vendor information section (always visible)
// Editable fields with no submission (Phase 1 - UI only)

import { Building2, Globe, Check, AlertCircle, Edit } from "lucide-react";

export default function VendorInfoForm({ vendor }) {
  const handleSave = () => {
    console.log("Save vendor info clicked - will be implemented in Phase 2");
    alert("Save functionality will be implemented in Phase 2");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">Vendor Information</h3>
        </div>

        {/* Status Badge */}
        {vendor.is_active ? (
          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs border border-green-200">
            <Check className="w-3 h-3" />
            <span>Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-gray-50 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">
            <AlertCircle className="w-3 h-3" />
            <span>Inactive</span>
          </div>
        )}
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Vendor Code */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Vendor Code
          </label>
          <input
            type="text"
            value={vendor.vendor_code}
            disabled
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700"
          />
        </div>

        {/* Vendor Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Vendor Name
          </label>
          <input
            type="text"
            defaultValue={vendor.name}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Legal Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Legal Name
          </label>
          <input
            type="text"
            defaultValue={vendor.legal_name}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Trade Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Trade Name
          </label>
          <input
            type="text"
            defaultValue={vendor.trade_name}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Website
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              defaultValue={vendor.website}
              placeholder="https://..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Status Toggle */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            defaultValue={vendor.is_active ? "active" : "inactive"}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          defaultValue={vendor.notes}
          rows={2}
          placeholder="Internal notes about this vendor..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      {/* Metadata Row */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
        <div className="flex gap-4">
          <span>Created: {formatDate(vendor.created_at)}</span>
          <span>Updated: {formatDate(vendor.updated_at)}</span>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 text-sm rounded flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

// Utility function to format date
function formatDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
