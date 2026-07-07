-- Fix: Add INSERT policy for order_items so customers can place orders
-- The existing policies only allow vendors and admins to manage order_items,
-- but customers need to INSERT order_items when placing orders.

DROP POLICY IF EXISTS "Order items all access" ON order_items;
DROP POLICY IF EXISTS "Users create order items for own orders" ON order_items;

CREATE POLICY "Users create order items for own orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
  );

-- Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
