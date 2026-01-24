// ContactsTab.jsx - Vendor contacts management
// Shows contact persons with roles and communication preferences

import { useState, useEffect } from "react";
import { Users, Plus, Loader2 } from "lucide-react";
import { useVendorContacts } from "../../../hooks/useVendorContacts";
import ContactCard from "../components/ContactCard";
import ContactForm from "../forms/ContactForm";

export default function ContactsTab({ vendorId, initialContacts, onRefetch }) {
  // Use initialContacts if provided, otherwise fall back to API call
  const { data: fetchedContacts, isLoading: isFetching, error, refetch: apiRefetch } = useVendorContacts(vendorId, {
    enabled: !initialContacts // Only fetch if no initial data provided
  });

  // Local state to track contacts (use initial data if available)
  const [contacts, setContacts] = useState(initialContacts || []);
  const [isLoading, setIsLoading] = useState(!initialContacts);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  // Update contacts when fetched data arrives (for API fallback case)
  useEffect(() => {
    if (fetchedContacts && !initialContacts) {
      setContacts(fetchedContacts);
      setIsLoading(false);
    }
  }, [fetchedContacts, initialContacts]);

  // Update loading state when initial data is provided
  useEffect(() => {
    if (initialContacts) {
      setContacts(initialContacts);
      setIsLoading(false);
    }
  }, [initialContacts]);

  // Handle refetch - use parent's refetch if available, otherwise use API
  const refetch = () => {
    if (onRefetch) {
      onRefetch();
    } else {
      apiRefetch();
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setShowContactForm(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading contacts...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-red-900 mb-2">Error Loading Contacts</h3>
        <p className="text-sm text-red-800 mb-3">
          {error.message || 'An error occurred while loading contacts.'}
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

  // Separate primary and other contacts
  const primaryContact = contacts.find((c) => c.is_primary);
  const otherContacts = contacts.filter((c) => !c.is_primary);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-600" />
            Vendor Contacts
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage contact persons and communication preferences
          </p>
        </div>

        <button
          onClick={handleAddContact}
          className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 text-sm rounded flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Contact Cards */}
      {contacts.length > 0 ? (
        <div className="space-y-4">
          {/* Primary Contact Section */}
          {primaryContact && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Primary Contact
              </h4>
              <ContactCard
                contact={primaryContact}
                vendorId={vendorId}
                onEdit={(contact) => {
                  setEditingContact(contact);
                  setShowContactForm(true);
                }}
                onSuccess={() => refetch()}
              />
            </div>
          )}

          {/* Other Contacts Section */}
          {otherContacts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Additional Contacts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    vendorId={vendorId}
                    onEdit={(contact) => {
                      setEditingContact(contact);
                      setShowContactForm(true);
                    }}
                    onSuccess={() => refetch()}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No contacts found
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Add contact persons for this vendor
          </p>
          <button
            onClick={handleAddContact}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm rounded inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Contact
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Contact Roles
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>Account Manager:</strong> Primary relationship manager
          </li>
          <li>
            <strong>Sales Rep:</strong> Product inquiries and special orders
          </li>
          <li>
            <strong>AR Specialist:</strong> Billing and payment questions
          </li>
          <li>
            <strong>Territory Manager:</strong> Regional oversight
          </li>
        </ul>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <ContactForm
          vendorId={vendorId}
          contact={editingContact}
          onClose={() => {
            setShowContactForm(false);
            setEditingContact(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
