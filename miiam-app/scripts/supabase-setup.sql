-- MIIAM Database Setup SQL
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Vendors Table
create table vendors (
  id uuid default uuid_generate_v4() primary key,
  owner_name text not null,
  phone text not null,
  email text,
  shop_name text not null,
  address text not null,
  city text,
  pincode text,
  cuisine text,
  gst_number text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Menu Items Table
create table menu_items (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references vendors(id) on delete cascade,
  name text not null,
  price numeric not null,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table vendors enable row level security;
alter table menu_items enable row level security;

-- Vendor Policies (explicit permissions for all operations)
DROP POLICY IF EXISTS "Vendors full access" ON vendors;
CREATE POLICY "Enable insert for all" ON vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all" ON vendors FOR SELECT USING (true);
CREATE POLICY "Enable update for all" ON vendors FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all" ON vendors FOR DELETE USING (true);

-- Menu items Policies (explicit permissions for all operations)
DROP POLICY IF EXISTS "Menu items full access" ON menu_items;
CREATE POLICY "Enable insert for menu_items" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Enable update for menu_items" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for menu_items" ON menu_items FOR DELETE USING (true);

-- Create indexes
create index idx_vendors_status on vendors(status);
create index idx_vendors_shop_name on vendors(shop_name);
create index idx_menu_items_vendor_id on menu_items(vendor_id);
create index idx_menu_items_category on menu_items(category);

-- Insert sample vendors (optional - for testing)
insert into vendors (owner_name, phone, email, shop_name, address, city, pincode, cuisine, status) values
('Rahul Sharma', '9876543210', 'rahul@biranihouse.com', 'Biryani House', '123 MG Road, Delhi', 'Delhi', '110001', 'North Indian', 'active'),
('Priya Singh', '9876543211', 'priya@pizzaparadise.com', 'Pizza Paradise', '456 NS Road, Mumbai', 'Mumbai', '400001', 'Italian', 'active'),
('Mike Chen', '9876543212', 'mike@chinesecorner.com', 'Chinese Corner', '789 BC Ave, Bangalore', 'Bangalore', '560001', 'Chinese', 'active');

-- Job Applications Table
create table job_applications (
  id uuid default uuid_generate_v4() primary key,
  full_name text,
  phone_number text,
  email text,
  passport_picture text,
  age_or_dob text,
  gender text,
  current_address text,
  city text,
  pincode text,
  landmark text,
  vehicle_type text,
  vehicle_number text,
  driving_license_number text,
  driving_license_url text,
  rc_url text,
  work_type text,
  preferred_area text,
  available_morning boolean default false,
  available_afternoon boolean default false,
  available_night boolean default false,
  work_monday boolean default false,
  work_tuesday boolean default false,
  work_wednesday boolean default false,
  work_thursday boolean default false,
  work_friday boolean default false,
  work_saturday boolean default false,
  work_sunday boolean default false,
  has_delivery_experience boolean,
  previous_platform text,
  has_smartphone boolean,
  comfortable_google_maps boolean,
  aadhaar_card_url text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table job_applications enable row level security;

drop policy if exists "Job applications full access" on job_applications;
create policy "Enable insert for job_applications" on job_applications for insert with check (true);
create policy "Enable select for job_applications" on job_applications for select using (true);
create policy "Enable update for job_applications" on job_applications for update using (true);
create policy "Enable delete for job_applications" on job_applications for delete using (true);

create index idx_job_applications_status on job_applications(status);
create index idx_job_applications_created on job_applications(created_at desc);
create index idx_job_applications_phone on job_applications(phone_number);
create index idx_job_applications_city on job_applications(city);

-- For testing - insert sample menu items
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

-- Confirm setup
select 'Tables created successfully!' as status;
select * from vendors;
select * from menu_items;