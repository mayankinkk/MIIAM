-- Fix open RLS policies from core_tables.sql
-- These policies allow ANY authenticated user to read/write ALL data

-- Drop the dangerously open policies
DROP POLICY IF EXISTS "Orders all access" ON orders;
DROP POLICY IF EXISTS "Order items all access" ON order_items;
DROP POLICY IF EXISTS "Notifications all access" ON notifications;
DROP POLICY IF EXISTS "User push tokens all access" ON user_push_tokens;
DROP POLICY IF EXISTS "Pending notifications all access" ON pending_notifications;
DROP POLICY IF EXISTS "Promo codes all access" ON promo_codes;
DROP POLICY IF EXISTS "Riders all access" ON riders;
DROP POLICY IF EXISTS "Delivery addresses all access" ON delivery_addresses;

-- Also drop any existing restrictive policies from rls_policies.sql to allow re-creation
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Vendors can view orders for their store" ON orders;
DROP POLICY IF EXISTS "Riders can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Vendors can update their order status" ON orders;
DROP POLICY IF EXISTS "Riders can update assigned orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Vendors can view their order items" ON order_items;
DROP POLICY IF EXISTS "Riders can view their order items" ON order_items;
DROP POLICY IF EXISTS "Vendors can manage order items for their store" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

DROP POLICY IF EXISTS "Users can view own push tokens" ON user_push_tokens;
DROP POLICY IF EXISTS "Users can manage own push tokens" ON user_push_tokens;

DROP POLICY IF EXISTS "Service role can manage pending notifications" ON pending_notifications;

DROP POLICY IF EXISTS "Anyone can view active promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins can manage all promo codes" ON promo_codes;

DROP POLICY IF EXISTS "Riders can view own profile" ON riders;
DROP POLICY IF EXISTS "Riders can update own profile" ON riders;
DROP POLICY IF EXISTS "Anyone can view active riders" ON riders;
DROP POLICY IF EXISTS "Admins can manage all riders" ON riders;

DROP POLICY IF EXISTS "Users can view own addresses" ON delivery_addresses;
DROP POLICY IF EXISTS "Users can manage own addresses" ON delivery_addresses;
DROP POLICY IF EXISTS "Admins can manage all addresses" ON delivery_addresses;

-- ORDERS: proper restrictive policies
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vendors can view orders for their store" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM vendors WHERE id = orders.vendor_id AND user_id = auth.uid())
  );
CREATE POLICY "Riders can view assigned orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM riders WHERE id = orders.rider_id AND user_id = auth.uid())
  );
CREATE POLICY "Vendors can update their order status" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM vendors WHERE id = orders.vendor_id AND user_id = auth.uid())
  );
CREATE POLICY "Riders can update assigned orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM riders WHERE id = orders.rider_id AND user_id = auth.uid())
  );
CREATE POLICY "Authenticated users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ORDER ITEMS: proper restrictive policies
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
  );
CREATE POLICY "Vendors can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders JOIN vendors ON orders.vendor_id = vendors.id
      WHERE orders.id = order_items.order_id AND vendors.user_id = auth.uid())
  );
CREATE POLICY "Riders can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders JOIN riders ON orders.rider_id = riders.id
      WHERE orders.id = order_items.order_id AND riders.user_id = auth.uid())
  );
CREATE POLICY "Vendors can manage order items for their store" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM orders JOIN vendors ON orders.vendor_id = vendors.id
      WHERE orders.id = order_items.order_id AND vendors.user_id = auth.uid())
  );
CREATE POLICY "Admins can manage all order items" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- NOTIFICATIONS: users see own, admins manage all
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- USER PUSH TOKENS: users manage own tokens
CREATE POLICY "Users can view own push tokens" ON user_push_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own push tokens" ON user_push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- PENDING NOTIFICATIONS: service role only
CREATE POLICY "Service role can manage pending notifications" ON pending_notifications
  FOR ALL USING (true);

-- PROMO CODES: anyone reads, admins manage
CREATE POLICY "Anyone can view active promo codes" ON promo_codes
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage all promo codes" ON promo_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RIDERS: riders manage own, admins manage all, others read limited
CREATE POLICY "Riders can view own profile" ON riders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Riders can update own profile" ON riders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active riders" ON riders
  FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage all riders" ON riders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELIVERY ADDRESSES: users manage own
CREATE POLICY "Users can view own addresses" ON delivery_addresses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own addresses" ON delivery_addresses
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all addresses" ON delivery_addresses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
