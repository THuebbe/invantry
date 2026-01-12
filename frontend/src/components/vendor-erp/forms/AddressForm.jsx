// AddressForm.jsx - Modal form for adding/editing vendor addresses
// Handles billing, remittance, shipping, and ship_from addresses

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateVendorAddress, useUpdateVendorAddress } from '../../../hooks/useVendorAddresses';
import { validateRequired, validateZipCode, validateEmail, validatePhone } from '../../../utils/vendorValidators';

export default function AddressForm({ vendorId, address = null, onClose, onSuccess }) {
  const [formData, setFormData] = useState(address || {
    address_type: 'billing',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
    email: '',
    is_primary: false
  });
  const [errors, setErrors] = useState({});

  const { mutate: createAddress, isLoading: isCreating } = useCreateVendorAddress();
  const { mutate: updateAddress, isLoading: isUpdating } = useUpdateVendorAddress();

  const isLoading = isCreating || isUpdating;

  const validateForm = () => {
    const newErrors = {};

    // Address line 1 is required
    const line1Validation = validateRequired(formData.address_line1, 'Address line 1');
    if (!line1Validation.valid) {
      newErrors.address_line1 = line1Validation.error;
    }

    // City is required
    const cityValidation = validateRequired(formData.city, 'City');
    if (!cityValidation.valid) {
      newErrors.city = cityValidation.error;
    }

    // State is required
    const stateValidation = validateRequired(formData.state, 'State');
    if (!stateValidation.valid) {
      newErrors.state = stateValidation.error;
    }

    // Postal code validation
    const zipValidation = validateZipCode(formData.postal_code);
    if (!zipValidation.valid) {
      newErrors.postal_code = zipValidation.error;
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error;
      }
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.valid) {
        newErrors.phone = phoneValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const mutation = address ? updateAddress : createAddress;
    const mutationData = address
      ? { vendorId, addressId: address.id, updates: formData }
      : { vendorId, addressData: formData };

    mutation(mutationData, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
        onClose();
      },
      onError: (error) => {
        setErrors({ submit: error.message || 'An error occurred while saving the address.' });
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
            {address ? 'Edit Address' : 'Add New Address'}
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
          {/* Address Type */}
          <div>
            <label htmlFor="address_type" className="block text-sm font-medium text-gray-700 mb-1">
              Address Type <span className="text-red-500">*</span>
            </label>
            <select
              id="address_type"
              value={formData.address_type}
              onChange={(e) => handleChange('address_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            >
              <option value="billing">Billing</option>
              <option value="remittance">Remittance</option>
              <option value="shipping">Shipping</option>
              <option value="ship_from">Ship From (Warehouse)</option>
            </select>
          </div>

          {/* Address Line 1 */}
          <div>
            <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => handleChange('address_line1', e.target.value)}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.address_line1 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Street address"
              disabled={isLoading}
            />
            {errors.address_line1 && (
              <p className="mt-1 text-sm text-red-600">{errors.address_line1}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div>
            <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              id="address_line2"
              value={formData.address_line2}
              onChange={(e) => handleChange('address_line2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Apartment, suite, unit, etc. (optional)"
              disabled={isLoading}
            />
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., TX"
                maxLength={2}
                disabled={isLoading}
              />
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>

            <div>
              <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.postal_code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="12345"
                disabled={isLoading}
              />
              {errors.postal_code && (
                <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>
              )}
            </div>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="MX">Mexico</option>
            </select>
          </div>

          {/* Phone and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="(123) 456-7890"
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="address@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Primary Address Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_primary"
              checked={formData.is_primary}
              onChange={(e) => handleChange('is_primary', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              disabled={isLoading}
            />
            <label htmlFor="is_primary" className="ml-2 text-sm text-gray-700">
              Set as primary address for this type
            </label>
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
              {isLoading ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
