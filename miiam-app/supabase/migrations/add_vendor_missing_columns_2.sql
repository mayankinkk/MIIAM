-- Add missing columns to vendors table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'banner_url') THEN
    ALTER TABLE vendors ADD COLUMN banner_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'description') THEN
    ALTER TABLE vendors ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'opening_hours') THEN
    ALTER TABLE vendors ADD COLUMN opening_hours TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'is_featured') THEN
    ALTER TABLE vendors ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
