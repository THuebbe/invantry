#!/usr/bin/env node

/**
 * Sprint 2 - P2 Backend Fixes - Migration Runner
 *
 * This script executes SQL migrations to fix database constraints:
 * 1. Remove unique constraint on vendor_addresses (vendor_id, address_type)
 * 2. Update vendor_contacts role check constraint to include new roles
 *
 * Run with: node backend/scripts/run-p2-migrations.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function executeMigration(supabase, migrationFile, description) {
	section(`Migration: ${path.basename(migrationFile)}`);
	log(description, 'blue');

	try {
		// Read migration file
		const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
		log(`\nReading: ${migrationPath}`, 'yellow');

		if (!fs.existsSync(migrationPath)) {
			throw new Error(`Migration file not found: ${migrationPath}`);
		}

		const sql = fs.readFileSync(migrationPath, 'utf8');

		// Execute SQL
		log('Executing SQL...', 'blue');
		const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

		if (error) {
			// Try direct execution if RPC doesn't work
			log('RPC failed, attempting direct execution...', 'yellow');
			const result = await executeSQLDirect(sql);
			if (result.error) {
				throw result.error;
			}
		}

		log('✅ Migration executed successfully', 'green');
		return { success: true };

	} catch (error) {
		log(`❌ Migration failed: ${error.message}`, 'red');
		console.error(error);
		return { success: false, error };
	}
}

async function executeSQLDirect(sql) {
	// Since Supabase client doesn't support raw SQL execution directly,
	// we need to guide the user to run these migrations manually
	return {
		error: new Error('Direct SQL execution not supported. Please run migrations via Supabase SQL Editor.')
	};
}

async function main() {
	log('\n🚀 Sprint 2 - P2 Backend Fixes - Migration Runner', 'cyan');
	log('═══════════════════════════════════════════════════════════════', 'cyan');

	// Check environment variables
	const supabaseUrl = process.env.SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		log('\n❌ Error: Missing environment variables', 'red');
		log('Required: SUPABASE_URL and SUPABASE_SERVICE_KEY', 'yellow');
		process.exit(1);
	}

	log(`\nSupabase URL: ${supabaseUrl}`, 'yellow');

	// Create Supabase client
	const supabase = createClient(supabaseUrl, supabaseKey);

	log('\n⚠️  IMPORTANT: Database Migrations Required', 'yellow');
	log('═══════════════════════════════════════════════════════════════', 'yellow');
	log('\nThe following migrations need to be run via Supabase SQL Editor:', 'yellow');
	log('\n1. Go to your Supabase project dashboard', 'cyan');
	log('2. Navigate to SQL Editor', 'cyan');
	log('3. Run each migration file below in order:', 'cyan');

	const migrations = [
		{
			file: '20260115_fix_issue_6_address_duplicate_constraint.sql',
			description: 'Issue #6: Remove duplicate address type constraint',
			location: path.join(__dirname, '..', 'migrations', '20260115_fix_issue_6_address_duplicate_constraint.sql')
		},
		{
			file: '20260115_fix_issue_7_contact_role_constraint.sql',
			description: 'Issue #7: Update contact role check constraint',
			location: path.join(__dirname, '..', 'migrations', '20260115_fix_issue_7_contact_role_constraint.sql')
		}
	];

	log('\n' + '-'.repeat(80), 'blue');

	migrations.forEach((migration, index) => {
		log(`\n${index + 1}. ${migration.file}`, 'green');
		log(`   ${migration.description}`, 'yellow');
		log(`   Location: ${migration.location}`, 'cyan');
	});

	log('\n' + '-'.repeat(80), 'blue');

	log('\n📋 Migration Instructions:', 'cyan');
	log('═══════════════════════════════════════════════════════════════', 'cyan');

	log('\nOption 1: Supabase Dashboard (Recommended)', 'green');
	log('1. Open Supabase Dashboard: https://supabase.com/dashboard', 'yellow');
	log('2. Select your project', 'yellow');
	log('3. Go to SQL Editor (left sidebar)', 'yellow');
	log('4. Click "New query"', 'yellow');
	log('5. Copy and paste the contents of each migration file', 'yellow');
	log('6. Click "Run" to execute', 'yellow');
	log('7. Verify success messages appear', 'yellow');

	log('\nOption 2: psql Command Line', 'green');
	log('If you have direct database access:', 'yellow');
	migrations.forEach((migration) => {
		log(`  psql <connection-string> -f ${migration.location}`, 'cyan');
	});

	log('\n📝 After Running Migrations:', 'cyan');
	log('═══════════════════════════════════════════════════════════════', 'cyan');
	log('Run the verification script to confirm all fixes are working:', 'yellow');
	log('  node backend/scripts/verify-p2-fixes.js', 'cyan');

	log('\n✅ Migration files are ready to be executed', 'green');
	log('\nFiles location:', 'yellow');
	log(`  ${path.join(__dirname, '..', 'migrations')}`, 'cyan');
}

main().catch(error => {
	log(`\n💥 Fatal Error: ${error.message}`, 'red');
	console.error(error);
	process.exit(1);
});
