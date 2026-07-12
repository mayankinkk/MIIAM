CREATE TABLE IF NOT EXISTS home_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  gradient TEXT NOT NULL DEFAULT 'from-blue-500 to-indigo-500',
  link_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0,
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE home_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for home_promotions"
  ON home_promotions FOR SELECT
  USING (true);

CREATE POLICY "Admin full access for home_promotions"
  ON home_promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

INSERT INTO home_promotions (badge, title, subtitle, gradient, link_url, position, is_active)
VALUES
  ('NEW USER', 'First Order 20% OFF', 'Use code WELCOME20', 'from-orange-500 to-red-500', NULL, 1, true),
  ('FREE DELIVERY', 'Free Delivery', 'On orders above ₹199', 'from-green-500 to-emerald-500', NULL, 2, true),
  ('FLAT OFF', 'Flat ₹100 OFF', 'On orders above ₹300', 'from-blue-500 to-indigo-500', NULL, 3, true);
