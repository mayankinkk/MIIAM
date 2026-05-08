-- Order Matching System - 5 minute notification for riders, auto-expire

-- Add columns to orders table for notification tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notification_sent_at') THEN
    ALTER TABLE orders ADD COLUMN notification_sent_at TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'expires_at') THEN
    ALTER TABLE orders ADD COLUMN expires_at TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notified_users') THEN
    ALTER TABLE orders ADD COLUMN notified_users TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'no_rider_notified') THEN
    ALTER TABLE orders ADD COLUMN no_rider_notified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create order_offers table to track which riders are looking at which orders
CREATE TABLE IF NOT EXISTS order_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'snoozed', 'accepted', 'expired', 'cancelled')),
  snoozed_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(order_id, rider_id)
);

-- Enable RLS on order_offers
ALTER TABLE order_offers ENABLE ROW LEVEL SECURITY;

-- Policies for order_offers
DROP POLICY IF EXISTS "Order offers all access" ON order_offers;
CREATE POLICY "Order offers all access" ON order_offers FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for order_offers
CREATE INDEX IF NOT EXISTS idx_order_offers_order_id ON order_offers(order_id);
CREATE INDEX IF NOT EXISTS idx_order_offers_rider_id ON order_offers(rider_id);
CREATE INDEX IF NOT EXISTS idx_order_offers_status ON order_offers(status);

-- Create function to auto-expire orders and notify users
CREATE OR REPLACE FUNCTION check_expired_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_order RECORD;
  user_notified TEXT;
BEGIN
  -- Find orders that have expired (no rider assigned after 5 min) and haven't notified user
  FOR expired_order IN
    SELECT o.id, o.user_id, o.notified_users
    FROM orders o
    WHERE o.rider_id IS NULL
      AND o.status = 'pending'
      AND o.expires_at IS NOT NULL
      AND o.expires_at < NOW()
      AND o.no_rider_notified = FALSE
  LOOP
    -- Mark order as no rider available
    UPDATE orders
    SET no_rider_notified = TRUE, updated_at = NOW()
    WHERE id = expired_order.id;

    -- Insert notification for user (will be picked up by polling/push)
    INSERT INTO notifications (user_id, title, message, type, read, icon)
    VALUES (
      expired_order.user_id,
      'No Rider Available',
      'Sorry, no riders are available for your order right now. Please try again in a few minutes.',
      'order_failed',
      false,
      'local_shipping'
    );
  END LOOP;
END;
$$;

-- Create function to assign order to rider (atomic operation)
CREATE OR REPLACE FUNCTION accept_order_as_rider(p_order_id UUID, p_rider_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_exists BOOLEAN;
  already_assigned BOOLEAN;
BEGIN
  -- Check if order exists and is still available
  SELECT EXISTS(SELECT 1 FROM orders WHERE id = p_order_id AND rider_id IS NULL AND status = 'pending')
  INTO order_exists;

  IF NOT order_exists THEN
    RETURN FALSE;
  END IF;

  -- Check if this rider already has an active offer
  SELECT EXISTS(SELECT 1 FROM order_offers WHERE order_id = p_order_id AND rider_id = p_rider_id AND status = 'active')
  INTO already_assigned;

  -- Update the order atomically
  UPDATE orders
  SET rider_id = p_rider_id,
      status = 'accepted',
      accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_order_id
    AND rider_id IS NULL
    AND status = 'pending';

  IF NOT FOUND THEN
    -- Another rider already took it
    RETURN FALSE;
  END IF;

  -- Update all offers for this order to cancelled (except the accepting rider)
  UPDATE order_offers
  SET status = 'cancelled', updated_at = NOW()
  WHERE order_id = p_order_id AND rider_id != p_rider_id;

  -- Mark accepting rider's offer as accepted
  UPDATE order_offers
  SET status = 'accepted', updated_at = NOW()
  WHERE order_id = p_order_id AND rider_id = p_rider_id;

  RETURN TRUE;
END;
$$;

-- Create function to snooze order for a rider
CREATE OR REPLACE FUNCTION snooze_order_for_rider(p_order_id UUID, p_rider_id UUID, p_seconds INTEGER DEFAULT 30)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO order_offers (order_id, rider_id, status, snoozed_until)
  VALUES (p_order_id, p_rider_id, 'snoozed', NOW() + (p_seconds || ' seconds')::interval)
  ON CONFLICT (order_id, rider_id)
  DO UPDATE SET status = 'snoozed', snoozed_until = NOW() + (p_seconds || ' seconds')::interval, updated_at = NOW();
END;
$$;

-- Create function to record rider viewing an order
CREATE OR REPLACE FUNCTION view_order_as_rider(p_order_id UUID, p_rider_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO order_offers (order_id, rider_id, status)
  VALUES (p_order_id, p_rider_id, 'active')
  ON CONFLICT (order_id, rider_id)
  DO UPDATE SET status = 'active', updated_at = NOW();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_expired_orders() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION accept_order_as_rider(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION snooze_order_for_rider(UUID, UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION view_order_as_rider(UUID, UUID) TO anon, authenticated;