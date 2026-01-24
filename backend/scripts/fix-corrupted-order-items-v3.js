import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixCorruptedOrderItems() {
  console.log('🔍 Finding corrupted order items...\n');

  // Get all items with status "on_po"
  const { data: itemsOnPO, error: fetchError } = await supabase
    .from('restaurant_order_items')
    .select('*')
    .eq('status', 'on_po');

  if (fetchError) {
    console.error('Error fetching items:', fetchError);
    throw fetchError;
  }

  console.log(`Found ${itemsOnPO?.length || 0} items with status "on_po"`);

  // Get all existing PO IDs (just IDs, no other fields)
  const { data: existingPOs, error: poError } = await supabase
    .from('purchase_orders')
    .select('id');

  if (poError) {
    console.error('Error fetching POs:', poError);
    throw poError;
  }

  console.log(`Found ${existingPOs?.length || 0} existing purchase orders\n`);

  // If no POs exist, ALL items with status "on_po" are corrupted
  let corruptedItems = [];

  if (!existingPOs || existingPOs.length === 0) {
    console.log('No purchase orders exist - all "on_po" items are corrupted');
    corruptedItems = itemsOnPO || [];
  } else {
    // Build set of existing PO IDs
    const existingPOIds = new Set(existingPOs.map(po => po.id));

    // Find items that reference non-existent POs
    corruptedItems = itemsOnPO?.filter(item => {
      // Item is corrupted if po_id is null OR doesn't exist in database
      return !item.po_id || !existingPOIds.has(item.po_id);
    }) || [];
  }

  console.log(`Found ${corruptedItems.length} corrupted items`);

  if (corruptedItems.length > 0) {
    console.log('\nCorrupted items details:');
    corruptedItems.forEach(item => {
      console.log(`  - ${item.ingredient_name || 'Unknown'}`);
      console.log(`    ID: ${item.id}`);
      console.log(`    PO ID: ${item.po_id || 'NULL'}`);
      console.log(`    PO Number: ${item.po_number || 'NULL'}`);
      console.log(`    Qty on PO: ${item.quantity_on_po}`);
      console.log('');
    });

    // Reset the corrupted items
    const corruptedIds = corruptedItems.map(item => item.id);

    console.log(`\n🔧 Resetting ${corruptedIds.length} corrupted items to pending status...`);

    const { error: updateError } = await supabase
      .from('restaurant_order_items')
      .update({
        status: 'pending',
        po_id: null,
        po_number: null,
        quantity_on_po: 0,
        updated_at: new Date().toISOString()
      })
      .in('id', corruptedIds);

    if (updateError) {
      console.error('❌ Error resetting items:', updateError);
      throw updateError;
    }

    console.log(`\n✅ Successfully reset ${corruptedIds.length} corrupted items`);
    console.log('✅ Items are now in "pending" status and available for PO generation');
  } else {
    console.log('✅ No corrupted items found!');
  }
}

fixCorruptedOrderItems()
  .then(() => {
    console.log('\n✅ Data cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });
