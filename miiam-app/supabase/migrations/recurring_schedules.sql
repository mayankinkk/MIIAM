CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id TEXT,
  status TEXT DEFAULT 'active',
  frequency TEXT NOT NULL,
  day_of_week INT,
  day_of_month INT,
  delivery_time TEXT,
  delivery_address TEXT,
  payment_method TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  next_delivery_date TIMESTAMPTZ,
  last_order_created_at TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedules"
  ON recurring_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own schedules"
  ON recurring_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON recurring_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON recurring_schedules FOR DELETE
  USING (auth.uid() = user_id);
