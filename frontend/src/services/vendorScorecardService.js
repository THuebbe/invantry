import api from '../core/database/api';

/**
 * Get all scorecards for a vendor
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<Array>} Array of scorecard objects
 */
export async function fetchVendorScorecards(vendorId) {
  const response = await api.get(`/vendors/${vendorId}/scorecards`);
  return response.data;
}

/**
 * Get single scorecard by ID
 * @param {string} vendorId - Vendor UUID
 * @param {string} scorecardId - Scorecard UUID
 * @returns {Promise<Object>} Scorecard object
 */
export async function fetchVendorScorecard(vendorId, scorecardId) {
  const response = await api.get(`/vendors/${vendorId}/scorecards/${scorecardId}`);
  return response.data;
}

/**
 * Create vendor scorecard
 * @param {string} vendorId - Vendor UUID
 * @param {Object} scorecardData - Scorecard data
 * @param {string} scorecardData.period_start - Period start date in YYYY-MM-DD format (required)
 * @param {string} scorecardData.period_end - Period end date in YYYY-MM-DD format (required)
 * @param {number} scorecardData.on_time_delivery_pct - % of on-time deliveries (0-100) (optional)
 * @param {number} scorecardData.order_accuracy_pct - % of accurate orders (0-100) (optional)
 * @param {number} scorecardData.fill_rate_pct - % of items fulfilled (0-100) (optional)
 * @param {number} scorecardData.quality_rating - Quality rating (0-5 scale) (optional)
 * @param {number} scorecardData.response_time_hours - Avg response time in hours (optional)
 * @param {number} scorecardData.issue_resolution_days - Avg days to resolve issues (optional)
 * @param {number} scorecardData.total_orders - Number of orders in period (optional)
 * @param {number} scorecardData.total_order_value - Total dollar value of orders (optional)
 * @param {string} scorecardData.notes - Additional notes (optional)
 * @returns {Promise<Object>} Created scorecard
 */
export async function createVendorScorecard(vendorId, scorecardData) {
  const response = await api.post(`/vendors/${vendorId}/scorecards`, scorecardData);
  return response.data;
}

/**
 * Update vendor scorecard
 * @param {string} vendorId - Vendor UUID
 * @param {string} scorecardId - Scorecard UUID
 * @param {Object} updates - Partial scorecard data to update
 * @returns {Promise<Object>} Updated scorecard
 */
export async function updateVendorScorecard(vendorId, scorecardId, updates) {
  const response = await api.put(`/vendors/${vendorId}/scorecards/${scorecardId}`, updates);
  return response.data;
}

/**
 * Get metric history (trend data) for a specific performance metric
 * @param {string} vendorId - Vendor UUID
 * @param {string} metricName - Metric name: on_time_delivery_pct, order_accuracy_pct, fill_rate_pct, quality_rating, response_time_hours, issue_resolution_days
 * @returns {Promise<Array>} Array of {period_start, period_end, metric_value} objects
 */
export async function fetchMetricHistory(vendorId, metricName) {
  const response = await api.get(`/vendors/${vendorId}/scorecards/metric/${metricName}`);
  return response.data;
}

/**
 * Delete vendor scorecard
 * @param {string} vendorId - Vendor UUID
 * @param {string} scorecardId - Scorecard UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteVendorScorecard(vendorId, scorecardId) {
  const response = await api.delete(`/vendors/${vendorId}/scorecards/${scorecardId}`);
  return response.data;
}
