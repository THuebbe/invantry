// PaymentInfoForm.jsx - Modal form for editing vendor payment information
// Handles payment terms, tax info, banking info

import { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useCreateVendorPaymentInfo, useUpdateVendorPaymentInfo } from '../../../hooks/useVendorPayment';
import api from '../../../core/database/api';

export default function PaymentInfoForm({ vendorId, paymentInfo = null, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    payment_terms_id: '',
    tax_id: '',
    credit_limit: '',
    preferred_payment_method: 'ACH',
    bank_name: '',
    account_number: '',
    routing_number: '',
    swift_code: '',
    iban: '',
    default_currency: 'USD',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent rapid clicks
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showRoutingNumber, setShowRoutingNumber] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [loadingTerms, setLoadingTerms] = useState(true);

  const { mutate: createPaymentInfo, isLoading: isCreating } = useCreateVendorPaymentInfo();
  const { mutate: updatePaymentInfo, isLoading: isUpdating } = useUpdateVendorPaymentInfo();

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

  // Load payment terms on mount
  useEffect(() => {
    const fetchPaymentTerms = async () => {
      try {
        const response = await api.get('/payment-terms');
        setPaymentTerms(response.data);
      } catch (error) {
        console.error('Error fetching payment terms:', error);
      } finally {
        setLoadingTerms(false);
      }
    };

    fetchPaymentTerms();
  }, []);

  // Initialize form data if editing
  useEffect(() => {
    if (paymentInfo) {
      // When editing, map the display data back to raw DB structure
      // Note: account/routing numbers are masked, so we leave them empty
      setFormData({
        payment_terms_id: paymentInfo.payment_terms_id || '',
        tax_id: paymentInfo.tax_id_number !== 'N/A' ? paymentInfo.tax_id_number : '',
        credit_limit: paymentInfo.credit_limit || '',
        preferred_payment_method: paymentInfo.payment_method !== 'N/A' ? paymentInfo.payment_method : 'ACH',
        bank_name: paymentInfo.bank_name !== 'N/A' ? paymentInfo.bank_name : '',
        account_number: '', // Don't show masked value
        routing_number: '', // Don't show masked value
        swift_code: '',
        iban: '',
        default_currency: 'USD',
        notes: paymentInfo.notes || ''
      });
    }
  }, [paymentInfo]);

  const validateForm = () => {
    const newErrors = {};

    // Payment terms ID is required
    if (!formData.payment_terms_id) {
      newErrors.payment_terms_id = 'Payment terms are required';
    }

    // Credit limit validation (must be positive number if provided)
    if (formData.credit_limit && (isNaN(formData.credit_limit) || parseFloat(formData.credit_limit) < 0)) {
      newErrors.credit_limit = 'Credit limit must be a positive number';
    }

    // Routing number format validation (9 digits for US banks)
    if (formData.routing_number && !/^\d{9}$/.test(formData.routing_number)) {
      newErrors.routing_number = 'Routing number must be 9 digits';
    }

    // Account number validation (at least 4 digits if provided)
    if (formData.account_number && formData.account_number.length < 4) {
      newErrors.account_number = 'Account number must be at least 4 digits';
    }

    // If bank info provided, bank name is required
    if ((formData.account_number || formData.routing_number) && !formData.bank_name) {
      newErrors.bank_name = 'Bank name is required when providing account information';
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

    // Prepare data for submission
    const submitData = {
      payment_terms_id: formData.payment_terms_id,
      tax_id: formData.tax_id || null,
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
      preferred_payment_method: formData.preferred_payment_method || null,
      bank_name: formData.bank_name || null,
      default_currency: formData.default_currency || 'USD',
      notes: formData.notes || null
    };

    // Only include account/routing if they were updated (not empty)
    if (formData.account_number) {
      submitData.account_number = formData.account_number;
    }
    if (formData.routing_number) {
      submitData.routing_number = formData.routing_number;
    }
    if (formData.swift_code) {
      submitData.swift_code = formData.swift_code;
    }
    if (formData.iban) {
      submitData.iban = formData.iban;
    }

    const mutation = paymentInfo ? updatePaymentInfo : createPaymentInfo;
    const mutationData = paymentInfo
      ? { vendorId, updates: submitData }
      : { vendorId, paymentData: submitData };

    mutation(mutationData, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
        onClose();
      },
      onError: (error) => {
        setIsSubmitting(false); // Re-enable on error
        setErrors({ submit: error.message || 'An error occurred while saving payment information.' });
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
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {paymentInfo ? 'Edit Payment Information' : 'Add Payment Information'}
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
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Payment Terms Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="payment_terms_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms <span className="text-red-500">*</span>
                </label>
                {loadingTerms ? (
                  <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">Loading terms...</span>
                  </div>
                ) : (
                  <select
                    id="payment_terms_id"
                    value={formData.payment_terms_id}
                    onChange={(e) => handleChange('payment_terms_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.payment_terms_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">Select payment terms</option>
                    {paymentTerms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name} - {term.days} days
                      </option>
                    ))}
                  </select>
                )}
                {errors.payment_terms_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.payment_terms_id}</p>
                )}
              </div>

              <div>
                <label htmlFor="preferred_payment_method" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Payment Method
                </label>
                <select
                  id="preferred_payment_method"
                  value={formData.preferred_payment_method}
                  onChange={(e) => handleChange('preferred_payment_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                >
                  <option value="ACH">ACH</option>
                  <option value="Wire">Wire Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="credit_limit" className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-600">$</span>
                  <input
                    type="number"
                    id="credit_limit"
                    value={formData.credit_limit}
                    onChange={(e) => handleChange('credit_limit', e.target.value)}
                    className={`w-full pl-7 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.credit_limit ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
                {errors.credit_limit && (
                  <p className="mt-1 text-sm text-red-600">{errors.credit_limit}</p>
                )}
              </div>

              <div>
                <label htmlFor="default_currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  id="default_currency"
                  value={formData.default_currency}
                  onChange={(e) => handleChange('default_currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="MXN">MXN - Mexican Peso</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tax Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tax Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Tax ID / EIN
                </label>
                <input
                  type="text"
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleChange('tax_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="XX-XXXXXXX"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-600">
                  Format: 12-3456789 for EIN or similar tax identification number
                </p>
              </div>
            </div>
          </div>

          {/* Banking Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Banking Information</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-yellow-800">
                {paymentInfo
                  ? 'Banking information is masked. Leave fields blank to keep existing values, or enter new values to update.'
                  : 'Banking information is encrypted and stored securely.'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.bank_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Chase Bank"
                  disabled={isLoading}
                />
                {errors.bank_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.bank_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="routing_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Routing Number
                </label>
                <div className="relative">
                  <input
                    type={showRoutingNumber ? 'text' : 'password'}
                    id="routing_number"
                    value={formData.routing_number}
                    onChange={(e) => handleChange('routing_number', e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3 py-2 pr-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.routing_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="9 digits"
                    maxLength={9}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRoutingNumber(!showRoutingNumber)}
                    className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-900"
                  >
                    {showRoutingNumber ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.routing_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.routing_number}</p>
                )}
              </div>

              <div>
                <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <div className="relative">
                  <input
                    type={showAccountNumber ? 'text' : 'password'}
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => handleChange('account_number', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.account_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Account number"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-900"
                  >
                    {showAccountNumber ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.account_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.account_number}</p>
                )}
              </div>

              <div>
                <label htmlFor="swift_code" className="block text-sm font-medium text-gray-700 mb-1">
                  SWIFT Code (International)
                </label>
                <input
                  type="text"
                  id="swift_code"
                  value={formData.swift_code}
                  onChange={(e) => handleChange('swift_code', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="CHASUS33"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-1">
                  IBAN (International)
                </label>
                <input
                  type="text"
                  id="iban"
                  value={formData.iban}
                  onChange={(e) => handleChange('iban', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="GB29 NWBK 6016 1331 9268 19"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Notes Section */}
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
              placeholder="Additional payment information or instructions..."
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
              {isLoading ? 'Saving...' : 'Save Payment Information'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
