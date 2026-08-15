-- Fix store_items RLS: allow authenticated users to read all items (not just active)
DROP POLICY IF EXISTS "Public read access for store_items" ON store_items;
DROP POLICY IF EXISTS "Authenticated read for store_items" ON store_items;

CREATE POLICY "Authenticated read all store_items"
  ON store_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public read active store_items"
  ON store_items FOR SELECT
  USING (is_active = true);

SELECT pg_notify('pgrst', 'reload schema');
