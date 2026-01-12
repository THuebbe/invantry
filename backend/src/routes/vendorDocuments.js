// /backend/src/routes/vendorDocuments.js

import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";
import {
	getVendorDocuments,
	getVendorDocument,
	createVendorDocument,
	updateVendorDocument,
	deleteVendorDocument,
	getExpiredDocuments,
	getExpiringDocuments,
} from "../services/vendorDocuments.js";

const router = express.Router();

// Configure multer for memory storage (files stored in memory as Buffer)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
	fileFilter: (req, file, cb) => {
		// Allow only specific file types
		const allowedMimes = [
			'application/pdf',
			'image/jpeg',
			'image/jpg',
			'image/png',
			'image/gif'
		];

		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
		}
	}
});

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * Helper function to get restaurant ID from business ID
 */
async function getRestaurantId(businessId) {
	const { data: restaurant, error } = await supabase
		.from("restaurants")
		.select("id")
		.eq("business_id", businessId)
		.single();

	if (error || !restaurant) {
		throw new Error("No restaurant found for this business");
	}

	return restaurant.id;
}

/**
 * GET /api/vendors/:vendorId/documents
 * List all documents for a vendor
 */
router.get("/:vendorId/documents", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const documents = await getVendorDocuments(vendorId, restaurantId);
		res.json(documents);
	} catch (error) {
		console.error("Error fetching vendor documents:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/vendors/:vendorId/documents
 * Upload/create a new document for a vendor
 */
router.post("/:vendorId/documents", upload.single('document'), async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const file = req.file;

		if (!file) {
			return res.status(400).json({ error: 'No file uploaded' });
		}

		// Extract form data
		const { document_type, expiration_date, notes } = req.body;

		// Generate unique file path
		const timestamp = Date.now();
		const fileExt = file.originalname.split('.').pop();
		const fileName = `${vendorId}_${document_type}_${timestamp}.${fileExt}`;
		const filePath = `vendor-documents/${restaurantId}/${fileName}`;

		// Upload file to Supabase Storage
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('vendor-documents')
			.upload(filePath, file.buffer, {
				contentType: file.mimetype,
				cacheControl: '3600',
				upsert: false
			});

		if (uploadError) {
			console.error('Error uploading file to storage:', uploadError);
			throw new Error(`File upload failed: ${uploadError.message}`);
		}

		// Get public URL for the uploaded file
		const { data: urlData } = supabase.storage
			.from('vendor-documents')
			.getPublicUrl(filePath);

		const fileUrl = urlData.publicUrl;

		// Create document record
		const documentData = {
			document_type,
			document_name: file.originalname,
			file_url: fileUrl,
			file_path: filePath,
			file_size_bytes: file.size,
			mime_type: file.mimetype,
			expiration_date: expiration_date || null,
			notes: notes || null,
			uploaded_by: req.userId // From auth middleware
		};

		const document = await createVendorDocument(
			documentData,
			vendorId,
			restaurantId
		);

		res.status(201).json(document);
	} catch (error) {
		console.error("Error creating vendor document:", error);

		if (error.message === "Vendor not found") {
			return res.status(404).json({ error: error.message });
		}
		if (
			error.message.includes("required") ||
			error.message.includes("Invalid") ||
			error.message.includes("file type")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:vendorId/documents/expired
 * Get all expired documents for a vendor
 * IMPORTANT: This must come BEFORE /:id route to avoid Express matching "expired" as an ID
 */
router.get("/:vendorId/documents/expired", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const documents = await getExpiredDocuments(vendorId, restaurantId);
		res.json(documents);
	} catch (error) {
		console.error("Error fetching expired documents:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:vendorId/documents/expiring-soon
 * Get documents expiring within N days
 * Query param: days (default 30)
 * IMPORTANT: This must come BEFORE /:id route to avoid Express matching "expiring-soon" as an ID
 */
router.get("/:vendorId/documents/expiring-soon", async (req, res) => {
	try {
		const { vendorId } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const days = parseInt(req.query.days) || 30;

		if (days <= 0 || days > 365) {
			return res
				.status(400)
				.json({ error: "Days must be between 1 and 365" });
		}

		const documents = await getExpiringDocuments(
			vendorId,
			restaurantId,
			days
		);
		res.json(documents);
	} catch (error) {
		console.error("Error fetching expiring documents:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/vendors/:vendorId/documents/:id
 * Get specific document by ID
 */
router.get("/:vendorId/documents/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const document = await getVendorDocument(id, vendorId, restaurantId);
		res.json(document);
	} catch (error) {
		console.error("Error fetching vendor document:", error);

		if (error.message === "Document not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/vendors/:vendorId/documents/:id
 * Update document metadata
 */
router.put("/:vendorId/documents/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);
		const updates = req.body;

		const document = await updateVendorDocument(
			id,
			updates,
			vendorId,
			restaurantId
		);
		res.json(document);
	} catch (error) {
		console.error("Error updating vendor document:", error);

		if (error.message === "Document not found") {
			return res.status(404).json({ error: error.message });
		}
		if (
			error.message.includes("required") ||
			error.message.includes("Invalid")
		) {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * DELETE /api/vendors/:vendorId/documents/:id
 * Delete document and remove from storage
 */
router.delete("/:vendorId/documents/:id", async (req, res) => {
	try {
		const { vendorId, id } = req.params;
		const restaurantId = await getRestaurantId(req.businessId);

		const result = await deleteVendorDocument(id, vendorId, restaurantId);

		// Delete file from Supabase Storage if file_path exists
		if (result.file_path) {
			const { error: storageError } = await supabase.storage
				.from('vendor-documents')
				.remove([result.file_path]);

			if (storageError) {
				console.warn('Error deleting file from storage:', storageError);
				// Don't fail the request if storage deletion fails
			}
		}

		res.json({ message: 'Document deleted successfully' });
	} catch (error) {
		console.error("Error deleting vendor document:", error);

		if (error.message === "Document not found" || error.message === "Vendor document not found") {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

export default router;
