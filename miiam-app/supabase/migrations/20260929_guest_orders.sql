-- Guest checkout: orders must accept rows that have no auth user.
-- Run this in the Supabase SQL editor (or `supabase db push`).
--
-- Verify afterwards with:
--   SELECT is_nullable FROM information_schema.columns
--    WHERE table_name = 'orders' AND column_name = 'user_id';  -- should be YES

BEGIN;

ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

COMMIT;

-- Inserts still happen through the service-role API route (/api/orders),
-- so no RLS change is required. Existing policies are unaffected:
--   * signed-in customers keep creating orders with their own user_id
--   * admins keep full access via "Admins can manage all orders"
--   * anon clients can never read another customer's rows
