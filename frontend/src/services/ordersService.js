// frontend/src/services/ordersService.js

import api from '../core/database/api';

// ============================================
// ORDER CREATION & MANAGEMENT
// ============================================

/**
 * Populate order lines with low-stock items
 * Returns suggested items based on current inventory levels
 */
export const populateOrderLines = async (restaurantId) => {
  const response = await api.post('/orders/populate-lines', { restaurantId });
  return response.data.items || []; // Extract items array from response
};

/**
 * Create a new restaurant order
 */
export const createOrder = async (orderData) => {
  const response = await api.post('/orders/restaurant-orders', orderData);
  return response.data;
};

/**
 * Get quantity already on order for a specific ingredient
 */
export const getQuantityOnOrder = async (ingredientId) => {
  const response = await api.get(`/orders/quantity-on-order/${ingredientId}`);
  return response.data;
};

/**
 * Get all orders for a restaurant
 */
export const getOrders = async (filters = {}) => {
  const response = await api.get('/orders/restaurant-orders', { params: filters });
  return response.data;
};

/**
 * Get a specific order by ID
 */
export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/restaurant-orders/${orderId}`);
  return response.data;
};

/**
 * Update an existing order
 */
export const updateOrder = async (orderId, orderData) => {
  const response = await api.put(`/orders/restaurant-orders/${orderId}`, orderData);
  return response.data;
};

/**
 * Delete an order
 */
export const deleteOrder = async (orderId) => {
  const response = await api.delete(`/orders/restaurant-orders/${orderId}`);
  return response.data;
};

// ============================================
// PURCHASE ORDER CREATION & MANAGEMENT
// ============================================

/**
 * Populate PO lines with open order items
 * Can optionally filter by vendor
 *
 * @returns {Array} If vendorId provided: flat array of items
 *                  If no vendorId: array of {vendor_name, vendor_id, items[]}
 */
export const populatePOLines = async (restaurantId, vendorId = null) => {
  const response = await api.post('/orders/populate-po-lines', {
    restaurantId,
    vendorId
  });

  // If vendor specified, return items array
  if (vendorId) {
    return response.data.items || [];
  }

  // If no vendor, return vendors grouping
  return response.data.vendors || [];
};

/**
 * Create PO from order items
 * Merges items by vendor if needed
 */
export const createPOFromOrderItems = async (poData) => {
  const response = await api.post('/orders/from-order-items', poData);
  return response.data;
};

/**
 * Generate multiple POs from order items grouped by vendor
 */
export const generatePOs = async (data) => {
  const response = await api.post('/orders/generate-pos', data);
  return response.data;
};

/**
 * Get all purchase orders
 */
export const getPurchaseOrders = async (filters = {}) => {
  const response = await api.get('/orders/purchase-orders', { params: filters });
  return response.data;
};

/**
 * Get a specific purchase order by ID
 */
export const getPOById = async (poId) => {
  const response = await api.get(`/orders/purchase-orders/${poId}`);
  return response.data;
};

/**
 * Update a purchase order
 */
export const updatePO = async (poId, poData) => {
  const response = await api.put(`/orders/purchase-orders/${poId}`, poData);
  return response.data;
};

/**
 * Delete a purchase order
 */
export const deletePO = async (poId) => {
  const response = await api.delete(`/orders/purchase-orders/${poId}`);
  return response.data;
};

// ============================================
// PURCHASE ORDER RECEIVING
// ============================================

/**
 * Receive items from a purchase order
 * Updates inventory and marks items as received
 */
export const receivePO = async (poId, items) => {
  const response = await api.post(`/orders/purchase-orders/${poId}/receive`, { items });
  return response.data;
};

/**
 * Get receiving status for a purchase order
 */
export const getPOReceivingStatus = async (poId) => {
  const response = await api.get(`/orders/purchase-orders/${poId}/receiving-status`);
  return response.data;
};

// ============================================
// VENDOR MANAGEMENT
// ============================================

/**
 * Get all vendors
 */
export const getVendors = async (filters = {}) => {
  const response = await api.get('/vendors', { params: filters });
  return response.data;
};

/**
 * Get a specific vendor by ID
 */
export const getVendorById = async (vendorId) => {
  const response = await api.get(`/vendors/${vendorId}`);
  return response.data;
};

/**
 * Create a new vendor
 */
export const createVendor = async (vendorData) => {
  const response = await api.post('/vendors', vendorData);
  return response.data;
};

/**
 * Update a vendor
 */
export const updateVendor = async (vendorId, vendorData) => {
  const response = await api.put(`/vendors/${vendorId}`, vendorData);
  return response.data;
};

/**
 * Delete a vendor
 */
export const deleteVendor = async (vendorId) => {
  const response = await api.delete(`/vendors/${vendorId}`);
  return response.data;
};

// ============================================
// INGREDIENT LIBRARY
// ============================================

/**
 * Search ingredient library
 * Supports search by name, item number, or UPC
 * NOTE: Currently uses inventory endpoint - should be updated to dedicated library endpoint
 */
export const searchIngredients = async (query, filters = {}) => {
  // For now, get all inventory items and filter client-side
  // TODO: Backend should implement /api/ingredient-library/search endpoint
  const response = await api.get('/inventory');
  const inventory = response.data;

  if (!query || query.length < 3) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  return inventory
    .filter(item =>
      item.ingredient_name?.toLowerCase().includes(lowerQuery) ||
      item.ingredient?.name?.toLowerCase().includes(lowerQuery) ||
      item.ingredient?.item_number?.includes(query) ||
      item.ingredient?.upc?.includes(query)
    )
    .map(item => ({
      id: item.ingredient_id,
      name: item.ingredient_name || item.ingredient?.name,
      category: item.category || item.ingredient?.category,
      itemNumber: item.ingredient?.item_number,
      upc: item.ingredient?.upc,
      unit: item.unit || item.ingredient?.unit,
      costPerUnit: item.cost_per_unit || item.ingredient?.cost_per_unit,
      preferredVendor: item.ingredient?.preferred_vendor,
      pkgQty: item.ingredient?.pkg_qty || 1,
      pkgUom: item.ingredient?.pkg_uom || item.unit,
      itemsPerPkg: item.ingredient?.items_per_pkg || 1,
      itemQty: item.ingredient?.item_qty,
      itemUom: item.ingredient?.item_uom,
    }));
};

/**
 * Get all ingredients from library
 * NOTE: Currently uses inventory endpoint
 */
export const getIngredientLibrary = async (filters = {}) => {
  const response = await api.get('/inventory', { params: filters });
  return response.data;
};

/**
 * Get ingredient details by ID
 */
export const getIngredientById = async (ingredientId) => {
  const response = await api.get(`/ingredient-library/${ingredientId}`);
  return response.data;
};

/**
 * Create a new ingredient in the library
 */
export const createIngredient = async (ingredientData) => {
  const response = await api.post('/ingredient-library', ingredientData);
  return response.data;
};

/**
 * Update an ingredient in the library
 */
export const updateIngredient = async (ingredientId, ingredientData) => {
  const response = await api.put(`/ingredient-library/${ingredientId}`, ingredientData);
  return response.data;
};

/**
 * Delete an ingredient from the library
 */
export const deleteIngredient = async (ingredientId) => {
  const response = await api.delete(`/ingredient-library/${ingredientId}`);
  return response.data;
};
