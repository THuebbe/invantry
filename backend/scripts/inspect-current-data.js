import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function inspect() {
  console.log('=== CURRENT DATA INSPECTION ===\n');

  // Get vendor count
  const { data: vendors } = await supabase.from('vendors').select('id, name, vendor_code, is_active');
  console.log('Vendors:', vendors?.length || 0);
  vendors?.forEach(v => console.log('  -', v.name, '(code:', v.vendor_code || 'NULL', ', active:', v.is_active, ')'));

  // Get restaurant_id
  const { data: restaurants } = await supabase.from('restaurants').select('id, name').limit(1);
  console.log('\nRestaurant ID:', restaurants?.[0]?.id);
  console.log('Restaurant Name:', restaurants?.[0]?.name);

  // Get sample ingredients
  const { data: ingredients } = await supabase.from('ingredient_library').select('id, name, category').limit(15);
  console.log('\nSample Ingredients (first 15):');
  ingredients?.forEach(i => console.log('  -', i.name, '(', i.category, ')'));

  // Get ingredient count
  const { count } = await supabase.from('ingredient_library').select('id', { count: 'exact', head: true });
  console.log('\nTotal ingredients in library:', count);

  // Check vendor_addresses columns
  const { data: addrSample } = await supabase.from('vendor_addresses').select('*').limit(1);
  console.log('\nVendor addresses columns:', addrSample?.[0] ? Object.keys(addrSample[0]).sort() : 'No data');

  // Check vendor contacts columns
  const { data: contactSample } = await supabase.from('vendor_contacts').select('*').limit(1);
  console.log('\nVendor contacts columns:', contactSample?.[0] ? Object.keys(contactSample[0]).sort() : 'No data');

  // Check vendor_payment_info columns
  const { data: paymentSample } = await supabase.from('vendor_payment_info').select('*').limit(1);
  console.log('\nVendor payment_info columns:', paymentSample?.[0] ? Object.keys(paymentSample[0]).sort() : 'Table exists, no data');

  // Check vendor_documents columns
  const { data: docSample } = await supabase.from('vendor_documents').select('*').limit(1);
  console.log('\nVendor documents columns:', docSample?.[0] ? Object.keys(docSample[0]).sort() : 'No data');

  // Check vendor_scorecards columns
  const { data: scorecardSample } = await supabase.from('vendor_scorecards').select('*').limit(1);
  console.log('\nVendor scorecards columns:', scorecardSample?.[0] ? Object.keys(scorecardSample[0]).sort() : 'No data');

  // Check ingredient_vendor_mapping sample
  const { data: ivmSample } = await supabase.from('ingredient_vendor_mapping').select('*').limit(2);
  console.log('\nIngredient vendor mapping sample (first 2):');
  ivmSample?.forEach(ivm => {
    console.log('  - Vendor:', ivm.vendor_id);
    console.log('    Ingredient:', ivm.ingredient_id);
    console.log('    Price:', ivm.price_per_unit, ivm.currency || 'USD');
    console.log('    Package:', ivm.package_size, ivm.package_unit);
  });
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
