// AgingSummaryCard.jsx - Card showing aging buckets for vendor accounts payable
import { Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useVendorAging } from "../../../hooks/useVendorInvoices";
import { formatCurrency } from "../../../utils/vendorFormatters";

// Aging bucket configurations
const AGING_BUCKETS = [
  {
    key: "current",
    label: "Current",
    description: "Not yet due",
    colorClass: "bg-green-500",
    textClass: "text-green-700",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
  },
  {
    key: "days_1_30",
    label: "1-30 Days",
    description: "Slightly overdue",
    colorClass: "bg-yellow-500",
    textClass: "text-yellow-700",
    bgClass: "bg-yellow-50",
    borderClass: "border-yellow-200",
  },
  {
    key: "days_31_60",
    label: "31-60 Days",
    description: "Moderately overdue",
    colorClass: "bg-orange-500",
    textClass: "text-orange-700",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200",
  },
  {
    key: "days_61_90",
    label: "61-90 Days",
    description: "Significantly overdue",
    colorClass: "bg-red-400",
    textClass: "text-red-600",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
  },
  {
    key: "days_90_plus",
    label: "90+ Days",
    description: "Severely overdue",
    colorClass: "bg-red-600",
    textClass: "text-red-700",
    bgClass: "bg-red-100",
    borderClass: "border-red-300",
  },
];

export default function AgingSummaryCard({ vendorId, initialAging }) {
  // Use initialAging if provided, otherwise fetch from API
  const { data: fetchedAging, isLoading, error } = useVendorAging(vendorId, {
    enabled: !initialAging,
  });

  const aging = initialAging || fetchedAging;

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading aging summary...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">Failed to load aging data: {error.message}</span>
        </div>
      </div>
    );
  }

  // If no aging data, show empty state
  if (!aging) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No aging data available</p>
      </div>
    );
  }

  // Calculate total
  const total = aging.total || AGING_BUCKETS.reduce((sum, bucket) => sum + (aging[bucket.key] || 0), 0);

  // Calculate percentages for progress bar
  const getPercentage = (value) => {
    if (total <= 0) return 0;
    return (value / total) * 100;
  };

  // Check if there are any overdue amounts
  const hasOverdue = (aging.days_1_30 || 0) + (aging.days_31_60 || 0) +
                     (aging.days_61_90 || 0) + (aging.days_90_plus || 0) > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Aging Summary</h3>
        </div>
        {hasOverdue && (
          <span className="flex items-center gap-1 text-xs text-orange-600">
            <AlertTriangle className="w-3 h-3" />
            Overdue balance
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Progress bar showing all buckets */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
          {AGING_BUCKETS.map((bucket) => {
            const value = aging[bucket.key] || 0;
            const percentage = getPercentage(value);
            if (percentage <= 0) return null;

            return (
              <div
                key={bucket.key}
                className={`${bucket.colorClass} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
                title={`${bucket.label}: ${formatCurrency(value)}`}
              />
            );
          })}
        </div>

        {/* Aging buckets grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {AGING_BUCKETS.map((bucket) => {
            const value = aging[bucket.key] || 0;

            return (
              <div
                key={bucket.key}
                className={`p-3 rounded-lg border ${bucket.bgClass} ${bucket.borderClass}`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <div className={`w-2 h-2 rounded-full ${bucket.colorClass}`} />
                  <span className="text-xs font-medium text-gray-700">{bucket.label}</span>
                </div>
                <div className={`text-lg font-semibold ${bucket.textClass}`}>
                  {formatCurrency(value)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700">Total Outstanding</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
