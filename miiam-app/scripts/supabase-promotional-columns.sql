-- Add promotional columns to vendors table
-- Run this in your Supabase SQL Editor

-- Add Featured/Promoted/New columns to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendors_is_featured ON vendors(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_vendors_is_promoted ON vendors(is_promoted) WHERE is_promoted = true;
CREATE INDEX IF NOT EXISTS idx_vendors_is_new ON vendors(is_new) WHERE is_new = true;

-- Add RLS policies (Row Level Security)
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read vendors
CREATE POLICY "Allow authenticated read" ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to update vendors (admin only)
CREATE POLICY "Allow authenticated update" ON vendors
  FOR UPDATE
  TO authenticated
  USING (true);

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name IN ('is_featured', 'is_promoted', 'is_new');

-- Example: Set a vendor as featured
-- UPDATE vendors SET is_featured = true WHERE id = 'your-vendor-id';

-- Example: Set a vendor as promoted
-- UPDATE vendors SET is_promoted = true WHERE id = 'your-vendor-id';

-- Example: Set a vendor as new
-- UPDATE vendors SET is_new = true WHERE id = 'your-vendor-id';

-- Example: Query featured/promoted vendors for homepage
-- SELECT * FROM vendors WHERE is_active = true AND (is_featured = true OR is_promoted = true) ORDER BY rating DESC;