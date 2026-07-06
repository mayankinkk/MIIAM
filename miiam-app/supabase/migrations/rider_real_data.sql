-- MIIAM Rider Real Data Migration
-- Adds missing tables and columns for real data support

-- Add rider_earning column to orders (used extensively in code but missing)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_earning DECIMAL(10,2) DEFAULT 0;

-- Add rating column to orders (for rider-to-customer ratings)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_feedback JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_rated_at TIMESTAMP;

-- Add total_earnings column to riders (used in code but might be missing in some schemas)
ALTER TABLE riders ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;

-- Rider Notifications table
CREATE TABLE IF NOT EXISTS rider_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES riders(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rider Training Progress table
CREATE TABLE IF NOT EXISTS rider_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES riders(id),
  video_id TEXT NOT NULL,
  is_watched BOOLEAN DEFAULT FALSE,
  quiz_score INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rider_id, video_id)
);

-- Rider Vehicles table
CREATE TABLE IF NOT EXISTS rider_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES riders(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('bike', 'scooter', 'car')) NOT NULL,
  model TEXT,
  number TEXT,
  insurance_expiry DATE,
  license_expiry DATE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicle Maintenance Records
CREATE TABLE IF NOT EXISTS rider_vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES rider_vehicles(id),
  date DATE NOT NULL,
  type TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  odometer INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vehicle Fuel Log
CREATE TABLE IF NOT EXISTS rider_vehicle_fuel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES rider_vehicles(id),
  date DATE NOT NULL,
  liters DECIMAL(5,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  odometer INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rider Incidents table
CREATE TABLE IF NOT EXISTS rider_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES riders(id),
  type TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status TEXT DEFAULT 'reported',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rider Settings table
CREATE TABLE IF NOT EXISTS rider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES riders(id) UNIQUE,
  dark_mode BOOLEAN DEFAULT FALSE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibration_enabled BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'English',
  auto_accept BOOLEAN DEFAULT FALSE,
  only_high_earnings BOOLEAN DEFAULT FALSE,
  preferred_order_types TEXT[] DEFAULT ARRAY['food', 'grocery'],
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rider Shifts table
CREATE TABLE IF NOT EXISTS rider_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES riders(id),
  shift_name TEXT NOT NULL,
  hours TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rider_id, shift_name)
);

-- Rider Quest Progress table (for dashboard quests)
CREATE TABLE IF NOT EXISTS rider_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES riders(id),
  quest_id INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  bonus INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rider_id, quest_id)
);

-- Rider Streak tracking
ALTER TABLE riders ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS last_work_date DATE;

-- Enable RLS on all new tables
ALTER TABLE rider_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_vehicle_fuel ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_quest_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for all new tables
CREATE POLICY "Allow all on rider_notifications" ON rider_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rider_training_progress" ON rider_training_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rider_vehicles" ON rider_vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rider_vehicle_maintenance" ON rider_vehicle_maintenance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rider_vehicle_fuel" ON rider_vehicle_fuel FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rider_incidents" ON rider_incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rider_settings" ON rider_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rider_shifts" ON rider_shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rider_quest_progress" ON rider_quest_progress FOR ALL USING (true) WITH CHECK (true);

-- Enable real-time for new tables
ALTER TABLE rider_notifications REPLICA IDENTITY FULL;
ALTER TABLE rider_training_progress REPLICA IDENTITY FULL;
ALTER TABLE rider_vehicles REPLICA IDENTITY FULL;
ALTER TABLE rider_vehicle_maintenance REPLICA IDENTITY FULL;
ALTER TABLE rider_vehicle_fuel REPLICA IDENTITY FULL;
ALTER TABLE rider_incidents REPLICA IDENTITY FULL;
ALTER TABLE rider_settings REPLICA IDENTITY FULL;
ALTER TABLE rider_shifts REPLICA IDENTITY FULL;
ALTER TABLE rider_quest_progress REPLICA IDENTITY FULL;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
