// frontend/src/utils/dateFormat.js

/**
 * Date formatting utilities for consistent date display across the app
 * Provides standardized formats and tracks actual data fetch times
 */

/**
 * Format a date to a readable string
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'time', 'datetime', 'relative'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
	if (!date) return '--';

	const dateObj = typeof date === 'string' || typeof date === 'number'
		? new Date(date)
		: date;

	if (!(dateObj instanceof Date) || isNaN(dateObj)) {
		return '--';
	}

	switch (format) {
		case 'short':
			// e.g., "Jan 15, 2024"
			return dateObj.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			});

		case 'long':
			// e.g., "January 15, 2024"
			return dateObj.toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
			});

		case 'time':
			// e.g., "3:45 PM"
			return dateObj.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			});

		case 'datetime':
			// e.g., "Jan 15, 2024 at 3:45 PM"
			return `${dateObj.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			})} at ${dateObj.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			})}`;

		case 'relative':
			// e.g., "2 hours ago", "just now"
			return getRelativeTime(dateObj);

		default:
			return dateObj.toLocaleDateString('en-US');
	}
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date} date - Date to compare to now
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
	const now = new Date();
	const diffMs = now - date;
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSecs < 60) return 'just now';
	if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
	if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
	if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
	if (diffDays < 30) {
		const weeks = Math.floor(diffDays / 7);
		return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
	}
	if (diffDays < 365) {
		const months = Math.floor(diffDays / 30);
		return `${months} month${months !== 1 ? 's' : ''} ago`;
	}
	const years = Math.floor(diffDays / 365);
	return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Track and format data fetch time for reports
 * @param {Date} fetchTime - When the data was fetched (not rendered)
 * @returns {string} Formatted fetch time message
 */
export function formatDataFetchTime(fetchTime) {
	if (!fetchTime) return 'Data fetch time unknown';

	const formatted = formatDate(fetchTime, 'datetime');
	return `Data last fetched: ${formatted}`;
}

/**
 * Get current timestamp for tracking data fetches
 * @returns {Date} Current date/time
 */
export function getCurrentTimestamp() {
	return new Date();
}

/**
 * Format a date range for display
 * @param {Date|string} startDate - Start of range
 * @param {Date|string} endDate - End of range
 * @returns {string} Formatted range string
 */
export function formatDateRange(startDate, endDate) {
	if (!startDate || !endDate) return '--';

	const start = formatDate(startDate, 'short');
	const end = formatDate(endDate, 'short');

	return `${start} - ${end}`;
}

/**
 * Parse ISO date string to local date
 * @param {string} isoString - ISO date string
 * @returns {Date} Parsed date
 */
export function parseISODate(isoString) {
	if (!isoString) return null;
	return new Date(isoString);
}

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
	if (!date) return false;

	const dateObj = typeof date === 'string' ? new Date(date) : date;
	const today = new Date();

	return (
		dateObj.getDate() === today.getDate() &&
		dateObj.getMonth() === today.getMonth() &&
		dateObj.getFullYear() === today.getFullYear()
	);
}

/**
 * Calculate days until a date
 * @param {Date|string} date - Future date
 * @returns {number} Days until date (negative if past)
 */
export function daysUntil(date) {
	if (!date) return null;

	const dateObj = typeof date === 'string' ? new Date(date) : date;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	dateObj.setHours(0, 0, 0, 0);

	const diffMs = dateObj - today;
	return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default {
	formatDate,
	getRelativeTime,
	formatDataFetchTime,
	getCurrentTimestamp,
	formatDateRange,
	parseISODate,
	isToday,
	daysUntil,
};
