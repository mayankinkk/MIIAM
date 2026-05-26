CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  recipient TEXT NOT NULL DEFAULT '',
  message TEXT DEFAULT '',
  design TEXT DEFAULT 'celebration',
  is_redeemed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  redeemed_at TIMESTAMPTZ
);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gift cards"
  ON gift_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own gift cards"
  ON gift_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gift cards"
  ON gift_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gift cards"
  ON gift_cards FOR DELETE
  USING (auth.uid() = user_id);
