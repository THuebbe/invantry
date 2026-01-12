// DocumentForm.jsx - Modal form for uploading vendor documents
// Handles file upload with drag-and-drop, validation, and progress tracking

import { useState, useRef } from 'react';
import { X, Loader2, Upload, File, AlertCircle } from 'lucide-react';
import { useCreateVendorDocument } from '../../../hooks/useVendorDocuments';
import { validateRequired } from '../../../utils/vendorValidators';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function DocumentForm({ vendorId, onClose, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    document_type: 'W9',
    expiration_date: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { mutate: uploadDocument, isPending: isUploading } = useCreateVendorDocument();

  const validateFile = (file) => {
    if (!file) {
      return { valid: false, error: 'Please select a file to upload' };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only PDF and image files are allowed.' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit.' };
    }

    return { valid: true };
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate file
    const fileValidation = validateFile(selectedFile);
    if (!fileValidation.valid) {
      newErrors.file = fileValidation.error;
    }

    // Document type is required
    const typeValidation = validateRequired(formData.document_type, 'Document type');
    if (!typeValidation.valid) {
      newErrors.document_type = typeValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrors({ file: validation.error });
      return;
    }

    setSelectedFile(file);
    setErrors(prev => ({ ...prev, file: null }));
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('document', selectedFile);
    formDataToSend.append('document_type', formData.document_type);
    if (formData.expiration_date) {
      formDataToSend.append('expiration_date', formData.expiration_date);
    }
    if (formData.notes) {
      formDataToSend.append('notes', formData.notes);
    }

    uploadDocument({ vendorId, documentData: formDataToSend }, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
        onClose();
      },
      onError: (error) => {
        setErrors({ submit: error.message || 'An error occurred while uploading the document.' });
      }
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            Upload Document
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document File <span className="text-red-500">*</span>
            </label>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-green-500 bg-green-50'
                  : errors.file
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-green-500 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                className="hidden"
                disabled={isUploading}
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <File className="w-8 h-8 text-green-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="text-green-600 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF or Image files (Max 10MB)
                  </p>
                </div>
              )}
            </div>

            {errors.file && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.file}</span>
              </div>
            )}
          </div>

          {/* Document Type */}
          <div>
            <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              id="document_type"
              value={formData.document_type}
              onChange={(e) => handleChange('document_type', e.target.value)}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.document_type ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isUploading}
            >
              <option value="W9">W9 Tax Form</option>
              <option value="W8">W8 Tax Form</option>
              <option value="1099">1099 Tax Form</option>
              <option value="contract">Contract/Agreement</option>
              <option value="insurance">Insurance Certificate</option>
              <option value="certification">Food Safety Certification</option>
              <option value="license">License/Permit</option>
              <option value="pricing_sheet">Pricing Sheet</option>
              <option value="other">Other</option>
            </select>
            {errors.document_type && (
              <p className="mt-1 text-sm text-red-600">{errors.document_type}</p>
            )}
          </div>

          {/* Expiration Date */}
          <div>
            <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date
            </label>
            <input
              type="date"
              id="expiration_date"
              value={formData.expiration_date}
              onChange={(e) => handleChange('expiration_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isUploading}
            />
            <p className="mt-1 text-xs text-gray-500">Optional. For documents that expire (e.g., insurance certificates)</p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Additional notes about this document..."
              disabled={isUploading}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-800">Uploading document...</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
