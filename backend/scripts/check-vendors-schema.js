// Check actual vendors table schema from Supabase
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('\n=== CHECKING VENDORS TABLE SCHEMA ===\n');

  // Get a sample vendor to see all columns
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching vendors:', error.message);
  } else if (vendors && vendors.length > 0) {
    console.log('✅ vendors table columns:');
    Object.keys(vendors[0]).sort().forEach(col => {
      const value = vendors[0][col];
      const type = typeof value;
      console.log(`  - ${col} (${type})`);
    });
  } else {
    console.log('⚠️  No vendors found - checking via RPC or information_schema');

    // Try to get column info via raw SQL
    const { data: columnInfo, error: colError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'vendors'
        ORDER BY ordinal_position;
      `
    });

    if (colError) {
      console.error('Cannot fetch schema info:', colError.message);
      console.log('\n📝 Please create a vendor manually first, or check Supabase table editor');
    } else {
      console.log('Column info:', columnInfo);
    }
  }

  // Check vendor_addresses table
  console.log('\n=== CHECKING VENDOR_ADDRESSES TABLE SCHEMA ===\n');
  const { data: addresses, error: addrError } = await supabase
    .from('vendor_addresses')
    .select('*')
    .limit(1);

  if (addrError) {
    console.error('Error fetching addresses:', addrError.message);
  } else if (addresses && addresses.length > 0) {
    console.log('✅ vendor_addresses table columns:');
    Object.keys(addresses[0]).sort().forEach(col => {
      const value = addresses[0][col];
      const type = typeof value;
      console.log(`  - ${col} (${type})`);
    });
  } else {
    console.log('⚠️  No addresses found');
  }

  // Check vendor_contacts table
  console.log('\n=== CHECKING VENDOR_CONTACTS TABLE SCHEMA ===\n');
  const { data: contacts, error: contactError } = await supabase
    .from('vendor_contacts')
    .select('*')
    .limit(1);

  if (contactError) {
    console.error('Error fetching contacts:', contactError.message);
  } else if (contacts && contacts.length > 0) {
    console.log('✅ vendor_contacts table columns:');
    Object.keys(contacts[0]).sort().forEach(col => {
      const value = contacts[0][col];
      const type = typeof value;
      console.log(`  - ${col} (${type})`);
    });
  } else {
    console.log('⚠️  No contacts found');
  }

  // Check payment_terms table
  console.log('\n=== CHECKING PAYMENT_TERMS TABLE SCHEMA ===\n');
  const { data: terms, error: termsError } = await supabase
    .from('payment_terms')
    .select('*')
    .limit(1);

  if (termsError) {
    console.error('Error fetching payment_terms:', termsError.message);
  } else if (terms && terms.length > 0) {
    console.log('✅ payment_terms table columns:');
    Object.keys(terms[0]).sort().forEach(col => {
      const value = terms[0][col];
      const type = typeof value;
      console.log(`  - ${col} (${type})`);
    });
  } else {
    console.log('⚠️  No payment terms found');
  }

  // Check vendor_payment_info table
  console.log('\n=== CHECKING VENDOR_PAYMENT_INFO TABLE SCHEMA ===\n');
  const { data: paymentInfo, error: paymentError } = await supabase
    .from('vendor_payment_info')
    .select('*')
    .limit(1);

  if (paymentError) {
    console.error('Error fetching payment info:', paymentError.message);
  } else if (paymentInfo && paymentInfo.length > 0) {
    console.log('✅ vendor_payment_info table columns:');
    Object.keys(paymentInfo[0]).sort().forEach(col => {
      const value = paymentInfo[0][col];
      const type = typeof value;
      console.log(`  - ${col} (${type})`);
    });
  } else {
    console.log('⚠️  No payment info found');
  }

  // Check vendor_scorecards table
  console.log('\n=== CHECKING VENDOR_SCORECARDS TABLE SCHEMA ===\n');
  const { data: scorecards, error: scorecardError } = await supabase
    .from('vendor_scorecards')
    .select('*')
    .limit(1);

  if (scorecardError) {
    console.error('Error fetching scorecards:', scorecardError.message);
  } else if (scorecards && scorecards.length > 0) {
    console.log('✅ vendor_scorecards table columns:');
    Object.keys(scorecards[0]).sort().forEach(col => {
      const value = scorecards[0][col];
      const type = typeof value;
      console.log(`  - ${col} (${type})`);
    });
  } else {
    console.log('⚠️  No scorecards found');
  }

  // Check vendor_documents table
  console.log('\n=== CHECKING VENDOR_DOCUMENTS TABLE SCHEMA ===\n');
  const { data: documents, error: docError } = await supabase
    .from('vendor_documents')
    .select('*')
    .limit(1);

  if (docError) {
    console.error('Error fetching documents:', docError.message);
  } else if (documents && documents.length > 0) {
    console.log('✅ vendor_documents table columns:');
    Object.keys(documents[0]).sort().forEach(col => {
      const value = documents[0][col];
      const type = typeof value;
      console.log(`  - ${col} (${type})`);
    });
  } else {
    console.log('⚠️  No documents found');
  }

  // Check ingredient_vendor_mapping table
  console.log('\n=== CHECKING INGREDIENT_VENDOR_MAPPING TABLE SCHEMA ===\n');
  const { data: mappings, error: mappingError } = await supabase
    .from('ingredient_vendor_mapping')
    .select('*')
    .limit(1);

  if (mappingError) {
    console.error('Error fetching mappings:', mappingError.message);
  } else if (mappings && mappings.length > 0) {
    console.log('✅ ingredient_vendor_mapping table columns:');
    Object.keys(mappings[0]).sort().forEach(col => {
      const value = mappings[0][col];
      const type = typeof value;
      console.log(`  - ${col} (${type})`);
    });
  } else {
    console.log('⚠️  No mappings found');
  }

  console.log('\n=== SCHEMA CHECK COMPLETE ===\n');
}

checkSchema().catch(console.error);
