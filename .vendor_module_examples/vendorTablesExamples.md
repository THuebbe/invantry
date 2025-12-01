✅ Vendor Master Table (vendors)

This is the core table. Most ERPs split vendor data into “General”, “Purchasing”, and “Accounting” segments — below is a combined modern version.

vendors
Field Type Notes
id UUID / bigint PK Primary key
vendor_code string (unique) Human-friendly ID (e.g. "VEND-000123")
legal_name string Vendor’s formal/legal name
trade_name string “Doing business as” name (optional)
status enum(‘active’, ‘inactive’, ‘suspended’) Controls availability in POs
vendor_group_id FK → vendor_groups.id Categorization (optional but useful)
tax_id string Vendor tax identifier (EIN / VAT / GST)
default_currency string ISO currency code
📍 Addresses Table (vendor_addresses)

Vendors often have multiple addresses: billing, remittance, shipping, warehouse, etc.

vendor_addresses
Field Type Notes
id UUID PK
vendor_id FK → vendors.id
address_type enum(‘billing’, ‘remittance’, ‘ship_from’, ‘primary’)
address_line1 string
address_line2 string
city string
state string
postal_code string
country string
phone string
email string
is_default boolean
👥 Contacts Table (vendor_contacts)

ERP vendors typically have multiple contacts (sales rep, account manager, billing contact).

vendor_contacts
Field Type Notes
id UUID PK
vendor_id FK → vendors.id
name string
title string
phone string
email string
role enum(‘sales_rep’, ‘account_manager’, ‘billing’, ‘support’, ‘other’)
is_primary boolean
💵 Banking / Remittance (vendor_payment_info)

Used by Accounts Payable.

vendor_payment_info
Field Type
id UUID PK
vendor_id FK → vendors.id
bank_name string
account_number (encrypted) string
routing_number (encrypted) string
swift_code string
preferred_payment_method enum(‘ach’, ‘wire’, ‘check’, ‘credit_card’)
payment_terms_id FK → payment_terms.id
🕒 Vendor Purchasing Defaults (vendor_purchasing_data)

Used when auto-populating a Purchase Order.

vendor_purchasing_data
Field Type Notes
id UUID PK
vendor_id FK → vendors.id
lead_time_days integer Default days for delivery
minimum_order_value numeric Minimum PO total
minimum_order_quantity integer Optional
default_freight_terms string (FOB Origin, FOB Destination, etc.)
default_incoterm string (EXW, CIF, DDP, etc.)
notes text
📦 Vendor–Item Cross Reference (vendor_items)

This is one of the most important ERP tables.
Each vendor can supply many items, each with vendor-specific data.

vendor_items
Field Type
id UUID PK
vendor_id FK → vendors.id
item_id FK → items.id
vendor_sku string
vendor_item_description string
unit_price numeric
currency string
uom string
lead_time_days integer
minimum_qty integer
last_updated timestamp
🧾 Compliance / Documents (vendor_documents)

ERPs often track certifications, insurance, tax forms, etc.

vendor_documents
Field Type
id UUID PK
vendor_id FK → vendors.id
document_type enum(‘w9’, ‘contract’, ‘insurance’, ‘certification’, ‘other’)
file_url string
expires_at date
uploaded_at timestamp
⭐ Vendor Score / Performance (optional but VERY useful)
vendor_scorecards
Field Type
id UUID PK
vendor_id FK → vendors.id
metric string
score numeric
period_start date
period_end date
notes text
📚 Supporting Tables
vendor_groups

(“Office Supplies”, “Raw Materials”, “Subcontractor”, etc.)

| id | name | description |

payment_terms

(“Net 30”, “Net 45”, “Due on receipt”, etc.)

| id | name | days | discount_percent | discount_days |

🔗 ER Diagram (Logical Layout)
vendors
├── vendor_addresses
├── vendor_contacts
├── vendor_payment_info
├── vendor_purchasing_data
├── vendor_documents
├── vendor_scorecards
└── vendor_items
└── items (inventory)

vendors ───< purchase_orders ───< purchase_order_lines ─── items
vendors ───< invoices
vendors ───< payments
