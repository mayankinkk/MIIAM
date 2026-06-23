-- Service settings table for admin-controlled service configuration
CREATE TABLE IF NOT EXISTS service_settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  message TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'settings',
  hours_open TEXT NOT NULL DEFAULT '06:00',
  hours_close TEXT NOT NULL DEFAULT '23:59',
  hours_is_24x7 BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: only admins can read/write
ALTER TABLE service_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view service settings"
  ON service_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can insert service settings"
  ON service_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can update service settings"
  ON service_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Anyone can read service settings"
  ON service_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read service settings"
  ON service_settings FOR SELECT
  TO authenticated
  USING (true);

-- Seed default rows
INSERT INTO service_settings (id, name, is_enabled, message, icon, hours_open, hours_close, hours_is_24x7)
VALUES
  ('food', 'Food Delivery', true, 'Food delivery is currently under maintenance', 'restaurant', '06:00', '23:59', false),
  ('grocery', 'Grocery', true, 'Grocery service is coming soon!', 'shopping_cart', '06:00', '23:59', false),
  ('printing', 'Printing', true, 'Printing service is under maintenance', 'print', '06:00', '23:59', false),
  ('beauty', 'Beauty & Wellness', true, 'Beauty service is under maintenance', 'spa', '06:00', '23:59', false),
  ('ac', 'AC Repair', true, 'AC repair service is under maintenance', 'ac_unit', '06:00', '23:59', false),
  ('cleaning', 'Home Cleaning', true, 'Home cleaning service is coming soon!', 'cleaning_services', '06:00', '23:59', false),
  ('plumbing', 'Plumbing', true, 'Plumbing service is under maintenance', 'plumbing', '06:00', '23:59', false),
  ('electrical', 'Electrical', true, 'Electrical service is coming soon!', 'electrical_services', '06:00', '23:59', false),
  ('pest', 'Pest Control', true, 'Pest control service is under maintenance', 'pest_control', '06:00', '23:59', false),
  ('car', 'Car Repair', true, 'Car repair service is coming soon!', 'directions_car', '06:00', '23:59', false),
  ('appliance', 'Appliance Repair', true, 'Appliance repair is under maintenance', 'kitchen', '06:00', '23:59', false)
ON CONFLICT (id) DO NOTHING;
