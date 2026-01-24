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

  // Get all existing PO IDs
  const { data: existingPOs, error: poError } = await supabase
    .from('purchase_orders')
    .select('id, po_number');

  if (poError) {
    console.error('Error fetching POs:', poError);
    throw poError;
  }

  console.log(`Found ${existingPOs?.length || 0} existing purchase orders`);

  const existingPOIds = new Set(existingPOs?.map(po => po.id) || []);
  const existingPONumbers = new Set(existingPOs?.map(po => po.po_number) || []);

  // Find corrupted items (on_po status but no matching PO exists)
  const corruptedItems = itemsOnPO?.filter(item => {
    // Item is corrupted if:
    // 1. It has po_id that doesn't exist, OR
    // 2. It has po_number that doesn't exist, OR
    // 3. It has po_id = null (should never be on_po with null po_id)
    const hasMissingPOId = item.po_id && !existingPOIds.has(item.po_id);
    const hasMissingPONumber = item.po_number && !existingPONumbers.has(item.po_number);
    const hasNullPOId = !item.po_id;

    return hasMissingPOId || hasMissingPONumber || hasNullPOId;
  }) || [];

  console.log(`\nFound ${corruptedItems.length} corrupted items:`);

  if (corruptedItems.length > 0) {
    console.log('\nCorrupted items details:');
    corruptedItems.forEach(item => {
      console.log(`  - ID: ${item.id}`);
      console.log(`    Ingredient: ${item.ingredient_name}`);
      console.log(`    Status: ${item.status}`);
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

    console.log(`✅ Successfully reset ${corruptedIds.length} corrupted items`);
    console.log('Items are now available for PO generation');
  } else {
    console.log('✅ No corrupted items found!');
  }
}

fixCorruptedOrderItems()
  .then(() => {
    console.log('\n✅ Fix complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });
