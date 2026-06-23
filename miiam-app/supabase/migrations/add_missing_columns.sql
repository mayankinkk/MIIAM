-- Idempotent migration to add all missing columns to vendors and menu_items
-- Safe to run multiple times

DO $$
BEGIN
  -- Vendors table: add missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'type') THEN
    ALTER TABLE vendors ADD COLUMN type TEXT DEFAULT 'food';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'description') THEN
    ALTER TABLE vendors ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'image_url') THEN
    ALTER TABLE vendors ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'cover_image_url') THEN
    ALTER TABLE vendors ADD COLUMN cover_image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'banner_url') THEN
    ALTER TABLE vendors ADD COLUMN banner_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'rating') THEN
    ALTER TABLE vendors ADD COLUMN rating NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'review_count') THEN
    ALTER TABLE vendors ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'rating_count') THEN
    ALTER TABLE vendors ADD COLUMN rating_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'delivery_time_min') THEN
    ALTER TABLE vendors ADD COLUMN delivery_time_min INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'delivery_time_max') THEN
    ALTER TABLE vendors ADD COLUMN delivery_time_max INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'delivery_time') THEN
    ALTER TABLE vendors ADD COLUMN delivery_time INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'delivery_charge') THEN
    ALTER TABLE vendors ADD COLUMN delivery_charge NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'min_order_amount') THEN
    ALTER TABLE vendors ADD COLUMN min_order_amount NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'latitude') THEN
    ALTER TABLE vendors ADD COLUMN latitude DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'longitude') THEN
    ALTER TABLE vendors ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'opening_hours') THEN
    ALTER TABLE vendors ADD COLUMN opening_hours TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'is_featured') THEN
    ALTER TABLE vendors ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'is_new') THEN
    ALTER TABLE vendors ADD COLUMN is_new BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'is_promoted') THEN
    ALTER TABLE vendors ADD COLUMN is_promoted BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'is_pure_veg') THEN
    ALTER TABLE vendors ADD COLUMN is_pure_veg BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'user_id') THEN
    ALTER TABLE vendors ADD COLUMN user_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'state') THEN
    ALTER TABLE vendors ADD COLUMN state TEXT;
  END IF;

  -- Menu items table: add missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'description') THEN
    ALTER TABLE menu_items ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_veg') THEN
    ALTER TABLE menu_items ADD COLUMN is_veg BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_available') THEN
    ALTER TABLE menu_items ADD COLUMN is_available BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_featured') THEN
    ALTER TABLE menu_items ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'preparation_time') THEN
    ALTER TABLE menu_items ADD COLUMN preparation_time INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'menu_slot') THEN
    ALTER TABLE menu_items ADD COLUMN menu_slot TEXT;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
