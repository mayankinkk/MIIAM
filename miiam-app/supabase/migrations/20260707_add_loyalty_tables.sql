-- Loyalty points balance per user
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Loyalty history (earn, redeem, bonus)
CREATE TABLE IF NOT EXISTS loyalty_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'bonus')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX idx_loyalty_history_user ON loyalty_history(user_id);
CREATE INDEX idx_loyalty_history_order ON loyalty_history(order_id);

ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty points" ON loyalty_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own loyalty history" ON loyalty_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage loyalty points" ON loyalty_points
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage loyalty history" ON loyalty_history
  FOR ALL USING (auth.role() = 'service_role');
