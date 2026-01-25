// ItemForm.jsx - Modal form for adding vendor items (ingredient-vendor mapping)
// Uses ModalForm wrapper with ingredient search functionality

import { useState, useMemo } from 'react';
import { Search, Loader2, Package } from 'lucide-react';
import ModalForm from '../../shared/ModalForm';
import { useIngredientSearch } from '../../../hooks/useIngredientSearch';
import { useCreateVendorItem } from '../../../hooks/useVendorItems';

// Common units of measure for vendor packaging
const PACK_UOM_OPTIONS = [
  'each',
  'case',
  'bag',
  'box',
  'lb',
  'oz',
  'gal',
  'qt',
  'pt',
  'dozen',
  'pack',
  'roll',
  'bottle',
  'can',
  'jar',
  'carton',
];

export default function ItemForm({ vendorId, existingIngredientIds = [], onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    ingredient_id: '',
    ingredient_name: '',
    vendor_item_number: '',
    vendor_item_description: '',
    unit_cost: '',
    pack_size: '',
    pack_uom: '',
    lead_time_days: '',
    minimum_order_qty: '1',
    vendor_barcode: '',
    is_preferred: false,
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);

  const { query, setQuery, results, loading: searchLoading } = useIngredientSearch('', 300);
  const { mutate: createItem, isPending: isCreating } = useCreateVendorItem();

  // Filter out already-mapped ingredients
  const filteredResults = useMemo(() => {
    if (!results || results.length === 0) return [];
    const existingSet = new Set(existingIngredientIds);
    return results.filter(item => !existingSet.has(item.id));
  }, [results, existingIngredientIds]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleIngredientSelect = (ingredient) => {
    setFormData(prev => ({
      ...prev,
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name
    }));
    setQuery('');
    setShowDropdown(false);
    if (errors.ingredient_id) {
      setErrors(prev => ({ ...prev, ingredient_id: null }));
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(value.length >= 3);
    // Clear selected ingredient if user starts typing again
    if (formData.ingredient_id) {
      setFormData(prev => ({
        ...prev,
        ingredient_id: '',
        ingredient_name: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ingredient_id) {
      newErrors.ingredient_id = 'Please select an ingredient';
    }

    if (!formData.vendor_item_number || formData.vendor_item_number.trim() === '') {
      newErrors.vendor_item_number = 'Vendor item number is required';
    }

    if (!formData.unit_cost || formData.unit_cost === '') {
      newErrors.unit_cost = 'Unit cost is required';
    } else if (isNaN(parseFloat(formData.unit_cost)) || parseFloat(formData.unit_cost) < 0) {
      newErrors.unit_cost = 'Unit cost must be a positive number';
    }

    if (!formData.lead_time_days || formData.lead_time_days === '') {
      newErrors.lead_time_days = 'Lead time is required';
    } else if (isNaN(parseInt(formData.lead_time_days)) || parseInt(formData.lead_time_days) < 0) {
      newErrors.lead_time_days = 'Lead time must be a positive integer';
    }

    if (formData.minimum_order_qty !== '' && formData.minimum_order_qty !== undefined) {
      const minQty = parseFloat(formData.minimum_order_qty);
      if (isNaN(minQty) || minQty < 0) {
        newErrors.minimum_order_qty = 'Minimum quantity must be a positive number';
      }
    }

    if (formData.pack_size && formData.pack_size !== '') {
      const packSize = parseFloat(formData.pack_size);
      if (isNaN(packSize) || packSize <= 0) {
        newErrors.pack_size = 'Pack size must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isCreating) return;

    if (!validateForm()) {
      return;
    }

    const itemData = {
      vendor_item_number: formData.vendor_item_number.trim(),
      vendor_item_description: formData.vendor_item_description.trim() || null,
      unit_cost: parseFloat(formData.unit_cost),
      pack_size: formData.pack_size ? parseFloat(formData.pack_size) : null,
      pack_uom: formData.pack_uom || null,
      lead_time_days: parseInt(formData.lead_time_days),
      minimum_order_qty: parseFloat(formData.minimum_order_qty) || 1,
      vendor_barcode: formData.vendor_barcode.trim() || null,
      is_preferred: formData.is_preferred,
      notes: formData.notes.trim() || null
    };

    createItem(
      {
        vendorId,
        ingredientId: formData.ingredient_id,
        itemData
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        },
        onError: (error) => {
          setErrors({ submit: error.message || 'Failed to add item' });
        }
      }
    );
  };

  return (
    <ModalForm
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Add Vendor Item"
      isLoading={isCreating}
      submitError={errors.submit}
      submitLabel="Add Item"
      loadingLabel="Adding..."
      size="xl"
    >
      {/* Ingredient Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ingredient <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          {formData.ingredient_id ? (
            <div className="flex items-center gap-2 px-3 py-2 border border-green-300 bg-green-50 rounded">
              <Package className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">{formData.ingredient_name}</span>
              <button
                type="button"
                onClick={() => handleChange('ingredient_id', '')}
                className="ml-auto text-green-600 hover:text-green-800 text-sm"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={handleSearchChange}
                  onFocus={() => query.length >= 3 && setShowDropdown(true)}
                  placeholder="Search ingredients (type 3+ characters)..."
                  className={`w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.ingredient_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isCreating}
                />
                {searchLoading && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {showDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((ingredient) => (
                      <button
                        key={ingredient.id}
                        type="button"
                        onClick={() => handleIngredientSelect(ingredient)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                          {ingredient.category && (
                            <div className="text-xs text-gray-500">{ingredient.category}</div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : searchLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Searching...
                    </div>
                  ) : query.length >= 3 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No ingredients found
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
        {errors.ingredient_id && (
          <p className="mt-1 text-sm text-red-600">{errors.ingredient_id}</p>
        )}
      </div>

      {/* Vendor Item Number and Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vendor_item_number" className="block text-sm font-medium text-gray-700 mb-1">
            Vendor Item # / SKU <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="vendor_item_number"
            value={formData.vendor_item_number}
            onChange={(e) => handleChange('vendor_item_number', e.target.value)}
            placeholder="e.g., SKU-12345"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.vendor_item_number ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isCreating}
          />
          {errors.vendor_item_number && (
            <p className="mt-1 text-sm text-red-600">{errors.vendor_item_number}</p>
          )}
        </div>

        <div>
          <label htmlFor="vendor_barcode" className="block text-sm font-medium text-gray-700 mb-1">
            Vendor Barcode / UPC
          </label>
          <input
            type="text"
            id="vendor_barcode"
            value={formData.vendor_barcode}
            onChange={(e) => handleChange('vendor_barcode', e.target.value)}
            placeholder="e.g., 012345678901"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isCreating}
          />
        </div>
      </div>

      {/* Vendor Item Description */}
      <div>
        <label htmlFor="vendor_item_description" className="block text-sm font-medium text-gray-700 mb-1">
          Vendor Description
        </label>
        <input
          type="text"
          id="vendor_item_description"
          value={formData.vendor_item_description}
          onChange={(e) => handleChange('vendor_item_description', e.target.value)}
          placeholder="How the vendor describes this item"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isCreating}
        />
        <p className="mt-1 text-xs text-gray-500">Optional: The vendor's name for this item if different from yours</p>
      </div>

      {/* Pricing Section */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Pricing & Packaging</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="unit_cost" className="block text-sm font-medium text-gray-700 mb-1">
              Unit Cost ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="unit_cost"
              step="0.01"
              min="0"
              value={formData.unit_cost}
              onChange={(e) => handleChange('unit_cost', e.target.value)}
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.unit_cost ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isCreating}
            />
            {errors.unit_cost && (
              <p className="mt-1 text-sm text-red-600">{errors.unit_cost}</p>
            )}
          </div>

          <div>
            <label htmlFor="pack_size" className="block text-sm font-medium text-gray-700 mb-1">
              Pack Size
            </label>
            <input
              type="number"
              id="pack_size"
              step="0.01"
              min="0"
              value={formData.pack_size}
              onChange={(e) => handleChange('pack_size', e.target.value)}
              placeholder="e.g., 10"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.pack_size ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isCreating}
            />
            {errors.pack_size && (
              <p className="mt-1 text-sm text-red-600">{errors.pack_size}</p>
            )}
          </div>

          <div>
            <label htmlFor="pack_uom" className="block text-sm font-medium text-gray-700 mb-1">
              Pack Unit
            </label>
            <select
              id="pack_uom"
              value={formData.pack_uom}
              onChange={(e) => handleChange('pack_uom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isCreating}
            >
              <option value="">Select unit...</option>
              {PACK_UOM_OPTIONS.map((uom) => (
                <option key={uom} value={uom}>
                  {uom}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Example: $45.00 for a 10 lb case means cost is $45/case, pack size is 10, pack unit is lb
        </p>
      </div>

      {/* Ordering Section */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Ordering Details</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lead_time_days" className="block text-sm font-medium text-gray-700 mb-1">
              Lead Time (days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="lead_time_days"
              min="0"
              step="1"
              value={formData.lead_time_days}
              onChange={(e) => handleChange('lead_time_days', e.target.value)}
              placeholder="e.g., 3"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.lead_time_days ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isCreating}
            />
            {errors.lead_time_days && (
              <p className="mt-1 text-sm text-red-600">{errors.lead_time_days}</p>
            )}
          </div>

          <div>
            <label htmlFor="minimum_order_qty" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Order Qty
            </label>
            <input
              type="number"
              id="minimum_order_qty"
              min="0"
              step="1"
              value={formData.minimum_order_qty}
              onChange={(e) => handleChange('minimum_order_qty', e.target.value)}
              placeholder="1"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.minimum_order_qty ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isCreating}
            />
            {errors.minimum_order_qty && (
              <p className="mt-1 text-sm text-red-600">{errors.minimum_order_qty}</p>
            )}
          </div>
        </div>
      </div>

      {/* Preferred Vendor Checkbox */}
      <div className="flex items-center border-t border-gray-200 pt-4">
        <input
          type="checkbox"
          id="is_preferred"
          checked={formData.is_preferred}
          onChange={(e) => handleChange('is_preferred', e.target.checked)}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          disabled={isCreating}
        />
        <label htmlFor="is_preferred" className="ml-2 text-sm text-gray-700">
          Set as preferred vendor for this ingredient
        </label>
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
          rows={2}
          placeholder="Additional notes about this item..."
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isCreating}
        />
      </div>
    </ModalForm>
  );
}
