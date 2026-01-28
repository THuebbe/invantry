// frontend/src/services/posImportService.js

import api from "../core/database/api";

/**
 * Save POS credentials
 * @param {string} posSystem - POS system type (toast, square, clover)
 * @param {Object} credentials - POS-specific credentials
 */
export async function savePOSCredentials(posSystem, credentials) {
	const response = await api.post("/pos-import/credentials", {
		posSystem,
		credentials,
	});
	return response.data;
}

/**
 * Verify POS connection
 * @param {string} posSystem - POS system type
 */
export async function verifyPOSConnection(posSystem) {
	const response = await api.get(`/pos-import/verify?posSystem=${posSystem}`);
	return response.data;
}

/**
 * Get import preview (dry run)
 * @param {string} posSystem - POS system type
 */
export async function getPOSImportPreview(posSystem) {
	const response = await api.get(`/pos-import/preview?posSystem=${posSystem}`);
	return response.data;
}

/**
 * Execute menu import from POS
 * @param {string} posSystem - POS system type
 * @param {Object} options - Import options
 * @param {boolean} options.updateExisting - Update existing items
 * @param {boolean} options.deactivateMissing - Deactivate missing items
 */
export async function importMenuFromPOS(posSystem, options = {}) {
	const response = await api.post("/pos-import/import", {
		posSystem,
		options,
	});
	return response.data;
}

/**
 * Get Square locations (for Square setup)
 * @param {string} accessToken - Square access token
 */
export async function getSquareLocations(accessToken) {
	const response = await api.get(
		`/pos-import/square/locations?accessToken=${encodeURIComponent(accessToken)}`
	);
	return response.data;
}
