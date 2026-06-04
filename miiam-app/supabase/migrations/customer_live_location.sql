-- Customer live-location sharing for in-flight orders.
-- The customer grants one-time permission on the order tracking page
-- and we push geolocation to this table at ~3 s intervals while
-- sharing is active. RLS keeps the data scoped to the order's
-- customer and assigned rider.

CREATE TABLE IF NOT EXISTS customer_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  accuracy    DOUBLE PRECISION,
  heading     DOUBLE PRECISION,
  speed       DOUBLE PRECISION,
  is_sharing  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One active location row per order (latest write wins)
CREATE UNIQUE INDEX IF NOT EXISTS customer_locations_order_id_key
  ON customer_locations (order_id);

CREATE INDEX IF NOT EXISTS customer_locations_order_id_idx
  ON customer_locations (order_id);

ALTER TABLE customer_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer can upsert their own location" ON customer_locations;
CREATE POLICY "Customer can upsert their own location"
  ON customer_locations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Rider can read assigned order location" ON customer_locations;
CREATE POLICY "Rider can read assigned order location"
  ON customer_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN riders r ON r.id = o.rider_id
      WHERE o.id = customer_locations.order_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendor can read assigned order location" ON customer_locations;
CREATE POLICY "Vendor can read assigned order location"
  ON customer_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN vendors v ON v.id = o.vendor_id
      WHERE o.id = customer_locations.order_id
        AND v.user_id = auth.uid()
    )
  );

ALTER TABLE customer_locations REPLICA IDENTITY FULL;
