// /backend/scripts/seed-vendor-complete.js
// Comprehensive seed script for ALL vendor-related data
// Usage: node scripts/seed-vendor-complete.js [--clean]

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const RESTAURANT_ID = '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a';

// Parse command line args
const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');

// ============================================================================
// VENDOR DATA
// ============================================================================

const VENDORS = [
  {
    vendor_code: 'SEED-SYS-001',
    name: 'Sysco Corporation',
    legal_name: 'Sysco Corporation',
    trade_name: 'Sysco',
    contact_name: 'John Smith',
    phone: '555-100-2000',
    email: 'contact@sysco.com',
    address: '1234 Distribution Way, Houston, TX 77001',
    payment_terms: 'Net 30',
    account_number: 'SYS-001',
    is_active: true,
    notes: 'Full-service food distributor - Broadline'
  },
  {
    vendor_code: 'SEED-HSC-002',
    name: 'Harbor Seafood Company',
    legal_name: 'Harbor Seafood Company LLC',
    trade_name: 'Harbor Seafood',
    contact_name: 'Sarah Johnson',
    phone: '555-200-3000',
    email: 'contact@harborseafood.com',
    address: '5678 Pier Road, Seattle, WA 98101',
    payment_terms: 'Net 30',
    account_number: 'HSC-002',
    is_active: true,
    notes: 'Premium seafood supplier - Specialty'
  },
  {
    vendor_code: 'SEED-LFF-003',
    name: 'Local Farm Fresh',
    legal_name: 'Local Farm Fresh Produce Inc.',
    trade_name: 'Farm Fresh',
    contact_name: 'Michael Green',
    phone: '555-300-4000',
    email: 'contact@farmfresh.com',
    address: '9012 Harvest Lane, Portland, OR 97201',
    payment_terms: 'Net 30',
    account_number: 'LFF-003',
    is_active: true,
    notes: 'Organic produce from local farms'
  },
  {
    vendor_code: 'SEED-PMC-004',
    name: 'Prime Meats Co.',
    legal_name: 'Prime Meats Company',
    trade_name: 'Prime Meats',
    contact_name: 'David Miller',
    phone: '555-400-5000',
    email: 'contact@primemeats.com',
    address: '3456 Butcher Blvd, Chicago, IL 60601',
    payment_terms: 'Net 45',
    account_number: 'PMC-004',
    is_active: true,
    notes: 'Premium beef, pork, chicken - Proteins'
  },
  {
    vendor_code: 'SEED-DDI-005',
    name: 'Dairy Distributors Inc.',
    legal_name: 'Dairy Distributors Incorporated',
    trade_name: 'Dairy Dist',
    contact_name: 'Emily Davis',
    phone: '555-500-6000',
    email: 'contact@dairydist.com',
    address: '7890 Milk Street, Madison, WI 53701',
    payment_terms: 'Net 30',
    account_number: 'DDI-005',
    is_active: true,
    notes: 'Full-line dairy products'
  },
  {
    vendor_code: 'SEED-GST-006',
    name: 'Global Spice Trading',
    legal_name: 'Global Spice Trading Company',
    trade_name: 'Global Spice',
    contact_name: 'Lisa Martinez',
    phone: '555-600-7000',
    email: 'contact@globalspice.com',
    address: '2345 Spice Market Dr, New York, NY 10001',
    payment_terms: 'Net 60',
    account_number: 'GST-006',
    is_active: true,
    notes: 'International spices and seasonings'
  },
  {
    vendor_code: 'SEED-ABC-007',
    name: 'Artisan Bakery Co-op',
    legal_name: 'Artisan Bakery Cooperative',
    trade_name: 'Artisan Bakery',
    contact_name: 'James Brown',
    phone: '555-700-8000',
    email: 'contact@artisanbakery.com',
    address: '6789 Baker Street, San Francisco, CA 94101',
    payment_terms: 'Net 30',
    account_number: 'ABC-007',
    is_active: true,
    notes: 'Fresh breads, pastries, baking ingredients'
  },
  {
    vendor_code: 'SEED-RDP-008',
    name: 'Restaurant Depot',
    legal_name: 'Restaurant Depot Inc.',
    trade_name: 'Restaurant Depot',
    contact_name: 'Jennifer Wilson',
    phone: '555-800-9000',
    email: 'contact@restaurantdepot.com',
    address: '8901 Warehouse Way, Los Angeles, CA 90001',
    payment_terms: 'COD',
    account_number: 'RDP-008',
    is_active: true,
    notes: 'Cash and carry warehouse - Broadline'
  },
  {
    vendor_code: 'SEED-INA-009',
    name: 'Inactive Vendor Example',
    legal_name: 'Inactive Vendor LLC',
    trade_name: 'Inactive Vendor',
    contact_name: 'Robert Taylor',
    phone: '555-900-1000',
    email: 'contact@inactive.com',
    address: '1122 Old Road, Nowhere, XX 00000',
    payment_terms: 'Net 30',
    account_number: 'INA-009',
    is_active: false,
    notes: 'Inactive vendor for testing'
  }
];

// ============================================================================
// CLEAN EXISTING SEED DATA
// ============================================================================

async function cleanSeedData() {
  console.log('🧹 Cleaning existing seed data...\n');

  try {
    // Get ALL vendor IDs for this restaurant
    const { data: allVendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, vendor_code')
      .eq('restaurant_id', RESTAURANT_ID);

    if (vendorError) throw vendorError;

    if (!allVendors || allVendors.length === 0) {
      console.log('   No vendors found to clean.\n');
      return;
    }

    const allVendorIds = allVendors.map(v => v.id);
    console.log(`   Found ${allVendors.length} vendors to remove`);
    allVendors.forEach(v => console.log(`      - ${v.vendor_code || 'NO-CODE'}: ${v.name}`));

    // Delete in reverse dependency order (most dependent first)
    console.log('\n   Deleting purchase order related data...');
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('restaurant_id', RESTAURANT_ID);

    if (pos && pos.length > 0) {
      const poIds = pos.map(po => po.id);
      console.log(`      Found ${pos.length} purchase orders to delete`);

      // Delete restaurant_order_items that reference POs
      await supabase.from('restaurant_order_items').delete().in('po_id', poIds);
      console.log(`      Deleted restaurant_order_items`);

      // Delete PO items
      await supabase.from('purchase_order_items').delete().in('purchase_order_id', poIds);
      console.log(`      Deleted purchase_order_items`);

      // Delete POs
      await supabase.from('purchase_orders').delete().eq('restaurant_id', RESTAURANT_ID);
      console.log(`      Deleted purchase_orders`);
    }

    // Also delete restaurant_orders for this restaurant
    console.log('   Deleting restaurant orders...');
    const { data: orders } = await supabase
      .from('restaurant_orders')
      .select('id')
      .eq('restaurant_id', RESTAURANT_ID);

    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      await supabase.from('restaurant_order_items').delete().in('order_id', orderIds);
      await supabase.from('restaurant_orders').delete().eq('restaurant_id', RESTAURANT_ID);
      console.log(`      Deleted ${orders.length} restaurant orders`);
    }

    console.log('   Deleting ingredient-vendor mappings...');
    await supabase.from('ingredient_vendor_mapping').delete().in('vendor_id', allVendorIds);

    console.log('   Deleting vendor scorecards...');
    await supabase.from('vendor_scorecards').delete().in('vendor_id', allVendorIds);

    console.log('   Deleting vendor documents...');
    await supabase.from('vendor_documents').delete().in('vendor_id', allVendorIds);

    console.log('   Deleting vendor payment info...');
    await supabase.from('vendor_payment_info').delete().in('vendor_id', allVendorIds);

    console.log('   Deleting vendor contacts...');
    await supabase.from('vendor_contacts').delete().in('vendor_id', allVendorIds);

    console.log('   Deleting vendor addresses...');
    await supabase.from('vendor_addresses').delete().in('vendor_id', allVendorIds);

    console.log('   Deleting vendors...');
    const { error: delError } = await supabase.from('vendors').delete().in('id', allVendorIds);
    if (delError) throw delError;

    // Verify deletion
    const { data: remaining } = await supabase
      .from('vendors')
      .select('id')
      .eq('restaurant_id', RESTAURANT_ID);

    if (remaining && remaining.length > 0) {
      throw new Error(`Failed to delete all vendors. ${remaining.length} remain.`);
    }

    console.log('✅ Cleaned all vendor data successfully\n');
  } catch (error) {
    console.error('❌ Error cleaning data:', error);
    throw error;
  }
}

// ============================================================================
// SEED VENDORS
// ============================================================================

async function seedVendors() {
  console.log('📦 Seeding vendors...\n');

  const vendorsToInsert = VENDORS.map(v => ({
    ...v,
    restaurant_id: RESTAURANT_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('vendors')
    .insert(vendorsToInsert)
    .select();

  if (error) throw error;

  console.log(`✅ Created ${data.length} vendors:`);
  data.forEach(v => {
    const status = v.is_active ? '🟢' : '🔴';
    console.log(`   ${status} ${v.vendor_code} - ${v.name}`);
  });
  console.log('');

  return data;
}

// ============================================================================
// SEED ADDRESSES
// ============================================================================

async function seedAddresses(vendors) {
  console.log('📍 Seeding addresses...\n');

  const addresses = [];

  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
  const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA'];

  for (const vendor of vendors) {
    const cityIndex = Math.floor(Math.random() * cities.length);

    // Primary/Billing address (always created)
    addresses.push({
      vendor_id: vendor.id,
      restaurant_id: RESTAURANT_ID,
      address_type: 'primary',
      address_line1: `${Math.floor(Math.random() * 9999) + 1} Commerce St`,
      address_line2: Math.random() > 0.7 ? `Suite ${Math.floor(Math.random() * 900) + 100}` : null,
      city: cities[cityIndex],
      state: states[cityIndex],
      postal_code: `${10000 + Math.floor(Math.random() * 89999)}`,
      country: 'USA',
      phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: `contact@${vendor.vendor_code.toLowerCase().replace('seed-', '')}.com`,
      is_primary: true,
      created_at: new Date().toISOString()
    });

    // Warehouse/Ship From address (always created, different from primary)
    const shippingCityIndex = (cityIndex + 1) % cities.length;
    addresses.push({
      vendor_id: vendor.id,
      restaurant_id: RESTAURANT_ID,
      address_type: 'ship_from',
      address_line1: `${Math.floor(Math.random() * 9999) + 1} Warehouse Blvd`,
      address_line2: `Building ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`,
      city: cities[shippingCityIndex],
      state: states[shippingCityIndex],
      postal_code: `${10000 + Math.floor(Math.random() * 89999)}`,
      country: 'USA',
      phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: `shipping@${vendor.vendor_code.toLowerCase().replace('seed-', '')}.com`,
      is_primary: false,
      created_at: new Date().toISOString()
    });

    // Some vendors have remittance address (50% chance)
    if (Math.random() > 0.5) {
      addresses.push({
        vendor_id: vendor.id,
        restaurant_id: RESTAURANT_ID,
        address_type: 'remittance',
        address_line1: 'PO Box ' + Math.floor(Math.random() * 99999),
        address_line2: null,
        city: cities[cityIndex],
        state: states[cityIndex],
        postal_code: `${10000 + Math.floor(Math.random() * 89999)}`,
        country: 'USA',
        phone: null,
        email: `payments@${vendor.vendor_code.toLowerCase().replace('seed-', '')}.com`,
        is_primary: true,
        created_at: new Date().toISOString()
      });
    }
  }

  const { error } = await supabase.from('vendor_addresses').insert(addresses);
  if (error) throw error;

  console.log(`✅ Created ${addresses.length} addresses (avg ${(addresses.length / vendors.length).toFixed(1)} per vendor)\n`);
}

// ============================================================================
// SEED CONTACTS
// ============================================================================

async function seedContacts(vendors) {
  console.log('👥 Seeding contacts...\n');

  const contacts = [];

  const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'James', 'Jennifer', 'Robert', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const roles = ['Account Manager', 'Sales Rep', 'Customer Service', 'Billing Contact', 'Delivery Coordinator'];

  for (const vendor of vendors) {
    const numContacts = Math.floor(Math.random() * 3) + 2; // 2-4 contacts per vendor

    for (let i = 0; i < numContacts; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const role = roles[Math.min(i, roles.length - 1)]; // First contacts get priority roles

      contacts.push({
        vendor_id: vendor.id,
        restaurant_id: RESTAURANT_ID,
        first_name: firstName,
        last_name: lastName,
        title: role,
        role: role, // Use role from the roles array
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${vendor.vendor_code.toLowerCase().replace('seed-', '')}.com`,
        phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        mobile: Math.random() > 0.5 ? `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : null,
        is_primary: i === 0,
        receive_orders: i === 0 || Math.random() > 0.5,
        receive_invoices: role.includes('Account') || role.includes('Billing'),
        notes: i === 0 ? 'Primary contact for all orders and inquiries' : null,
        created_at: new Date().toISOString()
      });
    }
  }

  const { error } = await supabase.from('vendor_contacts').insert(contacts);
  if (error) throw error;

  console.log(`✅ Created ${contacts.length} contacts (avg ${(contacts.length / vendors.length).toFixed(1)} per vendor)\n`);
}

// ============================================================================
// SEED PAYMENT INFO
// ============================================================================

async function seedPaymentInfo(vendors) {
  console.log('💳 Seeding payment info...\n');

  // Get payment terms
  const { data: paymentTerms, error: termsError } = await supabase
    .from('payment_terms')
    .select('id, name');

  if (termsError) throw termsError;

  const net30 = paymentTerms.find(pt => pt.name === 'Net 30');
  const net45 = paymentTerms.find(pt => pt.name === 'Net 45');
  const net60 = paymentTerms.find(pt => pt.name === 'Net 60');

  const paymentRecords = [];
  // Safe payment methods that match database constraint
  const paymentMethods = ['ACH', 'Check'];
  const banks = ['Wells Fargo', 'Chase', 'Bank of America', 'Citibank', 'US Bank'];

  for (const vendor of vendors) {
    // Only active vendors get payment info
    if (!vendor.is_active) continue;

    // Randomly select payment term
    const termOptions = [net30, net45, net60].filter(Boolean);
    const selectedTerm = termOptions[Math.floor(Math.random() * termOptions.length)];

    // Generate realistic tax ID (EIN format)
    const taxId = `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000000) + 1000000}`;

    paymentRecords.push({
      vendor_id: vendor.id,
      restaurant_id: RESTAURANT_ID,
      payment_terms_id: selectedTerm?.id,
      tax_id: taxId,
      preferred_payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      bank_name: banks[Math.floor(Math.random() * banks.length)],
      account_number: `****${Math.floor(Math.random() * 9000) + 1000}`, // Masked
      routing_number: `****${Math.floor(Math.random() * 9000) + 1000}`, // Masked
      credit_limit: (Math.floor(Math.random() * 10) + 2) * 10000, // $20k-$110k
      default_currency: 'USD',
      notes: Math.random() > 0.7 ? 'Preferred vendor - expedited processing' : null,
      created_at: new Date().toISOString()
    });
  }

  const { error } = await supabase.from('vendor_payment_info').insert(paymentRecords);
  if (error) throw error;

  console.log(`✅ Created ${paymentRecords.length} payment records\n`);
}

// ============================================================================
// SEED INGREDIENT MAPPINGS
// ============================================================================

async function seedIngredientMappings(vendors) {
  console.log('🥬 Seeding ingredient-vendor mappings...\n');

  // Get ingredients from library
  const { data: ingredients, error: ingError } = await supabase
    .from('ingredient_library')
    .select('id, name, category')
    .limit(100);

  if (ingError) throw ingError;

  console.log(`   Found ${ingredients.length} ingredients in library`);

  const mappings = [];
  const units = ['lb', 'kg', 'case', 'each', 'gallon', 'liter'];

  // Category mappings for each vendor type
  const vendorCategories = {
    'SEED-SYS-001': ['proteins', 'produce', 'dairy', 'dry_goods', 'frozen'], // Broadline - everything
    'SEED-HSC-002': ['proteins', 'seafood'], // Seafood specialist
    'SEED-LFF-003': ['produce', 'vegetables', 'fruits'], // Produce specialist
    'SEED-PMC-004': ['proteins', 'meat', 'poultry'], // Meats specialist
    'SEED-DDI-005': ['dairy', 'cheese', 'milk'], // Dairy specialist
    'SEED-GST-006': ['spices', 'seasonings', 'dry_goods'], // Spices specialist
    'SEED-ABC-007': ['bakery', 'bread', 'flour'], // Bakery specialist
    'SEED-RDP-008': ['proteins', 'produce', 'dry_goods', 'frozen'] // Cash & Carry - variety
  };

  for (const vendor of vendors) {
    // Skip inactive vendors
    if (!vendor.is_active) continue;

    const vendorCats = vendorCategories[vendor.vendor_code] || [];

    // Filter ingredients by vendor specialty
    let vendorIngredients;
    if (vendorCats.length > 0) {
      vendorIngredients = ingredients.filter(ing =>
        vendorCats.some(cat =>
          ing.category?.toLowerCase().includes(cat) ||
          ing.name?.toLowerCase().includes(cat)
        )
      );
    } else {
      vendorIngredients = ingredients;
    }

    // Take 10-20 items per vendor
    const itemCount = Math.floor(Math.random() * 11) + 10;
    const selectedItems = vendorIngredients.slice(0, Math.min(itemCount, vendorIngredients.length));

    for (const ingredient of selectedItems) {
      mappings.push({
        vendor_id: vendor.id,
        ingredient_id: ingredient.id,
        restaurant_id: RESTAURANT_ID,
        vendor_item_number: `${vendor.vendor_code.substring(5, 8)}-${ingredient.id.substring(0, 8).toUpperCase()}`,
        unit_cost: (Math.random() * 95 + 5).toFixed(2), // $5-$100
        lead_time_days: Math.floor(Math.random() * 7) + 1,
        minimum_order_qty: Math.floor(Math.random() * 5) + 1,
        is_preferred: Math.random() > 0.7,
        created_at: new Date().toISOString()
      });
    }

    console.log(`   ${vendor.name}: ${selectedItems.length} ingredients`);
  }

  const { error } = await supabase.from('ingredient_vendor_mapping').insert(mappings);
  if (error) throw error;

  console.log(`✅ Created ${mappings.length} ingredient mappings\n`);
}

// ============================================================================
// SEED SCORECARDS
// ============================================================================

async function seedScorecards(vendors) {
  console.log('📊 Seeding vendor scorecards...\n');

  const scorecards = [];

  for (const vendor of vendors) {
    // Only active vendors get scorecards
    if (!vendor.is_active) continue;

    // Generate realistic scores (mostly good vendors, 80-100 range)
    const qualityScore = Math.floor(Math.random() * 20) + 80;
    const deliveryScore = Math.floor(Math.random() * 20) + 80;
    const priceScore = Math.floor(Math.random() * 25) + 70; // Price is slightly more variable
    const serviceScore = Math.floor(Math.random() * 20) + 80;

    const avgScore = (qualityScore + deliveryScore + priceScore + serviceScore) / 4;

    // Calculate grade
    let grade;
    if (avgScore >= 95) grade = 'A+';
    else if (avgScore >= 90) grade = 'A';
    else if (avgScore >= 85) grade = 'B+';
    else if (avgScore >= 80) grade = 'B';
    else if (avgScore >= 75) grade = 'C+';
    else if (avgScore >= 70) grade = 'C';
    else grade = 'D';

    const quarter = Math.floor(new Date().getMonth() / 3) + 1;
    const year = new Date().getFullYear();

    scorecards.push({
      vendor_id: vendor.id,
      restaurant_id: RESTAURANT_ID,
      quality_score: qualityScore,
      delivery_score: deliveryScore,
      price_score: priceScore,
      service_score: serviceScore,
      overall_grade: grade,
      evaluation_date: new Date().toISOString(),
      notes: `Q${quarter} ${year} performance evaluation - ${grade === 'A+' || grade === 'A' ? 'Excellent' : grade.startsWith('B') ? 'Good' : 'Satisfactory'} vendor`,
      created_at: new Date().toISOString()
    });
  }

  const { error } = await supabase.from('vendor_scorecards').insert(scorecards);
  if (error) throw error;

  console.log(`✅ Created ${scorecards.length} scorecards\n`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('\n🚀 COMPREHENSIVE VENDOR SEED SCRIPT\n');
    console.log('='.repeat(60));
    console.log(`Restaurant ID: ${RESTAURANT_ID}`);
    console.log(`Clean mode: ${shouldClean ? 'YES' : 'NO'}`);
    console.log('='.repeat(60));
    console.log('');

    // Step 1: Clean if requested
    if (shouldClean) {
      await cleanSeedData();
    }

    // Step 2: Seed vendors
    const vendors = await seedVendors();

    // Step 3: Seed addresses
    await seedAddresses(vendors);

    // Step 4: Seed contacts
    await seedContacts(vendors);

    // Step 5: Seed payment info
    await seedPaymentInfo(vendors);

    // Step 6: Seed ingredient mappings
    await seedIngredientMappings(vendors);

    // Step 7: Seed scorecards (OPTIONAL - Skip for now due to schema mismatch)
    // await seedScorecards(vendors);
    console.log('   ⚠️  Skipping scorecards (schema needs verification)\n');

    // Summary
    console.log('='.repeat(60));
    console.log('✅✅✅ COMPLETE SEED DATA SUCCESSFULLY LOADED ✅✅✅');
    console.log('='.repeat(60));
    console.log('\n📋 Verification Queries:\n');
    console.log('-- Check vendors');
    console.log("SELECT vendor_code, name, is_active FROM vendors WHERE vendor_code LIKE 'SEED-%';\n");
    console.log('-- Check addresses per vendor');
    console.log("SELECT v.name, COUNT(va.id) as address_count FROM vendors v LEFT JOIN vendor_addresses va ON v.id = va.vendor_id WHERE v.vendor_code LIKE 'SEED-%' GROUP BY v.name;\n");
    console.log('-- Check contacts per vendor');
    console.log("SELECT v.name, COUNT(vc.id) as contact_count FROM vendors v LEFT JOIN vendor_contacts vc ON v.id = vc.vendor_id WHERE v.vendor_code LIKE 'SEED-%' GROUP BY v.name;\n");
    console.log('-- Check ingredient mappings');
    console.log("SELECT v.name, COUNT(ivm.id) as ingredient_count FROM vendors v LEFT JOIN ingredient_vendor_mapping ivm ON v.id = ivm.vendor_id WHERE v.vendor_code LIKE 'SEED-%' GROUP BY v.name;\n");

  } catch (error) {
    console.error('\n❌ SEED FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
