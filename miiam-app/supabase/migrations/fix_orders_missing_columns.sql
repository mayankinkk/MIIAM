-- Add missing columns to orders table that the code expects but were only
-- defined in the consolidated schema's CREATE TABLE IF NOT EXISTS (which was a no-op
-- because the table already existed from supabase-full-setup.sql).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng NUMERIC;

-- Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
