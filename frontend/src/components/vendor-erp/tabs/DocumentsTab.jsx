// DocumentsTab.jsx - Vendor documents management
// Shows W9s, contracts, certificates with expiry status

import { useState } from "react";
import { FileCheck, Plus, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useVendorDocuments } from "../../../hooks/useVendorDocuments";
import DocumentCard from "../components/DocumentCard";
import DocumentForm from "../forms/DocumentForm";

export default function DocumentsTab({ vendorId }) {
  const { data: documents = [], isLoading, error, refetch } = useVendorDocuments(vendorId);
  const [showDocumentForm, setShowDocumentForm] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-red-900 mb-2">Error Loading Documents</h3>
        <p className="text-sm text-red-800 mb-3">
          {error.message || 'An error occurred while loading documents.'}
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

  const handleUploadDocument = () => {
    setShowDocumentForm(true);
  };

  // Categorize documents by expiry status
  const expiredDocs = documents.filter((doc) => {
    if (!doc.expiration_date) return false;
    const today = new Date();
    const expiry = new Date(doc.expiration_date);
    return expiry < today;
  });

  const expiringDocs = documents.filter((doc) => {
    if (!doc.expiration_date) return false;
    const today = new Date();
    const expiry = new Date(doc.expiration_date);
    const daysUntil = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 30;
  });

  const currentDocs = documents.filter((doc) => {
    if (!doc.expiration_date) return true; // No expiration = current
    const today = new Date();
    const expiry = new Date(doc.expiration_date);
    const daysUntil = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntil > 30;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-gray-600" />
            Vendor Documents
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage W9s, contracts, insurance certificates, and other documents
          </p>
        </div>

        <button
          onClick={handleUploadDocument}
          className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 text-sm rounded flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Status Summary */}
      {documents.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-900">Expired</span>
            </div>
            <div className="text-xl font-bold text-red-700">{expiredDocs.length}</div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-900">
                Expiring Soon
              </span>
            </div>
            <div className="text-xl font-bold text-yellow-700">
              {expiringDocs.length}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-900">Current</span>
            </div>
            <div className="text-xl font-bold text-green-700">
              {currentDocs.length}
            </div>
          </div>
        </div>
      )}

      {/* Document Cards */}
      {documents.length > 0 ? (
        <div className="space-y-6">
          {/* Expired Documents */}
          {expiredDocs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Expired Documents ({expiredDocs.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expiredDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onSuccess={() => refetch()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon Documents */}
          {expiringDocs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Expiring Soon ({expiringDocs.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expiringDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onSuccess={() => refetch()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Current Documents */}
          {currentDocs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Current Documents ({currentDocs.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onSuccess={() => refetch()}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No documents found
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload vendor documents to manage compliance and records
          </p>
          <button
            onClick={handleUploadDocument}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm rounded inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload First Document
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Document Types
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>W9 Tax Form:</strong> Required for tax reporting and 1099 filing
          </li>
          <li>
            <strong>Insurance Certificate:</strong> Proof of general liability coverage
          </li>
          <li>
            <strong>Contract:</strong> Master supply agreements and pricing terms
          </li>
          <li>
            <strong>Food Safety Cert:</strong> HACCP and food safety compliance
          </li>
        </ul>
      </div>

      {/* Document Form Modal */}
      {showDocumentForm && (
        <DocumentForm
          vendorId={vendorId}
          onClose={() => setShowDocumentForm(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
