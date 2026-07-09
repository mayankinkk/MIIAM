-- Fix missing tables and columns referenced in code but never created

-- Bug 13: user_addresses table
create table if not exists user_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  label text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  lat numeric,
  lng numeric,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Bug 14: provider_availability table
create table if not exists provider_availability (
  id uuid default gen_random_uuid() primary key,
  provider_id uuid references vendors(id) on delete cascade,
  day_of_week int not null,
  start_time time,
  end_time time,
  is_available boolean default true
);

-- Bug 15: site_settings table
create table if not exists site_settings (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text,
  updated_at timestamptz default now()
);

-- Bug 16: rider_documents table
create table if not exists rider_documents (
  id uuid default gen_random_uuid() primary key,
  rider_id uuid references riders(id) on delete cascade,
  type text not null,
  url text,
  status text default 'pending',
  verified_at timestamptz,
  created_at timestamptz default now()
);

-- Bug 17, 37: Orders table missing columns (only if table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'orders') then
    alter table orders add column if not exists subtotal numeric default 0;
    alter table orders add column if not exists total numeric default 0;
    alter table orders add column if not exists tip numeric default 0;
    alter table orders add column if not exists estimated_delivery_time timestamptz;
    alter table orders add column if not exists vendor_lat numeric;
    alter table orders add column if not exists vendor_lng numeric;
    alter table orders add column if not exists delivery_lat numeric;
    alter table orders add column if not exists delivery_lng numeric;
  end if;
end $$;

-- Bug 18: notifications table - add both read columns for compatibility
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'notifications') then
    alter table notifications add column if not exists is_read boolean default false;
    if not exists (select 1 from information_schema.columns where table_name='notifications' and column_name='read') then
      alter table notifications add column read boolean default false;
    end if;
  end if;
end $$;

-- Bug 41: promo_codes missing columns
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'promo_codes') then
    alter table promo_codes add column if not exists vendor_id uuid;
    alter table promo_codes add column if not exists usage_limit int default 0;
    alter table promo_codes add column if not exists used_count int default 0;
    alter table promo_codes add column if not exists max_discount numeric;
  end if;
end $$;

-- Bug 44: Ensure vendors has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'vendors') then
    alter table vendors add column if not exists user_id uuid;
  end if;
end $$;

-- Add columns to profiles
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'profiles') then
    alter table profiles add column if not exists dietary_preference text;
    alter table profiles add column if not exists phone_verified boolean default false;
    alter table profiles add column if not exists phone_verified_at timestamptz;
    alter table profiles add column if not exists email_verified boolean default false;
    alter table profiles add column if not exists email_verified_at timestamptz;
  end if;
end $$;
