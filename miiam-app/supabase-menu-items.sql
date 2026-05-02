-- MIIAM Database Setup - Menu Items
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- Menu Items Table (only create if not exists)
create table if not exists menu_items (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references vendors(id) on delete cascade,
  name text not null,
  price numeric not null,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table menu_items enable row level security;

-- Policies for menu_items (explicit permissions for all operations)
DROP POLICY IF EXISTS "Menu items full access" ON menu_items;
CREATE POLICY "Enable insert for menu_items" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Enable update for menu_items" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for menu_items" ON menu_items FOR DELETE USING (true);

-- Create indexes
create index if not exists idx_menu_items_vendor_id on menu_items(vendor_id);
create index if not exists idx_menu_items_category on menu_items(category);

-- Insert sample menu items for existing vendors (if menu_items is empty)
insert into menu_items (vendor_id, name, price, category)
select id, 'Chicken Biryani', 250, 'Main Course' from vendors where shop_name = 'Biryani House'
union all
select id, 'Veg Biryani', 200, 'Main Course' from vendors where shop_name = 'Biryani House'
union all
select id, 'Margherita Pizza', 350, 'Main Course' from vendors where shop_name = 'Pizza Paradise'
union all
select id, 'Pepperoni Pizza', 450, 'Main Course' from vendors where shop_name = 'Pizza Paradise'
union all
select id, 'Fried Rice', 180, 'Main Course' from vendors where shop_name = 'Chinese Corner'
union all
select id, 'Manchurian', 220, 'Main Course' from vendors where shop_name = 'Chinese Corner';

-- Confirm
select 'Setup complete!' as status;
select * from menu_items;