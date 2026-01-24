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

async function validate() {
  console.log('============================================================================');
  console.log('VENDOR ERP DATABASE VALIDATION');
  console.log('============================================================================\n');

  // =========================================================================
  // 1. TABLE EXISTENCE VERIFICATION
  // =========================================================================
  console.log('=== 1. TABLE EXISTENCE VERIFICATION ===\n');

  const tablesToCheck = [
    'payment_terms',
    'vendor_addresses',
    'vendor_contacts',
    'vendor_payment_info',
    'vendor_purchasing_data',
    'vendor_documents',
    'vendor_scorecards'
  ];

  const existingTables = [];
  for (const tableName of tablesToCheck) {
    const { error } = await supabase.from(tableName).select('id').limit(0);
    if (!error) {
      existingTables.push(tableName);
      console.log(`  ✓ ${tableName}`);
    } else {
      console.log(`  ✗ ${tableName} - ${error.message}`);
    }
  }

  if (existingTables.length === 7) {
    logPass('Table Existence', 'All 7 vendor ERP tables exist');
  } else {
    logFail('Table Existence', `Expected 7 tables, found ${existingTables.length}`, existingTables);
  }

  // =========================================================================
  // 2. VENDORS TABLE ENHANCEMENT VERIFICATION
  // =========================================================================
  console.log('\n=== 2. VENDORS TABLE ENHANCEMENT VERIFICATION ===\n');

  const { data: vendorSample, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .limit(1);

  if (!vendorError) {
    const columns = vendorSample && vendorSample.length > 0 ? Object.keys(vendorSample[0]) : [];
    console.log('Vendors table columns found:', columns.sort());

    // Check for migration 012 columns
    const migration012Columns = ['vendor_code', 'legal_name', 'trade_name'];
    const missingMigration012 = migration012Columns.filter(col => !columns.includes(col));

    // Check if payment_terms exists (legacy text field)
    const hasPaymentTermsText = columns.includes('payment_terms');

    if (missingMigration012.length === 0) {
      logPass('Vendors Columns', `Migration 012 complete: ${migration012Columns.join(', ')} columns added`);
    } else {
      logFail('Vendors Columns', `Migration 012 incomplete - Missing: ${missingMigration012.join(', ')}`, columns);
    }

    if (hasPaymentTermsText) {
      console.log('  Note: payment_terms is TEXT field (legacy), not FK to payment_terms table');
      logWarning('Payment Terms Field', 'vendors.payment_terms is TEXT, not a foreign key to payment_terms table');
    }
  } else {
    logFail('Vendors Columns', 'Error querying vendors table', vendorError);
  }

  // =========================================================================
  // 3. INGREDIENT_VENDOR_MAPPING ENHANCEMENT VERIFICATION
  // =========================================================================
  console.log('\n=== 3. INGREDIENT_VENDOR_MAPPING ENHANCEMENT VERIFICATION ===\n');

  const { data: ivmSample, error: ivmError } = await supabase
    .from('ingredient_vendor_mapping')
    .select('id, restaurant_id, vendor_item_description, currency, package_size, package_unit, case_quantity, last_price_update, price_effective_date, price_expiration_date, is_active, discontinue_date')
    .limit(1);

  if (!ivmError) {
    const columns = ivmSample && ivmSample.length > 0 ? Object.keys(ivmSample[0]) : [];
    console.log('IVM columns found:', columns);

    const requiredNewColumns = ['restaurant_id', 'currency', 'package_size', 'package_unit', 'case_quantity', 'is_active'];
    const missingColumns = requiredNewColumns.filter(col => !columns.includes(col));

    if (missingColumns.length === 0) {
      logPass('IVM Columns', 'All required enhanced columns exist in ingredient_vendor_mapping');
    } else {
      logFail('IVM Columns', `Missing columns: ${missingColumns.join(', ')}`, columns);
    }
  } else {
    logFail('IVM Columns', 'Error querying ingredient_vendor_mapping table', ivmError);
  }

  // =========================================================================
  // 4. DATA MIGRATION VERIFICATION
  // =========================================================================
  console.log('\n=== 4. DATA MIGRATION VERIFICATION ===\n');

  // A. Check restaurant_id population
  const { data: ivmData, error: ivmDataError } = await supabase
    .from('ingredient_vendor_mapping')
    .select('id, restaurant_id', { count: 'exact', head: false });

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
  const { data: addresses, error: addrError, count: addrCount } = await supabase
    .from('vendor_addresses')
    .select('id, address_type, is_primary', { count: 'exact', head: false });

  if (!addrError) {
    console.log(`\nTotal vendor addresses: ${addresses?.length || 0}`);

    if (addresses && addresses.length > 0) {
      const addressCounts = addresses.reduce((acc, addr) => {
        acc[addr.address_type] = (acc[addr.address_type] || 0) + 1;
        return acc;
      }, {});
      console.log('By type:', addressCounts);

      const primaryCount = addresses.filter(a => a.is_primary).length;
      console.log(`Primary addresses: ${primaryCount}`);

      logPass('Vendor Addresses', `${addresses.length} vendor addresses exist (${primaryCount} primary)`);
    } else {
      logWarning('Vendor Addresses', 'No vendor addresses migrated - vendors may need addresses added');
    }
  }

  // C. Check vendor contacts
  const { data: contacts, error: contactsError } = await supabase
    .from('vendor_contacts')
    .select('id, is_primary, contact_type', { count: 'exact', head: false });

  if (!contactsError) {
    console.log(`\nTotal vendor contacts: ${contacts?.length || 0}`);

    if (contacts && contacts.length > 0) {
      const primaryCount = contacts.filter(c => c.is_primary).length;
      const secondaryCount = contacts.length - primaryCount;

      console.log(`Primary contacts: ${primaryCount}, Secondary: ${secondaryCount}`);

      logPass('Vendor Contacts', `${contacts.length} vendor contacts exist (${primaryCount} primary)`);
    } else {
      logWarning('Vendor Contacts', 'No vendor contacts migrated');
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
    } else if (paymentTerms.length > 0) {
      logWarning('Payment Terms', `Found ${paymentTerms.length} payment terms (expected 8)`);
    } else {
      logFail('Payment Terms', 'No payment terms found');
    }
  }

  // E. Check vendor_payment_info
  const { data: paymentInfo, error: piError } = await supabase
    .from('vendor_payment_info')
    .select('id, vendor_id, payment_method', { count: 'exact', head: false });

  console.log(`\nVendor payment info records: ${paymentInfo?.length || 0}`);
  if (paymentInfo && paymentInfo.length > 0) {
    logPass('Vendor Payment Info', `${paymentInfo.length} payment info records exist`);
  } else {
    logWarning('Vendor Payment Info', 'No payment info records - can be added later');
  }

  // F. Check vendor_purchasing_data
  const { data: purchasingData, error: pdError } = await supabase
    .from('vendor_purchasing_data')
    .select('id, vendor_id', { count: 'exact', head: false });

  console.log(`Vendor purchasing data records: ${purchasingData?.length || 0}`);
  if (purchasingData && purchasingData.length > 0) {
    logPass('Vendor Purchasing Data', `${purchasingData.length} purchasing records exist`);
  } else {
    logWarning('Vendor Purchasing Data', 'No purchasing data - can be populated over time');
  }

  // G. Check vendor_documents
  const { data: documents, error: docError } = await supabase
    .from('vendor_documents')
    .select('id, vendor_id, document_type', { count: 'exact', head: false });

  console.log(`Vendor documents: ${documents?.length || 0}`);
  if (documents && documents.length > 0) {
    logPass('Vendor Documents', `${documents.length} document records exist`);
  } else {
    logWarning('Vendor Documents', 'No documents uploaded - can be added via UI');
  }

  // H. Check vendor_scorecards
  const { data: scorecards, error: scError } = await supabase
    .from('vendor_scorecards')
    .select('id, vendor_id, evaluation_period', { count: 'exact', head: false });

  console.log(`Vendor scorecards: ${scorecards?.length || 0}`);
  if (scorecards && scorecards.length > 0) {
    logPass('Vendor Scorecards', `${scorecards.length} scorecard records exist`);
  } else {
    logWarning('Vendor Scorecards', 'No scorecards - will be created through evaluation process');
  }

  // =========================================================================
  // 5. MULTI-TENANCY VERIFICATION
  // =========================================================================
  console.log('\n=== 5. MULTI-TENANCY VERIFICATION ===\n');

  const tablesWithRestaurantId = [];
  const tablesWithoutRestaurantId = [];

  // payment_terms is a lookup table shared across restaurants, so it should NOT have restaurant_id
  const tablesToCheckMultiTenancy = tablesToCheck.filter(t => t !== 'payment_terms');

  for (const tableName of [...tablesToCheckMultiTenancy, 'vendors', 'ingredient_vendor_mapping']) {
    const { data, error } = await supabase
      .from(tableName)
      .select('restaurant_id')
      .limit(1);

    if (!error) {
      tablesWithRestaurantId.push(tableName);
      console.log(`  ✓ ${tableName} has restaurant_id`);
    } else if (error.code === '42703') {
      tablesWithoutRestaurantId.push(tableName);
      console.log(`  ✗ ${tableName} MISSING restaurant_id`);
    }
  }

  // Verify payment_terms does NOT have restaurant_id (it's a shared lookup table)
  const { data: ptCheck, error: ptCheckError } = await supabase
    .from('payment_terms')
    .select('id, name')
    .limit(1);

  if (!ptCheckError) {
    console.log(`  ✓ payment_terms (shared lookup table - no restaurant_id needed)`);
  }

  if (tablesWithoutRestaurantId.length === 0) {
    logPass('Multi-Tenancy', `All ${tablesWithRestaurantId.length} vendor tables have restaurant_id (payment_terms excluded as shared lookup)`);
  } else {
    logFail('Multi-Tenancy', `${tablesWithoutRestaurantId.length} tables missing restaurant_id`, tablesWithoutRestaurantId);
  }

  // =========================================================================
  // 6. SAMPLE DATA VERIFICATION
  // =========================================================================
  console.log('\n=== 6. SAMPLE DATA VERIFICATION ===\n');

  const { data: sampleVendors, error: svError } = await supabase
    .from('vendors')
    .select('id, name, vendor_code, legal_name, trade_name, is_active, restaurant_id, payment_terms')
    .limit(5);

  if (!svError && sampleVendors) {
    console.log('Sample vendors:');
    sampleVendors.forEach(v => {
      console.log(`  - ${v.name}`);
      console.log(`    Code: ${v.vendor_code || 'N/A'}`);
      console.log(`    Legal Name: ${v.legal_name || 'N/A'}`);
      console.log(`    Trade Name: ${v.trade_name || 'N/A'}`);
      console.log(`    Active: ${v.is_active}`);
      console.log(`    Restaurant ID: ${v.restaurant_id}`);
      console.log(`    Payment Terms: ${v.payment_terms || 'N/A'}`);
    });
  }

  const { data: sampleIVM, error: sivmError } = await supabase
    .from('ingredient_vendor_mapping')
    .select('id, vendor_id, ingredient_id, restaurant_id, vendor_item_code, vendor_item_description, package_size, package_unit, case_quantity, price_per_unit, currency, is_active')
    .limit(5);

  if (!sivmError && sampleIVM) {
    console.log('\nSample ingredient_vendor_mapping:');
    sampleIVM.forEach(ivm => {
      console.log(`  - Vendor ${ivm.vendor_id}, Ingredient ${ivm.ingredient_id}`);
      console.log(`    Item Code: ${ivm.vendor_item_code || 'N/A'}`);
      console.log(`    Description: ${ivm.vendor_item_description || 'N/A'}`);
      console.log(`    Package: ${ivm.package_size} ${ivm.package_unit} (case qty: ${ivm.case_quantity || 'N/A'})`);
      console.log(`    Price: $${ivm.price_per_unit} ${ivm.currency || 'USD'}`);
      console.log(`    Active: ${ivm.is_active}`);
      console.log(`    Restaurant ID: ${ivm.restaurant_id}`);
    });
  }

  // =========================================================================
  // 7. RELATIONSHIP VERIFICATION
  // =========================================================================
  console.log('\n=== 7. RELATIONSHIP VERIFICATION ===\n');

  // Check vendor payment_terms field (TEXT field, not a relationship)
  const { data: vendorsWithPaymentTerms, error: vptError } = await supabase
    .from('vendors')
    .select('id, name, payment_terms')
    .not('payment_terms', 'is', null)
    .limit(3);

  if (!vptError && vendorsWithPaymentTerms && vendorsWithPaymentTerms.length > 0) {
    console.log('Vendors with payment terms (text field):');
    vendorsWithPaymentTerms.forEach(v => {
      console.log(`  - ${v.name}: ${v.payment_terms}`);
    });
    logPass('Vendor Payment Terms', `${vendorsWithPaymentTerms.length} vendors have payment terms text`);
  } else {
    logWarning('Vendor Payment Terms', 'No vendors with payment terms text field populated');
  }

  // Test vendor_addresses -> vendors relationship
  const { data: addressesWithVendors, error: avError } = await supabase
    .from('vendor_addresses')
    .select(`
      id,
      address_type,
      vendor:vendors(name)
    `)
    .limit(3);

  if (!avError && addressesWithVendors && addressesWithVendors.length > 0) {
    console.log('\nVendor addresses:');
    addressesWithVendors.forEach(a => {
      console.log(`  - ${a.address_type}: ${a.vendor?.name || 'Unknown vendor'}`);
    });
    logPass('Address-Vendor Relationship', 'Foreign key relationship working');
  } else {
    logWarning('Address-Vendor Relationship', 'No addresses to test relationship');
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
    console.log('\n✓✓✓ DATABASE VALIDATION PASSED ✓✓✓');
    console.log('\nStatus: READY FOR SERVICE LAYER TESTING');
    console.log('\nNext Steps:');
    console.log('  1. Service layer implementation is already complete');
    console.log('  2. API routes are already implemented');
    console.log('  3. Ready for integration testing');
    console.log('  4. Can proceed with frontend development');
    return 0;
  } else {
    console.log('\n✗✗✗ DATABASE VALIDATION FAILED ✗✗✗');
    console.log('\nStatus: ISSUES MUST BE FIXED BEFORE PROCEEDING');
    console.log('\nPlease review failures above and fix schema issues.');
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
