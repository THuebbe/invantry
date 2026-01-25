// InvoiceQuickEntry.jsx - Quick form to add a vendor invoice
import { useState } from "react";
import { FileText, Plus, X, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useCreateVendorInvoice } from "../../../hooks/useVendorInvoices";

export default function InvoiceQuickEntry({ vendorId, purchaseOrders = [], onSuccess }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    amount: "",
    purchase_order_id: "",
    notes: "",
  });

  const { mutate: createInvoice, isPending } = useCreateVendorInvoice();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.invoice_number || !formData.invoice_date || !formData.due_date || !formData.amount) {
      alert("Please fill in all required fields.");
      return;
    }

    const invoiceData = {
      ...formData,
      amount: parseFloat(formData.amount),
      purchase_order_id: formData.purchase_order_id || null,
    };

    createInvoice(
      { vendorId, invoiceData },
      {
        onSuccess: () => {
          // Reset form
          setFormData({
            invoice_number: "",
            invoice_date: new Date().toISOString().split("T")[0],
            due_date: "",
            amount: "",
            purchase_order_id: "",
            notes: "",
          });
          // Show success message
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
          // Callback
          if (onSuccess) onSuccess();
        },
        onError: (error) => {
          console.error("Failed to create invoice:", error);
          alert(`Failed to create invoice: ${error.message}`);
        },
      }
    );
  };

  const handleClear = () => {
    setFormData({
      invoice_number: "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      amount: "",
      purchase_order_id: "",
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
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">Add Invoice</span>
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
              <span className="text-sm">Invoice added successfully!</span>
            </div>
          )}

          {/* Row 1: Invoice Number + Invoice Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                placeholder="INV-12345"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Row 2: Due Date + Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 3: Purchase Order (Optional) */}
          {purchaseOrders.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Link to Purchase Order (Optional)
              </label>
              <select
                name="purchase_order_id"
                value={formData.purchase_order_id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No linked PO</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.po_number} - ${po.total?.toFixed(2) || "0.00"}
                  </option>
                ))}
              </select>
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
              placeholder="Additional notes about this invoice..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Invoice
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
