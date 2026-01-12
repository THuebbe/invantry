// /backend/src/services/vendorScorecards.js

import { supabase } from "./supabase.js";

/**
 * Get all scorecards for a vendor with optional filtering
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @param {Object} filters - Optional filters (metric_name, period_start, period_end)
 * @returns {Promise<Array>} Array of vendor scorecard objects
 */
export async function getVendorScorecards(vendorId, restaurantId, filters = {}) {
	try {
		let query = supabase
			.from("vendor_scorecards")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId);

		// Apply filters
		if (filters.metric_name) {
			query = query.eq("metric_name", filters.metric_name);
		}

		if (filters.period_start) {
			query = query.gte("period_start", filters.period_start);
		}

		if (filters.period_end) {
			query = query.lte("period_end", filters.period_end);
		}

		// Order by calculation_date descending (most recent first)
		query = query.order("calculation_date", { ascending: false });

		const { data, error } = await query;
		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching vendor scorecards:", error);
		throw new Error(`Failed to fetch vendor scorecards: ${error.message}`);
	}
}

/**
 * Get specific vendor scorecard by ID
 * @param {string} scorecardId - Scorecard UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Vendor scorecard object
 */
export async function getVendorScorecard(scorecardId, vendorId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_scorecards")
			.select("*")
			.eq("id", scorecardId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new Error("Vendor scorecard not found");
			}
			throw error;
		}

		return data;
	} catch (error) {
		console.error("Error fetching vendor scorecard:", error);
		throw error;
	}
}

/**
 * Get metric history for a specific metric
 * @param {string} vendorId - Vendor UUID
 * @param {string} metricName - Name of the metric
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Array>} Array of scorecard records for this metric
 */
export async function getMetricHistory(vendorId, metricName, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_scorecards")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("metric_name", metricName)
			.eq("restaurant_id", restaurantId)
			.order("period_start", { ascending: true });

		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching metric history:", error);
		throw new Error(`Failed to fetch metric history: ${error.message}`);
	}
}

/**
 * Create a new vendor scorecard
 * @param {Object} data - Scorecard data
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Created scorecard object
 */
export async function createVendorScorecard(data, vendorId, restaurantId) {
	try {
		const {
			metric_name,
			metric_value,
			score,
			period_start,
			period_end,
			calculation_date = new Date().toISOString(),
			data_points_count,
		} = data;

		// Validation
		if (!metric_name || metric_name.trim().length === 0) {
			throw new Error("Metric name is required");
		}

		const validMetrics = [
			"on_time_delivery_pct",
			"order_accuracy_pct",
			"fill_rate_pct",
			"quality_score",
			"response_time_hours",
			"price_competitiveness",
			"invoice_accuracy_pct",
			"overall_rating",
		];
		if (!validMetrics.includes(metric_name)) {
			console.warn(`Metric '${metric_name}' is not a standard metric`);
		}

		if (metric_value === undefined || metric_value === null) {
			throw new Error("Metric value is required");
		}

		const value = parseFloat(metric_value);
		if (isNaN(value)) {
			throw new Error("Metric value must be a number");
		}

		// Validate score if provided
		if (score !== undefined && score !== null) {
			const scoreValue = parseFloat(score);
			if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
				throw new Error("Score must be a number between 0 and 100");
			}
		}

		// Validate dates
		if (!period_start || isNaN(Date.parse(period_start))) {
			throw new Error("Valid period start date is required");
		}

		if (!period_end || isNaN(Date.parse(period_end))) {
			throw new Error("Valid period end date is required");
		}

		if (new Date(period_end) < new Date(period_start)) {
			throw new Error("Period end date must be after period start date");
		}

		// Validate data_points_count if provided
		if (data_points_count !== undefined && data_points_count !== null) {
			const count = parseInt(data_points_count);
			if (isNaN(count) || count < 0) {
				throw new Error("Data points count must be a positive integer");
			}
		}

		// Create scorecard
		const { data: newScorecard, error } = await supabase
			.from("vendor_scorecards")
			.insert({
				vendor_id: vendorId,
				restaurant_id: restaurantId,
				metric_name: metric_name.trim(),
				metric_value: parseFloat(metric_value),
				score: score !== undefined ? Math.round(parseFloat(score)) : null,
				period_start,
				period_end,
				calculation_date,
				data_points_count:
					data_points_count !== undefined
						? parseInt(data_points_count)
						: null,
			})
			.select()
			.single();

		if (error) throw error;

		console.log(
			`✅ Created vendor scorecard: ${metric_name} = ${metric_value} for vendor ${vendorId}`
		);
		return newScorecard;
	} catch (error) {
		console.error("Error creating vendor scorecard:", error);
		throw error;
	}
}

/**
 * Update vendor scorecard
 * @param {string} scorecardId - Scorecard UUID
 * @param {Object} updates - Fields to update
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Updated scorecard object
 */
export async function updateVendorScorecard(
	scorecardId,
	updates,
	vendorId,
	restaurantId
) {
	try {
		// Verify scorecard exists and belongs to vendor/restaurant
		const { data: existing, error: checkError } = await supabase
			.from("vendor_scorecards")
			.select("*")
			.eq("id", scorecardId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor scorecard not found");
			}
			throw checkError;
		}

		// Validate metric_value if being updated
		if (updates.metric_value !== undefined && updates.metric_value !== null) {
			const value = parseFloat(updates.metric_value);
			if (isNaN(value)) {
				throw new Error("Metric value must be a number");
			}
		}

		// Validate score if being updated
		if (updates.score !== undefined && updates.score !== null) {
			const scoreValue = parseFloat(updates.score);
			if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
				throw new Error("Score must be a number between 0 and 100");
			}
		}

		// Validate dates if being updated
		if (updates.period_start && isNaN(Date.parse(updates.period_start))) {
			throw new Error("Invalid period start date format");
		}

		if (updates.period_end && isNaN(Date.parse(updates.period_end))) {
			throw new Error("Invalid period end date format");
		}

		// Validate data_points_count if being updated
		if (
			updates.data_points_count !== undefined &&
			updates.data_points_count !== null
		) {
			const count = parseInt(updates.data_points_count);
			if (isNaN(count) || count < 0) {
				throw new Error("Data points count must be a positive integer");
			}
		}

		// Prevent changing vendor_id or restaurant_id
		delete updates.vendor_id;
		delete updates.restaurant_id;
		delete updates.created_at;

		// Prepare update data
		const updateData = {};
		Object.keys(updates).forEach((key) => {
			if (updates[key] !== undefined) {
				// Parse numeric fields explicitly (same as create function)
				if (key === 'metric_value') {
					updateData[key] = parseFloat(updates[key]);
				} else if (key === 'score') {
					updateData[key] = Math.round(parseFloat(updates[key]));
				} else if (key === 'data_points_count') {
					updateData[key] = parseInt(updates[key]);
				} else {
					updateData[key] =
						typeof updates[key] === "string"
							? updates[key].trim()
							: updates[key];
				}
			}
		});

		updateData.updated_at = new Date().toISOString();

		// Perform update
		const { data, error } = await supabase
			.from("vendor_scorecards")
			.update(updateData)
			.eq("id", scorecardId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Updated vendor scorecard: ${scorecardId}`);
		return data;
	} catch (error) {
		console.error("Error updating vendor scorecard:", error);
		throw error;
	}
}

/**
 * Delete vendor scorecard
 * @param {string} scorecardId - Scorecard UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Success message
 */
export async function deleteVendorScorecard(
	scorecardId,
	vendorId,
	restaurantId
) {
	try {
		// Verify scorecard exists
		const { data: scorecard, error: checkError } = await supabase
			.from("vendor_scorecards")
			.select("*")
			.eq("id", scorecardId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor scorecard not found");
			}
			throw checkError;
		}

		// Delete scorecard
		const { error } = await supabase
			.from("vendor_scorecards")
			.delete()
			.eq("id", scorecardId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId);

		if (error) throw error;

		console.log(`✅ Deleted vendor scorecard: ${scorecardId}`);
		return { message: "Vendor scorecard deleted successfully" };
	} catch (error) {
		console.error("Error deleting vendor scorecard:", error);
		throw error;
	}
}
