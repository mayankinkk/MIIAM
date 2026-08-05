-- Make vendor_id nullable on menu_items so admins can create items without assigning a vendor
ALTER TABLE menu_items ALTER COLUMN vendor_id DROP NOT NULL;
