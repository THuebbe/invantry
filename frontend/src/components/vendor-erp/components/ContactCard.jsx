// ContactCard.jsx - Individual contact person card component
// Shows contact details with role and communication preferences

import { useState } from "react";
import { User, Phone, Mail, Smartphone, Star, Edit, Trash2, FileText, CreditCard } from "lucide-react";
import { useDeleteVendorContact } from "../../../hooks/useVendorContacts";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { formatPhoneNumber } from "../../../utils/vendorFormatters";

export default function ContactCard({ contact, vendorId, onEdit, onSuccess }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { mutate: deleteContact, isPending: isDeleting } = useDeleteVendorContact();

  const handleEdit = () => {
    onEdit(contact);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteContact(
      { vendorId: vendorId, contactId: contact.id },
      {
        onSuccess: () => {
          setShowDeleteModal(false);
          if (onSuccess) onSuccess();
        },
        onError: (error) => {
          console.error('Failed to delete contact:', error);
          alert(`Failed to delete contact: ${error.message}`);
        }
      }
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 rounded-full p-2">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900">
              {contact.first_name} {contact.last_name}
            </h4>
            <p className="text-xs text-gray-600">{contact.title}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="text-gray-600 hover:text-green-600 transition-colors"
            aria-label="Edit contact"
          >
            <Edit className="w-4 h-4" />
          </button>
          {!contact.is_primary && (
            <button
              onClick={handleDeleteClick}
              className="text-gray-600 hover:text-red-600 transition-colors"
              aria-label="Delete contact"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {contact.is_primary && (
          <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-xs">
            <Star className="w-3 h-3" />
            Primary Contact
          </span>
        )}
        {contact.role && (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-xs">
            {contact.role}
          </span>
        )}
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-3">
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-500" />
            <a href={`mailto:${contact.email}`} className="hover:text-green-600">
              {contact.email}
            </a>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-500" />
            <a href={`tel:${contact.phone}`} className="hover:text-green-600">
              {formatPhoneNumber(contact.phone)}
            </a>
          </div>
        )}
        {contact.mobile && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Smartphone className="w-4 h-4 text-gray-500" />
            <a href={`tel:${contact.mobile}`} className="hover:text-green-600">
              {formatPhoneNumber(contact.mobile)}
            </a>
          </div>
        )}
      </div>

      {/* Communication Preferences */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        {contact.receive_orders && (
          <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
            <FileText className="w-3 h-3" />
            Orders
          </span>
        )}
        {contact.receive_invoices && (
          <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
            <CreditCard className="w-3 h-3" />
            Invoices
          </span>
        )}
      </div>

      {/* Notes */}
      {contact.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 italic">{contact.notes}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contact.first_name} ${contact.last_name}?`}
        itemName={`${contact.first_name} ${contact.last_name}`}
        isDeleting={isDeleting}
        warningMessage={contact.is_primary ? "Cannot delete primary contact. Please set another contact as primary first." : null}
      />
    </div>
  );
}
