-- Seed a synthetic menu_item for the MIIAM Print Store so print cart
-- items can reference a real UUID in order_items.menu_item_id.
--
-- Why this exists: the print wizard used to generate non-UUID menu_item_ids
-- like "print_1780587697262" which Supabase rejected with:
--   "invalid input syntax for type uuid: 'print_1780587697262'"
-- at order_items insert time. This row gives every print cart item a
-- stable, valid UUID to point at.
--
-- The actual per-job data (files, copies, color, paper, add-ons, rush)
-- still lives in order_items.special_notes as JSON, so all 11 service
-- variants (B&W, Color, Passport, Binding, Lamination, Bulk, etc.) share
-- this single menu_item row and just carry different settings in the
-- special_notes payload.

INSERT INTO public.menu_items (id, vendor_id, name, description, price, category, is_veg)
VALUES (
  'a1111111-1111-4000-8000-000000000001',
  'f1111111-1111-4000-8000-000000000000',
  'Print Service',
  'Custom print job — B&W, colour, passport photos, binding, lamination and more. Settings configured per order.',
  0,
  'print',
  NULL
)
ON CONFLICT (id) DO NOTHING;
