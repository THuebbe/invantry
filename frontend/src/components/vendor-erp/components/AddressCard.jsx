// AddressCard.jsx - Individual address card component
// Shows address details with type badge

import { useState } from "react";
import { MapPin, Phone, Mail, Star, Edit, Trash2 } from "lucide-react";
import { useDeleteVendorAddress } from "../../../hooks/useVendorAddresses";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { formatPhoneNumber } from "../../../utils/vendorFormatters";

export default function AddressCard({ address, vendorId, onEdit, onSuccess }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { mutate: deleteAddress, isPending: isDeleting } = useDeleteVendorAddress();

  const handleEdit = () => {
    onEdit(address);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteAddress(
      { vendorId: vendorId, addressId: address.id },
      {
        onSuccess: () => {
          setShowDeleteModal(false);
          if (onSuccess) onSuccess();
        },
        onError: (error) => {
          console.error('Failed to delete address:', error);
          alert(`Failed to delete address: ${error.message}`);
        }
      }
    );
  };

  // Address type badge colors
  const getTypeBadge = (type) => {
    const badges = {
      billing: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Billing" },
      remittance: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Remittance" },
      ship_from: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Ship From" },
      shipping: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Shipping" },
    };

    return badges[type] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", label: type };
  };

  const badge = getTypeBadge(address.address_type);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
            {badge.label}
          </span>
          {address.is_primary && (
            <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-xs">
              <Star className="w-3 h-3" />
              Primary
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="text-gray-600 hover:text-green-600 transition-colors"
            aria-label="Edit address"
          >
            <Edit className="w-4 h-4" />
          </button>
          {!address.is_primary && (
            <button
              onClick={handleDeleteClick}
              className="text-gray-600 hover:text-red-600 transition-colors"
              aria-label="Delete address"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Address Lines */}
      <div className="mb-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-900">
            <div>{address.address_line1}</div>
            {address.address_line2 && <div>{address.address_line2}</div>}
            <div>
              {address.city}, {address.state} {address.postal_code}
            </div>
            <div>{address.country}</div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2">
        {address.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-3 h-3 text-gray-500" />
            <a href={`tel:${address.phone}`} className="hover:text-green-600">
              {formatPhoneNumber(address.phone)}
            </a>
          </div>
        )}
        {address.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-3 h-3 text-gray-500" />
            <a href={`mailto:${address.email}`} className="hover:text-green-600">
              {address.email}
            </a>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Address"
        message={`Are you sure you want to delete this ${badge.label.toLowerCase()} address?`}
        itemName={`${address.city}, ${address.state}`}
        isDeleting={isDeleting}
        warningMessage={address.is_primary ? "Cannot delete primary address. Please set another address as primary first." : null}
      />
    </div>
  );
}
