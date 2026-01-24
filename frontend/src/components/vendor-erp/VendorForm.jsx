// VendorForm.jsx - Add/Edit vendor form (Phase 2 implementation)
// This is a placeholder component for Phase 1

import { Building2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VendorForm({ mode = "add", vendorId = null }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/vendors")}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Building2 className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-bold text-gray-900">
          {mode === "add" ? "Add New Vendor" : "Edit Vendor"}
        </h2>
      </div>

      {/* Placeholder content */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-base font-semibold text-blue-900 mb-2">
          Phase 2 Feature
        </p>
        <p className="text-sm text-blue-700">
          Vendor form functionality will be implemented in Phase 2 with full backend integration.
        </p>
        <button
          onClick={() => navigate("/vendors")}
          className="mt-4 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm rounded"
        >
          Back to Vendors
        </button>
      </div>
    </div>
  );
}
