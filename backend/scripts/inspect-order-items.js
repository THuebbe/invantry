import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function inspectOrderItems() {
  console.log('🔍 Inspecting order items state...\n');

  // Get all order items
  const { data: allItems, error: itemsError } = await supabase
    .from('restaurant_order_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (itemsError) {
    console.error('Error fetching items:', itemsError);
    return;
  }

  console.log(`Total items (last 20): ${allItems?.length || 0}\n`);

  // Group by status
  const byStatus = {};
  allItems?.forEach(item => {
    const status = item.status || 'null';
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(item);
  });

  console.log('Items by status:');
  Object.keys(byStatus).forEach(status => {
    console.log(`  ${status}: ${byStatus[status].length} items`);
  });

  // Check for items with any PO fields set
  const itemsWithPOFields = allItems?.filter(item =>
    item.po_id || item.po_number || item.quantity_on_po > 0
  ) || [];

  console.log(`\nItems with PO fields set: ${itemsWithPOFields.length}`);

  if (itemsWithPOFields.length > 0) {
    console.log('\nDetails of items with PO fields:');
    itemsWithPOFields.forEach(item => {
      console.log(`  - ID: ${item.id}`);
      console.log(`    Status: ${item.status}`);
      console.log(`    PO ID: ${item.po_id}`);
      console.log(`    PO Number: ${item.po_number}`);
      console.log(`    Qty on PO: ${item.quantity_on_po}`);
      console.log('');
    });
  }

  // Get all purchase orders
  const { data: allPOs, error: poError } = await supabase
    .from('purchase_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (poError) {
    console.error('Error fetching POs:', poError);
    return;
  }

  console.log(`\nTotal Purchase Orders: ${allPOs?.length || 0}`);

  if (allPOs && allPOs.length > 0) {
    console.log('\nPurchase Orders:');
    allPOs.forEach(po => {
      console.log(`  - PO #${po.po_number}: ${po.status} (ID: ${po.id})`);
    });
  }

  // Check for pending items specifically
  const { data: pendingItems, error: pendingError } = await supabase
    .from('restaurant_order_items')
    .select('*')
    .eq('status', 'pending');

  console.log(`\nPending items: ${pendingItems?.length || 0}`);

  if (pendingItems && pendingItems.length > 0) {
    console.log('\nSample pending items:');
    pendingItems.slice(0, 5).forEach(item => {
      console.log(`  - ${item.ingredient_name}: ${item.quantity_needed} ${item.unit}`);
      console.log(`    Vendor: ${item.vendor_name}`);
      console.log(`    Status: ${item.status}, On PO: ${item.quantity_on_po}`);
    });
  }
}

inspectOrderItems()
  .then(() => {
    console.log('\n✅ Inspection complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Inspection failed:', error);
    process.exit(1);
  });
