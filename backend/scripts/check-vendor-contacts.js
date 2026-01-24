import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

console.log('=== Vendor Contacts ===\n');
const { data: contacts, error: contactsError } = await supabase
  .from('vendor_contacts')
  .select('*, vendor:vendors(name)')
  .order('created_at', { ascending: false });

if (contactsError) {
  console.error('Error:', contactsError);
} else if (contacts && contacts.length > 0) {
  console.log(`Found ${contacts.length} vendor contacts:\n`);
  contacts.forEach((contact, idx) => {
    console.log(`${idx + 1}. ${contact.first_name} ${contact.last_name}`);
    console.log(`   Vendor: ${contact.vendor?.name || 'Unknown'}`);
    console.log(`   Type: ${contact.contact_type}`);
    console.log(`   Primary: ${contact.is_primary}`);
    console.log(`   Email: ${contact.email || 'N/A'}`);
    console.log(`   Phone: ${contact.phone || 'N/A'}`);
    console.log(`   Restaurant ID: ${contact.restaurant_id}`);
    console.log('');
  });
} else {
  console.log('No vendor contacts found.');
}
