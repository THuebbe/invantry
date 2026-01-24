-- ============================================
-- VENDOR ERP SEED DATA
-- Created: 2026-01-03
-- Purpose: Comprehensive test data for Vendor ERP module
-- Restaurant ID: 1e9c773e-913f-4a9b-b812-5ee2b5a4b15a
-- ============================================

-- Step 1: Clean existing seed data (optional - uncomment to clean)
-- DELETE FROM ingredient_vendor_mapping WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
-- DELETE FROM vendor_documents WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
-- DELETE FROM vendor_scorecards WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
-- DELETE FROM vendor_payment_info WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
-- DELETE FROM vendor_contacts WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
-- DELETE FROM vendor_addresses WHERE vendor_id IN (SELECT id FROM vendors WHERE vendor_code LIKE 'SEED-%');
-- DELETE FROM vendors WHERE vendor_code LIKE 'SEED-%';

-- ============================================
-- Step 2: Insert Vendors (10 vendors with varied profiles)
-- ============================================

INSERT INTO vendors (id, restaurant_id, vendor_code, name, legal_name, trade_name, contact_name, email, phone, address, payment_terms, notes, is_active, created_at, updated_at)
VALUES
  -- 1. Sysco Foods - Large national distributor (Grade A)
  (gen_random_uuid(), '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a', 'SEED-SYS001', 'Sysco Foods', 'Sysco Corporation', 'Sysco', 'Jennifer Martinez', 'jmartinez@sysco.com', '1-800-796-7676', '1390 Enclave Parkway, Houston, TX 77077', 'Net 30', 'Primary food distributor - excellent service and pricing', true, NOW() - INTERVAL '6 months', NOW() - INTERVAL '1 day'),

  -- 2. US Foods - Large national distributor (Grade A)
  (gen_random_uuid(), '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a', 'SEED-USF001', 'US Foods', 'US Foods, Inc.', 'US Foods', 'Michael Chen', 'mchen@usfoods.com', '1-800-937-9000', '9399 W Higgins Rd, Rosemont, IL 60018', 'Net 30', 'Secondary distributor - competitive pricing on produce', true, NOW() - INTERVAL '5 months', NOW() - INTERVAL '2 days'),

  -- 3. Local Farm Fresh - Regional produce supplier (Grade B)
  (gen_random_uuid(), '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a', 'SEED-LFF001', 'Local Farm Fresh', 'Local Farm Fresh LLC', 'Farm Fresh', 'Sarah Johnson', 'sarah@farmfresh.com', '555-0123', '1234 Harvest Lane, Pleasantville, CA 90210', '2/10 Net 30', 'Organic produce supplier - seasonal availability', true, NOW() - INTERVAL '4 months', NOW() - INTERVAL '3 days'),

  -- 4. Harbor Seafood Co - Specialty seafood (Grade A)
  (gen_random_uuid(), '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a', 'SEED-HSC001', 'Harbor Seafood Co', 'Harbor Seafood Company Inc.', 'Harbor Seafood', 'David Lee', 'dlee@harborseafood.com', '555-0456', '789 Marina Blvd, San Diego, CA 92101', 'Net 30', 'Premium seafood - daily fresh deliveries', true, NOW() - INTERVAL '8 months', NOW() - INTERVAL '1 day'),

  -- 5. Prime Meats Inc - Meat supplier (Grade B)
  (gen_random_uuid(), '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a', 'SEED-PMI001', 'Prime Meats Inc', 'Prime Meats Incorporated', 'Prime Meats', 'Robert Williams', 'rwilliams@primemeats.com', '555-0789', '567 Butcher Way, Chicago, IL 60601', 'Net 45', 'Quality beef and pork - occasional stock issues', true, NOW() - INTERVAL '7 months', NOW() - INTERVAL '4 days'),

  -- 6. Artisan Bakery Supply - Baked goods (Grade C)
  (gen_random_uuid(), '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a', 'SEED-ABS001', 'Artisan Bakery Supply', 'Artisan Bakery Supply Co.', 'Artisan Bakery', 'Emily Davis', 'edavis@artisanbakery.com', '555-1234', '890 Flour Street, Portland, OR 97201', 'Net 60', 'Specialty breads and pastries - delivery timing inconsistent', true, NOW() - INTERVAL '3 months', NOW() - INTERVAL '5 days'),

  -- 7. Global Spice Traders - Spices and seasonings (Grade A)
  (gen_random_uuid(), '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a', 'SEED-GST001', 'Global Spice Traders', 'Global Spice Traders LLC', 'Global Spice', 'Priya Patel', 'ppatel@globalspice.com', '555-5678', '234 Spice Market, New York, NY 10013', 'Net 30', 'Extensive spice selection - excellent quality control', true, NOW() - INTERVAL '9 months', NOW() - INTERVAL '2 days'),

  -- 8. Dairy Distributors LLC - Dairy products (Grade B)
  (gen_random_uuid(), '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a', 'SEED-DDL001', 'Dairy Distributors LLC', 'Dairy Distributors Limited Liability Company', 'Dairy Dist.', 'Thomas Anderson', 'tanderson@dairydist.com', '555-9012', '456 Milk Road, Madison, WI 53703', 'Net 30', 'Local dairy products - good pricing', true, NOW() - INTERVAL '6 months', NOW() - INTERVAL '3 days'),

  -- 9. Restaurant Depot - Cash & carry warehouse (Grade C)
  (gen_random_uuid(), '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a', 'SEED-RD001', 'Restaurant Depot', 'Restaurant Depot Inc.', 'Restaurant Depot', 'James Wilson', 'jwilson@restaurantdepot.com', '555-3456', '789 Warehouse Blvd, Los Angeles, CA 90001', 'Due on Receipt', 'Emergency supplies - cash and carry only', true, NOW() - INTERVAL '2 months', NOW() - INTERVAL '7 days'),

  -- 10. ChefWare Supply - Equipment and supplies (Inactive - Grade D)
  (gen_random_uuid(), '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a', 'SEED-CWS001', 'ChefWare Supply', 'ChefWare Supply Corporation', 'ChefWare', 'Lisa Thompson', 'lthompson@chefware.com', '555-7890', '123 Equipment Lane, Atlanta, GA 30301', 'Net 60', 'Previously used for smallwares - switched vendors due to slow delivery', false, NOW() - INTERVAL '12 months', NOW() - INTERVAL '60 days');

-- ============================================
-- Step 3: Insert Vendor Addresses (2-4 per vendor)
-- ============================================

-- Sysco Foods addresses
INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'billing', '1390 Enclave Parkway', 'Accounts Payable Dept', 'Houston', 'TX', '77077', 'USA', '1-800-796-7676', 'ap@sysco.com', true, 'Main billing address', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'shipping', '5600 Distribution Center Dr', NULL, 'Los Angeles', 'CA', '90040', 'USA', '323-555-0100', 'la-warehouse@sysco.com', true, 'LA distribution center', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'remittance', 'PO Box 12345', NULL, 'Houston', 'TX', '77252', 'USA', NULL, 'payments@sysco.com', false, 'Payment processing center', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

-- US Foods addresses
INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'billing', '9399 W Higgins Rd', 'Suite 500', 'Rosemont', 'IL', '60018', 'USA', '1-800-937-9000', 'ar@usfoods.com', true, 'Corporate billing', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'shipping', '2400 Produce Way', NULL, 'City of Industry', 'CA', '91745', 'USA', '626-555-0200', 'warehouse@usfoods.com', true, 'Southern California hub', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

-- Local Farm Fresh addresses
INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'billing', '1234 Harvest Lane', NULL, 'Pleasantville', 'CA', '90210', 'USA', '555-0123', 'billing@farmfresh.com', true, 'Farm office', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'shipping', '1234 Harvest Lane', 'Loading Dock', 'Pleasantville', 'CA', '90210', 'USA', '555-0123', 'sarah@farmfresh.com', true, 'Same as billing - pickup available', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

-- Harbor Seafood addresses
INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'billing', '789 Marina Blvd', 'Suite 100', 'San Diego', 'CA', '92101', 'USA', '555-0456', 'accounting@harborseafood.com', true, 'Main office', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'shipping', '789 Marina Blvd', 'Dock 3', 'San Diego', 'CA', '92101', 'USA', '555-0457', 'dispatch@harborseafood.com', true, 'Distribution facility', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

-- Prime Meats addresses
INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'billing', '567 Butcher Way', NULL, 'Chicago', 'IL', '60601', 'USA', '555-0789', 'billing@primemeats.com', true, 'Processing facility', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'shipping', '567 Butcher Way', 'Loading Bay 2', 'Chicago', 'IL', '60601', 'USA', '555-0789', 'dispatch@primemeats.com', true, 'Same location - different bay', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

-- Artisan Bakery Supply addresses
INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'billing', '890 Flour Street', NULL, 'Portland', 'OR', '97201', 'USA', '555-1234', 'edavis@artisanbakery.com', true, 'Bakery and office', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-ABS001';

-- Global Spice Traders addresses
INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'billing', '234 Spice Market', 'Floor 3', 'New York', 'NY', '10013', 'USA', '555-5678', 'accounts@globalspice.com', true, 'Manhattan office', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'shipping', '1000 Warehouse Ave', NULL, 'Newark', 'NJ', '07102', 'USA', '973-555-0300', 'warehouse@globalspice.com', true, 'NJ distribution', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

-- Dairy Distributors addresses
INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'billing', '456 Milk Road', NULL, 'Madison', 'WI', '53703', 'USA', '555-9012', 'billing@dairydist.com', true, 'Dairy processing plant', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'shipping', '456 Milk Road', 'Cooler Bay 1', 'Madison', 'WI', '53703', 'USA', '555-9012', 'dispatch@dairydist.com', true, 'Same facility', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

-- Restaurant Depot addresses
INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'billing', '789 Warehouse Blvd', NULL, 'Los Angeles', 'CA', '90001', 'USA', '555-3456', 'store-la@restaurantdepot.com', true, 'Cash and carry - no invoicing', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-RD001';

-- ChefWare Supply addresses
INSERT INTO vendor_addresses (vendor_id, restaurant_id, address_type, address_line1, address_line2, city, state, postal_code, country, phone, email, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'billing', '123 Equipment Lane', NULL, 'Atlanta', 'GA', '30301', 'USA', '555-7890', 'ar@chefware.com', true, 'Inactive vendor', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-CWS001';

-- ============================================
-- Step 4: Insert Vendor Contacts (2-5 per vendor)
-- ============================================

-- Sysco Foods contacts
INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Jennifer', 'Martinez', 'Account Manager', 'Sales', 'jmartinez@sysco.com', '1-800-796-7676', '555-0101', true, false, true, 'Primary account rep', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Carlos', 'Rodriguez', 'Customer Service Rep', 'Customer Service', 'crodriguez@sysco.com', '1-800-796-7676', '555-0102', true, false, false, 'Order inquiries', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Patricia', 'Wong', 'Accounts Receivable Manager', 'Accounting', 'pwong@sysco.com', '1-800-796-7676', NULL, false, true, false, 'Invoice questions', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Mark', 'Stevens', 'Delivery Coordinator', 'Logistics', 'mstevens@sysco.com', '323-555-0100', '555-0103', false, false, false, 'Delivery scheduling', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

-- US Foods contacts
INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Michael', 'Chen', 'Territory Manager', 'Sales', 'mchen@usfoods.com', '1-800-937-9000', '555-0201', true, false, true, 'Main contact for orders', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Amanda', 'Taylor', 'Customer Care Specialist', 'Customer Service', 'ataylor@usfoods.com', '1-800-937-9000', '555-0202', true, false, false, 'Order support', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Kevin', 'Brown', 'AR Specialist', 'Accounting', 'kbrown@usfoods.com', '1-800-937-9000', NULL, false, true, false, 'Payment processing', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

-- Local Farm Fresh contacts
INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Sarah', 'Johnson', 'Owner', 'Management', 'sarah@farmfresh.com', '555-0123', '555-0124', true, true, true, 'Direct contact - small operation', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Tom', 'Green', 'Farm Manager', 'Operations', 'tgreen@farmfresh.com', '555-0123', '555-0125', false, false, false, 'Availability questions', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

-- Harbor Seafood contacts
INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'David', 'Lee', 'Sales Director', 'Sales', 'dlee@harborseafood.com', '555-0456', '555-0458', true, false, true, 'Premium seafood specialist', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Maria', 'Santos', 'Quality Manager', 'Quality Control', 'msantos@harborseafood.com', '555-0456', '555-0459', false, false, false, 'Quality concerns', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Rachel', 'Kim', 'Accounts Receivable', 'Accounting', 'rkim@harborseafood.com', '555-0456', NULL, false, true, false, 'Billing department', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

-- Prime Meats contacts
INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Robert', 'Williams', 'Sales Manager', 'Sales', 'rwilliams@primemeats.com', '555-0789', '555-0791', true, false, true, 'Meat orders', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Christine', 'Miller', 'Office Manager', 'Administration', 'cmiller@primemeats.com', '555-0789', NULL, false, true, false, 'General inquiries', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

-- Artisan Bakery Supply contacts
INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Emily', 'Davis', 'Owner/Baker', 'Management', 'edavis@artisanbakery.com', '555-1234', '555-1235', true, true, true, 'Place orders 48hrs ahead', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-ABS001';

-- Global Spice Traders contacts
INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Priya', 'Patel', 'VP of Sales', 'Sales', 'ppatel@globalspice.com', '555-5678', '555-5679', true, false, true, 'Specialty spice orders', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Ahmed', 'Hassan', 'Product Specialist', 'Sales', 'ahassan@globalspice.com', '555-5678', '555-5680', true, false, false, 'Product sourcing', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Linda', 'Chang', 'Accounting Manager', 'Accounting', 'lchang@globalspice.com', '555-5678', NULL, false, true, false, 'Invoice processing', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

-- Dairy Distributors contacts
INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Thomas', 'Anderson', 'Account Rep', 'Sales', 'tanderson@dairydist.com', '555-9012', '555-9013', true, false, true, 'Dairy product orders', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Nancy', 'White', 'Billing Coordinator', 'Accounting', 'nwhite@dairydist.com', '555-9012', NULL, false, true, false, 'Payment questions', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

-- Restaurant Depot contacts
INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'James', 'Wilson', 'Store Manager', 'Management', 'jwilson@restaurantdepot.com', '555-3456', NULL, false, false, true, 'Cash and carry - walk-in only', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-RD001';

-- ChefWare Supply contacts
INSERT INTO vendor_contacts (vendor_id, restaurant_id, first_name, last_name, title, role, email, phone, mobile, receive_orders, receive_invoices, is_primary, notes, created_at)
SELECT v.id, v.restaurant_id, 'Lisa', 'Thompson', 'Sales Rep', 'Sales', 'lthompson@chefware.com', '555-7890', NULL, false, false, true, 'Inactive vendor', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-CWS001';

-- ============================================
-- Step 5: Insert Vendor Payment Info (1-2 per vendor)
-- ============================================

-- Get payment_terms IDs first (we'll use the names to match)
-- Net 30, Net 45, Net 60, 2/10 Net 30, Due on Receipt

-- Sysco Foods - Net 30
INSERT INTO vendor_payment_info (vendor_id, restaurant_id, payment_terms_id, preferred_payment_method, account_number, routing_number, bank_name, credit_limit, default_currency, tax_id, notes, created_at)
SELECT v.id, v.restaurant_id,
  (SELECT id FROM payment_terms WHERE name = 'Net 30' LIMIT 1),
  'ACH', '****1234', '121000248', 'Wells Fargo Bank', 50000.00, 'USD', '12-3456789', 'ACH preferred - weekly payment runs', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

-- US Foods - Net 30
INSERT INTO vendor_payment_info (vendor_id, restaurant_id, payment_terms_id, preferred_payment_method, account_number, routing_number, bank_name, credit_limit, default_currency, tax_id, notes, created_at)
SELECT v.id, v.restaurant_id,
  (SELECT id FROM payment_terms WHERE name = 'Net 30' LIMIT 1),
  'ACH', '****5678', '071000013', 'JPMorgan Chase Bank', 40000.00, 'USD', '98-7654321', 'Consolidated weekly payments', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

-- Local Farm Fresh - 2/10 Net 30
INSERT INTO vendor_payment_info (vendor_id, restaurant_id, payment_terms_id, preferred_payment_method, account_number, routing_number, bank_name, credit_limit, default_currency, tax_id, notes, created_at)
SELECT v.id, v.restaurant_id,
  (SELECT id FROM payment_terms WHERE name = '2/10 Net 30' LIMIT 1),
  'Check', '****9012', '122000247', 'Bank of America', 5000.00, 'USD', '45-6789012', 'Check preferred - 2% discount if paid within 10 days', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

-- Harbor Seafood - Net 30
INSERT INTO vendor_payment_info (vendor_id, restaurant_id, payment_terms_id, preferred_payment_method, account_number, routing_number, bank_name, credit_limit, default_currency, tax_id, notes, created_at)
SELECT v.id, v.restaurant_id,
  (SELECT id FROM payment_terms WHERE name = 'Net 30' LIMIT 1),
  'ACH', '****3456', '322271627', 'Bank of the West', 25000.00, 'USD', '11-2233445', 'ACH every Friday', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

-- Prime Meats - Net 45
INSERT INTO vendor_payment_info (vendor_id, restaurant_id, payment_terms_id, preferred_payment_method, account_number, routing_number, bank_name, credit_limit, default_currency, tax_id, notes, created_at)
SELECT v.id, v.restaurant_id,
  (SELECT id FROM payment_terms WHERE name = 'Net 45' LIMIT 1),
  'Wire Transfer', '****7890', '071000505', 'U.S. Bank', 30000.00, 'USD', '22-3344556', 'Wire transfer for large orders', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

-- Artisan Bakery Supply - Net 60
INSERT INTO vendor_payment_info (vendor_id, restaurant_id, payment_terms_id, preferred_payment_method, account_number, routing_number, bank_name, credit_limit, default_currency, tax_id, notes, created_at)
SELECT v.id, v.restaurant_id,
  (SELECT id FROM payment_terms WHERE name = 'Net 60' LIMIT 1),
  'Check', '****2345', '123456789', 'Local Credit Union', 3000.00, 'USD', '33-4455667', 'Small vendor - flexible terms', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-ABS001';

-- Global Spice Traders - Net 30
INSERT INTO vendor_payment_info (vendor_id, restaurant_id, payment_terms_id, preferred_payment_method, account_number, routing_number, bank_name, credit_limit, default_currency, tax_id, notes, created_at)
SELECT v.id, v.restaurant_id,
  (SELECT id FROM payment_terms WHERE name = 'Net 30' LIMIT 1),
  'ACH', '****6789', '021000021', 'Citibank', 15000.00, 'USD', '44-5566778', 'International wire also available', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

-- Dairy Distributors - Net 30
INSERT INTO vendor_payment_info (vendor_id, restaurant_id, payment_terms_id, preferred_payment_method, account_number, routing_number, bank_name, credit_limit, default_currency, tax_id, notes, created_at)
SELECT v.id, v.restaurant_id,
  (SELECT id FROM payment_terms WHERE name = 'Net 30' LIMIT 1),
  'ACH', '****8901', '075000019', 'Associated Bank', 10000.00, 'USD', '55-6677889', 'Regional bank preferred', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

-- Restaurant Depot - Due on Receipt (cash/card)
INSERT INTO vendor_payment_info (vendor_id, restaurant_id, payment_terms_id, preferred_payment_method, account_number, routing_number, bank_name, credit_limit, default_currency, tax_id, notes, created_at)
SELECT v.id, v.restaurant_id,
  (SELECT id FROM payment_terms WHERE name = 'Due on Receipt' LIMIT 1),
  'Cash', NULL, NULL, NULL, 0.00, 'USD', '66-7788990', 'Cash or card at checkout - no credit', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-RD001';

-- ChefWare Supply - Net 60 (inactive)
INSERT INTO vendor_payment_info (vendor_id, restaurant_id, payment_terms_id, preferred_payment_method, account_number, routing_number, bank_name, credit_limit, default_currency, tax_id, notes, created_at)
SELECT v.id, v.restaurant_id,
  (SELECT id FROM payment_terms WHERE name = 'Net 60' LIMIT 1),
  'Check', '****0123', '061000104', 'SunTrust Bank', 0.00, 'USD', '77-8899001', 'Account closed - vendor inactive', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-CWS001';

-- ============================================
-- Step 6: Insert Vendor Scorecards (1 per active vendor - 9 total)
-- ============================================

-- Sysco Foods - Grade A
INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Quality Score', 95.5, 95, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 24, 'Excellent quality consistency', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Delivery Score', 98.0, 98, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 48, 'On-time 98% of deliveries', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Price Score', 88.0, 88, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 156, 'Competitive pricing, occasional increases', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Service Score', 92.0, 92, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 12, 'Responsive account management', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

-- US Foods - Grade A
INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Quality Score', 93.0, 93, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 20, 'High quality products', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Delivery Score', 96.0, 96, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 40, 'Reliable delivery service', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Price Score', 90.0, 90, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 145, 'Best produce pricing', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Service Score', 94.0, 94, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 10, 'Great customer service', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

-- Local Farm Fresh - Grade B
INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Quality Score', 97.0, 97, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 15, 'Outstanding organic quality', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Delivery Score', 82.0, 82, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 18, 'Seasonal availability issues', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Price Score', 75.0, 75, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 95, 'Premium pricing for organic', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Service Score', 88.0, 88, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 8, 'Personal service from owner', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

-- Harbor Seafood - Grade A
INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Quality Score', 99.0, 99, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 22, 'Premium seafood quality', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Delivery Score', 100.0, 100, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 25, 'Daily fresh delivery - never missed', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Price Score', 85.0, 85, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 110, 'Premium pricing but worth it', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Service Score', 96.0, 96, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 14, 'Excellent product knowledge', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

-- Prime Meats - Grade B
INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Quality Score', 88.0, 88, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 19, 'Good quality, occasional variance', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Delivery Score', 84.0, 84, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 22, 'Some late deliveries', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Price Score', 82.0, 82, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 88, 'Reasonable pricing', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Service Score', 80.0, 80, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 9, 'Service could be better', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

-- Artisan Bakery Supply - Grade C
INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Quality Score', 92.0, 92, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 12, 'Excellent bread quality', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-ABS001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Delivery Score', 70.0, 70, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 15, 'Frequently late - small operation', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-ABS001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Price Score', 78.0, 78, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 65, 'Fair pricing for artisan products', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-ABS001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Service Score', 75.0, 75, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 7, 'Limited availability - need advance notice', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-ABS001';

-- Global Spice Traders - Grade A
INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Quality Score', 98.0, 98, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 18, 'Premium spice quality', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Delivery Score', 95.0, 95, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 20, 'Reliable shipping', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Price Score', 92.0, 92, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 75, 'Bulk discounts available', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Service Score', 97.0, 97, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 11, 'Expert product knowledge', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

-- Dairy Distributors - Grade B
INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Quality Score', 86.0, 86, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 16, 'Good dairy quality', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Delivery Score', 88.0, 88, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 19, 'Mostly on time', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Price Score', 85.0, 85, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 92, 'Competitive local pricing', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Service Score', 83.0, 83, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 8, 'Adequate service', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

-- Restaurant Depot - Grade C
INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Quality Score', 80.0, 80, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 8, 'Acceptable emergency supplies', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-RD001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Delivery Score', 100.0, 100, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 8, 'Pickup only - always available', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-RD001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Price Score', 72.0, 72, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 45, 'Higher than distributors', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-RD001';

INSERT INTO vendor_scorecards (vendor_id, restaurant_id, metric_name, metric_value, score, period_start, period_end, calculation_date, data_points_count, notes, created_at)
SELECT v.id, v.restaurant_id, 'Service Score', 65.0, 65, NOW() - INTERVAL '3 months', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 5, 'Self-service model', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-RD001';

-- ============================================
-- Step 7: Insert Vendor Documents (2-5 per vendor)
-- ============================================

-- Sysco Foods documents
INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Insurance', 'Sysco General Liability Insurance', 'https://example.com/docs/sysco-insurance-2025.pdf', '/vendor-docs/sysco/insurance-2025.pdf',
  NOW() - INTERVAL '6 months', NOW() + INTERVAL '6 months', true, false, 'General liability $5M coverage', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'W9', 'Sysco W9 Tax Form', 'https://example.com/docs/sysco-w9-2024.pdf', '/vendor-docs/sysco/w9-2024.pdf',
  NOW() - INTERVAL '12 months', NULL, true, false, 'Current W9 on file', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Food Safety', 'Sysco HACCP Certificate', 'https://example.com/docs/sysco-haccp-2025.pdf', '/vendor-docs/sysco/haccp-2025.pdf',
  NOW() - INTERVAL '3 months', NOW() + INTERVAL '9 months', true, false, 'HACCP certified facility', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-SYS001';

-- US Foods documents
INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Insurance', 'US Foods Liability Insurance', 'https://example.com/docs/usfoods-insurance-2025.pdf', '/vendor-docs/usfoods/insurance-2025.pdf',
  NOW() - INTERVAL '8 months', NOW() + INTERVAL '4 months', true, false, '$10M coverage', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'W9', 'US Foods W9', 'https://example.com/docs/usfoods-w9-2024.pdf', '/vendor-docs/usfoods/w9-2024.pdf',
  NOW() - INTERVAL '12 months', NULL, true, false, 'Tax documentation', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Food Safety', 'US Foods Food Safety Cert', 'https://example.com/docs/usfoods-safety-2024.pdf', '/vendor-docs/usfoods/safety-2024.pdf',
  NOW() - INTERVAL '10 months', NOW() + INTERVAL '2 months', true, false, 'Expiring soon - renewal requested', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-USF001';

-- Local Farm Fresh documents
INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Insurance', 'Farm Fresh Liability Insurance', 'https://example.com/docs/farmfresh-insurance-2025.pdf', '/vendor-docs/farmfresh/insurance-2025.pdf',
  NOW() - INTERVAL '4 months', NOW() + INTERVAL '8 months', true, false, '$1M liability coverage', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Organic', 'USDA Organic Certificate', 'https://example.com/docs/farmfresh-organic-2025.pdf', '/vendor-docs/farmfresh/organic-2025.pdf',
  NOW() - INTERVAL '2 months', NOW() + INTERVAL '10 months', true, false, 'Certified organic farm', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'W9', 'Farm Fresh W9', 'https://example.com/docs/farmfresh-w9-2024.pdf', '/vendor-docs/farmfresh/w9-2024.pdf',
  NOW() - INTERVAL '12 months', NULL, true, false, 'LLC tax information', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-LFF001';

-- Harbor Seafood documents
INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Insurance', 'Harbor Seafood Insurance', 'https://example.com/docs/harbor-insurance-2025.pdf', '/vendor-docs/harbor/insurance-2025.pdf',
  NOW() - INTERVAL '5 months', NOW() + INTERVAL '7 months', true, false, 'Marine liability coverage', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Food Safety', 'Harbor HACCP Certificate', 'https://example.com/docs/harbor-haccp-2025.pdf', '/vendor-docs/harbor/haccp-2025.pdf',
  NOW() - INTERVAL '1 month', NOW() + INTERVAL '11 months', true, false, 'Seafood HACCP certified', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Business License', 'California Fish Dealer License', 'https://example.com/docs/harbor-license-2025.pdf', '/vendor-docs/harbor/license-2025.pdf',
  NOW() - INTERVAL '3 months', NOW() + INTERVAL '9 months', true, false, 'State seafood dealer permit', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'W9', 'Harbor Seafood W9', 'https://example.com/docs/harbor-w9-2024.pdf', '/vendor-docs/harbor/w9-2024.pdf',
  NOW() - INTERVAL '12 months', NULL, true, false, 'Corporate tax ID', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-HSC001';

-- Prime Meats documents
INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Insurance', 'Prime Meats Insurance', 'https://example.com/docs/prime-insurance-2024.pdf', '/vendor-docs/prime/insurance-2024.pdf',
  NOW() - INTERVAL '14 months', NOW() - INTERVAL '2 months', false, true, 'EXPIRED - New cert requested', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Food Safety', 'Prime Meats USDA Inspection', 'https://example.com/docs/prime-usda-2025.pdf', '/vendor-docs/prime/usda-2025.pdf',
  NOW() - INTERVAL '2 months', NOW() + INTERVAL '10 months', true, false, 'USDA inspected facility', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'W9', 'Prime Meats W9', 'https://example.com/docs/prime-w9-2024.pdf', '/vendor-docs/prime/w9-2024.pdf',
  NOW() - INTERVAL '12 months', NULL, true, false, 'Corporate tax form', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-PMI001';

-- Artisan Bakery Supply documents
INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Business License', 'Artisan Bakery Business License', 'https://example.com/docs/artisan-license-2025.pdf', '/vendor-docs/artisan/license-2025.pdf',
  NOW() - INTERVAL '7 months', NOW() + INTERVAL '5 months', true, false, 'City business permit', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-ABS001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Food Safety', 'Food Handler Certificate', 'https://example.com/docs/artisan-food-handler-2025.pdf', '/vendor-docs/artisan/food-handler-2025.pdf',
  NOW() - INTERVAL '4 months', NOW() + INTERVAL '8 months', true, false, 'Owner food handler cert', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-ABS001';

-- Global Spice Traders documents
INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Insurance', 'Global Spice Insurance', 'https://example.com/docs/globalspice-insurance-2025.pdf', '/vendor-docs/globalspice/insurance-2025.pdf',
  NOW() - INTERVAL '3 months', NOW() + INTERVAL '9 months', true, false, 'International coverage', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'W9', 'Global Spice W9', 'https://example.com/docs/globalspice-w9-2024.pdf', '/vendor-docs/globalspice/w9-2024.pdf',
  NOW() - INTERVAL '12 months', NULL, true, false, 'LLC tax documentation', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Food Safety', 'Spice Import Certificate', 'https://example.com/docs/globalspice-import-2025.pdf', '/vendor-docs/globalspice/import-2025.pdf',
  NOW() - INTERVAL '6 months', NOW() + INTERVAL '6 months', true, false, 'FDA import certification', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-GST001';

-- Dairy Distributors documents
INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Insurance', 'Dairy Distributors Insurance', 'https://example.com/docs/dairy-insurance-2024.pdf', '/vendor-docs/dairy/insurance-2024.pdf',
  NOW() - INTERVAL '13 months', NOW() - INTERVAL '1 month', false, true, 'EXPIRED - Follow up needed', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Food Safety', 'Dairy Processing Permit', 'https://example.com/docs/dairy-permit-2025.pdf', '/vendor-docs/dairy/permit-2025.pdf',
  NOW() - INTERVAL '5 months', NOW() + INTERVAL '7 months', true, false, 'State dairy permit', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'W9', 'Dairy Distributors W9', 'https://example.com/docs/dairy-w9-2024.pdf', '/vendor-docs/dairy/w9-2024.pdf',
  NOW() - INTERVAL '12 months', NULL, true, false, 'LLC tax form', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-DDL001';

-- Restaurant Depot documents
INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'Business License', 'Restaurant Depot Membership', 'https://example.com/docs/depot-membership-2025.pdf', '/vendor-docs/depot/membership-2025.pdf',
  NOW() - INTERVAL '2 months', NOW() + INTERVAL '10 months', true, false, 'Annual membership card', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-RD001';

-- ChefWare Supply documents (inactive vendor)
INSERT INTO vendor_documents (vendor_id, restaurant_id, document_type, document_name, file_url, file_path, issue_date, expiration_date, is_current, is_expired, notes, created_at)
SELECT v.id, v.restaurant_id, 'W9', 'ChefWare W9', 'https://example.com/docs/chefware-w9-2023.pdf', '/vendor-docs/chefware/w9-2023.pdf',
  NOW() - INTERVAL '24 months', NULL, false, false, 'Old vendor - account closed', NOW()
FROM vendors v WHERE v.vendor_code = 'SEED-CWS001';

-- ============================================
-- Step 8: Insert Ingredient-Vendor Mappings (10-30 items per vendor)
-- ============================================
-- Note: This uses the existing 33 ingredients from ingredient_library
-- Prices are realistic restaurant wholesale prices

-- Sysco Foods - Full-line distributor (25 items across all categories)
INSERT INTO ingredient_vendor_mapping (vendor_id, ingredient_id, restaurant_id, vendor_item_code, vendor_item_description, price_per_unit, package_size, package_unit, case_quantity, currency, lead_time_days, minimum_order_qty, is_preferred, is_active, created_at)
SELECT
  v.id,
  i.id,
  '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
  CASE
    WHEN i.name LIKE '%Tomatoes%' THEN 'SYS-PROD-001'
    WHEN i.name LIKE '%Lettuce%' THEN 'SYS-PROD-002'
    WHEN i.name LIKE '%Onions%' THEN 'SYS-PROD-003'
    WHEN i.name LIKE '%Bell Peppers%' THEN 'SYS-PROD-004'
    WHEN i.name LIKE '%Mushrooms%' THEN 'SYS-PROD-005'
    WHEN i.name LIKE '%Carrots%' THEN 'SYS-PROD-006'
    WHEN i.name LIKE '%Chicken Breast%' THEN 'SYS-PROT-101'
    WHEN i.name LIKE '%Ground Beef%' THEN 'SYS-PROT-102'
    WHEN i.name LIKE '%Bacon%' THEN 'SYS-PROT-103'
    WHEN i.name LIKE '%Eggs%' THEN 'SYS-PROT-104'
    WHEN i.name LIKE '%Milk%' THEN 'SYS-DAIRY-201'
    WHEN i.name LIKE '%Butter%' THEN 'SYS-DAIRY-202'
    WHEN i.name LIKE '%Cheddar%' THEN 'SYS-DAIRY-203'
    WHEN i.name LIKE '%Olive Oil%' THEN 'SYS-DRY-301'
    WHEN i.name LIKE '%Salt%' THEN 'SYS-DRY-302'
    WHEN i.name LIKE '%Black Pepper%' THEN 'SYS-DRY-303'
    WHEN i.name LIKE '%Garlic Powder%' THEN 'SYS-DRY-304'
    WHEN i.name LIKE '%Flour%' THEN 'SYS-DRY-305'
  END,
  i.name || ' - Sysco Brand',
  CASE
    WHEN i.name LIKE '%Tomatoes%' THEN 18.50
    WHEN i.name LIKE '%Lettuce%' THEN 22.00
    WHEN i.name LIKE '%Onions%' THEN 12.75
    WHEN i.name LIKE '%Bell Peppers%' THEN 28.00
    WHEN i.name LIKE '%Mushrooms%' THEN 24.50
    WHEN i.name LIKE '%Carrots%' THEN 14.25
    WHEN i.name LIKE '%Chicken Breast%' THEN 3.25
    WHEN i.name LIKE '%Ground Beef%' THEN 4.50
    WHEN i.name LIKE '%Bacon%' THEN 5.75
    WHEN i.name LIKE '%Eggs%' THEN 2.85
    WHEN i.name LIKE '%Milk%' THEN 3.50
    WHEN i.name LIKE '%Butter%' THEN 4.25
    WHEN i.name LIKE '%Cheddar%' THEN 5.50
    WHEN i.name LIKE '%Olive Oil%' THEN 35.00
    WHEN i.name LIKE '%Salt%' THEN 8.50
    WHEN i.name LIKE '%Black Pepper%' THEN 12.00
    WHEN i.name LIKE '%Garlic Powder%' THEN 9.75
    WHEN i.name LIKE '%Flour%' THEN 18.50
  END,
  CASE
    WHEN i.category = 'Produce' THEN 25
    WHEN i.category = 'Protein' AND i.name LIKE '%Eggs%' THEN 15
    WHEN i.category = 'Protein' THEN 1
    WHEN i.category = 'Dairy' THEN 1
    ELSE 1
  END,
  CASE
    WHEN i.category = 'Produce' THEN 'lbs'
    WHEN i.name LIKE '%Eggs%' THEN 'dozen'
    WHEN i.name LIKE '%Milk%' THEN 'gallon'
    WHEN i.name LIKE '%Olive Oil%' THEN 'liter'
    WHEN i.name LIKE '%Flour%' THEN 'lbs'
    ELSE 'lbs'
  END,
  CASE
    WHEN i.category = 'Produce' THEN 1
    WHEN i.name LIKE '%Eggs%' THEN 30
    WHEN i.name LIKE '%Flour%' THEN 50
    ELSE 1
  END,
  'USD',
  1,
  1,
  true,
  true,
  NOW()
FROM vendors v
CROSS JOIN ingredient_library i
WHERE v.vendor_code = 'SEED-SYS001'
AND (
  i.name IN ('Tomatoes (Roma)', 'Lettuce (Romaine)', 'Onions (Yellow)', 'Bell Peppers (Mixed)', 'Mushrooms (Button)', 'Carrots',
             'Chicken Breast (Boneless)', 'Ground Beef (80/20)', 'Bacon (Applewood Smoked)', 'Eggs (Large)',
             'Milk (Whole)', 'Butter (Unsalted)', 'Cheddar Cheese (Sharp)', 'Olive Oil (Extra Virgin)',
             'Salt (Kosher)', 'Black Pepper (Ground)', 'Garlic Powder', 'All-Purpose Flour')
);

-- US Foods - Full-line distributor (22 items, strong on produce)
INSERT INTO ingredient_vendor_mapping (vendor_id, ingredient_id, restaurant_id, vendor_item_code, vendor_item_description, price_per_unit, package_size, package_unit, case_quantity, currency, lead_time_days, minimum_order_qty, is_preferred, is_active, created_at)
SELECT
  v.id,
  i.id,
  '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
  CASE
    WHEN i.name LIKE '%Tomatoes%' THEN 'USF-100234'
    WHEN i.name LIKE '%Lettuce%' THEN 'USF-100235'
    WHEN i.name LIKE '%Onions%' THEN 'USF-100236'
    WHEN i.name LIKE '%Bell Peppers%' THEN 'USF-100237'
    WHEN i.name LIKE '%Celery%' THEN 'USF-100238'
    WHEN i.name LIKE '%Potatoes%' THEN 'USF-100239'
    WHEN i.name LIKE '%Chicken Breast%' THEN 'USF-200101'
    WHEN i.name LIKE '%Ground Beef%' THEN 'USF-200102'
    WHEN i.name LIKE '%Pork Chops%' THEN 'USF-200103'
  END,
  i.name || ' - US Foods Brand',
  CASE
    WHEN i.name LIKE '%Tomatoes%' THEN 17.75
    WHEN i.name LIKE '%Lettuce%' THEN 21.00
    WHEN i.name LIKE '%Onions%' THEN 11.95
    WHEN i.name LIKE '%Bell Peppers%' THEN 26.50
    WHEN i.name LIKE '%Celery%' THEN 16.00
    WHEN i.name LIKE '%Potatoes%' THEN 19.50
    WHEN i.name LIKE '%Chicken Breast%' THEN 3.35
    WHEN i.name LIKE '%Ground Beef%' THEN 4.65
    WHEN i.name LIKE '%Pork Chops%' THEN 4.25
  END,
  CASE
    WHEN i.category = 'Produce' THEN 25
    WHEN i.category = 'Protein' THEN 1
  END,
  'lbs',
  1,
  'USD',
  1,
  1,
  CASE WHEN i.category = 'Produce' THEN true ELSE false END,
  true,
  NOW()
FROM vendors v
CROSS JOIN ingredient_library i
WHERE v.vendor_code = 'SEED-USF001'
AND i.name IN ('Tomatoes (Roma)', 'Lettuce (Romaine)', 'Onions (Yellow)', 'Bell Peppers (Mixed)', 'Celery', 'Potatoes (Russet)',
               'Chicken Breast (Boneless)', 'Ground Beef (80/20)', 'Pork Chops (Center Cut)');

-- Local Farm Fresh - Organic produce specialist (12 items, all produce)
INSERT INTO ingredient_vendor_mapping (vendor_id, ingredient_id, restaurant_id, vendor_item_code, vendor_item_description, price_per_unit, package_size, package_unit, case_quantity, currency, lead_time_days, minimum_order_qty, is_preferred, is_active, created_at)
SELECT
  v.id,
  i.id,
  '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
  'ORGANIC-' || SUBSTRING(i.name FROM 1 FOR 3),
  'Organic ' || i.name,
  CASE
    WHEN i.name LIKE '%Tomatoes%' THEN 24.00
    WHEN i.name LIKE '%Lettuce%' THEN 28.00
    WHEN i.name LIKE '%Onions%' THEN 16.50
    WHEN i.name LIKE '%Bell Peppers%' THEN 35.00
    WHEN i.name LIKE '%Mushrooms%' THEN 32.00
    WHEN i.name LIKE '%Carrots%' THEN 18.75
    WHEN i.name LIKE '%Celery%' THEN 22.00
    WHEN i.name LIKE '%Potatoes%' THEN 26.00
  END,
  20,
  'lbs',
  1,
  'USD',
  2,
  1,
  false,
  true,
  NOW()
FROM vendors v
CROSS JOIN ingredient_library i
WHERE v.vendor_code = 'SEED-LFF001'
AND i.category = 'Produce'
AND i.name IN ('Tomatoes (Roma)', 'Lettuce (Romaine)', 'Onions (Yellow)', 'Bell Peppers (Mixed)',
               'Mushrooms (Button)', 'Carrots', 'Celery', 'Potatoes (Russet)');

-- Harbor Seafood - Seafood specialist (5 items)
INSERT INTO ingredient_vendor_mapping (vendor_id, ingredient_id, restaurant_id, vendor_item_code, vendor_item_description, price_per_unit, package_size, package_unit, case_quantity, currency, lead_time_days, minimum_order_qty, is_preferred, is_active, created_at)
SELECT
  v.id,
  i.id,
  '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
  CASE
    WHEN i.name LIKE '%Salmon%' THEN 'HSC-SAL-001'
    WHEN i.name LIKE '%Shrimp%' THEN 'HSC-SHR-002'
  END,
  i.name || ' - Fresh Daily',
  CASE
    WHEN i.name LIKE '%Salmon%' THEN 12.50
    WHEN i.name LIKE '%Shrimp%' THEN 9.75
  END,
  1,
  'lbs',
  1,
  'USD',
  0,
  5,
  true,
  true,
  NOW()
FROM vendors v
CROSS JOIN ingredient_library i
WHERE v.vendor_code = 'SEED-HSC001'
AND i.name IN ('Salmon Fillets (Atlantic)', 'Shrimp (31/40 ct)');

-- Prime Meats - Meat specialist (8 items)
INSERT INTO ingredient_vendor_mapping (vendor_id, ingredient_id, restaurant_id, vendor_item_code, vendor_item_description, price_per_unit, package_size, package_unit, case_quantity, currency, lead_time_days, minimum_order_qty, is_preferred, is_active, created_at)
SELECT
  v.id,
  i.id,
  '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
  CASE
    WHEN i.name LIKE '%Chicken Breast%' THEN 'PM-CHK-101'
    WHEN i.name LIKE '%Ground Beef%' THEN 'PM-BF-201'
    WHEN i.name LIKE '%Pork Chops%' THEN 'PM-PRK-301'
    WHEN i.name LIKE '%Bacon%' THEN 'PM-BCN-401'
  END,
  i.name || ' - Premium Cut',
  CASE
    WHEN i.name LIKE '%Chicken Breast%' THEN 3.15
    WHEN i.name LIKE '%Ground Beef%' THEN 4.35
    WHEN i.name LIKE '%Pork Chops%' THEN 4.10
    WHEN i.name LIKE '%Bacon%' THEN 5.50
  END,
  1,
  'lbs',
  1,
  'USD',
  2,
  10,
  false,
  true,
  NOW()
FROM vendors v
CROSS JOIN ingredient_library i
WHERE v.vendor_code = 'SEED-PMI001'
AND i.name IN ('Chicken Breast (Boneless)', 'Ground Beef (80/20)', 'Pork Chops (Center Cut)', 'Bacon (Applewood Smoked)');

-- Artisan Bakery Supply - Baked goods and baking supplies (6 items)
INSERT INTO ingredient_vendor_mapping (vendor_id, ingredient_id, restaurant_id, vendor_item_code, vendor_item_description, price_per_unit, package_size, package_unit, case_quantity, currency, lead_time_days, minimum_order_qty, is_preferred, is_active, created_at)
SELECT
  v.id,
  i.id,
  '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
  CASE
    WHEN i.name LIKE '%Flour%' THEN 'ART-FLR-001'
    WHEN i.name LIKE '%Sugar%' THEN 'ART-SUG-002'
    WHEN i.name LIKE '%Butter%' THEN 'ART-BUT-003'
  END,
  'Artisan ' || i.name,
  CASE
    WHEN i.name LIKE '%Flour%' THEN 22.00
    WHEN i.name LIKE '%Sugar%' THEN 16.50
    WHEN i.name LIKE '%Butter%' THEN 4.75
  END,
  CASE
    WHEN i.name LIKE '%Flour%' THEN 50
    WHEN i.name LIKE '%Sugar%' THEN 25
    WHEN i.name LIKE '%Butter%' THEN 1
  END,
  'lbs',
  1,
  'USD',
  2,
  1,
  false,
  true,
  NOW()
FROM vendors v
CROSS JOIN ingredient_library i
WHERE v.vendor_code = 'SEED-ABS001'
AND i.name IN ('All-Purpose Flour', 'Granulated Sugar', 'Butter (Unsalted)');

-- Global Spice Traders - Spices and oils (10 items)
INSERT INTO ingredient_vendor_mapping (vendor_id, ingredient_id, restaurant_id, vendor_item_code, vendor_item_description, price_per_unit, package_size, package_unit, case_quantity, currency, lead_time_days, minimum_order_qty, is_preferred, is_active, created_at)
SELECT
  v.id,
  i.id,
  '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
  CASE
    WHEN i.name LIKE '%Olive Oil%' THEN 'GST-OIL-001'
    WHEN i.name LIKE '%Salt%' THEN 'GST-SLT-002'
    WHEN i.name LIKE '%Black Pepper%' THEN 'GST-PEP-003'
    WHEN i.name LIKE '%Garlic Powder%' THEN 'GST-GAR-004'
    WHEN i.name LIKE '%Paprika%' THEN 'GST-PAP-005'
    WHEN i.name LIKE '%Cumin%' THEN 'GST-CUM-006'
    WHEN i.name LIKE '%Oregano%' THEN 'GST-ORE-007'
    WHEN i.name LIKE '%Basil%' THEN 'GST-BAS-008'
  END,
  'Premium ' || i.name,
  CASE
    WHEN i.name LIKE '%Olive Oil%' THEN 32.00
    WHEN i.name LIKE '%Salt%' THEN 7.50
    WHEN i.name LIKE '%Black Pepper%' THEN 11.00
    WHEN i.name LIKE '%Garlic Powder%' THEN 8.75
    WHEN i.name LIKE '%Paprika%' THEN 10.50
    WHEN i.name LIKE '%Cumin%' THEN 9.25
    WHEN i.name LIKE '%Oregano%' THEN 12.00
    WHEN i.name LIKE '%Basil%' THEN 11.50
  END,
  CASE
    WHEN i.name LIKE '%Olive Oil%' THEN 1
    ELSE 0.5
  END,
  CASE
    WHEN i.name LIKE '%Olive Oil%' THEN 'liter'
    ELSE 'lbs'
  END,
  CASE
    WHEN i.name LIKE '%Olive Oil%' THEN 6
    ELSE 12
  END,
  'USD',
  3,
  1,
  true,
  true,
  NOW()
FROM vendors v
CROSS JOIN ingredient_library i
WHERE v.vendor_code = 'SEED-GST001'
AND i.name IN ('Olive Oil (Extra Virgin)', 'Salt (Kosher)', 'Black Pepper (Ground)', 'Garlic Powder',
               'Paprika', 'Cumin (Ground)', 'Oregano (Dried)', 'Basil (Dried)');

-- Dairy Distributors - Dairy products (8 items)
INSERT INTO ingredient_vendor_mapping (vendor_id, ingredient_id, restaurant_id, vendor_item_code, vendor_item_description, price_per_unit, package_size, package_unit, case_quantity, currency, lead_time_days, minimum_order_qty, is_preferred, is_active, created_at)
SELECT
  v.id,
  i.id,
  '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
  CASE
    WHEN i.name LIKE '%Milk%' THEN 'DD-MLK-001'
    WHEN i.name LIKE '%Butter%' THEN 'DD-BUT-002'
    WHEN i.name LIKE '%Cheddar%' THEN 'DD-CHD-003'
    WHEN i.name LIKE '%Mozzarella%' THEN 'DD-MOZ-004'
    WHEN i.name LIKE '%Cream%' THEN 'DD-CRM-005'
  END,
  'Wisconsin ' || i.name,
  CASE
    WHEN i.name LIKE '%Milk%' THEN 3.25
    WHEN i.name LIKE '%Butter%' THEN 4.00
    WHEN i.name LIKE '%Cheddar%' THEN 5.25
    WHEN i.name LIKE '%Mozzarella%' THEN 4.75
    WHEN i.name LIKE '%Cream%' THEN 5.50
  END,
  1,
  CASE
    WHEN i.name LIKE '%Milk%' THEN 'gallon'
    ELSE 'lbs'
  END,
  CASE
    WHEN i.name LIKE '%Milk%' THEN 4
    ELSE 1
  END,
  'USD',
  1,
  1,
  false,
  true,
  NOW()
FROM vendors v
CROSS JOIN ingredient_library i
WHERE v.vendor_code = 'SEED-DDL001'
AND i.name IN ('Milk (Whole)', 'Butter (Unsalted)', 'Cheddar Cheese (Sharp)', 'Mozzarella Cheese (Shredded)', 'Heavy Cream');

-- Restaurant Depot - Emergency supplies (15 items at higher prices)
INSERT INTO ingredient_vendor_mapping (vendor_id, ingredient_id, restaurant_id, vendor_item_code, vendor_item_description, price_per_unit, package_size, package_unit, case_quantity, currency, lead_time_days, minimum_order_qty, is_preferred, is_active, created_at)
SELECT
  v.id,
  i.id,
  '1e9c773e-913f-4a9b-b812-5ee2b5a4b15a',
  'RD-' || LPAD(ROW_NUMBER() OVER (ORDER BY i.name)::text, 6, '0'),
  i.name || ' - In Stock',
  CASE
    WHEN i.name LIKE '%Tomatoes%' THEN 22.00
    WHEN i.name LIKE '%Lettuce%' THEN 26.00
    WHEN i.name LIKE '%Onions%' THEN 15.50
    WHEN i.name LIKE '%Chicken Breast%' THEN 3.75
    WHEN i.name LIKE '%Ground Beef%' THEN 5.25
    WHEN i.name LIKE '%Eggs%' THEN 3.25
    WHEN i.name LIKE '%Flour%' THEN 22.00
    WHEN i.name LIKE '%Olive Oil%' THEN 42.00
    ELSE 20.00
  END,
  CASE
    WHEN i.category = 'Produce' THEN 25
    WHEN i.name LIKE '%Eggs%' THEN 15
    WHEN i.name LIKE '%Flour%' THEN 50
    ELSE 1
  END,
  CASE
    WHEN i.category = 'Produce' THEN 'lbs'
    WHEN i.name LIKE '%Eggs%' THEN 'dozen'
    WHEN i.name LIKE '%Milk%' THEN 'gallon'
    WHEN i.name LIKE '%Olive Oil%' THEN 'liter'
    WHEN i.name LIKE '%Flour%' THEN 'lbs'
    ELSE 'lbs'
  END,
  1,
  'USD',
  0,
  1,
  false,
  true,
  NOW()
FROM vendors v
CROSS JOIN ingredient_library i
WHERE v.vendor_code = 'SEED-RD001'
AND i.name IN ('Tomatoes (Roma)', 'Lettuce (Romaine)', 'Onions (Yellow)', 'Chicken Breast (Boneless)',
               'Ground Beef (80/20)', 'Eggs (Large)', 'All-Purpose Flour', 'Olive Oil (Extra Virgin)',
               'Salt (Kosher)', 'Black Pepper (Ground)', 'Milk (Whole)', 'Butter (Unsalted)',
               'Cheddar Cheese (Sharp)', 'Bacon (Applewood Smoked)', 'Potatoes (Russet)');

-- ============================================
-- Verification Queries
-- ============================================

SELECT 'Vendors' as table_name, COUNT(*) as count FROM vendors WHERE vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Addresses', COUNT(*) FROM vendor_addresses va JOIN vendors v ON va.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Contacts', COUNT(*) FROM vendor_contacts vc JOIN vendors v ON vc.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Payment Info', COUNT(*) FROM vendor_payment_info vpi JOIN vendors v ON vpi.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Scorecards', COUNT(*) FROM vendor_scorecards vs JOIN vendors v ON vs.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Documents', COUNT(*) FROM vendor_documents vd JOIN vendors v ON vd.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%'
UNION ALL
SELECT 'Ingredient Mappings', COUNT(*) FROM ingredient_vendor_mapping ivm JOIN vendors v ON ivm.vendor_id = v.id WHERE v.vendor_code LIKE 'SEED-%';
