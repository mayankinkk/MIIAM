-- Seed the MIIAM Print Store platform vendor
INSERT INTO public.vendors (id, owner_name, phone, email, shop_name, address, category, type, status)
VALUES ('f1111111-1111-4000-8000-000000000000', 'MIIAM', '0000000000', 'printing@miiam.com', 'MIIAM Print Store', 'Platform', 'Printing', 'printing', 'active')
ON CONFLICT (id) DO NOTHING;
