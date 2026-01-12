// DocumentCard.jsx - Individual document card component
// Shows document details with expiry status badges

import { useState } from "react";
import { FileText, Download, Eye, Trash2, Calendar, AlertCircle } from "lucide-react";
import { useDeleteVendorDocument } from "../../../hooks/useVendorDocuments";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function DocumentCard({ document, onSuccess }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { mutate: deleteDocument, isLoading: isDeleting } = useDeleteVendorDocument();

  const handleView = () => {
    // Open document in new tab
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    } else {
      alert('Document URL not available');
    }
  };

  const handleDownload = () => {
    // Trigger browser download
    if (document.file_url) {
      const link = document.createElement('a');
      link.href = document.file_url;
      link.download = document.document_name || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Document URL not available');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteDocument(
      { vendorId: document.vendor_id, documentId: document.id },
      {
        onSuccess: () => {
          setShowDeleteModal(false);
          if (onSuccess) onSuccess();
        },
        onError: (error) => {
          console.error('Failed to delete document:', error);
          alert(`Failed to delete document: ${error.message}`);
        }
      }
    );
  };

  // Get document status based on expiration date
  const status = getDocumentStatus(document.expiration_date);

  // Document type display names
  // IMPORTANT: These values must match backend validation in vendorDocuments.js
  const documentTypes = {
    W9: "W9 Tax Form",
    W8: "W8 Tax Form",
    "1099": "1099 Form",
    insurance: "Insurance Certificate",
    contract: "Contract",
    certification: "Food Safety Certification",
    license: "Business License",
    pricing_sheet: "Pricing Sheet",
    other: "Other",
  };

  const documentTypeName =
    documentTypes[document.document_type] || document.document_type;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {document.document_name}
            </h4>
            <p className="text-xs text-gray-600">{documentTypeName}</p>
          </div>
        </div>

        {/* Expiry Status Badge */}
        <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${status.badgeClass}`}>
          {status.label}
        </span>
      </div>

      {/* Document Details */}
      <div className="space-y-2 mb-3">
        {document.expiration_date && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span>
              Expires: {formatDate(document.expiration_date)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <FileText className="w-3 h-3 text-gray-500" />
          <span>
            {formatFileSize(document.file_size)} • Uploaded{" "}
            {formatDate(document.uploaded_at)}
          </span>
        </div>
      </div>

      {/* Notes */}
      {document.notes && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          {document.notes}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={handleView}
            className="text-gray-600 hover:text-green-600 transition-colors"
            aria-label="View document"
            title="View document"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="text-gray-600 hover:text-green-600 transition-colors"
            aria-label="Download document"
            title="Download document"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="text-gray-600 hover:text-red-600 transition-colors"
            aria-label="Delete document"
            title="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Expiry Warning Icon */}
        {status.status === "expired" || status.status === "expiring" ? (
          <AlertCircle className={`w-4 h-4 ${status.status === "expired" ? "text-red-600" : "text-yellow-600"}`} />
        ) : null}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${document.document_name}"?`}
        itemName={document.document_name}
        isDeleting={isDeleting}
        warningMessage="This action cannot be undone. The document will be permanently deleted."
      />
    </div>
  );
}

// Get document status based on expiration date
function getDocumentStatus(expirationDate) {
  if (!expirationDate) {
    return {
      status: "none",
      label: "No Expiration",
      badgeClass: "bg-gray-50 text-gray-700 border border-gray-200",
    };
  }

  const today = new Date();
  const expiry = new Date(expirationDate);
  const daysUntil = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return {
      status: "expired",
      label: "Expired",
      badgeClass: "bg-red-50 text-red-700 border border-red-200",
    };
  }

  if (daysUntil <= 30) {
    return {
      status: "expiring",
      label: `Expires in ${daysUntil} days`,
      badgeClass: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    };
  }

  return {
    status: "current",
    label: "Current",
    badgeClass: "bg-green-50 text-green-700 border border-green-200",
  };
}

// Utility function to format date
function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Utility function to format file size
function formatFileSize(bytes) {
  if (!bytes) return "Unknown size";

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
