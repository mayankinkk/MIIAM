-- Rider Wallet for advance payments
CREATE TABLE IF NOT EXISTS rider_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES riders(id),
  amount DECIMAL(10,2) NOT NULL,
  type TEXT CHECK (type IN ('advance', 'expense', 'payout', 'earning')) NOT NULL,
  description TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add item status tracking to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'unavailable', 'different_brand'));
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS picked BOOLEAN DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS actual_price DECIMAL(10,2);

-- Add delivery notes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Rider wallets table
CREATE TABLE IF NOT EXISTS rider_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES riders(id) UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0,
  pending_payout DECIMAL(10,2) DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  advance_used DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable real-time for orders
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;