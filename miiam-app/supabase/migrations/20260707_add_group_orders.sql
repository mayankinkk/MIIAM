CREATE TABLE IF NOT EXISTS group_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked', 'ordered')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_order_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_order_id UUID NOT NULL REFERENCES group_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  joined_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_group_orders_code ON group_orders(code);
CREATE INDEX idx_group_orders_creator ON group_orders(creator_id);
CREATE INDEX idx_group_order_members_group ON group_order_members(group_order_id);

ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_order_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group orders" ON group_orders
  FOR SELECT USING (true);

CREATE POLICY "Users can create group orders" ON group_orders
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creator can update group order" ON group_orders
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can view group order members" ON group_order_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join group orders" ON group_order_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON group_order_members
  FOR UPDATE USING (auth.uid() = user_id);
