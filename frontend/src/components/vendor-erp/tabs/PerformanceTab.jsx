// PerformanceTab.jsx - Vendor performance metrics and scorecard
// Shows scorecard metrics with charts

import { TrendingUp, TrendingDown, Award, CheckCircle, AlertCircle, Package, DollarSign, Calendar, Loader2 } from "lucide-react";
import { useVendorScorecards } from "../../../hooks/useVendorScorecards";
import { useVendor } from "../../../hooks/useVendors";
import BarChart from "../../shared/BarChart";

export default function PerformanceTab({ vendorId }) {
  const { data: scorecards = [], isLoading: scorecardsLoading, error: scorecardsError, refetch: refetchScorecards } = useVendorScorecards(vendorId);
  const { data: vendor, isLoading: vendorLoading, error: vendorError } = useVendor(vendorId);

  const isLoading = scorecardsLoading || vendorLoading;
  const error = scorecardsError || vendorError;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading performance data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-red-900 mb-2">Error Loading Performance Data</h3>
        <p className="text-sm text-red-800 mb-3">
          {error.message || 'An error occurred while loading performance data.'}
        </p>
        <button
          onClick={() => refetchScorecards()}
          className="bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 text-sm rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Create metrics object from vendor data for backwards compatibility
  const metrics = vendor ? {
    total_items: vendor.total_items || 0,
    total_spend_ytd: vendor.total_spend_ytd || 0,
    total_orders_ytd: vendor.total_orders_ytd || 0,
    avg_order_value: vendor.avg_order_value || 0,
    last_order_date: vendor.last_order_date
  } : null;

  if (!scorecards || scorecards.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          No performance data
        </h3>
        <p className="text-sm text-gray-600">
          Performance metrics will appear once vendor activity is recorded
        </p>
      </div>
    );
  }

  // Calculate overall performance grade
  const avgScore =
    scorecards.reduce((sum, s) => sum + s.score, 0) / scorecards.length;
  const overallGrade = getGradeFromScore(avgScore);

  // Prepare chart data
  const chartData = scorecards.map((scorecard) => ({
    label: scorecard.metric_label,
    value: scorecard.score,
    color: getScoreColor(scorecard.score),
  }));

  return (
    <div className="space-y-4">
      {/* Summary KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-4 gap-3">
          {/* Total Items */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-600" />
              <div className="text-xs text-blue-700">Total Items</div>
            </div>
            <div className="text-2xl font-bold text-blue-900">{metrics.total_items}</div>
            <div className="text-xs text-blue-600 mt-0.5">Products supplied</div>
          </div>

          {/* YTD Spend */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <div className="text-xs text-purple-700">YTD Spend</div>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrencyCompact(metrics.total_spend_ytd)}
            </div>
            <div className="text-xs text-purple-600 mt-0.5">
              {metrics.total_orders_ytd} orders
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div className="text-xs text-green-700">Avg Order Value</div>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrencyCompact(metrics.avg_order_value)}
            </div>
            <div className="text-xs text-green-600 mt-0.5">per order</div>
          </div>

          {/* Last Order Date */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-600" />
              <div className="text-xs text-gray-700">Last Order</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDateRelative(metrics.last_order_date)}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              {formatDateAbsolute(metrics.last_order_date)}
            </div>
          </div>
        </div>
      )}

      {/* Header with Overall Grade */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-600" />
              Vendor Performance Scorecard
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Based on {scorecards[0]?.data_points_count || 0} data points from{" "}
              {formatDate(scorecards[0]?.period_start)} to{" "}
              {formatDate(scorecards[0]?.period_end)}
            </p>
          </div>

          {/* Overall Grade Badge */}
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Overall Grade</div>
            <div
              className={`text-4xl font-bold ${getGradeColorClass(overallGrade)}`}
            >
              {overallGrade}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {avgScore.toFixed(1)}% Average
            </div>
          </div>
        </div>
      </div>

      {/* Scorecard Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scorecards.map((scorecard) => (
          <ScoreCardMetric key={scorecard.id} scorecard={scorecard} />
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Performance Metrics Comparison
        </h4>
        <BarChart
          data={chartData}
          orientation="horizontal"
          height={chartData.length * 50 + 40}
          valueFormat="percentage"
          showValues={true}
          maxValue={100}
        />
      </div>

      {/* Performance Trends */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Trend Analysis
        </h4>

        <div className="space-y-2">
          {scorecards.map((scorecard) => (
            <div
              key={scorecard.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900">
                  {scorecard.metric_label}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">
                  {scorecard.score}%
                </span>
                <TrendBadge trend={scorecard.trend} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grade Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Performance Grading Scale
        </h4>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="bg-green-100 border border-green-200 rounded p-2 text-center">
            <div className="font-bold text-green-700">A</div>
            <div className="text-green-600">90-100%</div>
          </div>
          <div className="bg-blue-100 border border-blue-200 rounded p-2 text-center">
            <div className="font-bold text-blue-700">B</div>
            <div className="text-blue-600">80-89%</div>
          </div>
          <div className="bg-yellow-100 border border-yellow-200 rounded p-2 text-center">
            <div className="font-bold text-yellow-700">C</div>
            <div className="text-yellow-600">70-79%</div>
          </div>
          <div className="bg-orange-100 border border-orange-200 rounded p-2 text-center">
            <div className="font-bold text-orange-700">D</div>
            <div className="text-orange-600">60-69%</div>
          </div>
          <div className="bg-red-100 border border-red-200 rounded p-2 text-center">
            <div className="font-bold text-red-700">F</div>
            <div className="text-red-600">&lt; 60%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual scorecard metric component
function ScoreCardMetric({ scorecard }) {
  const scoreColor = getScoreColorClass(getGradeFromScore(scorecard.score));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">
            {scorecard.metric_label}
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            {scorecard.data_points_count} data points
          </p>
        </div>

        <TrendBadge trend={scorecard.trend} />
      </div>

      {/* Score Display */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-3xl font-bold ${scoreColor}`}>
          {scorecard.metric_value?.toFixed(1) || scorecard.score}
          {scorecard.metric_name.includes("pct") ? "%" : ""}
        </span>
        <span className="text-sm text-gray-600">
          Score: {scorecard.score}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getScoreBarColor(scorecard.score)}`}
          style={{ width: `${scorecard.score}%` }}
        />
      </div>
    </div>
  );
}

// Trend badge component
function TrendBadge({ trend }) {
  if (trend === "up") {
    return (
      <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs">
        <TrendingUp className="w-3 h-3" />
        Improving
      </span>
    );
  }

  if (trend === "down") {
    return (
      <span className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs">
        <TrendingDown className="w-3 h-3" />
        Declining
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-xs">
      <CheckCircle className="w-3 h-3" />
      Stable
    </span>
  );
}

// Utility functions
function getGradeFromScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function getGradeColorClass(grade) {
  const colors = {
    A: "text-green-700",
    B: "text-blue-700",
    C: "text-yellow-700",
    D: "text-orange-700",
    F: "text-red-700",
  };
  return colors[grade] || "text-gray-700";
}

function getScoreColorClass(grade) {
  const colors = {
    A: "text-green-700",
    B: "text-blue-700",
    C: "text-yellow-700",
    D: "text-orange-700",
    F: "text-red-700",
  };
  return colors[grade] || "text-gray-700";
}

function getScoreColor(score) {
  if (score >= 90) return "bg-green-500";
  if (score >= 80) return "bg-blue-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 60) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreBarColor(score) {
  if (score >= 90) return "bg-green-600";
  if (score >= 80) return "bg-blue-600";
  if (score >= 70) return "bg-yellow-600";
  if (score >= 60) return "bg-orange-600";
  return "bg-red-600";
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrencyCompact(value) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateRelative(dateString) {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return `${Math.floor(diffDays / 365)} years ago`;
}

function formatDateAbsolute(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
