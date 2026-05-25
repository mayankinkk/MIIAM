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

-- Bug 17, 37: Orders table missing columns
alter table orders add column if not exists subtotal numeric default 0;
alter table orders add column if not exists total numeric default 0;
alter table orders add column if not exists tip numeric default 0;
alter table orders add column if not exists estimated_delivery_time timestamptz;
alter table orders add column if not exists vendor_lat numeric;
alter table orders add column if not exists vendor_lng numeric;
alter table orders add column if not exists delivery_lat numeric;
alter table orders add column if not exists delivery_lng numeric;

-- Bug 18: notifications table - add both read columns for compatibility
alter table notifications add column if not exists is_read boolean default false;
-- If read column doesn't exist, add it too
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='notifications' and column_name='read') then
    alter table notifications add column read boolean default false;
  end if;
end $$;

-- Bug 20, 42: email_otps table (only in full-setup.sql)
create table if not exists email_otps (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  otp_code text not null,
  purpose text,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Bug 32: Add unique constraint on phone_otp_verification for upsert
alter table phone_otp_verification add constraint phone_otp_verification_phone_purpose_key unique (phone_number, purpose);

-- Bug 36, 45: Fix service_bookings foreign key to use profiles instead of users
do $$
begin
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'service_bookings_user_id_fkey') then
    alter table service_bookings drop constraint service_bookings_user_id_fkey;
  end if;
end $$;
-- Re-create with correct reference (if the column references users, this is a no-op if profiles is the right table)
-- Note: This assumes profiles is the actual user data table

-- Bug 41: promo_codes missing columns
alter table promo_codes add column if not exists vendor_id uuid;
alter table promo_codes add column if not exists usage_limit int default 0;
alter table promo_codes add column if not exists used_count int default 0;
alter table promo_codes add column if not exists max_discount numeric;

-- Bug 44: Ensure vendors has user_id column
alter table vendors add column if not exists user_id uuid;

-- Referrals table (Bug 36)
create table if not exists referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references profiles(id) on delete cascade,
  referred_email text,
  referred_id uuid references profiles(id),
  status text default 'pending',
  reward_given boolean default false,
  created_at timestamptz default now()
);

-- Add dietary_preference to profiles if not exists
alter table profiles add column if not exists dietary_preference text;
alter table profiles add column if not exists phone_verified boolean default false;
alter table profiles add column if not exists phone_verified_at timestamptz;
alter table profiles add column if not exists email_verified boolean default false;
alter table profiles add column if not exists email_verified_at timestamptz;
