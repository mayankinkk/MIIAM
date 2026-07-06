CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  balance NUMERIC(10,2) NOT NULL,
  initial_amount NUMERIC(10,2) NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchased', 'redeemed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_sender ON gift_cards(sender_id);
CREATE INDEX idx_gift_cards_recipient ON gift_cards(recipient_id);
CREATE INDEX idx_gift_card_transactions_card ON gift_card_transactions(gift_card_id);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sent gift cards" ON gift_cards
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can view received gift cards" ON gift_cards
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can create gift cards" ON gift_cards
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view own gift card transactions" ON gift_card_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage gift cards" ON gift_cards
  FOR ALL USING (auth.role() = 'service_role');
