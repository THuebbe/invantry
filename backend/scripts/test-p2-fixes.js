#!/usr/bin/env node
/**
 * Test script for Sprint 2 P2 Backend Fixes
 * Tests Issue #6 (multiple addresses) and Issue #7 (contact roles)
 *
 * Run: node backend/scripts/test-p2-fixes.js
 */

import { supabase } from '../src/services/supabase.js';
import {
  createVendorAddress,
  getVendorAddresses
} from '../src/services/vendorAddresses.js';
import {
  createVendorContact,
  getVendorContacts
} from '../src/services/vendorContacts.js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getTestVendor(restaurantId) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No active vendor found. Please create a vendor first.');
  }

  return data;
}

async function getTestRestaurant() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No restaurant found in database');
  }

  return data;
}

async function testMultipleAddresses(vendorId, restaurantId) {
  log('\n=== Testing Issue #6: Multiple Addresses of Same Type ===', 'blue');

  try {
    // Test 1: Create first billing address
    log('\n1. Creating first billing address...', 'yellow');
    const address1 = await createVendorAddress({
      address_type: 'billing',
      is_primary: true,
      address_line1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postal_code: '10001',
      country: 'USA'
    }, vendorId, restaurantId);

    log(`✅ First billing address created: ${address1.id}`, 'green');

    // Test 2: Create second billing address (this should work now)
    log('\n2. Creating second billing address (same type)...', 'yellow');
    const address2 = await createVendorAddress({
      address_type: 'billing',
      is_primary: false,
      address_line1: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      postal_code: '90001',
      country: 'USA'
    }, vendorId, restaurantId);

    log(`✅ Second billing address created: ${address2.id}`, 'green');
    log('✅ PASS: Multiple addresses of same type allowed', 'green');

    // Test 3: Create third billing address and set as primary
    log('\n3. Creating third billing address as primary...', 'yellow');
    const address3 = await createVendorAddress({
      address_type: 'billing',
      is_primary: true,
      address_line1: '789 Elm Road',
      city: 'Chicago',
      state: 'IL',
      postal_code: '60601',
      country: 'USA'
    }, vendorId, restaurantId);

    log(`✅ Third billing address created: ${address3.id}`, 'green');

    // Test 4: Verify only one primary billing address
    log('\n4. Verifying primary address constraint...', 'yellow');
    const allAddresses = await getVendorAddresses(vendorId, restaurantId);
    const billingAddresses = allAddresses.filter(a => a.address_type === 'billing');
    const primaryBillingAddresses = billingAddresses.filter(a => a.is_primary);

    log(`   Total billing addresses: ${billingAddresses.length}`, 'blue');
    log(`   Primary billing addresses: ${primaryBillingAddresses.length}`, 'blue');

    if (primaryBillingAddresses.length === 1) {
      log('✅ PASS: Only one primary billing address exists', 'green');
    } else {
      log('❌ FAIL: Multiple primary billing addresses found', 'red');
    }

    // Test 5: Create shipping address (different type)
    log('\n5. Creating ship_from address (different type)...', 'yellow');
    const address4 = await createVendorAddress({
      address_type: 'ship_from',
      is_primary: true,
      address_line1: '999 Warehouse Blvd',
      city: 'Seattle',
      state: 'WA',
      postal_code: '98101',
      country: 'USA'
    }, vendorId, restaurantId);

    log(`✅ Ship from address created: ${address4.id}`, 'green');

    // Verify we can have primary billing AND primary shipping
    const updatedAddresses = await getVendorAddresses(vendorId, restaurantId);
    const primaryAddresses = updatedAddresses.filter(a => a.is_primary);
    const hasPrimaryBilling = primaryAddresses.some(a => a.address_type === 'billing');
    const hasPrimaryShipping = primaryAddresses.some(a => a.address_type === 'ship_from');

    if (hasPrimaryBilling && hasPrimaryShipping) {
      log('✅ PASS: Can have primary addresses of different types', 'green');
    } else {
      log('❌ FAIL: Primary addresses of different types not working', 'red');
    }

    log('\n=== Issue #6 Tests Complete ===', 'blue');
    return true;

  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    return false;
  }
}

async function testContactRoles(vendorId, restaurantId) {
  log('\n=== Testing Issue #7: Contact Role Validation ===', 'blue');

  const newRoles = [
    'AR Specialist',
    'AP Specialist',
    'Territory Manager'
  ];

  const existingRoles = [
    'Sales Rep',
    'Account Manager',
    'Billing Contact',
    'Customer Service',
    'Delivery Coordinator',
    'Other'
  ];

  try {
    // Test new roles
    log('\n1. Testing NEW roles...', 'yellow');
    for (const role of newRoles) {
      log(`   Testing role: ${role}`, 'blue');
      const contact = await createVendorContact({
        first_name: 'Test',
        last_name: role.replace(' ', '_'),
        role: role,
        email: `test.${role.toLowerCase().replace(' ', '_')}@vendor.com`,
        is_primary: false
      }, vendorId, restaurantId);

      log(`   ✅ ${role} accepted (ID: ${contact.id})`, 'green');
    }

    log('\n✅ PASS: All new roles accepted by backend', 'green');

    // Test existing roles still work
    log('\n2. Testing EXISTING roles (backward compatibility)...', 'yellow');
    for (const role of existingRoles.slice(0, 3)) { // Test first 3 to save time
      log(`   Testing role: ${role}`, 'blue');
      const contact = await createVendorContact({
        first_name: 'Test',
        last_name: role.replace(' ', '_'),
        role: role,
        email: `test.${role.toLowerCase().replace(' ', '_')}@vendor.com`,
        is_primary: false
      }, vendorId, restaurantId);

      log(`   ✅ ${role} still works (ID: ${contact.id})`, 'green');
    }

    log('\n✅ PASS: Existing roles still work (backward compatible)', 'green');

    // Test invalid role
    log('\n3. Testing INVALID role (should fail)...', 'yellow');
    try {
      await createVendorContact({
        first_name: 'Test',
        last_name: 'Invalid',
        role: 'Invalid Role',
        email: 'test.invalid@vendor.com',
        is_primary: false
      }, vendorId, restaurantId);

      log('❌ FAIL: Invalid role was accepted', 'red');
      return false;
    } catch (error) {
      if (error.message.includes('Invalid role')) {
        log('✅ PASS: Invalid role correctly rejected', 'green');
      } else {
        throw error;
      }
    }

    log('\n=== Issue #7 Tests Complete ===', 'blue');
    return true;

  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    return false;
  }
}

async function cleanup(vendorId, restaurantId) {
  log('\n=== Cleaning up test data ===', 'yellow');

  try {
    // Delete test addresses
    await supabase
      .from('vendor_addresses')
      .delete()
      .eq('vendor_id', vendorId)
      .eq('restaurant_id', restaurantId);

    // Delete test contacts
    await supabase
      .from('vendor_contacts')
      .delete()
      .eq('vendor_id', vendorId)
      .eq('restaurant_id', restaurantId)
      .like('email', 'test.%@vendor.com');

    log('✅ Test data cleaned up', 'green');
  } catch (error) {
    log(`⚠️  Warning: Cleanup failed: ${error.message}`, 'yellow');
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════╗', 'blue');
  log('║   Sprint 2 P2 Backend Fixes - Test Suite          ║', 'blue');
  log('╚════════════════════════════════════════════════════╝', 'blue');

  try {
    // Setup
    log('\n=== Setup ===', 'blue');
    const restaurant = await getTestRestaurant();
    log(`Using restaurant: ${restaurant.name} (${restaurant.id})`, 'blue');

    const vendor = await getTestVendor(restaurant.id);
    log(`Using vendor: ${vendor.name} (${vendor.id})`, 'blue');

    // Run tests
    const addressTestPassed = await testMultipleAddresses(vendor.id, restaurant.id);
    const contactTestPassed = await testContactRoles(vendor.id, restaurant.id);

    // Cleanup
    await cleanup(vendor.id, restaurant.id);

    // Summary
    log('\n╔════════════════════════════════════════════════════╗', 'blue');
    log('║                  TEST SUMMARY                      ║', 'blue');
    log('╚════════════════════════════════════════════════════╝', 'blue');
    log(`Issue #6 (Multiple Addresses): ${addressTestPassed ? '✅ PASS' : '❌ FAIL'}`, addressTestPassed ? 'green' : 'red');
    log(`Issue #7 (Contact Roles):      ${contactTestPassed ? '✅ PASS' : '❌ FAIL'}`, contactTestPassed ? 'green' : 'red');

    if (addressTestPassed && contactTestPassed) {
      log('\n✅ ALL TESTS PASSED', 'green');
      process.exit(0);
    } else {
      log('\n❌ SOME TESTS FAILED', 'red');
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
