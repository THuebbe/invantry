import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data, error } = await supabase.from('vendors').select('*').limit(1);

if (error) {
  console.error('Error:', error);
} else if (data && data.length > 0) {
  console.log('Vendors table columns:');
  Object.keys(data[0]).sort().forEach(col => {
    console.log(`  - ${col}: ${typeof data[0][col]} = ${JSON.stringify(data[0][col])}`);
  });
} else {
  console.log('No data in vendors table');
}
