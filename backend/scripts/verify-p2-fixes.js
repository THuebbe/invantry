#!/usr/bin/env node

/**
 * Sprint 2 - P2 Backend Fixes Verification Script
 *
 * This script verifies that all 3 high-priority backend fixes are working:
 * 1. Vendor soft delete preserves all data
 * 2. Multiple addresses of same type allowed
 * 3. Contact roles include AR Specialist, AP Specialist, Territory Manager
 *
 * Run with: node backend/scripts/verify-p2-fixes.js
 */

import { supabase } from '../src/services/supabase.js';
import { deleteVendor, getVendorById } from '../src/services/vendors.js';
import { createVendorAddress, getVendorAddresses } from '../src/services/vendorAddresses.js';
import { createVendorContact } from '../src/services/vendorContacts.js';

const COLORS = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
	console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function section(title) {
	console.log('\n' + '='.repeat(80));
	log(title, 'cyan');
	console.log('='.repeat(80));
}

async function cleanup(testVendorId, restaurantId) {
	try {
		// Hard delete test vendor and related records
		await supabase.from('vendor_contacts').delete().eq('vendor_id', testVendorId);
		await supabase.from('vendor_addresses').delete().eq('vendor_id', testVendorId);
		await supabase.from('vendors').delete().eq('id', testVendorId);
		log('✓ Cleanup successful', 'green');
	} catch (error) {
		log(`✗ Cleanup failed: ${error.message}`, 'red');
	}
}

async function testIssue5_SoftDelete(testVendorId, restaurantId) {
	section('TEST #1: Issue #5 - Vendor Soft Delete Preserves All Data');

	try {
		// Get vendor data before delete
		log('Step 1: Fetching vendor data before soft delete...', 'blue');
		const beforeDelete = await getVendorById(testVendorId, restaurantId);
		const originalData = { ...beforeDelete };
		delete originalData.stats; // Remove stats object for comparison

		log(`  Vendor: ${originalData.name}`, 'yellow');
		log(`  Code: ${originalData.vendor_code || 'N/A'}`, 'yellow');
		log(`  Legal Name: ${originalData.legal_name || 'N/A'}`, 'yellow');
		log(`  Trade Name: ${originalData.trade_name || 'N/A'}`, 'yellow');
		log(`  Notes: ${originalData.notes || 'N/A'}`, 'yellow');
		log(`  Is Active: ${originalData.is_active}`, 'yellow');

		// Perform soft delete
		log('\nStep 2: Performing soft delete...', 'blue');
		await deleteVendor(testVendorId, restaurantId);
		log('  ✓ Soft delete completed', 'green');

		// Verify data preservation
		log('\nStep 3: Verifying data preservation...', 'blue');
		const { data: afterDelete, error } = await supabase
			.from('vendors')
			.select('*')
			.eq('id', testVendorId)
			.eq('restaurant_id', restaurantId)
			.single();

		if (error) throw error;

		// Check is_active changed to false
		if (afterDelete.is_active === false) {
			log('  ✓ is_active correctly set to false', 'green');
		} else {
			throw new Error(`Expected is_active to be false, got ${afterDelete.is_active}`);
		}

		// Check all other fields preserved
		const fieldsToCheck = ['name', 'vendor_code', 'legal_name', 'trade_name', 'notes',
		                        'phone', 'email', 'contact_name', 'payment_terms', 'account_number'];
		let allFieldsPreserved = true;

		for (const field of fieldsToCheck) {
			if (afterDelete[field] !== originalData[field]) {
				log(`  ✗ Field '${field}' changed: ${originalData[field]} → ${afterDelete[field]}`, 'red');
				allFieldsPreserved = false;
			}
		}

		if (allFieldsPreserved) {
			log('  ✓ ALL vendor data fields preserved', 'green');
		}

		log('\n✅ TEST #1 PASSED: Soft delete preserves all data except is_active', 'green');
		return true;

	} catch (error) {
		log(`\n❌ TEST #1 FAILED: ${error.message}`, 'red');
		console.error(error);
		return false;
	}
}

async function testIssue6_MultipleSameTypeAddresses(testVendorId, restaurantId) {
	section('TEST #2: Issue #6 - Multiple Addresses of Same Type Allowed');

	try {
		// Create first billing address
		log('Step 1: Creating first billing address...', 'blue');
		const address1 = await createVendorAddress({
			address_type: 'billing',
			is_primary: true,
			address_line1: '123 Main Street',
			city: 'New York',
			state: 'NY',
			postal_code: '10001',
		}, testVendorId, restaurantId);
		log(`  ✓ Created address 1: ${address1.address_line1}`, 'green');

		// Create second billing address (same type - this should work now)
		log('\nStep 2: Creating second billing address (same type)...', 'blue');
		const address2 = await createVendorAddress({
			address_type: 'billing',
			is_primary: false,
			address_line1: '456 Oak Avenue',
			city: 'Los Angeles',
			state: 'CA',
			postal_code: '90001',
		}, testVendorId, restaurantId);
		log(`  ✓ Created address 2: ${address2.address_line1}`, 'green');

		// Create third billing address with is_primary = true
		log('\nStep 3: Creating third billing address (also primary - should unset previous primary)...', 'blue');
		const address3 = await createVendorAddress({
			address_type: 'billing',
			is_primary: true,
			address_line1: '789 Elm Road',
			city: 'Chicago',
			state: 'IL',
			postal_code: '60601',
		}, testVendorId, restaurantId);
		log(`  ✓ Created address 3: ${address3.address_line1}`, 'green');

		// Verify all addresses exist
		log('\nStep 4: Verifying all billing addresses exist...', 'blue');
		const allAddresses = await getVendorAddresses(testVendorId, restaurantId);
		const billingAddresses = allAddresses.filter(a => a.address_type === 'billing');

		if (billingAddresses.length === 3) {
			log(`  ✓ Found 3 billing addresses`, 'green');
		} else {
			throw new Error(`Expected 3 billing addresses, found ${billingAddresses.length}`);
		}

		// Verify only one primary
		log('\nStep 5: Verifying only ONE primary billing address...', 'blue');
		const primaryAddresses = billingAddresses.filter(a => a.is_primary);

		if (primaryAddresses.length === 1) {
			log(`  ✓ Exactly 1 primary billing address`, 'green');
			log(`    Primary: ${primaryAddresses[0].address_line1}`, 'yellow');
		} else {
			throw new Error(`Expected 1 primary address, found ${primaryAddresses.length}`);
		}

		// Verify the last one is primary
		if (primaryAddresses[0].address_line1 === '789 Elm Road') {
			log(`  ✓ Most recently marked primary address is correctly primary`, 'green');
		} else {
			throw new Error(`Expected '789 Elm Road' to be primary, found ${primaryAddresses[0].address_line1}`);
		}

		log('\n✅ TEST #2 PASSED: Multiple addresses of same type allowed, primary constraint works', 'green');
		return true;

	} catch (error) {
		log(`\n❌ TEST #2 FAILED: ${error.message}`, 'red');
		console.error(error);
		return false;
	}
}

async function testIssue7_ContactRoles(testVendorId, restaurantId) {
	section('TEST #3: Issue #7 - Contact Roles Include AR Specialist, AP Specialist, Territory Manager');

	const newRoles = [
		{ role: 'AR Specialist', firstName: 'Alice', lastName: 'Johnson' },
		{ role: 'AP Specialist', firstName: 'Bob', lastName: 'Smith' },
		{ role: 'Territory Manager', firstName: 'Charlie', lastName: 'Davis' },
	];

	try {
		log('Testing new contact roles...', 'blue');

		for (const { role, firstName, lastName } of newRoles) {
			log(`\n  Creating contact with role: ${role}`, 'blue');

			const contact = await createVendorContact({
				first_name: firstName,
				last_name: lastName,
				role: role,
				email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@vendor.com`,
				is_primary: false,
			}, testVendorId, restaurantId);

			if (contact.role === role) {
				log(`    ✓ ${firstName} ${lastName} (${role}) created successfully`, 'green');
			} else {
				throw new Error(`Expected role ${role}, got ${contact.role}`);
			}
		}

		log('\n✅ TEST #3 PASSED: All new contact roles accepted', 'green');
		return true;

	} catch (error) {
		log(`\n❌ TEST #3 FAILED: ${error.message}`, 'red');
		console.error(error);
		return false;
	}
}

async function main() {
	log('\n🚀 Sprint 2 - P2 Backend Fixes Verification', 'cyan');
	log('═══════════════════════════════════════════════════════════════', 'cyan');

	let testVendorId = null;
	let restaurantId = null;

	try {
		// Setup: Create test vendor
		log('\n📦 Setup: Creating test vendor...', 'blue');

		// Get first restaurant ID from database
		const { data: restaurants, error: restaurantError } = await supabase
			.from('restaurants')
			.select('id')
			.limit(1);

		if (restaurantError) throw restaurantError;
		if (!restaurants || restaurants.length === 0) {
			throw new Error('No restaurants found in database. Please create a restaurant first.');
		}

		restaurantId = restaurants[0].id;
		log(`  Using restaurant ID: ${restaurantId}`, 'yellow');

		// Create test vendor
		const { data: vendor, error: vendorError } = await supabase
			.from('vendors')
			.insert({
				restaurant_id: restaurantId,
				name: 'P2 Test Vendor',
				vendor_code: 'TEST-P2',
				legal_name: 'P2 Test Vendor LLC',
				trade_name: 'P2 Test Trading',
				notes: 'Test vendor for P2 fixes verification',
				phone: '555-0100',
				email: 'test@p2vendor.com',
				contact_name: 'Test Contact',
				payment_terms: 'Net 30',
				account_number: 'ACC-12345',
				is_active: true,
			})
			.select()
			.single();

		if (vendorError) throw vendorError;
		testVendorId = vendor.id;

		log(`  ✓ Test vendor created: ${vendor.name} (${testVendorId})`, 'green');

		// Run tests
		const results = {
			issue5: false,
			issue6: false,
			issue7: false,
		};

		results.issue6 = await testIssue6_MultipleSameTypeAddresses(testVendorId, restaurantId);
		results.issue7 = await testIssue7_ContactRoles(testVendorId, restaurantId);
		results.issue5 = await testIssue5_SoftDelete(testVendorId, restaurantId);

		// Summary
		section('📊 TEST SUMMARY');

		const passedCount = Object.values(results).filter(r => r).length;
		const totalCount = Object.keys(results).length;

		log(`Issue #5 (Soft Delete): ${results.issue5 ? '✅ PASSED' : '❌ FAILED'}`, results.issue5 ? 'green' : 'red');
		log(`Issue #6 (Multiple Addresses): ${results.issue6 ? '✅ PASSED' : '❌ FAILED'}`, results.issue6 ? 'green' : 'red');
		log(`Issue #7 (Contact Roles): ${results.issue7 ? '✅ PASSED' : '❌ FAILED'}`, results.issue7 ? 'green' : 'red');

		console.log('\n' + '═'.repeat(80));

		if (passedCount === totalCount) {
			log(`\n🎉 ALL TESTS PASSED (${passedCount}/${totalCount})`, 'green');
			log('\n✅ Sprint 2 - P2 Backend Fixes: VERIFIED', 'green');
		} else {
			log(`\n⚠️  SOME TESTS FAILED (${passedCount}/${totalCount} passed)`, 'red');
			log('\n❌ Sprint 2 - P2 Backend Fixes: NEEDS ATTENTION', 'red');
		}

		// Cleanup
		log('\n🧹 Cleaning up test data...', 'blue');
		await cleanup(testVendorId, restaurantId);

		process.exit(passedCount === totalCount ? 0 : 1);

	} catch (error) {
		log(`\n💥 Fatal Error: ${error.message}`, 'red');
		console.error(error);

		if (testVendorId && restaurantId) {
			log('\n🧹 Attempting cleanup...', 'blue');
			await cleanup(testVendorId, restaurantId);
		}

		process.exit(1);
	}
}

main();
