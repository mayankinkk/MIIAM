-- Fix: Riders cannot complete delivery because the RLS policy only allows updates
-- when orders.rider_id already matches. This migration broadens the policy to also
-- allow riders to claim/update orders that are unassigned (rider_id IS NULL).

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Riders can update assigned orders" ON orders;

-- New policy: rider can update an order if they ARE the assigned rider,
-- OR the order has no rider yet (so they can claim it and set rider_id).
CREATE POLICY "Riders can update assigned orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM riders
      WHERE riders.user_id = auth.uid()
      AND (orders.rider_id = riders.id OR orders.rider_id IS NULL)
    )
  );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
