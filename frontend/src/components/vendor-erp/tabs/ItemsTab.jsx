// ItemsTab.jsx - Vendor items (ingredient-vendor mapping) table
// Shows all items supplied by this vendor with pricing and lead times

import { Package, Plus, Star, Clock, Search, Edit2, X, Check, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useUpdateVendorItem } from "../../../hooks/useVendorItems";
import ItemForm from "../forms/ItemForm";

export default function ItemsTab({ vendorId, vendor }) {
  const { mutate: updateVendorItem, isPending: isSaving } = useUpdateVendorItem();

  // Transform vendor.items to match expected format
  const rawItems = useMemo(() => {
    if (!vendor || !vendor.items) return [];

    return vendor.items.map(mapping => ({
      id: mapping.id,
      ingredient_id: mapping.ingredient_id,
      ingredient_name: mapping.ingredient?.name || 'Unknown Ingredient',
      vendor_item_code: mapping.vendor_item_number || '',
      pack_size: mapping.ingredient?.pack_size || 1,
      pack_unit: mapping.ingredient?.unit || 'unit',
      price_per_pack: mapping.unit_cost || 0,
      last_price_update: mapping.updated_at,
      lead_time_days: mapping.lead_time_days || 0,
      minimum_order_qty: mapping.minimum_order_qty || 1,
      is_preferred: mapping.is_preferred || false,
      is_active: mapping.is_active !== false
    }));
  }, [vendor]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPreferred, setFilterPreferred] = useState("all"); // all, preferred, non-preferred
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // Inline editing state
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedItem, setEditedItem] = useState(null);
  const [originalItem, setOriginalItem] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const items = rawItems;

  // Get list of ingredient IDs already mapped to this vendor (for filtering in ItemForm)
  const existingIngredientIds = useMemo(() => {
    return items.map(item => item.ingredient_id);
  }, [items]);

  const handleAddItem = () => {
    setShowAddItemForm(true);
  };

  // Inline editing handlers
  const handleEdit = (item) => {
    setEditingItemId(item.id);
    setEditedItem({ ...item });
    setOriginalItem({ ...item });
    setHasChanges(false);
  };

  const handleFieldChange = (field, value) => {
    setEditedItem(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleCancel = () => {
    // Revert to original values
    if (originalItem) {
      setEditedItem({ ...originalItem });
    }
    setEditingItemId(null);
    setEditedItem(null);
    setOriginalItem(null);
    setHasChanges(false);
  };

  const handleSave = () => {
    // Prevent rapid clicks - check isSaving first
    if (isSaving) return;
    if (!hasChanges || !editedItem) return;

    // Validate required fields
    if (!editedItem.vendor_item_code || !editedItem.price_per_pack || editedItem.lead_time_days === null || editedItem.lead_time_days === undefined) {
      alert('Please fill in all required fields: Vendor Code, Price, and Lead Time');
      return;
    }

    // Prepare update data - map UI fields to API fields
    const updates = {
      vendor_item_number: editedItem.vendor_item_code,
      unit_cost: parseFloat(editedItem.price_per_pack),
      lead_time_days: parseInt(editedItem.lead_time_days),
      minimum_order_qty: parseInt(editedItem.minimum_order_qty) || 1,
      is_preferred: editedItem.is_preferred || false,
      is_active: editedItem.is_active !== false
    };

    updateVendorItem(
      {
        vendorId: vendorId,
        ingredientId: editedItem.ingredient_id,
        updates: updates
      },
      {
        onSuccess: () => {
          setEditingItemId(null);
          setEditedItem(null);
          setOriginalItem(null);
          setHasChanges(false);
        },
        onError: (error) => {
          alert(`Failed to save changes: ${error.message}`);
        }
      }
    );
  };

  // Filter items based on search and preferred status
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor_item_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPreferred =
      filterPreferred === "all" ||
      (filterPreferred === "preferred" && item.is_preferred) ||
      (filterPreferred === "non-preferred" && !item.is_preferred);

    return matchesSearch && matchesPreferred;
  });

  const preferredCount = items.filter((i) => i.is_preferred).length;
  const totalValue = items.reduce(
    (sum, item) => sum + item.price_per_pack * (item.minimum_order_qty || 1),
    0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-600" />
            Vendor Items
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {items.length} items • {preferredCount} preferred
          </p>
        </div>

        <button
          onClick={handleAddItem}
          className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 text-sm rounded flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-700 mb-1">Total Items</div>
          <div className="text-xl font-bold text-blue-900">{items.length}</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-xs text-green-700 mb-1">Preferred Items</div>
          <div className="text-xl font-bold text-green-900">{preferredCount}</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-xs text-purple-700 mb-1">Min Order Value</div>
          <div className="text-xl font-bold text-purple-900">
            {formatCurrency(totalValue)}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Preferred Filter */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded p-1">
          <button
            onClick={() => setFilterPreferred("all")}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filterPreferred === "all"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterPreferred("preferred")}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filterPreferred === "preferred"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Preferred
          </button>
          <button
            onClick={() => setFilterPreferred("non-preferred")}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filterPreferred === "non-preferred"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Standard
          </button>
        </div>
      </div>

      {/* Items Table */}
      {filteredItems.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Vendor Code
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                    Pack Size
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                    Price/Pack
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                    Lead Time
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                    Min Qty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const isEditing = editingItemId === item.id;
                  const displayItem = isEditing ? editedItem : item;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {displayItem.ingredient_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={displayItem.vendor_item_code}
                            onChange={(e) => handleFieldChange('vendor_item_code', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <div className="text-sm text-gray-600 font-mono">
                            {displayItem.vendor_item_code}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={displayItem.pack_size}
                              onChange={(e) => handleFieldChange('pack_size', parseFloat(e.target.value))}
                              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <input
                              type="text"
                              value={displayItem.pack_unit}
                              onChange={(e) => handleFieldChange('pack_unit', e.target.value)}
                              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900">
                            {displayItem.pack_size} {displayItem.pack_unit}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={displayItem.price_per_pack}
                            onChange={(e) => handleFieldChange('price_per_pack', parseFloat(e.target.value))}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(displayItem.price_per_pack)}
                            </div>
                            {displayItem.last_price_update && (
                              <div className="text-xs text-gray-500">
                                Updated {formatDate(displayItem.last_price_update)}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={displayItem.lead_time_days}
                            onChange={(e) => handleFieldChange('lead_time_days', parseInt(e.target.value))}
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {displayItem.lead_time_days}d
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={displayItem.minimum_order_qty}
                            onChange={(e) => handleFieldChange('minimum_order_qty', parseInt(e.target.value))}
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {displayItem.minimum_order_qty}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={displayItem.is_preferred}
                              onChange={(e) => handleFieldChange('is_preferred', e.target.checked)}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-xs text-gray-700">Preferred</span>
                          </label>
                        ) : (
                          displayItem.is_preferred ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs">
                              <Star className="w-3 h-3" />
                              Preferred
                            </span>
                          ) : (
                            <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded text-xs">
                              Standard
                            </span>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={handleCancel}
                              className="text-gray-600 hover:text-gray-800 transition-colors"
                              title="Cancel editing"
                              disabled={isSaving}
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleSave}
                              className={`transition-colors flex items-center gap-1 ${
                                hasChanges && !isSaving
                                  ? 'text-green-600 hover:text-green-800'
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title={hasChanges ? "Save changes" : "No changes to save"}
                              disabled={!hasChanges || isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-gray-600 hover:text-green-600 transition-colors"
                            title="Edit item"
                            disabled={isSaving}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No items found
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Add items that this vendor supplies"}
          </p>
          {!searchTerm && (
            <button
              onClick={handleAddItem}
              className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm rounded inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Item
            </button>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Item Management
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>Preferred Items:</strong> Primary source for this ingredient
          </li>
          <li>
            <strong>Lead Time:</strong> Days between order placement and delivery
          </li>
          <li>
            <strong>Min Qty:</strong> Minimum order quantity per pack
          </li>
          <li>
            <strong>Pack Size:</strong> Quantity per package unit
          </li>
        </ul>
      </div>

      {/* Add Item Modal */}
      {showAddItemForm && (
        <ItemForm
          vendorId={vendorId}
          existingIngredientIds={existingIngredientIds}
          onClose={() => setShowAddItemForm(false)}
          onSuccess={() => setShowAddItemForm(false)}
        />
      )}
    </div>
  );
}

// Utility function to format currency
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Utility function to format date
function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
