import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixCorruptedOrderItems() {
  console.log('🔍 Finding corrupted order items...');

  // Get all items with po_id set
  const { data: itemsWithPO } = await supabase
    .from('restaurant_order_items')
    .select('id, po_id, status, quantity_on_po')
    .not('po_id', 'is', null);

  console.log(`Found ${itemsWithPO?.length || 0} items with PO references`);

  // Get all existing PO IDs
  const { data: existingPOs } = await supabase
    .from('purchase_orders')
    .select('id');

  const existingPOIds = new Set(existingPOs?.map(po => po.id) || []);

  // Find items referencing deleted POs
  const corruptedItems = itemsWithPO?.filter(item => !existingPOIds.has(item.po_id)) || [];

  console.log(`Found ${corruptedItems.length} corrupted items (referencing deleted POs)`);

  if (corruptedItems.length === 0) {
    console.log('✅ No corrupted items found!');
    return;
  }

  // Reset the corrupted items
  const corruptedIds = corruptedItems.map(item => item.id);

  const { error } = await supabase
    .from('restaurant_order_items')
    .update({
      status: 'pending',
      po_id: null,
      po_number: null,
      quantity_on_po: 0,
      updated_at: new Date().toISOString()
    })
    .in('id', corruptedIds);

  if (error) {
    console.error('❌ Error resetting items:', error);
    throw error;
  }

  console.log(`✅ Successfully reset ${corruptedIds.length} corrupted items`);
  console.log('Items are now available for PO generation');
}

fixCorruptedOrderItems()
  .then(() => {
    console.log('✅ Fix complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
