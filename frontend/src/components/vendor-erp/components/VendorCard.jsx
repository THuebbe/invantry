// VendorCard.jsx - Individual vendor card component for grid display
// Condensed spacing: p-4, text-sm, smaller icons

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Package, Calendar, TrendingUp, Check, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { useDeleteVendor } from "../../../hooks/useVendors";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function VendorCard({ vendor, onEdit }) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { mutate: deleteVendor, isPending: isDeleting } = useDeleteVendor();

  const handleClick = () => {
    navigate(`/vendors/detail?vendorId=${vendor.id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(vendor);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteVendor(vendor.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
      },
      onError: (error) => {
        console.error('Failed to delete vendor:', error);
        alert(`Failed to delete vendor: ${error.message}`);
      }
    });
  };

  // Grade color mapping
  const gradeColors = {
    A: "bg-green-50 text-green-700 border-green-200",
    B: "bg-blue-50 text-blue-700 border-blue-200",
    C: "bg-yellow-50 text-yellow-700 border-yellow-200",
    D: "bg-orange-50 text-orange-700 border-orange-200",
    F: "bg-red-50 text-red-700 border-red-200",
  };

  const gradeClass = gradeColors[vendor.performance_grade] || gradeColors.B;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all relative group">
        {/* Edit and Delete buttons - appear on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200"
            title="Edit vendor"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200"
            title="Delete vendor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clickable card content */}
        <button
          onClick={handleClick}
          className="text-left w-full"
        >
          {/* Header: Vendor name and status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Building2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {vendor.name}
                </h3>
                <p className="text-xs text-gray-500">{vendor.vendor_code}</p>
              </div>
            </div>

            {/* Status indicator */}
            {vendor.is_active ? (
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs flex-shrink-0">
                <Check className="w-3 h-3" />
                <span>Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-gray-50 text-gray-600 px-2 py-0.5 rounded text-xs flex-shrink-0">
                <AlertCircle className="w-3 h-3" />
                <span>Inactive</span>
              </div>
            )}
          </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Items</p>
            <p className="text-sm font-semibold text-gray-900">{vendor.itemCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Grade</p>
            <span className={`text-sm font-semibold px-2 py-0.5 rounded border ${gradeClass}`}>
              {vendor.performance_grade}
            </span>
          </div>
        </div>
      </div>

          {/* Last Order Date */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>Last order: {formatDate(vendor.last_order_date)}</span>
          </div>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${vendor.name}"?`}
        itemName={vendor.name}
        isDeleting={isDeleting}
        warningMessage="This will soft-delete the vendor. The vendor can be reactivated later if needed."
      />
    </>
  );
}

// Utility function to format date
function formatDate(dateString) {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
