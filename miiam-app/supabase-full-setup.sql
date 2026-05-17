-- MIIAM Full Database Setup SQL
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  email text,
  avatar_url text,
  role text default 'user',
  city text,
  state text,
  is_profile_complete boolean default false,
  referral_code text unique,
  referred_by uuid references profiles(id),
  total_loyalty_points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- VENDORS TABLE
create table if not exists vendors (
  id uuid default uuid_generate_v4() primary key,
  owner_name text not null,
  phone text not null,
  email text,
  shop_name text not null,
  address text not null,
  cuisine text,
  gst_number text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- MENU ITEMS TABLE
create table if not exists menu_items (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references vendors(id) on delete cascade,
  name text not null,
  price numeric not null,
  category text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ORDERS TABLE
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  vendor_id uuid references vendors(id),
  rider_id uuid,
  status text default 'pending',
  total_amount numeric default 0,
  delivery_fee numeric default 0,
  discount_amount numeric default 0,
  payment_method text,
  special_instructions text,
  delivery_address text,
  delivery_instructions text,
  placed_at timestamp with time zone default timezone('utc'::text, now()),
  accepted_at timestamp with time zone,
  picked_at timestamp with time zone,
  delivered_at timestamp with time zone
);

-- ORDER ITEMS TABLE
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name text not null,
  price numeric not null,
  quantity integer default 1,
  unit_price numeric not null,
  special_notes text,
  status text default 'pending',
  picked boolean default false,
  actual_price numeric
);

-- RIDERS TABLE
create table if not exists riders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  name text not null,
  phone text not null,
  email text,
  vehicle_type text,
  vehicle_number text,
  is_online boolean default false,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RIDER WALLET TABLE
create table if not exists rider_wallet (
  id uuid default uuid_generate_v4() primary key,
  rider_id uuid references riders(id),
  balance numeric default 0,
  total_earnings numeric default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- BANNERS TABLE
create table if not exists banners (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  image_url text not null,
  link_url text,
  position integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- REVIEWS TABLE
create table if not exists reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  vendor_id uuid references vendors(id),
  order_id uuid references orders(id),
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- PROMO CODES TABLE
create table if not exists promo_codes (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  discount_type text,
  discount_value numeric,
  min_order_amount numeric,
  max_discount numeric,
  is_active boolean default true,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- AUDIT LOGS TABLE
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- CHAT MESSAGES TABLE
create table if not exists chat_messages (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id),
  sender_id uuid references profiles(id),
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- NOTIFICATIONS TABLE
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  title text not null,
  body text,
  type text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- LOYALTY POINTS TRANSACTIONS
create table if not exists loyalty_points_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  points integer not null,
  type text not null,
  description text,
  reference_id text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ENABLE RLS ON ALL TABLES
alter table profiles enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table riders enable row level security;
alter table rider_wallet enable row level security;
alter table banners enable row level security;
alter table reviews enable row level security;
alter table promo_codes enable row level security;
alter table audit_logs enable row level security;
alter table chat_messages enable row level security;
alter table loyalty_points_transactions enable row level security;
alter table notifications enable row level security;

-- FUNCTION: Auto-create notification when order status changes
CREATE OR REPLACE FUNCTION create_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_icon TEXT;
BEGIN
  IF NEW.status != OLD.status AND NEW.user_id IS NOT NULL THEN
    -- Determine notification content based on status
    CASE NEW.status
      WHEN 'accepted' THEN
        notification_title := '🎉 Order Accepted';
        notification_message := 'Great news! Your order has been accepted and is being prepared.';
        notification_icon := 'check_circle';
      WHEN 'preparing' THEN
        notification_title := '👨‍🍳 Preparing Your Order';
        notification_message := 'The restaurant is preparing your delicious food.';
        notification_icon := 'restaurant';
      WHEN 'shopping' THEN
        notification_title := '🛒 Shopping Started';
        notification_message := 'Your rider has started shopping for your items.';
        notification_icon := 'shopping_cart';
      WHEN 'picking_up' THEN
        notification_title := '📦 Picking Up Order';
        notification_message := 'Your rider is on the way to pick up your order.';
        notification_icon := 'delivery_dining';
      WHEN 'on_the_way' THEN
        notification_title := '🚴 On The Way';
        notification_message := 'Your order is on its way to you!';
        notification_icon := 'directions_bike';
      WHEN 'delivered' THEN
        notification_title := '✅ Order Delivered';
        notification_message := 'Your order has been delivered. Enjoy your meal!';
        notification_icon := 'home_pin';
      WHEN 'cancelled' THEN
        notification_title := '❌ Order Cancelled';
        notification_message := 'Your order has been cancelled.';
        notification_icon := 'cancel';
      WHEN 'refunded' THEN
        notification_title := '💰 Refund Initiated';
        notification_message := 'Your refund has been initiated and will be processed soon.';
        notification_icon := 'currency_exchange';
      ELSE
        notification_title := '📋 Order Update';
        notification_message := 'Your order status has been updated to: ' || NEW.status;
        notification_icon := 'update';
    END CASE;

    INSERT INTO notifications (user_id, title, message, type, read, icon, action_url, created_at)
    VALUES (
      NEW.user_id,
      notification_title,
      notification_message,
      'order_update',
      false,
      notification_icon,
      '/app/orders/' || NEW.id,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Execute function on order status change
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
CREATE TRIGGER order_status_notification_trigger
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION create_order_status_notification();

-- CREATE RLS POLICIES FOR ALL TABLES
-- Profiles
DROP POLICY IF EXISTS "Profiles full access" ON profiles;
CREATE POLICY "Enable select for profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for profiles" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Enable delete for profiles" ON profiles FOR DELETE USING (true);

-- Orders
DROP POLICY IF EXISTS "Orders full access" ON orders;
CREATE POLICY "Enable select for orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert for orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable delete for orders" ON orders FOR DELETE USING (true);

-- Order Items
DROP POLICY IF EXISTS "Order Items full access" ON order_items;
CREATE POLICY "Enable select for order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for order_items" ON order_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for order_items" ON order_items FOR DELETE USING (true);

-- Riders
DROP POLICY IF EXISTS "Riders full access" ON riders;
CREATE POLICY "Enable select for riders" ON riders FOR SELECT USING (true);
CREATE POLICY "Enable insert for riders" ON riders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for riders" ON riders FOR UPDATE USING (true);
CREATE POLICY "Enable delete for riders" ON riders FOR DELETE USING (true);

-- Rider Wallet
DROP POLICY IF EXISTS "Rider Wallet full access" ON rider_wallet;
CREATE POLICY "Enable select for rider_wallet" ON rider_wallet FOR SELECT USING (true);
CREATE POLICY "Enable insert for rider_wallet" ON rider_wallet FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for rider_wallet" ON rider_wallet FOR UPDATE USING (true);
CREATE POLICY "Enable delete for rider_wallet" ON rider_wallet FOR DELETE USING (true);

-- Banners
DROP POLICY IF EXISTS "Banners full access" ON banners;
CREATE POLICY "Enable select for banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Enable insert for banners" ON banners FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for banners" ON banners FOR UPDATE USING (true);
CREATE POLICY "Enable delete for banners" ON banners FOR DELETE USING (true);

-- Reviews
DROP POLICY IF EXISTS "Reviews full access" ON reviews;
CREATE POLICY "Enable select for reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Enable insert for reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for reviews" ON reviews FOR UPDATE USING (true);
CREATE POLICY "Enable delete for reviews" ON reviews FOR DELETE USING (true);

-- Promo Codes
DROP POLICY IF EXISTS "Promo Codes full access" ON promo_codes;
CREATE POLICY "Enable select for promo_codes" ON promo_codes FOR SELECT USING (true);
CREATE POLICY "Enable insert for promo_codes" ON promo_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for promo_codes" ON promo_codes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for promo_codes" ON promo_codes FOR DELETE USING (true);

-- Audit Logs
DROP POLICY IF EXISTS "Audit Logs full access" ON audit_logs;
CREATE POLICY "Enable select for audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Chat Messages
DROP POLICY IF EXISTS "Chat Messages full access" ON chat_messages;
CREATE POLICY "Enable select for chat_messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert for chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for chat_messages" ON chat_messages FOR UPDATE USING (true);

-- Notifications
DROP POLICY IF EXISTS "Notifications full access" ON notifications;
CREATE POLICY "Enable select for notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert for notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for notifications" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Enable delete for notifications" ON notifications FOR DELETE USING (true);

-- CREATE INDEXES
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_vendor_id on orders(vendor_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_riders_user_id on riders(user_id);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_banners_position on banners(position);

-- Insert sample banners (if not exists)
insert into banners (title, image_url, link_url, position, is_active) 
select * from (values
('Flat 50% Off', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80', '/app/food', 1, true),
('Free Delivery', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80', '/app/food', 2, true),
('New Restaurants', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', '/app/food', 3, true)
) as v(title, image_url, link_url, position, is_active)
where not exists (select 1 from banners where title = v.title);

-- Insert sample promo codes (if not exists)
insert into promo_codes (code, discount_type, discount_value, min_order_amount, max_discount, is_active)
select * from (values
('FIRST50', 'percent', 50, 200, 100, true),
('SAVE20', 'percent', 20, 300, 50, true),
('MIIAM10', 'fixed', 10, 100, 10, true)
) as v(code, discount_type, discount_value, min_order_amount, max_discount, is_active)
where not exists (select 1 from promo_codes where code = v.code);

-- Confirm
select 'Full database setup complete!' as status;

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTOMATIC PROFILE CREATION
-- ─────────────────────────────────────────────────────────────────────────────
-- Create a function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', 'User'), 
    new.email, 
    new.raw_user_meta_data->>'avatar_url', 
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to run the function on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Ensure existing users have a profile
insert into public.profiles (id, email, role)
select id, email, 'user'
from auth.users
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIIAM PLATFORM VENDORS (Seeding)
-- ─────────────────────────────────────────────────────────────────────────────
-- Add missing category column if it doesn't exist
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS category text;

-- Create official Platform Vendors with valid UUIDs
INSERT INTO public.vendors (id, owner_name, phone, email, shop_name, address, category, status)
VALUES 
  ('f00d0000-0000-4000-8000-000000000000', 'MIIAM', '0000000000', 'food@miiam.com', 'MIIAM Food', 'Platform', 'Food', 'active'),
  ('5e700000-0000-4000-8000-000000000000', 'MIIAM', '0000000000', 'services@miiam.com', 'MIIAM Services', 'Platform', 'Service', 'active')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- DATABASE REPAIR & MIGRATION (Ensuring all columns exist)
-- ─────────────────────────────────────────────────────────────────────────────
-- Fix for Orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_instructions text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- Fix for Order Items table
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS name text;

-- ─────────────────────────────────────────────────────────────────────────────
-- GROCERY, PHARMACY & FLOWERS PRODUCTS TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- GROCERY PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS grocery_products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null,
  price numeric not null,
  stock integer default 0,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- PHARMACY MEDICINES TABLE
CREATE TABLE IF NOT EXISTS pharmacy_medicines (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null,
  price numeric not null,
  stock integer default 0,
  image_url text,
  requires_prescription boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- FLOWERS & GIFTS ITEMS TABLE
CREATE TABLE IF NOT EXISTS flower_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null,
  price numeric not null,
  description text,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on new tables
ALTER TABLE public.grocery_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flower_items ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (adjust as needed)
CREATE POLICY "Allow full access to grocery_products" ON public.grocery_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to pharmacy_medicines" ON public.pharmacy_medicines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to flower_items" ON public.flower_items FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price numeric;

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';

-- EMAIL OTP TABLE (for serverless-friendly OTP storage)
CREATE TABLE IF NOT EXISTS email_otps (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  otp text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Policy for full access
CREATE POLICY "Allow full access to email_otps" ON public.email_otps FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDERS & ORDER ITEMS TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  vendor_id uuid,
  rider_id uuid,
  status text default 'pending',
  total_amount numeric default 0,
  delivery_fee numeric default 0,
  discount_amount numeric default 0,
  payment_method text,
  delivery_address text,
  delivery_instructions text,
  special_instructions text,
  scheduled_delivery text,
  placed_at timestamp with time zone default timezone('utc'::text, now()),
  accepted_at timestamp with time zone,
  picked_at timestamp with time zone,
  delivered_at timestamp with time zone
);

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid,
  name text not null,
  quantity numeric default 1,
  unit_price numeric not null,
  price numeric not null,
  special_notes text,
  status text default 'pending',
  picked boolean default false,
  actual_price numeric
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow full access to orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- User Prescriptions Table
CREATE TABLE IF NOT EXISTS user_prescriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id text,
  image_url text not null,
  notes text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

ALTER TABLE public.user_prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to user_prescriptions" ON public.user_prescriptions FOR ALL USING (true) WITH CHECK (true);

-- STORAGE BUCKET FOR PHARMACY IMAGES
INSERT INTO storage.buckets (id, name, public) VALUES ('pharmacy-images', 'pharmacy-images', true);

-- Allow public access to pharmacy-images bucket
CREATE POLICY "Public access to pharmacy-images" ON storage.objects FOR SELECT USING (bucket_id = 'pharmacy-images');
CREATE POLICY "Allow uploads to pharmacy-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pharmacy-images');

-- SAMPLE VENDORS AND MENU ITEMS FOR TESTING
-- Run this to add sample data to your database

-- Insert sample vendors
INSERT INTO vendors (id, owner_name, phone, email, shop_name, address, cuisine, status) VALUES
('r1', 'Rahul Sharma', '9876543210', 'rahul@biranihouse.com', 'Biryani House', '123 MG Road, Delhi', 'North Indian', 'active'),
('r2', 'Priya Singh', '9876543211', 'priya@pizzaparadise.com', 'Pizza Paradise', '456 NS Road, Mumbai', 'Italian', 'active'),
('r3', 'Mike Chen', '9876543212', 'mike@chinesecorner.com', 'Chinese Corner', '789 BC Ave, Bangalore', 'Chinese', 'active'),
('r4', 'Anita Desai', '9876543213', 'anita@burgerbarn.com', 'Burger Barn', '321 KL Street, Chennai', 'American', 'active'),
('r5', 'Vikram Singh', '9876543214', 'vikram@icecreamscoop.com', 'Ice Cream Scoop', '555 PQ Road, Hyderabad', 'Desserts', 'active');

-- Insert sample menu items for Biryani House (r1)
INSERT INTO menu_items (vendor_id, name, price, category, image_url) VALUES
('r1', 'Chicken Biryani', 250, 'Biryani', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400'),
('r1', 'Mutton Biryani', 350, 'Biryani', 'https://images.unsplash.com/photo-1583134253734-8a8d8d5b09f5?w=400'),
('r1', 'Veg Biryani', 180, 'Biryani', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400'),
('r1', 'Chicken Fry', 150, 'Starters', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400'),
('r1', 'Dal Makhani', 120, 'Curries', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'),
('r1', 'Butter Chicken', 280, 'Curries', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400'),
('r1', 'Garlic Naan', 40, 'Breads', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('r1', 'Masala Papad', 30, 'Starters', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400');

-- Insert sample menu items for Pizza Paradise (r2)
INSERT INTO menu_items (vendor_id, name, price, category, image_url) VALUES
('r2', 'Margherita Pizza', 299, 'Pizza', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
('r2', 'Pepperoni Pizza', 399, 'Pizza', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400'),
('r2', 'Veggie Supreme', 349, 'Pizza', 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400'),
('r2', 'Chicken Wings', 199, 'Starters', 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400'),
('r2', 'Garlic Bread', 99, 'Starters', 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400'),
('r2', 'Pasta Alfredo', 249, 'Pasta', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400'),
('r2', 'Tiramisu', 149, 'Desserts', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400');

-- Insert sample menu items for Chinese Corner (r3)
INSERT INTO menu_items (vendor_id, name, price, category, image_url) VALUES
('r3', 'Chicken Fried Rice', 180, 'Rice', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400'),
('r3', 'Schezwan Noodles', 160, 'Noodles', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
('r3', 'Manchurian', 180, 'Starters', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400'),
('r3', 'Spring Rolls', 120, 'Starters', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'),
('r3', 'Chilli Chicken', 220, 'Main Course', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400'),
('r3', 'Hot & Sour Soup', 80, 'Soups', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400');

-- Insert sample menu items for Burger Barn (r4)
INSERT INTO menu_items (vendor_id, name, price, category, image_url) VALUES
('r4', 'Classic Cheeseburger', 199, 'Burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
('r4', 'Chicken Burger', 179, 'Burgers', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400'),
('r4', 'Veggie Burger', 149, 'Burgers', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400'),
('r4', 'Loaded Fries', 99, 'Sides', 'https://images.unsplash.com/photo-1573080496219-bb080dd6f248?w=400'),
('r4', 'Onion Rings', 79, 'Sides', 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400'),
('r4', 'Chocolate Milkshake', 129, 'Drinks', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400');

-- Insert sample menu items for Ice Cream Scoop (r5)
INSERT INTO menu_items (vendor_id, name, price, category, image_url) VALUES
('r5', 'Vanilla Scoop', 50, 'Ice Cream', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400'),
('r5', 'Chocolate Scoop', 50, 'Ice Cream', 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=400'),
('r5', 'Strawberry Scoop', 50, 'Ice Cream', 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400'),
('r5', 'Sundae', 120, 'Ice Cream', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400'),
('r5', 'Waffle with Ice Cream', 150, 'Desserts', 'https://images.unsplash.com/photo-1551024601-564d6dbf303f?w=400'),
('r5', 'Cold Coffee', 80, 'Drinks', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400');