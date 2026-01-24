// PaymentTab.jsx - Payment and banking information
// Shows payment terms, tax ID (masked), banking info (masked)

import { CreditCard, DollarSign, Building, Eye, EyeOff, Edit, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useVendorPaymentInfo } from "../../../hooks/useVendorPayment";
import PaymentInfoForm from "../forms/PaymentInfoForm";

export default function PaymentTab({ vendorId, initialPaymentInfo, onRefetch }) {
  // Use initialPaymentInfo if provided, otherwise fall back to API call
  const { data: fetchedPaymentInfo, isLoading: isFetching, error, refetch: apiRefetch } = useVendorPaymentInfo(vendorId, {
    enabled: !initialPaymentInfo // Only fetch if no initial data provided
  });

  // Local state to track payment info (use initial data if available)
  const [paymentInfo, setPaymentInfo] = useState(initialPaymentInfo || null);
  const [isLoading, setIsLoading] = useState(!initialPaymentInfo);
  const [showTaxId, setShowTaxId] = useState(false);
  const [showBankAccount, setShowBankAccount] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Update payment info when fetched data arrives (for API fallback case)
  useEffect(() => {
    if (fetchedPaymentInfo && !initialPaymentInfo) {
      setPaymentInfo(fetchedPaymentInfo);
      setIsLoading(false);
    }
  }, [fetchedPaymentInfo, initialPaymentInfo]);

  // Update loading state when initial data is provided
  useEffect(() => {
    if (initialPaymentInfo !== undefined) {
      setPaymentInfo(initialPaymentInfo);
      setIsLoading(false);
    }
  }, [initialPaymentInfo]);

  // Handle refetch - use parent's refetch if available, otherwise use API
  const refetch = () => {
    if (onRefetch) {
      onRefetch();
    } else {
      apiRefetch();
    }
  };

  const handleEdit = () => {
    setShowPaymentForm(true);
  };

  const handleFormClose = () => {
    setShowPaymentForm(false);
  };

  const handleFormSuccess = () => {
    refetch(); // Refresh payment info after successful save
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading payment information...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-red-900 mb-2">Error Loading Payment Information</h3>
        <p className="text-sm text-red-800 mb-3">
          {error.message || 'An error occurred while loading payment information.'}
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

  if (!paymentInfo) {
    return (
      <>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No payment information
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Add payment and banking details for this vendor
          </p>
          <button
            onClick={handleEdit}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm rounded"
          >
            Add Payment Info
          </button>
        </div>

        {/* Payment Info Form Modal */}
        {showPaymentForm && (
          <PaymentInfoForm
            vendorId={vendorId}
            paymentInfo={null}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-600" />
            Payment & Banking Information
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Payment terms and banking details
          </p>
        </div>

        <button
          onClick={handleEdit}
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 text-sm rounded flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Payment Terms */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-600" />
          Payment Terms
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Payment Term" value={paymentInfo.payment_term} />
          <InfoItem label="Payment Method" value={formatPaymentMethod(paymentInfo.payment_method)} />
          <InfoItem
            label="Credit Limit"
            value={formatCurrency(paymentInfo.credit_limit)}
          />
          <InfoItem
            label="Current Balance"
            value={formatCurrency(paymentInfo.current_balance)}
            valueColor={
              paymentInfo.current_balance > paymentInfo.credit_limit * 0.8
                ? "text-red-600"
                : "text-green-600"
            }
          />
        </div>
      </div>

      {/* Tax Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Tax Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Tax ID Type" value={paymentInfo.tax_id_type} />
          <div>
            <dt className="text-xs font-medium text-gray-600 mb-1">Tax ID Number</dt>
            <div className="flex items-center gap-2">
              <dd className="text-sm text-gray-900 font-mono">
                {showTaxId
                  ? paymentInfo.tax_id_number
                  : maskTaxId(paymentInfo.tax_id_number)}
              </dd>
              <button
                onClick={() => setShowTaxId(!showTaxId)}
                className="text-gray-600 hover:text-gray-900"
                aria-label={showTaxId ? "Hide tax ID" : "Show tax ID"}
              >
                {showTaxId ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banking Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-600" />
          Banking Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Bank Name" value={paymentInfo.bank_name} />
          <InfoItem
            label="Account Type"
            value={paymentInfo.bank_account_type}
          />
          <InfoItem
            label="Routing Number"
            value={paymentInfo.bank_routing_number}
          />
          <div>
            <dt className="text-xs font-medium text-gray-600 mb-1">
              Account Number
            </dt>
            <div className="flex items-center gap-2">
              <dd className="text-sm text-gray-900 font-mono">
                {showBankAccount
                  ? paymentInfo.bank_account_number
                  : maskAccountNumber(paymentInfo.bank_account_number)}
              </dd>
              <button
                onClick={() => setShowBankAccount(!showBankAccount)}
                className="text-gray-600 hover:text-gray-900"
                aria-label={
                  showBankAccount ? "Hide account number" : "Show account number"
                }
              >
                {showBankAccount ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <InfoItem
            label="Remittance Email"
            value={
              <a
                href={`mailto:${paymentInfo.remittance_email}`}
                className="text-green-600 hover:underline"
              >
                {paymentInfo.remittance_email}
              </a>
            }
          />
        </div>
      </div>

      {/* Notes */}
      {paymentInfo.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Payment Notes
          </h4>
          <p className="text-sm text-blue-800">{paymentInfo.notes}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">
          Security Notice
        </h4>
        <p className="text-sm text-yellow-800">
          Sensitive financial information is masked by default. Click the eye icon to
          temporarily reveal full account numbers. This information should only be
          accessed when necessary for payment processing.
        </p>
      </div>

      {/* Payment Info Form Modal */}
      {showPaymentForm && (
        <PaymentInfoForm
          vendorId={vendorId}
          paymentInfo={paymentInfo}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

// Helper component for information items
function InfoItem({ label, value, valueColor = "text-gray-900" }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-600 mb-1">{label}</dt>
      <dd className={`text-sm ${valueColor}`}>{value || "—"}</dd>
    </div>
  );
}

// Utility functions for masking
function maskTaxId(taxId) {
  if (!taxId) return "—";
  // Show only last 4 digits: 12-3456789 -> XX-XXXX789
  const cleanId = taxId.replace(/[^0-9]/g, "");
  const last4 = cleanId.slice(-4);
  return `XX-XXXX${last4}`;
}

function maskAccountNumber(accountNumber) {
  if (!accountNumber) return "—";
  // Show only last 4 digits: 1234567890123456 -> ************3456
  const last4 = accountNumber.slice(-4);
  return `${"*".repeat(accountNumber.length - 4)}${last4}`;
}

// Utility function to format currency
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Utility function to format payment method for display
function formatPaymentMethod(method) {
  if (!method || method === "N/A") return "N/A";
  const methodLabels = {
    "ACH": "ACH",
    "Wire": "Wire Transfer",
    "Check": "Check",
    "Credit Card": "Credit Card",
    "Other": "Other"
  };
  return methodLabels[method] || method;
}
