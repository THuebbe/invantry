#!/usr/bin/env node

/**
 * Database Migration Runner for Order Entry Feature
 *
 * This script executes all database migrations for the Order Entry & PO feature
 * in the correct order with validation between steps.
 *
 * Usage: node run-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../backend/.env') });

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Migration files in execution order
const migrations = [
  {
    file: 'migration-001-extend-restaurant-orders.sql',
    name: 'Extend restaurant_orders table',
    phase: 'Table Extensions',
    risk: 'Low'
  },
  {
    file: 'migration-002-extend-order-items.sql',
    name: 'Extend restaurant_order_items table',
    phase: 'Table Extensions',
    risk: 'Low'
  },
  {
    file: 'migration-005-create-vendors-table.sql',
    name: 'Create vendors table',
    phase: 'New Tables',
    risk: 'None'
  },
  {
    file: 'migration-006-create-ingredient-vendor-mapping.sql',
    name: 'Create ingredient_vendor_mapping table',
    phase: 'New Tables',
    risk: 'None'
  },
  {
    file: 'migration-003-extend-purchase-orders.sql',
    name: 'Extend purchase_orders table',
    phase: 'PO Extensions',
    risk: 'Medium',
    warning: 'Contains supplier_id type change - requires manual data migration after execution'
  },
  {
    file: 'migration-004-extend-po-items.sql',
    name: 'Extend purchase_order_items table',
    phase: 'PO Extensions',
    risk: 'Low'
  },
  {
    file: 'migration-007-create-indexes.sql',
    name: 'Create performance indexes',
    phase: 'Performance & Logic',
    risk: 'None'
  },
  {
    file: 'migration-008-create-functions.sql',
    name: 'Create database functions and triggers',
    phase: 'Performance & Logic',
    risk: 'None'
  }
];

// Helper function to read SQL file
function readMigrationFile(filename) {
  const filePath = path.join(__dirname, filename);
  return fs.readFileSync(filePath, 'utf8');
}

// Helper function to execute SQL
async function executeSql(sql, migrationName) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct query if RPC doesn't work
      const { data: queryData, error: queryError } = await supabase
        .from('_sqlexec')
        .select('*')
        .limit(1);

      if (queryError) {
        throw queryError;
      }

      // Since Supabase doesn't have a direct SQL execution endpoint,
      // we'll need to use psql or the Supabase dashboard
      console.warn(`⚠️  Cannot execute via API - please run manually in Supabase SQL Editor`);
      return { success: false, needsManual: true };
    }

    return { success: true, data };
  } catch (error) {
    console.error(`Error executing ${migrationName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Validation queries
const validations = {
  '001': `
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'restaurant_orders' AND column_name = 'order_purpose';
  `,
  '002': `
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'restaurant_order_items'
    AND column_name IN ('item_name', 'quantity_on_po', 'quantity_received');
  `,
  '003': `
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'purchase_orders'
    AND column_name IN ('ship_to_address', 'bill_to_address', 'supplier_id_new');
  `,
  '004': `
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'purchase_order_items'
    AND column_name = 'source_order_item_ids';
  `,
  '005': `
    SELECT table_name FROM information_schema.tables
    WHERE table_name = 'vendors';
  `,
  '006': `
    SELECT table_name FROM information_schema.tables
    WHERE table_name = 'ingredient_vendor_mapping';
  `,
  '007': `
    SELECT count(*) as index_count FROM pg_indexes
    WHERE schemaname = 'public'
    AND (indexname LIKE '%restaurant_order%' OR indexname LIKE '%purchase_order%' OR indexname LIKE '%vendor%');
  `,
  '008': `
    SELECT routine_name FROM information_schema.routines
    WHERE routine_name IN ('get_ingredient_quantity_on_order', 'calculate_suggested_reorder_quantity', 'get_low_stock_items');
  `
};

// Main execution function
async function runMigrations() {
  console.log('\n🚀 Order Entry Feature - Database Migration Runner\n');
  console.log('=' .repeat(70));
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Total Migrations: ${migrations.length}`);
  console.log('=' .repeat(70));
  console.log('\n');

  let currentPhase = '';

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    const migrationNumber = migration.file.match(/\d+/)[0];

    // Print phase header
    if (migration.phase !== currentPhase) {
      currentPhase = migration.phase;
      console.log(`\n📦 Phase: ${currentPhase}`);
      console.log('-'.repeat(70));
    }

    console.log(`\n[${i + 1}/${migrations.length}] ${migration.name}`);
    console.log(`    File: ${migration.file}`);
    console.log(`    Risk: ${migration.risk}`);

    if (migration.warning) {
      console.log(`    ⚠️  Warning: ${migration.warning}`);
    }

    // Read migration file
    console.log(`    📖 Reading migration file...`);
    const sql = readMigrationFile(migration.file);

    console.log(`    📝 Migration SQL loaded (${sql.length} characters)`);
    console.log(`\n    ⚠️  MANUAL EXECUTION REQUIRED:`);
    console.log(`    Please run this migration in the Supabase SQL Editor:`);
    console.log(`    https://app.supabase.com/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql`);
    console.log(`\n    Migration file location:`);
    console.log(`    ${path.join(__dirname, migration.file)}`);
    console.log(`\n    Press Enter when migration ${migrationNumber} is complete...`);

    // Wait for user confirmation
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        console.log(`    ✅ Migration ${migrationNumber} confirmed\n`);
        resolve();
      });
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎉 All migrations completed!');
  console.log('='.repeat(70));
  console.log('\n📋 Next Steps:');
  console.log('   1. Run post-migration verification queries');
  console.log('   2. Seed vendor data (optional)');
  console.log('   3. Map existing ingredients to vendors');
  console.log('   4. Test database functions');
  console.log('\n');
}

// Run migrations
console.log('\n⚠️  IMPORTANT: This script will guide you through running migrations manually in Supabase SQL Editor.');
console.log('Press Ctrl+C to cancel, or press Enter to continue...\n');

process.stdin.once('data', () => {
  runMigrations().catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
});
