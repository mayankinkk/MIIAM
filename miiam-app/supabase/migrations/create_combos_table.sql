-- Create combos table for MIIAM
CREATE TABLE IF NOT EXISTS combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  original_price NUMERIC(10,2) NOT NULL,
  combo_price NUMERIC(10,2) NOT NULL,
  items TEXT[] DEFAULT '{}',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies (drop first to avoid conflicts)
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Combos are viewable by everyone" ON combos;
CREATE POLICY "Combos are viewable by everyone" ON combos
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can manage combos" ON combos;
CREATE POLICY "Anyone can manage combos" ON combos
  FOR ALL USING (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_combos_vendor_id ON combos(vendor_id);
CREATE INDEX IF NOT EXISTS idx_combos_active ON combos(is_active);
CREATE INDEX IF NOT EXISTS idx_combos_display_order ON combos(display_order);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_combos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_combos_updated_at ON combos;
CREATE TRIGGER update_combos_updated_at
  BEFORE UPDATE ON combos
  FOR EACH ROW
  EXECUTE FUNCTION update_combos_updated_at();
