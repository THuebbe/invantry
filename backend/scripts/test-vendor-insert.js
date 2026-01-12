// Test simple vendor insert to identify the issue
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

async function testInsert() {
  console.log('\n=== TESTING VENDOR INSERT ===\n');

  const testVendor = {
    restaurant_id: '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
    vendor_code: 'TEST-001',
    name: 'Test Vendor',
    legal_name: 'Test Vendor LLC',
    trade_name: 'Test',
    contact_name: 'John Doe',
    email: 'john@test.com',
    phone: '555-1234',
    address: '123 Test Street, Test City, TS 12345',
    payment_terms: 'Net 30',
    account_number: 'ACC123',
    notes: 'This is a test vendor',
    is_active: true
  };

  console.log('Attempting to insert:', testVendor);

  const { data, error } = await supabase
    .from('vendors')
    .insert(testVendor)
    .select()
    .single();

  if (error) {
    console.error('\n❌ INSERT FAILED:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    return;
  }

  console.log('\n✅ INSERT SUCCESSFUL!');
  console.log('Created vendor:', data);

  // Clean up - delete the test vendor
  console.log('\nCleaning up test vendor...');
  const { error: deleteError } = await supabase
    .from('vendors')
    .delete()
    .eq('id', data.id);

  if (deleteError) {
    console.warn('Warning: Could not delete test vendor:', deleteError.message);
  } else {
    console.log('✅ Test vendor deleted');
  }
}

testInsert().catch(console.error);
