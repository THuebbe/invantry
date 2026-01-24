// VendorForm.jsx - Modal form for adding/editing vendors
// Handles create and update operations with validation

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateVendor, useUpdateVendor } from '../../../hooks/useVendors';
import { validateRequired, validateVendorCode } from '../../../utils/vendorValidators';

export default function VendorForm({ vendor = null, onClose, onSuccess }) {
  const [formData, setFormData] = useState(vendor || {
    name: '',
    vendor_code: '',
    legal_name: '',
    trade_name: '',
    status: 'active',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent rapid clicks

  const { mutate: createVendor, isLoading: isCreating } = useCreateVendor();
  const { mutate: updateVendor, isLoading: isUpdating } = useUpdateVendor();

  const isLoading = isCreating || isUpdating || isSubmitting;

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose, isLoading]);

  const validateForm = () => {
    const newErrors = {};

    // Name is required
    const nameValidation = validateRequired(formData.name, 'Vendor name');
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error;
    }

    // Vendor code is required
    const codeRequiredValidation = validateRequired(formData.vendor_code, 'Vendor code');
    if (!codeRequiredValidation.valid) {
      newErrors.vendor_code = codeRequiredValidation.error;
    } else {
      // If provided, must be valid format
      const codeValidation = validateVendorCode(formData.vendor_code);
      if (!codeValidation.valid) {
        newErrors.vendor_code = codeValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prevent rapid clicks
    if (isLoading) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true); // Immediately disable button

    const mutation = vendor ? updateVendor : createVendor;
    const mutationData = vendor
      ? { vendorId: vendor.id, updates: formData }
      : formData;

    mutation(mutationData, {
      onSuccess: () => {
        if (onSuccess) onSuccess(formData.name, !!vendor);
        onClose();
      },
      onError: (error) => {
        setIsSubmitting(false); // Re-enable on error
        // Extract error message from axios response or fall back to generic message
        const errorMessage = error.response?.data?.error || error.message || 'An error occurred while saving the vendor.';

        // Check if it's a vendor_code specific error to show inline
        if (errorMessage.toLowerCase().includes('vendor') && errorMessage.toLowerCase().includes('code')) {
          setErrors({ vendor_code: errorMessage });
        } else if (errorMessage.toLowerCase().includes('name') && errorMessage.toLowerCase().includes('exists')) {
          setErrors({ name: errorMessage });
        } else {
          setErrors({ submit: errorMessage });
        }
      }
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {vendor ? 'Edit Vendor' : 'Add New Vendor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Vendor Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Sysco Foods"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Vendor Code */}
          <div>
            <label htmlFor="vendor_code" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="vendor_code"
              value={formData.vendor_code}
              onChange={(e) => handleChange('vendor_code', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.vendor_code ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., SYS001"
              disabled={isLoading}
            />
            {errors.vendor_code && (
              <p className="mt-1 text-sm text-red-600">{errors.vendor_code}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Required. Letters, numbers, and hyphens only.</p>
          </div>

          {/* Legal Name */}
          <div>
            <label htmlFor="legal_name" className="block text-sm font-medium text-gray-700 mb-1">
              Legal Name
            </label>
            <input
              type="text"
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => handleChange('legal_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Sysco Corporation"
              disabled={isLoading}
            />
          </div>

          {/* Trade Name */}
          <div>
            <label htmlFor="trade_name" className="block text-sm font-medium text-gray-700 mb-1">
              Trade Name (DBA)
            </label>
            <input
              type="text"
              id="trade_name"
              value={formData.trade_name}
              onChange={(e) => handleChange('trade_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Sysco"
              disabled={isLoading}
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Additional notes about this vendor..."
              disabled={isLoading}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Saving...' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
