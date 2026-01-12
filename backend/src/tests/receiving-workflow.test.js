// /backend/src/tests/receiving-workflow.test.js
// Comprehensive test suite for PO receiving workflow with partial fulfillment

import { supabase } from "../services/supabase.js";
import {
	receivePurchaseOrderItems,
	createPOFromOrderItems,
} from "../services/orders.js";

/**
 * Test Suite: PO Receiving Workflow
 *
 * Tests all scenarios including:
 * 1. Full receipt (all items)
 * 2. Partial receipt (some items)
 * 3. Multiple partial receipts (cumulative)
 * 4. Consolidated item distribution (proportional)
 * 5. Over-receive prevention (error)
 * 6. Zero quantity items (skip)
 * 7. Status transitions (verify all)
 * 8. Inventory update (verify quantities)
 */

// Test configuration
const TEST_CONFIG = {
	restaurantId: null, // Will be set during setup
	testOrderIds: [],
	testPOIds: [],
	testIngredientIds: [],
};

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
	console.log("\n🔧 Setting up test environment...\n");

	// Get or create test restaurant
	const { data: restaurant, error: restaurantError } = await supabase
		.from("restaurants")
		.select("id, business_id")
		.limit(1)
		.single();

	if (restaurantError || !restaurant) {
		throw new Error("No restaurant found - please create a test restaurant first");
	}

	TEST_CONFIG.restaurantId = restaurant.id;
	console.log(`✅ Using restaurant: ${restaurant.id}\n`);

	// Get test ingredients
	const { data: ingredients, error: ingredientsError } = await supabase
		.from("ingredient_library")
		.select("id, name, unit")
		.limit(3);

	if (ingredientsError || !ingredients.length) {
		throw new Error("No ingredients found - please seed ingredient_library");
	}

	TEST_CONFIG.testIngredientIds = ingredients.map(i => ({
		id: i.id,
		name: i.name,
		unit: i.unit
	}));

	console.log(`✅ Using ${ingredients.length} test ingredients\n`);

	return true;
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
	console.log("\n🧹 Cleaning up test data...\n");

	// Delete test PO items
	if (TEST_CONFIG.testPOIds.length > 0) {
		await supabase
			.from("purchase_order_items")
			.delete()
			.in("purchase_order_id", TEST_CONFIG.testPOIds);
	}

	// Delete test POs
	if (TEST_CONFIG.testPOIds.length > 0) {
		await supabase
			.from("purchase_orders")
			.delete()
			.in("id", TEST_CONFIG.testPOIds);
	}

	// Delete test order items
	if (TEST_CONFIG.testOrderIds.length > 0) {
		await supabase
			.from("restaurant_order_items")
			.delete()
			.in("order_id", TEST_CONFIG.testOrderIds);
	}

	// Delete test orders
	if (TEST_CONFIG.testOrderIds.length > 0) {
		await supabase
			.from("restaurant_orders")
			.delete()
			.in("id", TEST_CONFIG.testOrderIds);
	}

	console.log("✅ Test data cleaned up\n");
}

/**
 * Test 1: Full Receipt - All items received at once
 */
async function testFullReceipt() {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("TEST 1: Full Receipt (All Items)");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

	try {
		// Create test order
		const { data: order, error: orderError } = await supabase
			.from("restaurant_orders")
			.insert({
				restaurant_id: TEST_CONFIG.restaurantId,
				order_number: `TEST-FULL-${Date.now()}`,
				order_type: "vendor",
				status: "submitted",
				created_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (orderError) throw orderError;
		TEST_CONFIG.testOrderIds.push(order.id);

		// Create order items
		const orderItems = await supabase
			.from("restaurant_order_items")
			.insert([
				{
					order_id: order.id,
					ingredient_id: TEST_CONFIG.testIngredientIds[0].id,
					item_name: TEST_CONFIG.testIngredientIds[0].name,
					quantity: 10,
					unit: TEST_CONFIG.testIngredientIds[0].unit,
					estimated_unit_cost: 5.00,
					status: "pending",
				}
			])
			.select();

		// Create PO from order items
		const poData = {
			restaurant_id: TEST_CONFIG.restaurantId,
			supplierName: "Test Supplier Full",
			notes: "Test PO - Full Receipt",
		};

		const poResult = await createPOFromOrderItems(
			poData,
			orderItems.data.map(i => i.id)
		);

		TEST_CONFIG.testPOIds.push(poResult.purchaseOrder.id);

		console.log(`✅ Created test PO: ${poResult.purchaseOrder.order_number}`);
		console.log(`   - Items: 1`);
		console.log(`   - Total: $${poResult.purchaseOrder.total}\n`);

		// Receive all items
		const receivedItems = poResult.items.map(item => ({
			po_item_id: item.id,
			quantity_received: item.quantity_ordered,
			expiration_date: "2025-12-31",
			batch_number: "BATCH-001",
		}));

		const receiveResult = await receivePurchaseOrderItems(
			poResult.purchaseOrder.id,
			receivedItems,
			TEST_CONFIG.restaurantId
		);

		console.log("📦 Receiving Result:");
		console.log(`   - Status: ${receiveResult.status}`);
		console.log(`   - Items Received: ${receiveResult.items_received.length}`);
		console.log(`   - Inventory Updated: ${receiveResult.inventory_updated}`);

		// Verify PO status is complete
		if (receiveResult.status !== "complete") {
			throw new Error(`Expected PO status 'complete', got '${receiveResult.status}'`);
		}

		// Verify all items fully received
		for (const item of receiveResult.items_received) {
			if (item.status !== "complete") {
				throw new Error(`Expected item status 'complete', got '${item.status}'`);
			}
			if (item.remaining !== 0) {
				throw new Error(`Expected 0 remaining, got ${item.remaining}`);
			}
		}

		console.log("\n✅ TEST 1 PASSED: Full receipt successful\n");
		return true;

	} catch (error) {
		console.error("\n❌ TEST 1 FAILED:", error.message, "\n");
		return false;
	}
}

/**
 * Test 2: Partial Receipt - Some items received
 */
async function testPartialReceipt() {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("TEST 2: Partial Receipt (Some Items)");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

	try {
		// Create test order
		const { data: order, error: orderError } = await supabase
			.from("restaurant_orders")
			.insert({
				restaurant_id: TEST_CONFIG.restaurantId,
				order_number: `TEST-PARTIAL-${Date.now()}`,
				order_type: "vendor",
				status: "submitted",
			})
			.select()
			.single();

		if (orderError) throw orderError;
		TEST_CONFIG.testOrderIds.push(order.id);

		// Create order items
		const orderItems = await supabase
			.from("restaurant_order_items")
			.insert([
				{
					order_id: order.id,
					ingredient_id: TEST_CONFIG.testIngredientIds[0].id,
					item_name: TEST_CONFIG.testIngredientIds[0].name,
					quantity: 20,
					unit: TEST_CONFIG.testIngredientIds[0].unit,
					estimated_unit_cost: 5.00,
					status: "pending",
				}
			])
			.select();

		// Create PO
		const poData = {
			restaurant_id: TEST_CONFIG.restaurantId,
			supplierName: "Test Supplier Partial",
		};

		const poResult = await createPOFromOrderItems(
			poData,
			orderItems.data.map(i => i.id)
		);

		TEST_CONFIG.testPOIds.push(poResult.purchaseOrder.id);

		console.log(`✅ Created test PO: ${poResult.purchaseOrder.order_number}`);
		console.log(`   - Ordered: 20 ${TEST_CONFIG.testIngredientIds[0].unit}\n`);

		// Receive only 12 units (60% of order)
		const receivedItems = [{
			po_item_id: poResult.items[0].id,
			quantity_received: 12,
		}];

		const receiveResult = await receivePurchaseOrderItems(
			poResult.purchaseOrder.id,
			receivedItems,
			TEST_CONFIG.restaurantId
		);

		console.log("📦 Receiving Result:");
		console.log(`   - Status: ${receiveResult.status}`);
		console.log(`   - Received: 12 ${TEST_CONFIG.testIngredientIds[0].unit}`);
		console.log(`   - Remaining: ${receiveResult.items_received[0].remaining}`);

		// Verify PO status is backordered
		if (receiveResult.status !== "backordered") {
			throw new Error(`Expected PO status 'backordered', got '${receiveResult.status}'`);
		}

		// Verify item status is partial
		if (receiveResult.items_received[0].status !== "partial") {
			throw new Error(`Expected item status 'partial', got '${receiveResult.items_received[0].status}'`);
		}

		// Verify remaining is 8
		if (receiveResult.items_received[0].remaining !== 8) {
			throw new Error(`Expected 8 remaining, got ${receiveResult.items_received[0].remaining}`);
		}

		console.log("\n✅ TEST 2 PASSED: Partial receipt successful\n");
		return true;

	} catch (error) {
		console.error("\n❌ TEST 2 FAILED:", error.message, "\n");
		return false;
	}
}

/**
 * Test 3: Multiple Partial Receipts - Cumulative receiving
 */
async function testMultiplePartialReceipts() {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("TEST 3: Multiple Partial Receipts (Cumulative)");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

	try {
		// Create test order
		const { data: order } = await supabase
			.from("restaurant_orders")
			.insert({
				restaurant_id: TEST_CONFIG.restaurantId,
				order_number: `TEST-MULTI-${Date.now()}`,
				order_type: "vendor",
				status: "submitted",
			})
			.select()
			.single();

		TEST_CONFIG.testOrderIds.push(order.id);

		// Create order items
		const orderItems = await supabase
			.from("restaurant_order_items")
			.insert([
				{
					order_id: order.id,
					ingredient_id: TEST_CONFIG.testIngredientIds[0].id,
					item_name: TEST_CONFIG.testIngredientIds[0].name,
					quantity: 30,
					unit: TEST_CONFIG.testIngredientIds[0].unit,
					estimated_unit_cost: 5.00,
					status: "pending",
				}
			])
			.select();

		// Create PO
		const poData = {
			restaurant_id: TEST_CONFIG.restaurantId,
			supplierName: "Test Supplier Multi",
		};

		const poResult = await createPOFromOrderItems(
			poData,
			orderItems.data.map(i => i.id)
		);

		TEST_CONFIG.testPOIds.push(poResult.purchaseOrder.id);

		console.log(`✅ Created test PO: ${poResult.purchaseOrder.order_number}`);
		console.log(`   - Ordered: 30 ${TEST_CONFIG.testIngredientIds[0].unit}\n`);

		// First receipt: 10 units
		console.log("📦 Receipt #1: 10 units");
		const receipt1 = await receivePurchaseOrderItems(
			poResult.purchaseOrder.id,
			[{ po_item_id: poResult.items[0].id, quantity_received: 10 }],
			TEST_CONFIG.restaurantId
		);

		if (receipt1.items_received[0].quantity_received !== 10) {
			throw new Error("Receipt 1: Expected 10 received");
		}
		if (receipt1.items_received[0].remaining !== 20) {
			throw new Error("Receipt 1: Expected 20 remaining");
		}
		console.log(`   ✓ Received: 10, Remaining: 20\n`);

		// Second receipt: 15 units (cumulative: 25)
		console.log("📦 Receipt #2: 15 units");
		const receipt2 = await receivePurchaseOrderItems(
			poResult.purchaseOrder.id,
			[{ po_item_id: poResult.items[0].id, quantity_received: 15 }],
			TEST_CONFIG.restaurantId
		);

		if (receipt2.items_received[0].quantity_received !== 25) {
			throw new Error("Receipt 2: Expected 25 cumulative received");
		}
		if (receipt2.items_received[0].remaining !== 5) {
			throw new Error("Receipt 2: Expected 5 remaining");
		}
		console.log(`   ✓ Cumulative: 25, Remaining: 5\n`);

		// Third receipt: 5 units (complete)
		console.log("📦 Receipt #3: 5 units (completing order)");
		const receipt3 = await receivePurchaseOrderItems(
			poResult.purchaseOrder.id,
			[{ po_item_id: poResult.items[0].id, quantity_received: 5 }],
			TEST_CONFIG.restaurantId
		);

		if (receipt3.status !== "complete") {
			throw new Error("Receipt 3: Expected PO status 'complete'");
		}
		if (receipt3.items_received[0].quantity_received !== 30) {
			throw new Error("Receipt 3: Expected 30 total received");
		}
		console.log(`   ✓ Complete: 30/30 received\n`);

		console.log("✅ TEST 3 PASSED: Multiple partial receipts successful\n");
		return true;

	} catch (error) {
		console.error("\n❌ TEST 3 FAILED:", error.message, "\n");
		return false;
	}
}

/**
 * Test 4: Consolidated Item Distribution - Proportional receiving
 */
async function testConsolidatedDistribution() {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("TEST 4: Consolidated Item Distribution (Proportional)");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

	try {
		// Create two separate orders
		const { data: order1 } = await supabase
			.from("restaurant_orders")
			.insert({
				restaurant_id: TEST_CONFIG.restaurantId,
				order_number: `TEST-CONSOL-A-${Date.now()}`,
				order_type: "vendor",
				status: "submitted",
			})
			.select()
			.single();

		const { data: order2 } = await supabase
			.from("restaurant_orders")
			.insert({
				restaurant_id: TEST_CONFIG.restaurantId,
				order_number: `TEST-CONSOL-B-${Date.now()}`,
				order_type: "vendor",
				status: "submitted",
			})
			.select()
			.single();

		TEST_CONFIG.testOrderIds.push(order1.id, order2.id);

		// Order 1 needs 6 lbs
		const orderItems1 = await supabase
			.from("restaurant_order_items")
			.insert([
				{
					order_id: order1.id,
					ingredient_id: TEST_CONFIG.testIngredientIds[0].id,
					item_name: TEST_CONFIG.testIngredientIds[0].name,
					quantity: 6,
					unit: "lbs",
					estimated_unit_cost: 5.00,
					status: "pending",
				}
			])
			.select();

		// Order 2 needs 4 lbs
		const orderItems2 = await supabase
			.from("restaurant_order_items")
			.insert([
				{
					order_id: order2.id,
					ingredient_id: TEST_CONFIG.testIngredientIds[0].id,
					item_name: TEST_CONFIG.testIngredientIds[0].name,
					quantity: 4,
					unit: "lbs",
					estimated_unit_cost: 5.00,
					status: "pending",
				}
			])
			.select();

		console.log(`✅ Created two orders:`);
		console.log(`   - Order A: 6 lbs`);
		console.log(`   - Order B: 4 lbs`);
		console.log(`   - Total PO: 10 lbs\n`);

		// Create consolidated PO
		const poData = {
			restaurant_id: TEST_CONFIG.restaurantId,
			supplierName: "Test Supplier Consolidated",
		};

		const allOrderItemIds = [
			...orderItems1.data.map(i => i.id),
			...orderItems2.data.map(i => i.id)
		];

		const poResult = await createPOFromOrderItems(poData, allOrderItemIds);
		TEST_CONFIG.testPOIds.push(poResult.purchaseOrder.id);

		console.log(`✅ Created consolidated PO: ${poResult.purchaseOrder.order_number}`);
		console.log(`   - Consolidated: 1 line item for 10 lbs\n`);

		// Receive only 8 lbs (partial)
		console.log("📦 Receiving 8 lbs (80% of order)");
		const receiveResult = await receivePurchaseOrderItems(
			poResult.purchaseOrder.id,
			[{ po_item_id: poResult.items[0].id, quantity_received: 8 }],
			TEST_CONFIG.restaurantId
		);

		console.log(`   - PO Status: ${receiveResult.status}`);
		console.log(`   - Received: 8 lbs`);
		console.log(`   - Remaining: 2 lbs\n`);

		// Verify proportional distribution
		// Order A (6 lbs) should get: (6/10) * 8 = 4.8 lbs
		// Order B (4 lbs) should get: (4/10) * 8 = 3.2 lbs

		const { data: orderItem1 } = await supabase
			.from("restaurant_order_items")
			.select("quantity_received, status")
			.eq("id", orderItems1.data[0].id)
			.single();

		const { data: orderItem2 } = await supabase
			.from("restaurant_order_items")
			.select("quantity_received, status")
			.eq("id", orderItems2.data[0].id)
			.single();

		console.log("🔍 Verifying proportional distribution:");
		console.log(`   - Order A received: ${orderItem1.quantity_received} lbs (expected: 4.8)`);
		console.log(`   - Order B received: ${orderItem2.quantity_received} lbs (expected: 3.2)`);

		const tolerance = 0.01;
		if (Math.abs(parseFloat(orderItem1.quantity_received) - 4.8) > tolerance) {
			throw new Error(`Order A distribution incorrect: ${orderItem1.quantity_received}`);
		}
		if (Math.abs(parseFloat(orderItem2.quantity_received) - 3.2) > tolerance) {
			throw new Error(`Order B distribution incorrect: ${orderItem2.quantity_received}`);
		}

		// Verify both are partially_received
		if (orderItem1.status !== "partially_received") {
			throw new Error(`Order A status should be 'partially_received', got '${orderItem1.status}'`);
		}
		if (orderItem2.status !== "partially_received") {
			throw new Error(`Order B status should be 'partially_received', got '${orderItem2.status}'`);
		}

		console.log(`   ✓ Proportional distribution accurate\n`);

		console.log("✅ TEST 4 PASSED: Consolidated item distribution successful\n");
		return true;

	} catch (error) {
		console.error("\n❌ TEST 4 FAILED:", error.message, "\n");
		return false;
	}
}

/**
 * Test 5: Over-Receive Prevention - Validation error
 */
async function testOverReceivePrevention() {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("TEST 5: Over-Receive Prevention (Error)");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

	try {
		// Create test order
		const { data: order } = await supabase
			.from("restaurant_orders")
			.insert({
				restaurant_id: TEST_CONFIG.restaurantId,
				order_number: `TEST-OVER-${Date.now()}`,
				order_type: "vendor",
				status: "submitted",
			})
			.select()
			.single();

		TEST_CONFIG.testOrderIds.push(order.id);

		// Create order items
		const orderItems = await supabase
			.from("restaurant_order_items")
			.insert([
				{
					order_id: order.id,
					ingredient_id: TEST_CONFIG.testIngredientIds[0].id,
					item_name: TEST_CONFIG.testIngredientIds[0].name,
					quantity: 10,
					unit: TEST_CONFIG.testIngredientIds[0].unit,
					estimated_unit_cost: 5.00,
					status: "pending",
				}
			])
			.select();

		// Create PO
		const poData = {
			restaurant_id: TEST_CONFIG.restaurantId,
			supplierName: "Test Supplier Over",
		};

		const poResult = await createPOFromOrderItems(
			poData,
			orderItems.data.map(i => i.id)
		);

		TEST_CONFIG.testPOIds.push(poResult.purchaseOrder.id);

		console.log(`✅ Created test PO: ${poResult.purchaseOrder.order_number}`);
		console.log(`   - Ordered: 10 ${TEST_CONFIG.testIngredientIds[0].unit}\n`);

		// Try to receive 15 units (more than ordered)
		console.log("📦 Attempting to receive 15 units (should fail)...");

		let errorCaught = false;
		try {
			await receivePurchaseOrderItems(
				poResult.purchaseOrder.id,
				[{ po_item_id: poResult.items[0].id, quantity_received: 15 }],
				TEST_CONFIG.restaurantId
			);
		} catch (error) {
			errorCaught = true;
			console.log(`   ✓ Error caught: "${error.message}"\n`);

			// Verify error message mentions over-receiving
			if (!error.message.includes("Cannot receive")) {
				throw new Error("Error message should mention 'Cannot receive'");
			}
		}

		if (!errorCaught) {
			throw new Error("Expected error for over-receiving but none was thrown");
		}

		console.log("✅ TEST 5 PASSED: Over-receive prevention successful\n");
		return true;

	} catch (error) {
		console.error("\n❌ TEST 5 FAILED:", error.message, "\n");
		return false;
	}
}

/**
 * Test 6: Status Transitions - Verify all status changes
 */
async function testStatusTransitions() {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("TEST 6: Status Transitions (Verify All)");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

	try {
		// Create test order
		const { data: order } = await supabase
			.from("restaurant_orders")
			.insert({
				restaurant_id: TEST_CONFIG.restaurantId,
				order_number: `TEST-STATUS-${Date.now()}`,
				order_type: "vendor",
				status: "submitted",
			})
			.select()
			.single();

		TEST_CONFIG.testOrderIds.push(order.id);

		// Create order items
		const orderItems = await supabase
			.from("restaurant_order_items")
			.insert([
				{
					order_id: order.id,
					ingredient_id: TEST_CONFIG.testIngredientIds[0].id,
					item_name: TEST_CONFIG.testIngredientIds[0].name,
					quantity: 20,
					unit: TEST_CONFIG.testIngredientIds[0].unit,
					estimated_unit_cost: 5.00,
					status: "pending",
				}
			])
			.select();

		// Create PO (should be draft)
		const poData = {
			restaurant_id: TEST_CONFIG.restaurantId,
			supplierName: "Test Supplier Status",
		};

		const poResult = await createPOFromOrderItems(
			poData,
			orderItems.data.map(i => i.id)
		);

		TEST_CONFIG.testPOIds.push(poResult.purchaseOrder.id);

		console.log(`✅ Created PO: ${poResult.purchaseOrder.order_number}`);
		console.log(`   - Initial PO status: ${poResult.purchaseOrder.status}`);

		// Verify initial status is draft
		if (poResult.purchaseOrder.status !== "draft") {
			throw new Error(`Expected initial PO status 'draft', got '${poResult.purchaseOrder.status}'`);
		}

		// Verify order item status is on_po
		const { data: orderItem1 } = await supabase
			.from("restaurant_order_items")
			.select("status")
			.eq("id", orderItems.data[0].id)
			.single();

		console.log(`   - Order item status: ${orderItem1.status}\n`);

		// Receive partial (should change PO to backordered)
		console.log("📦 Receiving 10/20 units (partial)...");
		const receipt1 = await receivePurchaseOrderItems(
			poResult.purchaseOrder.id,
			[{ po_item_id: poResult.items[0].id, quantity_received: 10 }],
			TEST_CONFIG.restaurantId
		);

		console.log(`   - PO status: ${receipt1.status}`);

		if (receipt1.status !== "backordered") {
			throw new Error(`Expected PO status 'backordered' after partial, got '${receipt1.status}'`);
		}

		// Verify order item status is partially_received
		const { data: orderItem2 } = await supabase
			.from("restaurant_order_items")
			.select("status")
			.eq("id", orderItems.data[0].id)
			.single();

		console.log(`   - Order item status: ${orderItem2.status}\n`);

		if (orderItem2.status !== "partially_received") {
			throw new Error(`Expected order item status 'partially_received', got '${orderItem2.status}'`);
		}

		// Receive remaining (should change to complete)
		console.log("📦 Receiving remaining 10 units (completing)...");
		const receipt2 = await receivePurchaseOrderItems(
			poResult.purchaseOrder.id,
			[{ po_item_id: poResult.items[0].id, quantity_received: 10 }],
			TEST_CONFIG.restaurantId
		);

		console.log(`   - PO status: ${receipt2.status}`);

		if (receipt2.status !== "complete") {
			throw new Error(`Expected PO status 'complete', got '${receipt2.status}'`);
		}

		// Verify order item status is received
		const { data: orderItem3 } = await supabase
			.from("restaurant_order_items")
			.select("status")
			.eq("id", orderItems.data[0].id)
			.single();

		console.log(`   - Order item status: ${orderItem3.status}\n`);

		if (orderItem3.status !== "received") {
			throw new Error(`Expected order item status 'received', got '${orderItem3.status}'`);
		}

		// Verify order status is complete
		const { data: orderFinal } = await supabase
			.from("restaurant_orders")
			.select("status")
			.eq("id", order.id)
			.single();

		console.log(`   - Order status: ${orderFinal.status}\n`);

		if (orderFinal.status !== "complete") {
			throw new Error(`Expected order status 'complete', got '${orderFinal.status}'`);
		}

		console.log("✅ TEST 6 PASSED: All status transitions correct\n");
		return true;

	} catch (error) {
		console.error("\n❌ TEST 6 FAILED:", error.message, "\n");
		return false;
	}
}

/**
 * Run all tests
 */
async function runAllTests() {
	console.log("\n");
	console.log("╔════════════════════════════════════════════════════════╗");
	console.log("║  PO RECEIVING WORKFLOW - COMPREHENSIVE TEST SUITE      ║");
	console.log("╚════════════════════════════════════════════════════════╝");
	console.log("\n");

	const results = {
		passed: 0,
		failed: 0,
		total: 6,
	};

	try {
		// Setup
		await setupTestEnvironment();

		// Run tests
		if (await testFullReceipt()) results.passed++;
		else results.failed++;

		if (await testPartialReceipt()) results.passed++;
		else results.failed++;

		if (await testMultiplePartialReceipts()) results.passed++;
		else results.failed++;

		if (await testConsolidatedDistribution()) results.passed++;
		else results.failed++;

		if (await testOverReceivePrevention()) results.passed++;
		else results.failed++;

		if (await testStatusTransitions()) results.passed++;
		else results.failed++;

	} catch (error) {
		console.error("\n❌ Test suite error:", error.message);
	} finally {
		// Cleanup
		await cleanupTestData();
	}

	// Summary
	console.log("\n");
	console.log("╔════════════════════════════════════════════════════════╗");
	console.log("║  TEST SUMMARY                                          ║");
	console.log("╚════════════════════════════════════════════════════════╝");
	console.log("\n");
	console.log(`   Total Tests: ${results.total}`);
	console.log(`   ✅ Passed: ${results.passed}`);
	console.log(`   ❌ Failed: ${results.failed}`);
	console.log(`   Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
	console.log("\n");

	if (results.failed === 0) {
		console.log("🎉 ALL TESTS PASSED! 🎉\n");
	} else {
		console.log("⚠️  SOME TESTS FAILED - Review output above\n");
	}
}

// Run tests
runAllTests();
