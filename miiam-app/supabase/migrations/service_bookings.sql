-- Service Bookings Table
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  service_type VARCHAR(50) NOT NULL,
  sub_service VARCHAR(100),
  user_name VARCHAR(100) NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time VARCHAR(20) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  amount DECIMAL(10, 2) NOT NULL,
  provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  provider_name VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Service Providers Table
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  earnings DECIMAL(10, 2) DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Categories Table
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Items Table
CREATE TABLE IF NOT EXISTS service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_bookings_user_id ON service_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_scheduled_date ON service_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_service_type ON service_providers(service_type);

-- Enable Realtime for service_bookings
ALTER PUBLICATION supabase_realtime ADD TABLE service_bookings;

-- RLS Policies
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

-- Service Bookings Policies
CREATE POLICY "Users can view own bookings" ON service_bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view all bookings" ON service_bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create bookings" ON service_bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can update bookings" ON service_bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service Providers Policies
CREATE POLICY "Public can view available providers" ON service_providers
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admin can manage providers" ON service_providers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default service categories
INSERT INTO service_categories (name, icon, description, display_order) VALUES
  ('AC Repair', 'ac_unit', 'Air conditioning repair and maintenance', 1),
  ('Plumbing', 'plumbing', 'Pipe, tap and drainage services', 2),
  ('Electrical', 'electrical_services', 'Wiring and electrical repairs', 3),
  ('Cleaning', 'cleaning_services', 'Home and deep cleaning services', 4),
  ('Appliance', 'kitchen', 'Home appliance repair', 5),
  ('Pest Control', 'bug_report', 'Pest and termite control', 6)
ON CONFLICT (name) DO NOTHING;