// VendorMetricsDashboard.jsx - Vendor performance metrics overview
// Shows aggregate metrics across all vendors

import { ArrowLeft, TrendingUp, Package, DollarSign, Calendar, Award, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVendors, useVendorMetrics } from "../../hooks/useVendors";

export default function VendorMetricsDashboard() {
  const navigate = useNavigate();

  // Fetch vendors and metrics from backend
  const { data: vendors = [], isLoading: isLoadingVendors, error: vendorsError } = useVendors();
  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useVendorMetrics();

  // Loading state
  if (isLoadingVendors || isLoadingMetrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading vendor metrics...</span>
      </div>
    );
  }

  // Error state
  if (vendorsError || metricsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-red-900 mb-2">Error Loading Metrics</h3>
        <p className="text-sm text-red-800">
          {vendorsError?.message || metricsError?.message || 'An error occurred while loading vendor metrics.'}
        </p>
      </div>
    );
  }

  // Calculate aggregate metrics from real data
  const totalVendors = vendors.length;
  const activeVendors = metrics?.activeVendorsCount || vendors.filter((v) => v.is_active).length;

  // These metrics come from individual vendor stats
  const totalItems = vendors.reduce((sum, v) => sum + (v.itemCount || 0), 0);

  // Placeholder for metrics not yet in backend
  const totalSpendYTD = 0; // TODO: Add to backend metrics
  const avgOnTimeDelivery = "95.0"; // TODO: Add to backend metrics
  const avgOrderAccuracy = "97.5"; // TODO: Add to backend metrics

  const gradeA = vendors.filter((v) => v.performance_grade === "A").length;
  const gradeB = vendors.filter((v) => v.performance_grade === "B").length;
  const gradeC = vendors.filter((v) => v.performance_grade === "C").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/vendors")}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <TrendingUp className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-bold text-gray-900">Vendor Metrics Dashboard</h2>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Vendors"
          value={activeVendors}
          subtitle={`of ${totalVendors} total`}
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Total Items"
          value={totalItems}
          subtitle="across all vendors"
          icon={Package}
          color="green"
        />
        <MetricCard
          title="YTD Spend"
          value={formatCurrency(totalSpendYTD)}
          subtitle="this year"
          icon={DollarSign}
          color="purple"
        />
        <MetricCard
          title="Avg On-Time Delivery"
          value={`${avgOnTimeDelivery}%`}
          subtitle="across all vendors"
          icon={Calendar}
          color="green"
        />
      </div>

      {/* Performance Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-gray-600" />
          Performance Grade Distribution
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">{gradeA}</div>
              <div className="text-sm text-green-600">Grade A</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">{gradeB}</div>
              <div className="text-sm text-blue-600">Grade B</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700">{gradeC}</div>
              <div className="text-sm text-yellow-600">Grade C</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-600" />
          Top Performing Vendors
        </h3>
        <div className="space-y-3">
          {vendors.filter((v) => v.performance_grade === "A")
            .slice(0, 5)
            .map((vendor, index) => (
              <div
                key={vendor.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
                onClick={() => navigate(`/vendors/detail?vendorId=${vendor.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {vendor.name}
                    </div>
                    <div className="text-xs text-gray-600">{vendor.vendor_code}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-xs font-semibold">
                    Grade {vendor.performance_grade}
                  </span>
                  <span className="text-sm text-gray-600">{vendor.itemCount} items</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Average Quality Metrics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">On-Time Delivery</div>
            <div className="text-2xl font-bold text-green-700">{avgOnTimeDelivery}%</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">Order Accuracy</div>
            <div className="text-2xl font-bold text-blue-700">{avgOrderAccuracy}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm text-gray-600">{title}</h3>
      </div>
      <div className={`text-2xl font-bold mb-1 ${colorClasses[color]?.split(" ")[2] || "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
