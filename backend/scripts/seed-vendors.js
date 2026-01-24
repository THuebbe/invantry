#!/usr/bin/env node
/**
 * Vendor ERP Seed Data Script
 *
 * This script seeds comprehensive test data for the Vendor ERP module including:
 * - 10 vendors with varied profiles (9 active, 1 inactive)
 * - Vendor addresses (billing, shipping, remittance)
 * - Vendor contacts with roles
 * - Vendor payment information
 * - Vendor scorecards
 * - Vendor documents
 * - Ingredient-vendor mappings
 *
 * Usage:
 *   node backend/scripts/seed-vendors.js
 *
 * Options:
 *   --clean : Delete existing seed data before inserting
 *
 * Restaurant ID: 1e9c773e-913f-4a9b-b812-5ee2b5a4b15a
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const RESTAURANT_ID = '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a';

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function error(message) {
  console.error(`[${new Date().toISOString()}] ❌ ${message}`);
}

function success(message) {
  console.log(`[${new Date().toISOString()}] ✅ ${message}`);
}

function dateOffset(monthsAgo, daysAgo = 0) {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

// ============================================
// CLEANUP FUNCTIONS
// ============================================

async function cleanExistingSeedData() {
  log('Cleaning existing seed data...');

  // Get vendor IDs for seed vendors
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id')
    .like('vendor_code', 'SEED-%');

  if (!vendors || vendors.length === 0) {
    log('No existing seed data found');
    return;
  }

  const vendorIds = vendors.map(v => v.id);
  log(`Found ${vendorIds.length} seed vendors to clean`);

  // Delete in order (child tables first)
  const tables = [
    'ingredient_vendor_mapping',
    'vendor_documents',
    'vendor_scorecards',
    'vendor_payment_info',
    'vendor_contacts',
    'vendor_addresses'
  ];

  for (const table of tables) {
    const { error: deleteError, count } = await supabase
      .from(table)
      .delete()
      .in('vendor_id', vendorIds);

    if (deleteError) {
      error(`Failed to clean ${table}: ${deleteError.message}`);
    } else {
      log(`Cleaned ${table}`);
    }
  }

  // Finally delete vendors
  const { error: vendorError } = await supabase
    .from('vendors')
    .delete()
    .in('id', vendorIds);

  if (vendorError) {
    error(`Failed to clean vendors: ${vendorError.message}`);
  } else {
    success('Cleaned all seed vendors');
  }
}

// ============================================
// VENDOR DATA
// ============================================

const vendorsData = [
  {
    vendor_code: 'SEED-SYS001',
    name: 'Sysco Foods',
    legal_name: 'Sysco Corporation',
    trade_name: 'Sysco',
    contact_name: 'Jennifer Martinez',
    email: 'jmartinez@sysco.com',
    phone: '1-800-796-7676',
    address: '1390 Enclave Parkway, Houston, TX 77077',
    payment_terms: 'Net 30',
    notes: 'Primary food distributor - excellent service and pricing',
    is_active: true,
    created_months_ago: 6,
    updated_days_ago: 1
  },
  {
    vendor_code: 'SEED-USF001',
    name: 'US Foods',
    legal_name: 'US Foods, Inc.',
    trade_name: 'US Foods',
    contact_name: 'Michael Chen',
    email: 'mchen@usfoods.com',
    phone: '1-800-937-9000',
    address: '9399 W Higgins Rd, Rosemont, IL 60018',
    payment_terms: 'Net 30',
    notes: 'Secondary distributor - competitive pricing on produce',
    is_active: true,
    created_months_ago: 5,
    updated_days_ago: 2
  },
  {
    vendor_code: 'SEED-LFF001',
    name: 'Local Farm Fresh',
    legal_name: 'Local Farm Fresh LLC',
    trade_name: 'Farm Fresh',
    contact_name: 'Sarah Johnson',
    email: 'sarah@farmfresh.com',
    phone: '555-0123',
    address: '1234 Harvest Lane, Pleasantville, CA 90210',
    payment_terms: '2/10 Net 30',
    notes: 'Organic produce supplier - seasonal availability',
    is_active: true,
    created_months_ago: 4,
    updated_days_ago: 3
  },
  {
    vendor_code: 'SEED-HSC001',
    name: 'Harbor Seafood Co',
    legal_name: 'Harbor Seafood Company Inc.',
    trade_name: 'Harbor Seafood',
    contact_name: 'David Lee',
    email: 'dlee@harborseafood.com',
    phone: '555-0456',
    address: '789 Marina Blvd, San Diego, CA 92101',
    payment_terms: 'Net 30',
    notes: 'Premium seafood - daily fresh deliveries',
    is_active: true,
    created_months_ago: 8,
    updated_days_ago: 1
  },
  {
    vendor_code: 'SEED-PMI001',
    name: 'Prime Meats Inc',
    legal_name: 'Prime Meats Incorporated',
    trade_name: 'Prime Meats',
    contact_name: 'Robert Williams',
    email: 'rwilliams@primemeats.com',
    phone: '555-0789',
    address: '567 Butcher Way, Chicago, IL 60601',
    payment_terms: 'Net 45',
    notes: 'Quality beef and pork - occasional stock issues',
    is_active: true,
    created_months_ago: 7,
    updated_days_ago: 4
  },
  {
    vendor_code: 'SEED-ABS001',
    name: 'Artisan Bakery Supply',
    legal_name: 'Artisan Bakery Supply Co.',
    trade_name: 'Artisan Bakery',
    contact_name: 'Emily Davis',
    email: 'edavis@artisanbakery.com',
    phone: '555-1234',
    address: '890 Flour Street, Portland, OR 97201',
    payment_terms: 'Net 60',
    notes: 'Specialty breads and pastries - delivery timing inconsistent',
    is_active: true,
    created_months_ago: 3,
    updated_days_ago: 5
  },
  {
    vendor_code: 'SEED-GST001',
    name: 'Global Spice Traders',
    legal_name: 'Global Spice Traders LLC',
    trade_name: 'Global Spice',
    contact_name: 'Priya Patel',
    email: 'ppatel@globalspice.com',
    phone: '555-5678',
    address: '234 Spice Market, New York, NY 10013',
    payment_terms: 'Net 30',
    notes: 'Extensive spice selection - excellent quality control',
    is_active: true,
    created_months_ago: 9,
    updated_days_ago: 2
  },
  {
    vendor_code: 'SEED-DDL001',
    name: 'Dairy Distributors LLC',
    legal_name: 'Dairy Distributors Limited Liability Company',
    trade_name: 'Dairy Dist.',
    contact_name: 'Thomas Anderson',
    email: 'tanderson@dairydist.com',
    phone: '555-9012',
    address: '456 Milk Road, Madison, WI 53703',
    payment_terms: 'Net 30',
    notes: 'Local dairy products - good pricing',
    is_active: true,
    created_months_ago: 6,
    updated_days_ago: 3
  },
  {
    vendor_code: 'SEED-RD001',
    name: 'Restaurant Depot',
    legal_name: 'Restaurant Depot Inc.',
    trade_name: 'Restaurant Depot',
    contact_name: 'James Wilson',
    email: 'jwilson@restaurantdepot.com',
    phone: '555-3456',
    address: '789 Warehouse Blvd, Los Angeles, CA 90001',
    payment_terms: 'Due on Receipt',
    notes: 'Emergency supplies - cash and carry only',
    is_active: true,
    created_months_ago: 2,
    updated_days_ago: 7
  },
  {
    vendor_code: 'SEED-CWS001',
    name: 'ChefWare Supply',
    legal_name: 'ChefWare Supply Corporation',
    trade_name: 'ChefWare',
    contact_name: 'Lisa Thompson',
    email: 'lthompson@chefware.com',
    phone: '555-7890',
    address: '123 Equipment Lane, Atlanta, GA 30301',
    payment_terms: 'Net 60',
    notes: 'Previously used for smallwares - switched vendors due to slow delivery',
    is_active: false,
    created_months_ago: 12,
    updated_days_ago: 60
  }
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedVendors() {
  log('Starting vendor seed process...\n');

  if (shouldClean) {
    await cleanExistingSeedData();
    log('');
  }

  // Step 1: Insert vendors
  log('Step 1: Inserting vendors...');
  const insertedVendors = [];

  for (const vendorData of vendorsData) {
    const { created_months_ago, updated_days_ago, ...vendorFields } = vendorData;

    const { data, error: insertError } = await supabase
      .from('vendors')
      .insert({
        restaurant_id: RESTAURANT_ID,
        ...vendorFields,
        created_at: dateOffset(created_months_ago, 0),
        updated_at: dateOffset(0, updated_days_ago)
      })
      .select()
      .single();

    if (insertError) {
      error(`Failed to insert ${vendorData.name}: ${insertError.message}`);
      continue;
    }

    insertedVendors.push(data);
    success(`Inserted vendor: ${data.name} (${data.vendor_code})`);
  }

  log(`\n✅ Inserted ${insertedVendors.length} vendors\n`);

  // TODO: Add addresses, contacts, payment info, scorecards, documents, and mappings
  // For now, this script creates the vendors successfully

  return insertedVendors;
}

// ============================================
// EXECUTE
// ============================================

async function main() {
  try {
    const vendors = await seedVendors();

    log('\n========================================');
    log('SEED SUMMARY');
    log('========================================');
    log(`Restaurant ID: ${RESTAURANT_ID}`);
    log(`Vendors created: ${vendors.length}`);
    log(`Active vendors: ${vendors.filter(v => v.is_active).length}`);
    log(`Inactive vendors: ${vendors.filter(v => !v.is_active).length}`);
    log('========================================\n');

    success('Seed process completed successfully!');
    process.exit(0);
  } catch (err) {
    error(`Seed process failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
