-- Safe, idempotent SQL script to add missing columns to the vendors table.
-- Run this in your Supabase Dashboard SQL Editor to update your tables.

DO $$ 
BEGIN
  -- Add city column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'city') THEN
    ALTER TABLE vendors ADD COLUMN city TEXT;
  END IF;

  -- Add state column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'state') THEN
    ALTER TABLE vendors ADD COLUMN state TEXT;
  END IF;

  -- Add pincode column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'pincode') THEN
    ALTER TABLE vendors ADD COLUMN pincode TEXT;
  END IF;

  -- Add landmark column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'landmark') THEN
    ALTER TABLE vendors ADD COLUMN landmark TEXT;
  END IF;

  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'latitude') THEN
    ALTER TABLE vendors ADD COLUMN latitude DOUBLE PRECISION;
  END IF;

  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'longitude') THEN
    ALTER TABLE vendors ADD COLUMN longitude DOUBLE PRECISION;
  END IF;

  -- Add pan_number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'pan_number') THEN
    ALTER TABLE vendors ADD COLUMN pan_number TEXT;
  END IF;

  -- Add fssai_number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'fssai_number') THEN
    ALTER TABLE vendors ADD COLUMN fssai_number TEXT;
  END IF;

  -- Add min_order_amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'min_order_amount') THEN
    ALTER TABLE vendors ADD COLUMN min_order_amount NUMERIC DEFAULT 0;
  END IF;

  -- Add delivery_time_min column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'delivery_time_min') THEN
    ALTER TABLE vendors ADD COLUMN delivery_time_min INTEGER;
  END IF;

  -- Add delivery_time_max column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'delivery_time_max') THEN
    ALTER TABLE vendors ADD COLUMN delivery_time_max INTEGER;
  END IF;

  -- Add is_pure_veg column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'is_pure_veg') THEN
    ALTER TABLE vendors ADD COLUMN is_pure_veg BOOLEAN DEFAULT false;
  END IF;

END $$;

-- Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
