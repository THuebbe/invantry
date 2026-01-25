// PaymentQuickEntry.jsx - Quick form to record a vendor AP payment
import { useState } from "react";
import { DollarSign, Plus, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useCreateVendorPayment } from "../../../hooks/useVendorAPPayments";

const PAYMENT_METHODS = [
  { value: "ACH", label: "ACH Transfer" },
  { value: "Wire", label: "Wire Transfer" },
  { value: "Check", label: "Check" },
  { value: "Credit Card", label: "Credit Card" },
  { value: "Other", label: "Other" },
];

export default function PaymentQuickEntry({ vendorId, openInvoices = [], onSuccess }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
    payment_method: "ACH",
    reference_number: "",
    invoice_id: "",
    notes: "",
  });

  const { mutate: createPayment, isPending } = useCreateVendorPayment();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // When an invoice is selected, auto-fill the amount ONLY if amount is empty
  const handleInvoiceChange = (e) => {
    const invoiceId = e.target.value;
    setFormData((prev) => {
      const updates = { invoice_id: invoiceId };

      // Only auto-fill amount if it's currently empty
      if (invoiceId && !prev.amount) {
        const selectedInvoice = openInvoices.find((inv) => inv.id === invoiceId);
        if (selectedInvoice) {
          const balance = selectedInvoice.amount - (selectedInvoice.amount_paid || 0);
          updates.amount = balance.toFixed(2);
        }
      }

      return { ...prev, ...updates };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.payment_date || !formData.amount || !formData.payment_method) {
      alert("Please fill in all required fields.");
      return;
    }

    const paymentData = {
      ...formData,
      amount: parseFloat(formData.amount),
      invoice_id: formData.invoice_id || null,
    };

    createPayment(
      { vendorId, paymentData },
      {
        onSuccess: () => {
          // Reset form
          setFormData({
            payment_date: new Date().toISOString().split("T")[0],
            amount: "",
            payment_method: "ACH",
            reference_number: "",
            invoice_id: "",
            notes: "",
          });
          // Show success message
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
          // Callback
          if (onSuccess) onSuccess();
        },
        onError: (error) => {
          console.error("Failed to record payment:", error);
          alert(`Failed to record payment: ${error.message}`);
        },
      }
    );
  };

  const handleClear = () => {
    setFormData({
      payment_date: new Date().toISOString().split("T")[0],
      amount: "",
      payment_method: "ACH",
      reference_number: "",
      invoice_id: "",
      notes: "",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="text-sm font-semibold text-gray-900">Record Payment</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Form Content */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4">
          {/* Success Message */}
          {showSuccess && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg p-3">
              <Check className="w-4 h-4" />
              <span className="text-sm">Payment recorded successfully!</span>
            </div>
          )}

          {/* Row 1: Payment Date + Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 2: Payment Method + Reference Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reference # (Check/Transaction ID)
              </label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                placeholder="e.g., Check #1234"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Row 3: Apply to Invoice (Optional) */}
          {openInvoices.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Apply to Invoice (Optional)
              </label>
              <select
                name="invoice_id"
                value={formData.invoice_id}
                onChange={handleInvoiceChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Apply as general payment</option>
                {openInvoices.map((inv) => {
                  const balance = inv.amount - (inv.amount_paid || 0);
                  return (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - Balance: ${balance.toFixed(2)}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select an invoice to automatically apply this payment to it.
              </p>
            </div>
          )}

          {/* Row 4: Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Payment memo or additional details..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
