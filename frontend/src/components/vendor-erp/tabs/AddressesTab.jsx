// AddressesTab.jsx - Vendor addresses management
// Shows billing, remittance, and shipping addresses

import { useState } from "react";
import { MapPin, Plus, Loader2 } from "lucide-react";
import { useVendorAddresses } from "../../../hooks/useVendorAddresses";
import AddressCard from "../components/AddressCard";
import AddressForm from "../forms/AddressForm";

export default function AddressesTab({ vendorId }) {
  const { data: addresses = [], isLoading, error, refetch } = useVendorAddresses(vendorId);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading addresses...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-red-900 mb-2">Error Loading Addresses</h3>
        <p className="text-sm text-red-800 mb-3">
          {error.message || 'An error occurred while loading addresses.'}
        </p>
        <button
          onClick={() => refetch()}
          className="bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 text-sm rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-600" />
            Vendor Addresses
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage billing, remittance, and shipping addresses
          </p>
        </div>

        <button
          onClick={handleAddAddress}
          className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 text-sm rounded flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Address
        </button>
      </div>

      {/* Address Cards Grid */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={(address) => {
                setEditingAddress(address);
                setShowAddressForm(true);
              }}
              onSuccess={() => refetch()}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No addresses found
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Add addresses for billing, remittance, and shipping
          </p>
          <button
            onClick={handleAddAddress}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm rounded inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Address
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Address Types
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>Billing:</strong> Where invoices should be sent
          </li>
          <li>
            <strong>Remittance:</strong> Where payments should be sent
          </li>
          <li>
            <strong>Ship From:</strong> Warehouse or distribution center location
          </li>
          <li>
            <strong>Shipping:</strong> Delivery destination (if different from billing)
          </li>
        </ul>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressForm
          vendorId={vendorId}
          address={editingAddress}
          onClose={() => {
            setShowAddressForm(false);
            setEditingAddress(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
