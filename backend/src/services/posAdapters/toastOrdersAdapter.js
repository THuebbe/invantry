// /backend/src/services/posAdapters/toastOrdersAdapter.js

/**
 * Toast POS Orders/Sales Adapter
 *
 * Toast API Documentation: https://doc.toasttab.com/
 *
 * Fetches orders from Toast for sales tracking and inventory deduction.
 * Requires Orders API scope in Toast Partner application.
 */

import axios from "axios";

/**
 * Fetch orders from Toast POS for a date range
 * @param {object} credentials - Toast API credentials
 * @param {string} credentials.restaurantGuid - Toast restaurant GUID
 * @param {string} credentials.accessToken - Toast API access token
 * @param {string} credentials.apiUrl - Optional API URL override
 * @param {object} options - Fetch options
 * @param {string} options.startDate - Start date (ISO string or YYYY-MM-DD)
 * @param {string} options.endDate - End date (ISO string or YYYY-MM-DD)
 * @param {number} options.pageSize - Number of orders per page (default: 100)
 * @param {string} options.pageToken - Pagination token for next page
 * @returns {Promise<Object>} Orders data with pagination info
 */
export async function fetchToastOrders(credentials, options = {}) {
	const { restaurantGuid, accessToken, apiUrl } = credentials;

	if (!restaurantGuid || !accessToken) {
		throw new Error(
			"Toast credentials incomplete: restaurantGuid and accessToken required"
		);
	}

	const baseUrl =
		apiUrl || process.env.TOAST_API_URL || "https://ws-api.toasttab.com";

	const {
		startDate,
		endDate,
		pageSize = 100,
		pageToken,
	} = options;

	// Default to today if no dates provided
	const now = new Date();
	const defaultStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
	const defaultEnd = new Date().toISOString();

	try {
		// Build query parameters
		const params = new URLSearchParams({
			startDate: startDate || defaultStart,
			endDate: endDate || defaultEnd,
			pageSize: pageSize.toString(),
		});

		if (pageToken) {
			params.append("pageToken", pageToken);
		}

		// Toast Orders API endpoint
		const response = await axios.get(
			`${baseUrl}/orders/v2/orders?${params.toString()}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Toast-Restaurant-External-ID": restaurantGuid,
					"Content-Type": "application/json",
				},
			}
		);

		// Normalize orders to our format
		const normalizedOrders = (response.data.orders || []).map((order) =>
			normalizeToastOrder(order)
		);

		return {
			orders: normalizedOrders,
			pagination: {
				hasMore: !!response.data.nextPageToken,
				nextPageToken: response.data.nextPageToken || null,
				totalCount: response.data.totalCount || normalizedOrders.length,
			},
		};
	} catch (error) {
		console.error("Error fetching Toast orders:", error);

		if (error.response) {
			throw new Error(
				`Toast Orders API error (${error.response.status}): ${
					error.response.data?.message || error.message
				}`
			);
		}

		throw new Error(`Failed to fetch Toast orders: ${error.message}`);
	}
}

/**
 * Fetch a single order by ID
 * @param {object} credentials - Toast API credentials
 * @param {string} orderId - Toast order GUID
 * @returns {Promise<Object>} Normalized order data
 */
export async function fetchToastOrder(credentials, orderId) {
	const { restaurantGuid, accessToken, apiUrl } = credentials;

	if (!restaurantGuid || !accessToken) {
		throw new Error(
			"Toast credentials incomplete: restaurantGuid and accessToken required"
		);
	}

	const baseUrl =
		apiUrl || process.env.TOAST_API_URL || "https://ws-api.toasttab.com";

	try {
		const response = await axios.get(
			`${baseUrl}/orders/v2/orders/${orderId}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Toast-Restaurant-External-ID": restaurantGuid,
					"Content-Type": "application/json",
				},
			}
		);

		return normalizeToastOrder(response.data);
	} catch (error) {
		console.error("Error fetching Toast order:", error);

		if (error.response?.status === 404) {
			return null;
		}

		throw new Error(`Failed to fetch Toast order: ${error.message}`);
	}
}

/**
 * Normalize a Toast order to our internal format
 * @param {object} toastOrder - Raw Toast order data
 * @returns {object} Normalized order
 */
function normalizeToastOrder(toastOrder) {
	// Extract line items from checks
	const lineItems = [];

	if (toastOrder.checks && Array.isArray(toastOrder.checks)) {
		for (const check of toastOrder.checks) {
			if (check.selections && Array.isArray(check.selections)) {
				for (const selection of check.selections) {
					lineItems.push({
						posMenuItemId: selection.item?.guid || selection.itemGuid,
						name: selection.displayName || selection.item?.name || "Unknown Item",
						quantity: selection.quantity || 1,
						unitPrice: selection.price ? selection.price / 100 : 0, // Toast uses cents
						totalPrice: selection.price
							? (selection.price * (selection.quantity || 1)) / 100
							: 0,
						modifiers: (selection.modifiers || []).map((mod) => ({
							name: mod.displayName || mod.name,
							price: mod.price ? mod.price / 100 : 0,
						})),
						voided: selection.voided || false,
						voidReason: selection.voidReason || null,
					});
				}
			}
		}
	}

	// Calculate totals from checks
	let subtotal = 0;
	let tax = 0;
	let total = 0;

	if (toastOrder.checks && Array.isArray(toastOrder.checks)) {
		for (const check of toastOrder.checks) {
			subtotal += check.subtotal ? check.subtotal / 100 : 0;
			tax += check.taxAmount ? check.taxAmount / 100 : 0;
			total += check.totalAmount ? check.totalAmount / 100 : 0;
		}
	}

	return {
		posOrderId: toastOrder.guid,
		orderNumber: toastOrder.displayNumber || toastOrder.externalId,
		orderDate: toastOrder.openedDate || toastOrder.createdDate,
		businessDate: toastOrder.businessDate,
		closedDate: toastOrder.closedDate,
		orderSource: toastOrder.source || "POS",
		orderType: toastOrder.diningOption?.name || "Dine In",
		status: normalizeOrderStatus(toastOrder),
		subtotal,
		tax,
		total,
		lineItems,
		voided: toastOrder.voided || false,
		deleted: toastOrder.deleted || false,
		rawData: toastOrder, // Store original for debugging
	};
}

/**
 * Normalize order status from Toast
 * @param {object} order - Toast order
 * @returns {string} Normalized status
 */
function normalizeOrderStatus(order) {
	if (order.deleted) return "deleted";
	if (order.voided) return "voided";
	if (order.closedDate) return "closed";
	if (order.paidDate) return "paid";
	return "open";
}

/**
 * Get orders modified since a timestamp (for incremental sync)
 * @param {object} credentials - Toast API credentials
 * @param {string} since - ISO timestamp
 * @returns {Promise<Array>} Modified orders
 */
export async function fetchToastOrdersSince(credentials, since) {
	const { restaurantGuid, accessToken, apiUrl } = credentials;

	const baseUrl =
		apiUrl || process.env.TOAST_API_URL || "https://ws-api.toasttab.com";

	try {
		const response = await axios.get(
			`${baseUrl}/orders/v2/ordersBulk`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Toast-Restaurant-External-ID": restaurantGuid,
					"Content-Type": "application/json",
				},
				params: {
					startDate: since,
					endDate: new Date().toISOString(),
				},
			}
		);

		return (response.data.orders || []).map(normalizeToastOrder);
	} catch (error) {
		console.error("Error fetching Toast orders since timestamp:", error);
		throw new Error(`Failed to fetch orders: ${error.message}`);
	}
}
