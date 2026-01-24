import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function getRestaurantId() {
  // Get restaurant_id from existing vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .select('restaurant_id')
    .not('restaurant_id', 'is', null)
    .limit(1);

  if (vendor && vendor[0]) {
    console.log('Restaurant ID:', vendor[0].restaurant_id);
    return vendor[0].restaurant_id;
  }

  // Try from restaurant_inventory
  const { data: inventory } = await supabase
    .from('restaurant_inventory')
    .select('restaurant_id')
    .limit(1);

  if (inventory && inventory[0]) {
    console.log('Restaurant ID:', inventory[0].restaurant_id);
    return inventory[0].restaurant_id;
  }

  console.log('Could not find restaurant_id');
  return null;
}

getRestaurantId().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
