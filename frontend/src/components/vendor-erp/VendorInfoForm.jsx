// VendorInfoForm.jsx - Top vendor information section (always visible)
// Editable fields with save functionality

import { useState, useEffect } from 'react';
import { Building2, Check, AlertCircle, Loader2, Save, X } from "lucide-react";
import { useUpdateVendor } from "../../hooks/useVendors";
import { validateRequired } from "../../utils/vendorValidators";

export default function VendorInfoForm({ vendor, onSaveSuccess }) {
  // Form state - initialize from vendor prop
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    legal_name: vendor?.legal_name || '',
    trade_name: vendor?.trade_name || '',
    is_active: vendor?.is_active ?? true,
    notes: vendor?.notes || ''
  });

  // Track if form has unsaved changes
  const [isDirty, setIsDirty] = useState(false);

  // Error state
  const [errors, setErrors] = useState({});

  // Success message state
  const [showSuccess, setShowSuccess] = useState(false);

  // Track if submitting to prevent rapid clicks
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update vendor mutation
  const { mutate: updateVendor, isLoading: isUpdating } = useUpdateVendor();

  const isLoading = isUpdating || isSubmitting;

  // Reset form when vendor ID changes (e.g., navigating between vendors)
  // Intentionally only reset on ID change, not on every vendor prop update
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        legal_name: vendor.legal_name || '',
        trade_name: vendor.trade_name || '',
        is_active: vendor.is_active ?? true,
        notes: vendor.notes || ''
      });
      setIsDirty(false);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?.id]);

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    // Vendor name is required
    const nameValidation = validateRequired(formData.name, 'Vendor name');
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Hide success message when user makes changes
    if (showSuccess) {
      setShowSuccess(false);
    }
  };

  // Handle save
  const handleSave = () => {
    // Prevent rapid clicks
    if (isLoading) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Prepare updates - only send changed fields
    const updates = {
      name: formData.name.trim(),
      legal_name: formData.legal_name?.trim() || null,
      trade_name: formData.trade_name?.trim() || null,
      is_active: formData.is_active,
      notes: formData.notes?.trim() || null
    };

    updateVendor(
      { vendorId: vendor.id, updates },
      {
        onSuccess: () => {
          setIsSubmitting(false);
          setIsDirty(false);
          setShowSuccess(true);

          // Auto-hide success message after 3 seconds
          setTimeout(() => setShowSuccess(false), 3000);

          // Call optional callback
          if (onSaveSuccess) onSaveSuccess();
        },
        onError: (error) => {
          setIsSubmitting(false);
          setErrors({
            submit: error.message || 'An error occurred while saving vendor information.'
          });
        }
      }
    );
  };

  // Handle cancel/reset
  const handleCancel = () => {
    setFormData({
      name: vendor?.name || '',
      legal_name: vendor?.legal_name || '',
      trade_name: vendor?.trade_name || '',
      is_active: vendor?.is_active ?? true,
      notes: vendor?.notes || ''
    });
    setIsDirty(false);
    setErrors({});
    setShowSuccess(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">Vendor Information</h3>
          {isDirty && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Unsaved changes
            </span>
          )}
        </div>

        {/* Status Badge */}
        {formData.is_active ? (
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

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-800">Vendor information saved successfully.</p>
        </div>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Vendor Code - Read Only */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Vendor Code
          </label>
          <input
            type="text"
            value={vendor?.vendor_code || ''}
            disabled
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700"
          />
        </div>

        {/* Vendor Name - Required */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Vendor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'bg-gray-50' : ''}`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Legal Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Legal Name
          </label>
          <input
            type="text"
            value={formData.legal_name}
            onChange={(e) => handleChange('legal_name', e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
              isLoading ? 'bg-gray-50' : ''
            }`}
          />
        </div>

        {/* Trade Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Trade Name
          </label>
          <input
            type="text"
            value={formData.trade_name}
            onChange={(e) => handleChange('trade_name', e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
              isLoading ? 'bg-gray-50' : ''
            }`}
          />
        </div>

        {/* Status Toggle */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.is_active ? "active" : "inactive"}
            onChange={(e) => handleChange('is_active', e.target.value === "active")}
            disabled={isLoading}
            className={`w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
              isLoading ? 'bg-gray-50' : ''
            }`}
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
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          disabled={isLoading}
          rows={2}
          placeholder="Internal notes about this vendor..."
          className={`w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
            isLoading ? 'bg-gray-50' : ''
          }`}
        />
      </div>

      {/* Metadata Row and Actions */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
        <div className="flex gap-4">
          <span>Created: {formatDate(vendor?.created_at)}</span>
          <span>Updated: {formatDate(vendor?.updated_at)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Cancel Button - Only show when dirty */}
          {isDirty && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-800 px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isLoading || !isDirty}
            className={`px-3 py-1.5 text-sm rounded flex items-center gap-2 transition-colors ${
              isDirty && !isLoading
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
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
