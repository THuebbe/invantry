// /backend/src/services/vendorDocuments.js

import { supabase } from "./supabase.js";

/**
 * Get all documents for a vendor with optional filtering
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @param {Object} filters - Optional filters (document_type, is_expired)
 * @returns {Promise<Array>} Array of vendor document objects
 */
export async function getVendorDocuments(vendorId, restaurantId, filters = {}) {
	try {
		let query = supabase
			.from("vendor_documents")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId);

		// Apply filters
		if (filters.document_type) {
			query = query.eq("document_type", filters.document_type);
		}

		if (filters.is_expired !== undefined) {
			query = query.eq("is_expired", filters.is_expired);
		}

		// Order by created_at descending (newest first)
		query = query.order("created_at", { ascending: false });

		const { data, error } = await query;
		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching vendor documents:", error);
		throw new Error(`Failed to fetch vendor documents: ${error.message}`);
	}
}

/**
 * Get specific vendor document by ID
 * @param {string} documentId - Document UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Vendor document object
 */
export async function getVendorDocument(documentId, vendorId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_documents")
			.select("*")
			.eq("id", documentId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new Error("Vendor document not found");
			}
			throw error;
		}

		return data;
	} catch (error) {
		console.error("Error fetching vendor document:", error);
		throw error;
	}
}

/**
 * Get expired documents for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Array>} Array of expired document objects
 */
export async function getExpiredDocuments(vendorId, restaurantId) {
	try {
		const { data, error } = await supabase
			.from("vendor_documents")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.eq("is_expired", true)
			.order("expiration_date", { ascending: true });

		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching expired documents:", error);
		throw new Error(`Failed to fetch expired documents: ${error.message}`);
	}
}

/**
 * Get documents expiring soon for a vendor
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @param {number} daysAhead - Number of days ahead to check (default 30)
 * @returns {Promise<Array>} Array of expiring document objects
 */
export async function getExpiringDocuments(
	vendorId,
	restaurantId,
	daysAhead = 30
) {
	try {
		const today = new Date();
		const futureDate = new Date();
		futureDate.setDate(today.getDate() + daysAhead);

		const { data, error } = await supabase
			.from("vendor_documents")
			.select("*")
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.not("expiration_date", "is", null)
			.gte("expiration_date", today.toISOString())
			.lte("expiration_date", futureDate.toISOString())
			.order("expiration_date", { ascending: true });

		if (error) throw error;

		return data || [];
	} catch (error) {
		console.error("Error fetching expiring documents:", error);
		throw new Error(`Failed to fetch expiring documents: ${error.message}`);
	}
}

/**
 * Create a new vendor document
 * NOTE: File upload to Supabase Storage should be handled in the route layer
 * @param {Object} data - Document data
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Created document object
 */
export async function createVendorDocument(data, vendorId, restaurantId) {
	try {
		const {
			document_type,
			document_name,
			file_url,
			file_path,
			file_size_bytes,
			mime_type,
			issue_date,
			expiration_date,
			is_current = false,
			reminder_days_before,
			uploaded_by,
		} = data;

		// Validation
		if (!document_type) {
			throw new Error("Document type is required");
		}

		const validTypes = [
			"W9",
			"W8",
			"1099",
			"contract",
			"insurance",
			"certification",
			"license",
			"pricing_sheet",
			"other",
		];
		if (!validTypes.includes(document_type)) {
			throw new Error(
				`Invalid document type. Must be one of: ${validTypes.join(", ")}`
			);
		}

		if (!document_name || document_name.trim().length === 0) {
			throw new Error("Document name is required");
		}

		if (!file_url || file_url.trim().length === 0) {
			throw new Error("File URL is required");
		}

		// Validate dates if provided
		if (issue_date && isNaN(Date.parse(issue_date))) {
			throw new Error("Invalid issue date format");
		}

		if (expiration_date && isNaN(Date.parse(expiration_date))) {
			throw new Error("Invalid expiration date format");
		}

		// Validate reminder_days_before if provided
		if (
			reminder_days_before !== undefined &&
			reminder_days_before !== null
		) {
			const days = parseInt(reminder_days_before);
			if (isNaN(days) || days < 0) {
				throw new Error("Reminder days must be a positive integer");
			}
		}

		// If is_current is true and document_type is pricing_sheet,
		// unset existing current pricing sheet
		if (is_current && document_type === "pricing_sheet") {
			const { error: unsetError } = await supabase
				.from("vendor_documents")
				.update({ is_current: false })
				.eq("vendor_id", vendorId)
				.eq("restaurant_id", restaurantId)
				.eq("document_type", "pricing_sheet")
				.eq("is_current", true);

			if (unsetError) {
				console.warn("Error unsetting existing current pricing sheet:", unsetError);
			}
		}

		// Create document
		const { data: newDocument, error } = await supabase
			.from("vendor_documents")
			.insert({
				vendor_id: vendorId,
				restaurant_id: restaurantId,
				document_type,
				document_name: document_name.trim(),
				file_url: file_url.trim(),
				file_path: file_path?.trim() || null,
				file_size_bytes: file_size_bytes || null,
				mime_type: mime_type?.trim() || null,
				issue_date: issue_date || null,
				expiration_date: expiration_date || null,
				is_current,
				reminder_days_before:
					reminder_days_before !== undefined
						? parseInt(reminder_days_before)
						: null,
				uploaded_by: uploaded_by || null,
			})
			.select()
			.single();

		if (error) throw error;

		console.log(
			`✅ Created vendor document: ${document_name} (${document_type}) for vendor ${vendorId}`
		);
		return newDocument;
	} catch (error) {
		console.error("Error creating vendor document:", error);
		throw error;
	}
}

/**
 * Update vendor document metadata
 * @param {string} documentId - Document UUID
 * @param {Object} updates - Fields to update
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Updated document object
 */
export async function updateVendorDocument(
	documentId,
	updates,
	vendorId,
	restaurantId
) {
	try {
		// Verify document exists and belongs to vendor/restaurant
		const { data: existing, error: checkError } = await supabase
			.from("vendor_documents")
			.select("*")
			.eq("id", documentId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor document not found");
			}
			throw checkError;
		}

		// Validate document_type if being updated
		if (updates.document_type) {
			const validTypes = [
				"W9",
				"W8",
				"1099",
				"contract",
				"insurance",
				"certification",
				"license",
				"pricing_sheet",
				"other",
			];
			if (!validTypes.includes(updates.document_type)) {
				throw new Error(
					`Invalid document type. Must be one of: ${validTypes.join(", ")}`
				);
			}
		}

		// Validate dates if being updated
		if (updates.issue_date && isNaN(Date.parse(updates.issue_date))) {
			throw new Error("Invalid issue date format");
		}

		if (
			updates.expiration_date &&
			isNaN(Date.parse(updates.expiration_date))
		) {
			throw new Error("Invalid expiration date format");
		}

		// Validate reminder_days_before if being updated
		if (
			updates.reminder_days_before !== undefined &&
			updates.reminder_days_before !== null
		) {
			const days = parseInt(updates.reminder_days_before);
			if (isNaN(days) || days < 0) {
				throw new Error("Reminder days must be a positive integer");
			}
		}

		// If is_current is being set to true and document is pricing_sheet,
		// unset existing current pricing sheet
		if (
			updates.is_current === true &&
			(existing.document_type === "pricing_sheet" ||
				updates.document_type === "pricing_sheet")
		) {
			const { error: unsetError } = await supabase
				.from("vendor_documents")
				.update({ is_current: false })
				.eq("vendor_id", vendorId)
				.eq("restaurant_id", restaurantId)
				.eq("document_type", "pricing_sheet")
				.eq("is_current", true)
				.neq("id", documentId);

			if (unsetError) {
				console.warn("Error unsetting existing current pricing sheet:", unsetError);
			}
		}

		// Prevent changing vendor_id, restaurant_id, or uploaded_by
		delete updates.vendor_id;
		delete updates.restaurant_id;
		delete updates.uploaded_by;
		delete updates.created_at;

		// Prepare update data with trimmed strings
		const updateData = {};
		Object.keys(updates).forEach((key) => {
			if (updates[key] !== undefined) {
				updateData[key] =
					typeof updates[key] === "string"
						? updates[key].trim()
						: updates[key];
			}
		});

		updateData.updated_at = new Date().toISOString();

		// Perform update
		const { data, error } = await supabase
			.from("vendor_documents")
			.update(updateData)
			.eq("id", documentId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Updated vendor document: ${documentId}`);
		return data;
	} catch (error) {
		console.error("Error updating vendor document:", error);
		throw error;
	}
}

/**
 * Delete vendor document
 * NOTE: File deletion from Supabase Storage should be handled in the route layer
 * @param {string} documentId - Document UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Success message with file_path for storage cleanup
 */
export async function deleteVendorDocument(documentId, vendorId, restaurantId) {
	try {
		// Get document details for file cleanup
		const { data: document, error: checkError } = await supabase
			.from("vendor_documents")
			.select("*")
			.eq("id", documentId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor document not found");
			}
			throw checkError;
		}

		// Delete document record
		const { error } = await supabase
			.from("vendor_documents")
			.delete()
			.eq("id", documentId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId);

		if (error) throw error;

		console.log(`✅ Deleted vendor document: ${documentId}`);
		return {
			message: "Vendor document deleted successfully",
			file_path: document.file_path, // Return for storage cleanup in route
		};
	} catch (error) {
		console.error("Error deleting vendor document:", error);
		throw error;
	}
}

/**
 * Set pricing sheet as current (archives previous current sheet)
 * @param {string} documentId - Document UUID
 * @param {string} vendorId - Vendor UUID
 * @param {string} restaurantId - Restaurant UUID for multi-tenant enforcement
 * @returns {Promise<Object>} Updated document object
 */
export async function setCurrentPricingSheet(
	documentId,
	vendorId,
	restaurantId
) {
	try {
		// Verify document exists and is a pricing sheet
		const { data: document, error: checkError } = await supabase
			.from("vendor_documents")
			.select("*")
			.eq("id", documentId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.single();

		if (checkError) {
			if (checkError.code === "PGRST116") {
				throw new Error("Vendor document not found");
			}
			throw checkError;
		}

		if (document.document_type !== "pricing_sheet") {
			throw new Error("Document must be of type 'pricing_sheet'");
		}

		// Unset existing current pricing sheet
		const { error: unsetError } = await supabase
			.from("vendor_documents")
			.update({ is_current: false })
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.eq("document_type", "pricing_sheet")
			.eq("is_current", true)
			.neq("id", documentId);

		if (unsetError) {
			console.warn("Error unsetting existing current pricing sheet:", unsetError);
		}

		// Set new current pricing sheet
		const { data, error } = await supabase
			.from("vendor_documents")
			.update({
				is_current: true,
				updated_at: new Date().toISOString(),
			})
			.eq("id", documentId)
			.eq("vendor_id", vendorId)
			.eq("restaurant_id", restaurantId)
			.select()
			.single();

		if (error) throw error;

		console.log(`✅ Set current pricing sheet: ${documentId}`);
		return data;
	} catch (error) {
		console.error("Error setting current pricing sheet:", error);
		throw error;
	}
}
