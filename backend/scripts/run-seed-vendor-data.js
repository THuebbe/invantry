import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function runSeed() {
  try {
    console.log('============================================================================');
    console.log('VENDOR ERP SEED DATA IMPORT');
    console.log('============================================================================\n');

    // Read SQL file
    const sqlPath = join(__dirname, 'seed-vendor-data.sql');
    console.log('Reading SQL file:', sqlPath);

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL file into individual statements
    // Remove comments and empty lines
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .filter(stmt => !stmt.startsWith('--'))
      .filter(stmt => !stmt.match(/^\/\*/));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement using Supabase client
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip verification queries for now - we'll run them separately
      if (statement.includes('UNION ALL')) {
        console.log(`Skipping verification query (will run separately)...`);
        continue;
      }

      console.log(`[${i + 1}/${statements.length}] Executing statement...`);

      try {
        // Use raw SQL execution if available
        // Note: Supabase doesn't directly support raw SQL execution via the client
        // We need to execute through individual table operations

        // For now, we'll log the statement type
        if (statement.includes('INSERT INTO vendors')) {
          console.log('  -> Inserting vendors...');
        } else if (statement.includes('INSERT INTO vendor_addresses')) {
          console.log('  -> Inserting vendor addresses...');
        } else if (statement.includes('INSERT INTO vendor_contacts')) {
          console.log('  -> Inserting vendor contacts...');
        } else if (statement.includes('INSERT INTO vendor_payment_info')) {
          console.log('  -> Inserting vendor payment info...');
        } else if (statement.includes('INSERT INTO vendor_scorecards')) {
          console.log('  -> Inserting vendor scorecards...');
        } else if (statement.includes('INSERT INTO vendor_documents')) {
          console.log('  -> Inserting vendor documents...');
        } else if (statement.includes('INSERT INTO ingredient_vendor_mapping')) {
          console.log('  -> Inserting ingredient-vendor mappings...');
        } else if (statement.includes('DELETE FROM')) {
          console.log('  -> Deleting existing seed data...');
        }

        // Execute via RPC if available, otherwise skip
        // Most Supabase instances don't allow direct SQL execution for security
        console.log('  ⚠ Note: Direct SQL execution not available. Please run SQL file manually in Supabase SQL Editor.');

        successCount++;
      } catch (error) {
        console.error(`  ✗ Error:`, error.message);
        errorCount++;
      }
    }

    console.log('\n============================================================================');
    console.log('EXECUTION SUMMARY');
    console.log('============================================================================\n');
    console.log(`Total statements: ${statements.length}`);
    console.log(`Processed: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    console.log('\n⚠ IMPORTANT: Supabase client does not support direct SQL execution.');
    console.log('\nTo run this seed data:');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the contents of seed-vendor-data.sql');
    console.log('4. Execute the SQL script');
    console.log('\nOR use the manual seeding approach below:\n');

    // Provide manual seeding option
    console.log('============================================================================');
    console.log('MANUAL SEEDING OPTION (Using Supabase Client)');
    console.log('============================================================================\n');

    console.log('Since direct SQL is not available, here\'s how to seed manually:');
    console.log('\n1. Run the SQL file in Supabase SQL Editor (recommended)');
    console.log('   - File: backend/scripts/seed-vendor-data.sql');
    console.log('   - This ensures all complex queries and relationships work correctly');
    console.log('\n2. After running, verify the data:');

    // Run verification queries
    console.log('\n============================================================================');
    console.log('VERIFICATION');
    console.log('============================================================================\n');

    await verifySeededData();

  } catch (error) {
    console.error('❌ Seed import failed:', error);
    process.exit(1);
  }
}

async function verifySeededData() {
  try {
    // Check vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, vendor_code')
      .like('vendor_code', 'SEED-%');

    if (vendorsError) {
      console.log('⚠ Could not verify vendors:', vendorsError.message);
    } else {
      console.log(`✓ Seed Vendors: ${vendors?.length || 0}`);
      if (vendors && vendors.length > 0) {
        console.log('  Sample vendors:');
        vendors.slice(0, 3).forEach(v => {
          console.log(`    - ${v.name} (${v.vendor_code})`);
        });
      }
    }

    // Check addresses
    const { data: addresses } = await supabase
      .from('vendor_addresses')
      .select('id, vendor_id')
      .in('vendor_id', vendors?.map(v => v.id) || []);

    console.log(`✓ Seed Addresses: ${addresses?.length || 0}`);

    // Check contacts
    const { data: contacts } = await supabase
      .from('vendor_contacts')
      .select('id, vendor_id')
      .in('vendor_id', vendors?.map(v => v.id) || []);

    console.log(`✓ Seed Contacts: ${contacts?.length || 0}`);

    // Check payment info
    const { data: paymentInfo } = await supabase
      .from('vendor_payment_info')
      .select('id, vendor_id')
      .in('vendor_id', vendors?.map(v => v.id) || []);

    console.log(`✓ Seed Payment Info: ${paymentInfo?.length || 0}`);

    // Check scorecards
    const { data: scorecards } = await supabase
      .from('vendor_scorecards')
      .select('id, vendor_id')
      .in('vendor_id', vendors?.map(v => v.id) || []);

    console.log(`✓ Seed Scorecards: ${scorecards?.length || 0}`);

    // Check documents
    const { data: documents } = await supabase
      .from('vendor_documents')
      .select('id, vendor_id')
      .in('vendor_id', vendors?.map(v => v.id) || []);

    console.log(`✓ Seed Documents: ${documents?.length || 0}`);

    // Check ingredient mappings
    const { data: mappings } = await supabase
      .from('ingredient_vendor_mapping')
      .select('id, vendor_id')
      .in('vendor_id', vendors?.map(v => v.id) || []);

    console.log(`✓ Seed Ingredient Mappings: ${mappings?.length || 0}`);

    console.log('\n============================================================================\n');

    if (vendors && vendors.length === 10) {
      console.log('✓✓✓ SEED DATA SUCCESSFULLY LOADED ✓✓✓');
      console.log('\nAll 10 seed vendors found in database!');
      console.log('Ready for Vendor ERP UI testing.');
    } else if (vendors && vendors.length > 0) {
      console.log('⚠ PARTIAL SEED DATA LOADED');
      console.log(`\nFound ${vendors.length} seed vendors (expected 10)`);
      console.log('Some data may not have loaded correctly.');
    } else {
      console.log('⚠ NO SEED DATA FOUND');
      console.log('\nPlease run the seed-vendor-data.sql file in Supabase SQL Editor:');
      console.log('1. Open Supabase Dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Copy contents of backend/scripts/seed-vendor-data.sql');
      console.log('4. Execute the SQL script');
    }

  } catch (error) {
    console.error('Error during verification:', error);
  }
}

// Run the seeding process
runSeed()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
