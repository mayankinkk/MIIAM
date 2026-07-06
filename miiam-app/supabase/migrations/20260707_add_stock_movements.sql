CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'restored', 'manual_adjustment', 'restock')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stock_movements_item ON stock_movements(menu_item_id);
CREATE INDEX idx_stock_movements_order ON stock_movements(order_id);
