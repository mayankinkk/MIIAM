-- Core tables for MIIAM delivery system (Idempotent - safe to run multiple times)

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  vendor_id UUID REFERENCES vendors(id),
  rider_id UUID,
  status TEXT DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 5.99,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,
  delivery_address TEXT,
  delivery_address_id UUID,
  special_instructions TEXT,
  delivery_notes TEXT,
  placed_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  delivered_at TIMESTAMP,
  estimated_delivery TIMESTAMP,
  customer_collected NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  special_notes TEXT,
  status TEXT DEFAULT 'pending',
  picked BOOLEAN DEFAULT FALSE,
  actual_price NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  icon TEXT,
  action_url TEXT,
  type TEXT DEFAULT 'system',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Push Tokens Table
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  token TEXT NOT NULL,
  device_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pending Notifications Table
CREATE TABLE IF NOT EXISTS pending_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  icon TEXT,
  action_url TEXT,
  type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Promo Codes Table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  discount_type TEXT,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Riders Table
CREATE TABLE IF NOT EXISTS riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  phone TEXT,
  email TEXT,
  profile_image TEXT,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  vehicle_type TEXT,
  vehicle_number TEXT,
  city TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Addresses Table
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  label TEXT,
  street TEXT NOT NULL,
  city TEXT,
  state TEXT,
  pincode TEXT,
  landmark TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Orders all access" ON orders;
CREATE POLICY "Orders all access" ON orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Order items all access" ON order_items;
CREATE POLICY "Order items all access" ON order_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Notifications all access" ON notifications;
CREATE POLICY "Notifications all access" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "User push tokens all access" ON user_push_tokens;
CREATE POLICY "User push tokens all access" ON user_push_tokens FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Pending notifications all access" ON pending_notifications;
CREATE POLICY "Pending notifications all access" ON pending_notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Promo codes all access" ON promo_codes;
CREATE POLICY "Promo codes all access" ON promo_codes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Riders all access" ON riders;
CREATE POLICY "Riders all access" ON riders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Delivery addresses all access" ON delivery_addresses;
CREATE POLICY "Delivery addresses all access" ON delivery_addresses FOR ALL USING (true) WITH CHECK (true);

-- Enable Real-time
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Indexes (IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_rider_id ON orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_riders_user_id ON riders(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_user_id ON delivery_addresses(user_id);

-- Insert sample promo codes (will not duplicate)
INSERT INTO promo_codes (code, discount_value, discount_type, min_order_amount, is_active) VALUES
('FIRST50', 50, 'flat', 200, true),
('MIIAM20', 20, 'percentage', 100, true),
('SAVE50', 50, 'flat', 300, true)
ON CONFLICT (code) DO NOTHING;