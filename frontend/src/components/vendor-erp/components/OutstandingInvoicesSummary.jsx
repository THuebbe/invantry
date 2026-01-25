// OutstandingInvoicesSummary.jsx - Table showing outstanding invoices for a vendor
import { useState, useMemo } from "react";
import { FileText, ArrowUpDown, AlertCircle, Loader2 } from "lucide-react";
import { useVendorInvoices } from "../../../hooks/useVendorInvoices";
import { formatCurrency, formatDate } from "../../../utils/vendorFormatters";

// Status badge configurations
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
  },
  partial: {
    label: "Partial",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  paid: {
    label: "Paid",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  overdue: {
    label: "Overdue",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
  },
};

function getInvoiceStatus(invoice) {
  const now = new Date();
  const dueDate = new Date(invoice.due_date);
  const balance = invoice.amount - (invoice.amount_paid || 0);

  if (balance <= 0) return "paid";
  if (dueDate < now) return "overdue";
  if ((invoice.amount_paid || 0) > 0) return "partial";
  return "pending";
}

function getDaysOverdue(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function OutstandingInvoicesSummary({ vendorId, initialInvoices }) {
  const [sortField, setSortField] = useState("due_date");
  const [sortDirection, setSortDirection] = useState("asc");

  // Use initialInvoices if provided, otherwise fetch from API
  const { data: fetchedInvoices, isLoading, error } = useVendorInvoices(
    vendorId,
    { status: "outstanding" }, // Only fetch outstanding invoices
    { enabled: !initialInvoices }
  );

  const invoices = initialInvoices || fetchedInvoices || [];

  // Filter to only show outstanding (not fully paid) invoices
  const outstandingInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const balance = inv.amount - (inv.amount_paid || 0);
      return balance > 0;
    });
  }, [invoices]);

  // Sort invoices
  const sortedInvoices = useMemo(() => {
    return [...outstandingInvoices].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "invoice_number":
          aValue = a.invoice_number || "";
          bValue = b.invoice_number || "";
          break;
        case "invoice_date":
          aValue = new Date(a.invoice_date);
          bValue = new Date(b.invoice_date);
          break;
        case "due_date":
          aValue = new Date(a.due_date);
          bValue = new Date(b.due_date);
          break;
        case "amount":
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case "balance":
          aValue = a.amount - (a.amount_paid || 0);
          bValue = b.amount - (b.amount_paid || 0);
          break;
        case "days_overdue":
          aValue = getDaysOverdue(a.due_date);
          bValue = getDaysOverdue(b.due_date);
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [outstandingInvoices, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading invoices...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Failed to load invoices: {error.message}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedInvoices.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900 mb-1">No Outstanding Invoices</h3>
        <p className="text-sm text-gray-600">
          All invoices for this vendor have been paid.
        </p>
      </div>
    );
  }

  // Calculate totals
  const totalAmount = sortedInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = sortedInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalBalance = totalAmount - totalPaid;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Outstanding Invoices ({sortedInvoices.length})
          </h3>
        </div>
        <div className="text-sm text-gray-600">
          Total Due: <span className="font-semibold text-gray-900">{formatCurrency(totalBalance)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableHeader
                label="Invoice #"
                field="invoice_number"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Date"
                field="invoice_date"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Due Date"
                field="due_date"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Amount"
                field="amount"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="right"
              />
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid
              </th>
              <SortableHeader
                label="Balance"
                field="balance"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="right"
              />
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <SortableHeader
                label="Days Overdue"
                field="days_overdue"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="center"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedInvoices.map((invoice) => {
              const status = getInvoiceStatus(invoice);
              const statusConfig = STATUS_CONFIG[status];
              const balance = invoice.amount - (invoice.amount_paid || 0);
              const daysOverdue = getDaysOverdue(invoice.due_date);

              return (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(invoice.invoice_date)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="px-4 py-3 text-gray-900 text-right">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-right">
                    {formatCurrency(invoice.amount_paid || 0)}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium text-right">
                    {formatCurrency(balance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {status === "overdue" ? (
                      <span className="text-red-600 font-medium">{daysOverdue}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Footer with totals */}
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900">
                Total
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                {formatCurrency(totalAmount)}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">
                {formatCurrency(totalPaid)}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                {formatCurrency(totalBalance)}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// Sortable table header component
function SortableHeader({ label, field, currentField, direction, onSort, align = "left" }) {
  const isActive = currentField === field;
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <th
      className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${alignClass}`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`}>
        <span>{label}</span>
        <ArrowUpDown
          className={`w-3 h-3 ${isActive ? "text-gray-900" : "text-gray-400"}`}
        />
      </div>
    </th>
  );
}
