-- Consolidated Migration: All patches merged into a single ordered migration
-- Created: 2026-07-07
-- This file replaces the individual patch files for cleaner migration management.
-- Run this ONCE if setting up a fresh database.

-- ============================================================
-- 1. CORE TABLES (from core_tables.sql)
-- ============================================================

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shop_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  logo_url TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  opening_hours TEXT,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  delivery_charge NUMERIC DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  estimated_delivery_time INTEGER DEFAULT 30,
  surge_enabled BOOLEAN DEFAULT false,
  surge_multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  has_discount BOOLEAN DEFAULT false,
  discount_percent NUMERIC DEFAULT 0,
  stock INTEGER,
  requires_prescription BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  rider_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tip_amount NUMERIC DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT DEFAULT 'pending',
  delivery_address TEXT,
  delivery_lat NUMERIC,
  delivery_lng NUMERIC,
  scheduled_delivery TIMESTAMPTZ,
  special_instructions TEXT,
  cancel_reason TEXT,
  placed_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  shopping_at TIMESTAMPTZ,
  picked_at TIMESTAMPTZ,
  on_the_way_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  lat NUMERIC,
  lng NUMERIC,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. EXTENDED TABLES (from patch files)
-- ============================================================

-- Chat system
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phone verification
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recurring schedules
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  frequency TEXT NOT NULL,
  day_of_week INTEGER,
  items JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  next_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device TEXT,
  ip_address TEXT,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service bookings
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  service_id UUID,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  address TEXT,
  total NUMERIC NOT NULL,
  technician_id UUID,
  technician_name TEXT,
  technician_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product tables
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Grocery items
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  category TEXT,
  unit TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pharmacy items
CREATE TABLE IF NOT EXISTS pharmacy_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  requires_prescription BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Flower items
CREATE TABLE IF NOT EXISTS flower_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Print files
CREATE TABLE IF NOT EXISTS print_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  file_url TEXT NOT NULL,
  file_name TEXT,
  copies INTEGER DEFAULT 1,
  color_mode TEXT DEFAULT 'bw',
  paper_size TEXT DEFAULT 'A4',
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer live location
CREATE TABLE IF NOT EXISTS customer_live_location (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. RLS POLICIES (from rls_policies.sql, fix_open_rls_policies.sql)
-- ============================================================

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE flower_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_live_location ENABLE ROW LEVEL SECURITY;

-- Vendors: public read, owner write
CREATE POLICY "Vendors are publicly readable" ON vendors FOR SELECT USING (true);
CREATE POLICY "Vendors can update own" ON vendors FOR UPDATE USING (auth.uid() = user_id);

-- Menu items: public read, vendor owner write
CREATE POLICY "Menu items are publicly readable" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Vendor can manage own menu" ON menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM vendors WHERE id = menu_items.vendor_id AND user_id = auth.uid())
);

-- Orders: user sees own, vendor sees own, rider sees assigned
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vendors view assigned orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM vendors WHERE id = orders.vendor_id AND user_id = auth.uid())
);
CREATE POLICY "Vendors update assigned orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM vendors WHERE id = orders.vendor_id AND user_id = auth.uid())
);
CREATE POLICY "Riders view assigned orders" ON orders FOR SELECT USING (auth.uid() = rider_id);
CREATE POLICY "Riders update assigned orders" ON orders FOR UPDATE USING (auth.uid() = rider_id);

-- Order items: visible with order
CREATE POLICY "Order items visible with order" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND (user_id = auth.uid() OR rider_id = auth.uid() OR EXISTS (SELECT 1 FROM vendors WHERE id = orders.vendor_id AND user_id = auth.uid())))
);
CREATE POLICY "Users create order items for own orders" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- Addresses: user owns own
CREATE POLICY "Users manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

-- Reviews: public read, user writes own
CREATE POLICY "Reviews are publicly readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages
CREATE POLICY "Chat messages visible to order participants" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = chat_messages.order_id AND (user_id = auth.uid() OR rider_id = auth.uid()))
);
CREATE POLICY "Users send chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Service bookings
CREATE POLICY "Users view own bookings" ON service_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own bookings" ON service_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bookings" ON service_bookings FOR UPDATE USING (auth.uid() = user_id);

-- Products, grocery, pharmacy, flower items: public read, vendor manage
CREATE POLICY "Products publicly readable" ON products FOR SELECT USING (true);
CREATE POLICY "Grocery items publicly readable" ON grocery_items FOR SELECT USING (true);
CREATE POLICY "Pharmacy items publicly readable" ON pharmacy_items FOR SELECT USING (true);
CREATE POLICY "Flower items publicly readable" ON flower_items FOR SELECT USING (true);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider ON orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_vendor ON menu_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_order ON chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_user ON service_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_vendor ON service_bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_user ON recurring_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_print_files_user ON print_files(user_id);

-- ============================================================
-- 5. FEATURE COLUMNS (from add_missing_columns.sql)
-- ============================================================

-- Add columns that may not exist from initial setup
DO $$ BEGIN
  ALTER TABLE vendors ADD COLUMN IF NOT EXISTS max_delivery_distance NUMERIC;
  ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'food';
  ALTER TABLE vendors ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT false;
  ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS prep_time INTEGER;
  ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags TEXT[];
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS recurring_schedule_id UUID;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
