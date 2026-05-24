-- Add missing columns to menu_items (food)
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT true;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add missing columns to grocery_products (if table exists)
ALTER TABLE grocery_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE grocery_products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE grocery_products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add missing columns to pharmacy_medicines (if table exists)
ALTER TABLE pharmacy_medicines ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE pharmacy_medicines ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE pharmacy_medicines ADD COLUMN IF NOT EXISTS requires_prescription BOOLEAN DEFAULT false;
ALTER TABLE pharmacy_medicines ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add missing columns to flower_items (if table exists)
ALTER TABLE flower_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE flower_items ADD COLUMN IF NOT EXISTS image_url TEXT;
