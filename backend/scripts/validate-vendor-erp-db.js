import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation results tracker
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logPass(test, message) {
  results.passed.push({ test, message });
  console.log(`✓ PASS: ${test} - ${message}`);
}

function logFail(test, message, details) {
  results.failed.push({ test, message, details });
  console.log(`✗ FAIL: ${test} - ${message}`);
  if (details) console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
}

function logWarning(test, message) {
  results.warnings.push({ test, message });
  console.log(`⚠ WARNING: ${test} - ${message}`);
}

async function runQuery(sql, description) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error running query (${description}):`, error.message);
    return null;
  }
}

async function validate() {
  console.log('============================================================================');
  console.log('VENDOR ERP DATABASE VALIDATION');
  console.log('============================================================================\n');

  // =========================================================================
  // 1. TABLE EXISTENCE VERIFICATION
  // =========================================================================
  console.log('=== 1. TABLE EXISTENCE VERIFICATION ===\n');

  // Query using raw SQL via RPC
  const tableCheckSql = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'payment_terms',
      'vendor_addresses',
      'vendor_contacts',
      'vendor_payment_info',
      'vendor_purchasing_data',
      'vendor_documents',
      'vendor_scorecards'
    )
    ORDER BY table_name;
  `;

  const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', { query: tableCheckSql });

  if (tablesError) {
    logFail('Table Existence', 'Error querying tables', tablesError);
  } else {
    const tableNames = tables.map(t => t.table_name).sort();
    console.log('Found tables:', tableNames);

    if (tableNames.length === 7) {
      logPass('Table Existence', 'All 7 vendor ERP tables exist');
    } else {
      logFail('Table Existence', `Expected 7 tables, found ${tableNames.length}`, tableNames);
    }
  }

  // =========================================================================
  // 2. VENDORS TABLE ENHANCEMENT VERIFICATION
  // =========================================================================
  console.log('\n=== 2. VENDORS TABLE ENHANCEMENT VERIFICATION ===\n');

  const { data: vendorColumns, error: vendorColError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'vendors')
    .in('column_name', [
      'vendor_code',
      'legal_name',
      'trade_name',
      'tax_id',
      'payment_term_id',
      'credit_limit',
      'currency',
      'is_active',
      'onboarding_date',
      'inactive_date'
    ]);

  if (vendorColError) {
    logFail('Vendors Columns', 'Error querying vendors columns', vendorColError);
  } else {
    console.log('Vendors table new columns:', vendorColumns.map(c => c.column_name).sort());

    if (vendorColumns.length === 10) {
      logPass('Vendors Columns', 'All 10 new/enhanced columns exist in vendors table');
    } else {
      logFail('Vendors Columns', `Expected 10 columns, found ${vendorColumns.length}`, vendorColumns);
    }
  }

  // =========================================================================
  // 3. INGREDIENT_VENDOR_MAPPING ENHANCEMENT VERIFICATION
  // =========================================================================
  console.log('\n=== 3. INGREDIENT_VENDOR_MAPPING ENHANCEMENT VERIFICATION ===\n');

  const { data: ivmColumns, error: ivmColError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'ingredient_vendor_mapping')
    .in('column_name', [
      'restaurant_id',
      'vendor_item_description',
      'currency',
      'package_size',
      'package_unit',
      'case_quantity',
      'last_price_update',
      'price_effective_date',
      'price_expiration_date',
      'is_active',
      'discontinue_date'
    ]);

  if (ivmColError) {
    logFail('IVM Columns', 'Error querying ingredient_vendor_mapping columns', ivmColError);
  } else {
    console.log('IVM new columns:', ivmColumns.map(c => c.column_name).sort());

    if (ivmColumns.length === 11) {
      logPass('IVM Columns', 'All 11 new columns exist in ingredient_vendor_mapping');
    } else {
      logFail('IVM Columns', `Expected 11 columns, found ${ivmColumns.length}`, ivmColumns);
    }
  }

  // =========================================================================
  // 4. DATA MIGRATION VERIFICATION
  // =========================================================================
  console.log('\n=== 4. DATA MIGRATION VERIFICATION ===\n');

  // A. Check restaurant_id population
  const { data: ivmData, error: ivmDataError } = await supabase
    .from('ingredient_vendor_mapping')
    .select('id, restaurant_id', { count: 'exact' });

  if (!ivmDataError && ivmData) {
    const totalRecords = ivmData.length;
    const withRestaurantId = ivmData.filter(r => r.restaurant_id !== null).length;
    const nullCount = totalRecords - withRestaurantId;

    console.log(`Total IVM records: ${totalRecords}`);
    console.log(`With restaurant_id: ${withRestaurantId}`);
    console.log(`NULL restaurant_id: ${nullCount}`);

    if (nullCount === 0 && totalRecords > 0) {
      logPass('IVM restaurant_id', `All ${totalRecords} records have restaurant_id populated`);
    } else if (totalRecords === 0) {
      logWarning('IVM restaurant_id', 'No records in ingredient_vendor_mapping table');
    } else {
      logFail('IVM restaurant_id', `${nullCount} records have NULL restaurant_id`, { totalRecords, nullCount });
    }
  }

  // B. Check vendor addresses
  const { data: addresses, error: addrError } = await supabase
    .from('vendor_addresses')
    .select('address_type', { count: 'exact' });

  if (!addrError && addresses) {
    const addressCounts = addresses.reduce((acc, addr) => {
      acc[addr.address_type] = (acc[addr.address_type] || 0) + 1;
      return acc;
    }, {});

    console.log('\nVendor addresses by type:', addressCounts);

    if (addresses.length > 0) {
      logPass('Vendor Addresses', `${addresses.length} vendor addresses exist`);
    } else {
      logWarning('Vendor Addresses', 'No vendor addresses in database');
    }
  }

  // C. Check vendor contacts
  const { data: contacts, error: contactsError } = await supabase
    .from('vendor_contacts')
    .select('is_primary', { count: 'exact' });

  if (!contactsError && contacts) {
    const primaryCount = contacts.filter(c => c.is_primary).length;
    const secondaryCount = contacts.length - primaryCount;

    console.log(`\nVendor contacts - Primary: ${primaryCount}, Secondary: ${secondaryCount}`);

    if (contacts.length > 0) {
      logPass('Vendor Contacts', `${contacts.length} vendor contacts exist`);
    } else {
      logWarning('Vendor Contacts', 'No vendor contacts in database');
    }
  }

  // D. Check payment terms
  const { data: paymentTerms, error: ptError } = await supabase
    .from('payment_terms')
    .select('*')
    .order('days');

  if (!ptError && paymentTerms) {
    console.log('\nPayment Terms:');
    paymentTerms.forEach(pt => {
      console.log(`  - ${pt.name} (${pt.days} days)${pt.discount_percent ? ` - ${pt.discount_percent}% discount` : ''}`);
    });

    if (paymentTerms.length === 8) {
      logPass('Payment Terms', 'All 8 standard payment terms seeded');
    } else {
      logWarning('Payment Terms', `Expected 8 payment terms, found ${paymentTerms.length}`);
    }
  }

  // =========================================================================
  // 5. FOREIGN KEYS VERIFICATION
  // =========================================================================
  console.log('\n=== 5. FOREIGN KEYS VERIFICATION ===\n');

  const { data: fks, error: fkError } = await supabase
    .from('information_schema.table_constraints')
    .select(`
      table_name,
      constraint_name,
      constraint_type
    `)
    .eq('constraint_type', 'FOREIGN KEY')
    .in('table_name', [
      'vendors',
      'vendor_addresses',
      'vendor_contacts',
      'vendor_payment_info',
      'vendor_purchasing_data',
      'vendor_documents',
      'vendor_scorecards',
      'ingredient_vendor_mapping'
    ]);

  if (!fkError && fks) {
    const fkByTable = fks.reduce((acc, fk) => {
      if (!acc[fk.table_name]) acc[fk.table_name] = [];
      acc[fk.table_name].push(fk.constraint_name);
      return acc;
    }, {});

    console.log('Foreign keys by table:');
    Object.entries(fkByTable).forEach(([table, constraints]) => {
      console.log(`  ${table}: ${constraints.length} FK(s)`);
    });

    if (fks.length >= 15) {
      logPass('Foreign Keys', `${fks.length} foreign key constraints defined`);
    } else {
      logWarning('Foreign Keys', `Only ${fks.length} foreign keys found, expected 15+`);
    }
  }

  // =========================================================================
  // 6. TRIGGERS VERIFICATION
  // =========================================================================
  console.log('\n=== 6. TRIGGERS VERIFICATION ===\n');

  const { data: triggers, error: triggerError } = await supabase
    .from('information_schema.triggers')
    .select('trigger_name, event_object_table, action_timing, event_manipulation')
    .in('event_object_table', [
      'vendors',
      'vendor_addresses',
      'vendor_contacts',
      'vendor_payment_info',
      'vendor_purchasing_data',
      'vendor_documents',
      'vendor_scorecards',
      'ingredient_vendor_mapping'
    ]);

  if (!triggerError && triggers) {
    console.log(`Found ${triggers.length} triggers:`);
    const triggersByTable = triggers.reduce((acc, t) => {
      if (!acc[t.event_object_table]) acc[t.event_object_table] = [];
      acc[t.event_object_table].push(t.trigger_name);
      return acc;
    }, {});

    Object.entries(triggersByTable).forEach(([table, triggerNames]) => {
      console.log(`  ${table}: ${triggerNames.join(', ')}`);
    });

    if (triggers.length >= 8) {
      logPass('Triggers', `${triggers.length} triggers configured`);
    } else {
      logWarning('Triggers', `Only ${triggers.length} triggers found, expected 8+`);
    }
  }

  // =========================================================================
  // 7. MULTI-TENANCY VERIFICATION
  // =========================================================================
  console.log('\n=== 7. MULTI-TENANCY VERIFICATION ===\n');

  const { data: restaurantIdCols, error: ridError } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, is_nullable')
    .in('table_name', [
      'vendors',
      'vendor_addresses',
      'vendor_contacts',
      'vendor_payment_info',
      'vendor_purchasing_data',
      'vendor_documents',
      'vendor_scorecards',
      'ingredient_vendor_mapping'
    ])
    .eq('column_name', 'restaurant_id');

  if (!ridError && restaurantIdCols) {
    console.log('Tables with restaurant_id:');
    restaurantIdCols.forEach(col => {
      console.log(`  - ${col.table_name} (nullable: ${col.is_nullable})`);
    });

    if (restaurantIdCols.length === 8) {
      logPass('Multi-Tenancy', 'All 8 vendor tables have restaurant_id column');
    } else {
      logFail('Multi-Tenancy', `Expected 8 tables with restaurant_id, found ${restaurantIdCols.length}`, restaurantIdCols);
    }
  }

  // =========================================================================
  // 8. INDEXES VERIFICATION
  // =========================================================================
  console.log('\n=== 8. INDEXES VERIFICATION ===\n');

  const { data: indexes, error: indexError } = await supabase
    .from('pg_indexes')
    .select('tablename, indexname')
    .in('tablename', [
      'vendors',
      'vendor_addresses',
      'vendor_contacts',
      'vendor_payment_info',
      'vendor_purchasing_data',
      'vendor_documents',
      'vendor_scorecards',
      'ingredient_vendor_mapping'
    ])
    .eq('schemaname', 'public');

  if (!indexError && indexes) {
    const indexByTable = indexes.reduce((acc, idx) => {
      if (!acc[idx.tablename]) acc[idx.tablename] = [];
      acc[idx.tablename].push(idx.indexname);
      return acc;
    }, {});

    console.log('Indexes by table:');
    Object.entries(indexByTable).forEach(([table, idxNames]) => {
      console.log(`  ${table}: ${idxNames.length} index(es)`);
    });

    if (indexes.length >= 20) {
      logPass('Indexes', `${indexes.length} performance indexes created`);
    } else {
      logWarning('Indexes', `Only ${indexes.length} indexes found, expected 20+`);
    }
  }

  // =========================================================================
  // 9. UNIQUE CONSTRAINTS VERIFICATION
  // =========================================================================
  console.log('\n=== 9. UNIQUE CONSTRAINTS VERIFICATION ===\n');

  const { data: uniqueConstraints, error: ucError } = await supabase
    .from('information_schema.table_constraints')
    .select('table_name, constraint_name')
    .eq('constraint_type', 'UNIQUE')
    .in('table_name', [
      'vendors',
      'vendor_addresses',
      'vendor_contacts',
      'vendor_payment_info',
      'vendor_purchasing_data',
      'vendor_documents',
      'vendor_scorecards',
      'ingredient_vendor_mapping',
      'payment_terms'
    ]);

  if (!ucError && uniqueConstraints) {
    console.log(`Found ${uniqueConstraints.length} unique constraints:`);
    uniqueConstraints.forEach(uc => {
      console.log(`  - ${uc.table_name}: ${uc.constraint_name}`);
    });

    if (uniqueConstraints.length >= 5) {
      logPass('Unique Constraints', `${uniqueConstraints.length} unique constraints defined`);
    } else {
      logWarning('Unique Constraints', `Only ${uniqueConstraints.length} unique constraints found`);
    }
  }

  // =========================================================================
  // 10. SAMPLE DATA VERIFICATION
  // =========================================================================
  console.log('\n=== 10. SAMPLE DATA VERIFICATION ===\n');

  const { data: sampleVendors, error: svError } = await supabase
    .from('vendors')
    .select('id, name, vendor_code, legal_name, is_active, restaurant_id')
    .limit(5);

  if (!svError && sampleVendors) {
    console.log('Sample vendors:');
    sampleVendors.forEach(v => {
      console.log(`  - ${v.name} (code: ${v.vendor_code || 'N/A'}, active: ${v.is_active})`);
    });
  }

  const { data: sampleIVM, error: sivmError } = await supabase
    .from('ingredient_vendor_mapping')
    .select('id, vendor_id, ingredient_id, restaurant_id, vendor_item_code, package_size, package_unit, case_quantity, price_per_unit, currency, is_active')
    .limit(5);

  if (!sivmError && sampleIVM) {
    console.log('\nSample ingredient_vendor_mapping:');
    sampleIVM.forEach(ivm => {
      console.log(`  - Vendor ${ivm.vendor_id}, Ingredient ${ivm.ingredient_id}: ${ivm.package_size} ${ivm.package_unit}, $${ivm.price_per_unit} ${ivm.currency}`);
    });
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n============================================================================');
  console.log('VALIDATION SUMMARY');
  console.log('============================================================================\n');

  console.log(`✓ PASSED: ${results.passed.length} tests`);
  console.log(`✗ FAILED: ${results.failed.length} tests`);
  console.log(`⚠ WARNINGS: ${results.warnings.length} tests`);

  if (results.failed.length > 0) {
    console.log('\nFAILURES:');
    results.failed.forEach(f => {
      console.log(`  ✗ ${f.test}: ${f.message}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\nWARNINGS:');
    results.warnings.forEach(w => {
      console.log(`  ⚠ ${w.test}: ${w.message}`);
    });
  }

  console.log('\n============================================================================');

  if (results.failed.length === 0) {
    console.log('✓ DATABASE VALIDATION PASSED - Ready for service layer testing');
    return 0;
  } else {
    console.log('✗ DATABASE VALIDATION FAILED - Issues must be fixed before proceeding');
    return 1;
  }
}

// Run validation
validate()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Validation script error:', error);
    process.exit(1);
  });
