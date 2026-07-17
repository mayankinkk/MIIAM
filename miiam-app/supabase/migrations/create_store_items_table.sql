CREATE TABLE IF NOT EXISTS store_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  image_url TEXT,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  vendor_name TEXT,
  category TEXT NOT NULL DEFAULT 'under_99',
  is_veg BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category);
CREATE INDEX IF NOT EXISTS idx_store_items_active ON store_items(is_active);
CREATE INDEX IF NOT EXISTS idx_store_items_price ON store_items(price);

ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for store_items"
  ON store_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access for store_items"
  ON store_items FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated insert for store_items"
  ON store_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated update for store_items"
  ON store_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated delete for store_items"
  ON store_items FOR DELETE
  USING (auth.uid() IS NOT NULL);
