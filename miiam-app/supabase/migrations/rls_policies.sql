-- ============================================================
-- Row-Level Security (RLS) Policies for MIIAM
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add user_id to vendors so we can link partner accounts to their store
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);

-- 2. Enable RLS on all tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flower_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to re-run)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view orders for their store" ON public.orders;
DROP POLICY IF EXISTS "Riders can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

DROP POLICY IF EXISTS "Vendors can manage their own store" ON public.vendors;
DROP POLICY IF EXISTS "Anyone can view vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can manage all vendors" ON public.vendors;

DROP POLICY IF EXISTS "Vendors can manage their menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;

DROP POLICY IF EXISTS "Vendors can manage their grocery products" ON public.grocery_products;
DROP POLICY IF EXISTS "Anyone can view grocery products" ON public.grocery_products;

DROP POLICY IF EXISTS "Vendors can manage their pharmacy medicines" ON public.pharmacy_medicines;
DROP POLICY IF EXISTS "Anyone can view pharmacy medicines" ON public.pharmacy_medicines;

DROP POLICY IF EXISTS "Vendors can manage their flower items" ON public.flower_items;
DROP POLICY IF EXISTS "Anyone can view flower items" ON public.flower_items;

DROP POLICY IF EXISTS "Riders can insert their location" ON public.rider_locations;
DROP POLICY IF EXISTS "Riders can update their location" ON public.rider_locations;
DROP POLICY IF EXISTS "Customers can view locations for their order" ON public.rider_locations;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- ORDERS
-- ============================================================
CREATE POLICY "Customers can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can view orders for their store" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE id = orders.vendor_id AND user_id = auth.uid())
  );

CREATE POLICY "Riders can view assigned orders" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.riders WHERE id = orders.rider_id AND user_id = auth.uid())
  );

CREATE POLICY "Vendors can update their order status" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE id = orders.vendor_id AND user_id = auth.uid())
  );

CREATE POLICY "Riders can update assigned orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.riders WHERE id = orders.rider_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow order creation (authenticated users)
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- VENDORS
-- ============================================================
CREATE POLICY "Anyone can view vendors" ON public.vendors
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage their own store" ON public.vendors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vendors" ON public.vendors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE POLICY "Anyone can view menu items" ON public.menu_items
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage their menu items" ON public.menu_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE id = menu_items.vendor_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all menu items" ON public.menu_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- GROCERY PRODUCTS
-- ============================================================
CREATE POLICY "Anyone can view grocery products" ON public.grocery_products
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage their grocery products" ON public.grocery_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE id = grocery_products.vendor_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all grocery products" ON public.grocery_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- PHARMACY MEDICINES
-- ============================================================
CREATE POLICY "Anyone can view pharmacy medicines" ON public.pharmacy_medicines
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage their pharmacy medicines" ON public.pharmacy_medicines
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE id = pharmacy_medicines.vendor_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all pharmacy medicines" ON public.pharmacy_medicines
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- FLOWER ITEMS
-- ============================================================
CREATE POLICY "Anyone can view flower items" ON public.flower_items
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage their flower items" ON public.flower_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE id = flower_items.vendor_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all flower items" ON public.flower_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- RIDER LOCATIONS
-- ============================================================
CREATE POLICY "Riders can insert their location" ON public.rider_locations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.riders WHERE id = rider_locations.rider_id AND user_id = auth.uid())
  );

CREATE POLICY "Riders can update their location" ON public.rider_locations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.riders WHERE id = rider_locations.rider_id AND user_id = auth.uid())
  );

CREATE POLICY "Customers can view locations for their order" ON public.rider_locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = rider_locations.order_id AND user_id = auth.uid())
  );

CREATE POLICY "Vendors can view rider locations for their orders" ON public.rider_locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders JOIN public.vendors ON orders.vendor_id = vendors.id
      WHERE orders.id = rider_locations.order_id AND vendors.user_id = auth.uid())
  );

-- ============================================================
-- ORDER ITEMS
-- ============================================================
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Vendors can view their order items" ON public.order_items;

CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
  );

CREATE POLICY "Vendors can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders JOIN public.vendors ON orders.vendor_id = vendors.id
      WHERE orders.id = order_items.order_id AND vendors.user_id = auth.uid())
  );

CREATE POLICY "Riders can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders JOIN public.riders ON orders.rider_id = riders.id
      WHERE orders.id = order_items.order_id AND riders.user_id = auth.uid())
  );

-- ============================================================
-- REVIEWS
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;

CREATE POLICY "Anyone can read reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Reload PostgREST Schema Cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
