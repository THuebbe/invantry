// OverviewTab.jsx - General vendor information overview
// Shows summary information, notes, and key details

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Calendar } from "lucide-react";
import ContactForm from "../forms/ContactForm";
import AddressForm from "../forms/AddressForm";
import DocumentForm from "../forms/DocumentForm";

export default function OverviewTab({ vendorId, vendor }) {
  const navigate = useNavigate();
  const [showContactForm, setShowContactForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);

  const handleCreatePurchaseOrder = () => {
    navigate('/orders/create', {
      state: {
        vendorId: vendorId,
        vendorName: vendor?.name || ''
      }
    });
  };

  if (!vendor) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-600">Vendor details not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-600" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Vendor Code" value={vendor.vendor_code} />
          <InfoItem label="Vendor Name" value={vendor.name} />
          <InfoItem label="Legal Name" value={vendor.legal_name} />
          <InfoItem label="Trade Name" value={vendor.trade_name} />
          <InfoItem
            label="Status"
            value={
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  vendor.is_active
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-600 border border-gray-200"
                }`}
              >
                {vendor.is_active ? "Active" : "Inactive"}
              </span>
            }
          />
        </div>
      </div>

      {/* Notes */}
      {vendor.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-base font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" />
            Internal Notes
          </h3>
          <p className="text-sm text-blue-800 whitespace-pre-wrap">{vendor.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          Record Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem
            label="Created Date"
            value={formatDate(vendor.created_at)}
          />
          <InfoItem
            label="Last Updated"
            value={formatDate(vendor.updated_at)}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowContactForm(true)}
            className="border border-green-500 text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 text-sm rounded transition-colors"
          >
            Add Contact
          </button>
          <button
            onClick={() => setShowAddressForm(true)}
            className="border border-green-500 text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 text-sm rounded transition-colors"
          >
            Add Address
          </button>
          <button
            onClick={() => setShowDocumentForm(true)}
            className="border border-green-500 text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 text-sm rounded transition-colors"
          >
            Upload Document
          </button>
          <button
            onClick={handleCreatePurchaseOrder}
            className="border border-green-500 text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 text-sm rounded transition-colors"
          >
            Create Purchase Order
          </button>
        </div>
      </div>

      {/* Modals */}
      {showContactForm && (
        <ContactForm
          vendorId={vendorId}
          onClose={() => setShowContactForm(false)}
          onSuccess={() => {
            setShowContactForm(false);
          }}
        />
      )}

      {showAddressForm && (
        <AddressForm
          vendorId={vendorId}
          onClose={() => setShowAddressForm(false)}
          onSuccess={() => {
            setShowAddressForm(false);
          }}
        />
      )}

      {showDocumentForm && (
        <DocumentForm
          vendorId={vendorId}
          onClose={() => setShowDocumentForm(false)}
          onSuccess={() => {
            setShowDocumentForm(false);
          }}
        />
      )}
    </div>
  );
}

// Helper component for information items
function InfoItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-600 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

// Utility function to format date
function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
