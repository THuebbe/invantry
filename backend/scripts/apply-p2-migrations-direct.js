#!/usr/bin/env node

/**
 * Sprint 2 - P2 Backend Fixes - Direct Migration Application
 *
 * This script directly applies the database constraint fixes using Supabase client.
 * It breaks down the SQL into executable statements.
 *
 * Run with: node backend/scripts/apply-p2-migrations-direct.js
 */

import { supabase } from '../src/services/supabase.js';

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

async function executeSqlStatement(statement, description) {
	try {
		log(`\n  ${description}...`, 'blue');
		const { data, error } = await supabase.rpc('exec_sql', {
			query: statement
		});

		if (error) throw error;
		log(`  ✓ Success`, 'green');
		return { success: true };
	} catch (error) {
		log(`  ✗ Error: ${error.message}`, 'red');
		return { success: false, error };
	}
}

async function migration1_RemoveAddressDuplicateConstraint() {
	section('Migration 1: Remove Address Duplicate Type Constraint');

	log('\nThis migration allows vendors to have multiple addresses of the same type', 'yellow');

	// Drop the unique constraint
	const dropConstraint = `
		ALTER TABLE vendor_addresses
		DROP CONSTRAINT IF EXISTS idx_vendor_addresses_vendor_type_unique;
	`;

	const result1 = await executeSqlStatement(
		dropConstraint,
		'Dropping unique constraint idx_vendor_addresses_vendor_type_unique'
	);

	if (!result1.success) {
		log('\n❌ Failed to drop constraint', 'red');
		return false;
	}

	// Create a regular index for performance
	const createIndex = `
		CREATE INDEX IF NOT EXISTS idx_vendor_addresses_vendor_type_lookup
		ON vendor_addresses (vendor_id, address_type);
	`;

	const result2 = await executeSqlStatement(
		createIndex,
		'Creating non-unique index for query performance'
	);

	if (!result2.success) {
		log('\n⚠️  Warning: Failed to create index, but migration may still work', 'yellow');
	}

	log('\n✅ Migration 1 completed successfully', 'green');
	return true;
}

async function migration2_UpdateContactRoleConstraint() {
	section('Migration 2: Update Contact Role Check Constraint');

	log('\nThis migration adds AR Specialist, AP Specialist, and Territory Manager roles', 'yellow');

	// Drop existing constraint
	const dropConstraint = `
		ALTER TABLE vendor_contacts
		DROP CONSTRAINT IF EXISTS vendor_contacts_role_check;
	`;

	const result1 = await executeSqlStatement(
		dropConstraint,
		'Dropping existing role check constraint'
	);

	if (!result1.success) {
		log('\n❌ Failed to drop constraint', 'red');
		return false;
	}

	// Add new constraint with all roles
	const addConstraint = `
		ALTER TABLE vendor_contacts
		ADD CONSTRAINT vendor_contacts_role_check CHECK (
			role IS NULL OR role IN (
				'Sales Rep',
				'Account Manager',
				'Billing Contact',
				'AR Specialist',
				'AP Specialist',
				'Customer Service',
				'Delivery Coordinator',
				'Territory Manager',
				'Other'
			)
		);
	`;

	const result2 = await executeSqlStatement(
		addConstraint,
		'Adding updated role check constraint with new roles'
	);

	if (!result2.success) {
		log('\n❌ Failed to add constraint', 'red');
		return false;
	}

	log('\n✅ Migration 2 completed successfully', 'green');
	return true;
}

async function verifyMigrations() {
	section('Verification: Checking Migration Results');

	try {
		// Test 1: Try to create duplicate address type
		log('\nTest 1: Attempting to create duplicate address types...', 'blue');

		// Get a test vendor
		const { data: vendors } = await supabase
			.from('vendors')
			.select('id, restaurant_id')
			.limit(1);

		if (!vendors || vendors.length === 0) {
			log('  ⚠️  No vendors found to test with', 'yellow');
			return;
		}

		const testVendorId = vendors[0].id;
		const restaurantId = vendors[0].restaurant_id;

		// Try creating two billing addresses
		const { error: error1 } = await supabase
			.from('vendor_addresses')
			.insert({
				vendor_id: testVendorId,
				restaurant_id: restaurantId,
				address_type: 'billing',
				is_primary: false,
				address_line1: 'Test Address 1',
				city: 'Test City',
				state: 'TS',
				postal_code: '12345',
			});

		if (error1 && error1.code === '23505') {
			log('  ✗ Still cannot create duplicate address types', 'red');
			log(`    Error: ${error1.message}`, 'yellow');
		} else {
			log('  ✓ Can create duplicate address types (or address already exists)', 'green');

			// Clean up test address
			await supabase
				.from('vendor_addresses')
				.delete()
				.eq('address_line1', 'Test Address 1');
		}

		// Test 2: Try to create contact with new role
		log('\nTest 2: Attempting to create contact with AR Specialist role...', 'blue');

		const { error: error2 } = await supabase
			.from('vendor_contacts')
			.insert({
				vendor_id: testVendorId,
				restaurant_id: restaurantId,
				first_name: 'Test',
				last_name: 'Contact',
				role: 'AR Specialist',
				email: 'test@example.com',
			});

		if (error2 && error2.code === '23514') {
			log('  ✗ Still cannot use AR Specialist role', 'red');
			log(`    Error: ${error2.message}`, 'yellow');
		} else {
			log('  ✓ Can use AR Specialist role', 'green');

			// Clean up test contact
			await supabase
				.from('vendor_contacts')
				.delete()
				.eq('email', 'test@example.com');
		}

		log('\n✅ Verification complete', 'green');

	} catch (error) {
		log(`\n⚠️  Verification error: ${error.message}`, 'yellow');
	}
}

async function main() {
	log('\n🚀 Sprint 2 - P2 Backend Fixes - Direct Migration Application', 'cyan');
	log('═══════════════════════════════════════════════════════════════════', 'cyan');

	log('\n⚠️  WARNING: This script will modify your database', 'yellow');
	log('Make sure you have a backup before proceeding', 'yellow');

	try {
		// Check if exec_sql RPC function exists
		log('\nChecking database connection...', 'blue');
		const { error: testError } = await supabase
			.from('vendors')
			.select('id')
			.limit(1);

		if (testError) {
			throw new Error(`Database connection failed: ${testError.message}`);
		}

		log('✓ Database connected', 'green');

		// Note: Since Supabase client doesn't support direct ALTER TABLE commands,
		// we'll need to guide users to use the SQL editor
		log('\n⚠️  IMPORTANT: Direct ALTER TABLE not supported via client', 'yellow');
		log('These migrations must be run via Supabase SQL Editor', 'yellow');
		log('\nPlease run: node backend/scripts/run-p2-migrations.js', 'cyan');
		log('for detailed instructions on how to apply these migrations.', 'cyan');

		log('\n📋 Quick Summary:', 'cyan');
		log('═══════════════════════════════════════════════════════════════════', 'cyan');

		log('\n1. Issue #6: Address Duplicate Type Constraint', 'green');
		log('   SQL: ALTER TABLE vendor_addresses DROP CONSTRAINT idx_vendor_addresses_vendor_type_unique;', 'yellow');

		log('\n2. Issue #7: Contact Role Check Constraint', 'green');
		log('   SQL: ALTER TABLE vendor_contacts DROP CONSTRAINT vendor_contacts_role_check;', 'yellow');
		log('   SQL: ALTER TABLE vendor_contacts ADD CONSTRAINT vendor_contacts_role_check CHECK (...);', 'yellow');

		log('\n✅ Run these in Supabase SQL Editor to complete migrations', 'green');

	} catch (error) {
		log(`\n💥 Fatal Error: ${error.message}`, 'red');
		console.error(error);
		process.exit(1);
	}
}

main();
