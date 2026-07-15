-- ============================================================
-- MIIAM: Add missing columns to service_items + seed data
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- Add missing columns to service_items
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 0;
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS price_min DECIMAL(10,2);
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS price_max DECIMAL(10,2);
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS included TEXT[] DEFAULT '{}';
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS warranty_days INTEGER DEFAULT 7;
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS badge VARCHAR(30);
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Seed categories that may be missing
INSERT INTO service_categories (name, icon, description, display_order) VALUES
  ('Beauty & Spa', 'spa', 'Salon and spa services at home', 7),
  ('Car Care', 'directions_car', 'Car cleaning and detailing', 8)
ON CONFLICT (name) DO NOTHING;

-- Seed all 28 service items from hardcoded data
-- AC Services
INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'AC Deep Cleaning', sc.id, 'Get your AC units deep cleaned by certified technicians. Removes dust, mold, and bacteria for cleaner, healthier air.', 599, 499, 899, 799, '90 mins', 'https://images.unsplash.com/photo-1631564591547-4d46fe7c9c0a?w=400&q=80', ARRAY['Complete interior cleaning','Filter cleaning','Coil cleaning','Gas check']::TEXT[], 30, 'mostPopular', 4.8, 28450, 1, true
FROM service_categories sc WHERE sc.name = 'AC Repair'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'AC Gas Refill', sc.id, 'Professional AC gas refill service. Restores cooling efficiency and maintains optimal performance.', 450, 350, 650, NULL, '30 mins', 'https://images.unsplash.com/photo-1631564591547-4d46fe7c9c0a?w=400&q=80', ARRAY['Gas refill','Leak check','Performance test']::TEXT[], 90, NULL, 4.7, 18200, 2, true
FROM service_categories sc WHERE sc.name = 'AC Repair'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'AC Repair', sc.id, 'Expert AC repair for all brands. Quick diagnosis and fix for cooling issues, noise, and electrical faults.', 350, NULL, NULL, NULL, '60 mins', 'https://images.unsplash.com/photo-1631564591547-4d46fe7c9c0a?w=400&q=80', ARRAY['Diagnosis','Repair','Testing']::TEXT[], 30, NULL, 4.6, 15400, 3, true
FROM service_categories sc WHERE sc.name = 'AC Repair'
ON CONFLICT DO NOTHING;

-- Cleaning Services
INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Full Home Cleaning', sc.id, 'Complete home cleaning service covering all rooms, kitchen, bathrooms, and balcony. Professional team with eco-friendly products.', 2499, NULL, NULL, 3499, '4-5 hrs', '/images/service_cleaning.png', ARRAY['All rooms','Kitchen','Bathrooms','Balcony']::TEXT[], 7, 'bestSeller', 4.8, 45000, 1, true
FROM service_categories sc WHERE sc.name = 'Cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Bathroom Deep Cleaning', sc.id, 'Deep cleaning for your bathrooms. Removes stains, mold, and limescale. Sanitization included.', 799, NULL, NULL, NULL, '2 hrs', '/images/service_cleaning.png', ARRAY['Floor cleaning','Tile cleaning','Fitting cleaning','Disinfection']::TEXT[], 7, NULL, 4.7, 32100, 2, true
FROM service_categories sc WHERE sc.name = 'Cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Kitchen Cleaning', sc.id, 'Professional kitchen deep cleaning. Degreasing, sanitization, and complete appliance exterior cleaning.', 999, NULL, NULL, NULL, '2-3 hrs', '/images/service_cleaning.png', ARRAY['Chimney cleaning','Stove cleaning','Countertops','Tiles']::TEXT[], 7, NULL, 4.6, 22500, 3, true
FROM service_categories sc WHERE sc.name = 'Cleaning'
ON CONFLICT DO NOTHING;

-- Plumbing Services
INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Tap & Mixer Repair', sc.id, 'Professional plumbing repair service. Fix leaking taps, faulty mixers, and replace washers.', 199, NULL, NULL, NULL, '45 mins', '/images/service_plumbing.png', ARRAY['Inspection','Washer replacement','Thread check']::TEXT[], 30, NULL, 4.8, 22300, 1, true
FROM service_categories sc WHERE sc.name = 'Plumbing'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Toilet Repair', sc.id, 'Complete toilet repair service. Fix running toilets, clogs, flush issues, and leaky tanks.', 299, NULL, NULL, NULL, '60 mins', '/images/service_plumbing.png', ARRAY['Flush repair','Tank cleaning','Leak fix']::TEXT[], 30, NULL, 4.7, 18900, 2, true
FROM service_categories sc WHERE sc.name = 'Plumbing'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Pipe Leakage Fix', sc.id, 'Expert pipe leak detection and repair. Non-invasive techniques to find and fix hidden leaks.', 399, NULL, NULL, NULL, '90 mins', '/images/service_plumbing.png', ARRAY['Leak detection','Pipe repair','Waterproofing']::TEXT[], 90, NULL, 4.5, 12300, 3, true
FROM service_categories sc WHERE sc.name = 'Plumbing'
ON CONFLICT DO NOTHING;

-- Electrical Services
INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Fan Installation', sc.id, 'Professional fan installation service. Safe and secure installation with testing.', 149, NULL, NULL, NULL, '30 mins', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80', ARRAY['Installation','Wiring','Testing']::TEXT[], 90, NULL, 4.8, 28900, 1, true
FROM service_categories sc WHERE sc.name = 'Electrical'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Switch Board Repair', sc.id, 'Quick switch board repair and replacement. Fix faulty switches, sockets, and wiring issues.', 99, NULL, NULL, NULL, '20 mins', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80', ARRAY['Inspection','Switch replacement','Testing']::TEXT[], 30, NULL, 4.6, 19800, 2, true
FROM service_categories sc WHERE sc.name = 'Electrical'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'MCB Repair', sc.id, 'MCB and distribution board repair. Fix tripping issues, replace faulty MCBs, and safety inspection.', 249, NULL, NULL, NULL, '45 mins', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80', ARRAY['MCB check','Repair','Safety check']::TEXT[], 90, NULL, 4.7, 14200, 3, true
FROM service_categories sc WHERE sc.name = 'Electrical'
ON CONFLICT DO NOTHING;

-- Beauty & Spa
INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Salon at Home - Women', sc.id, 'Professional salon services at home. Haircut, styling, and grooming by expert beauticians.', 499, NULL, NULL, 799, '90 mins', '/images/service_beauty.png', ARRAY['Haircut','Oiling','Blow dry','Styling']::TEXT[], 7, 'popular', 4.8, 45200, 1, true
FROM service_categories sc WHERE sc.name = 'Beauty & Spa'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Full Body Spa', sc.id, 'Luxurious full body spa experience at home. Includes massage, scrub, facial, and steam therapy.', 1299, NULL, NULL, NULL, '90 mins', '/images/service_beauty.png', ARRAY['Body massage','Scrub','Facial','Steam']::TEXT[], 7, 'premium', 4.9, 32100, 2, true
FROM service_categories sc WHERE sc.name = 'Beauty & Spa'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Manicure & Pedicure', sc.id, 'Professional manicure and pedicure at home. Nail care, massage, and polish by experts.', 399, NULL, NULL, NULL, '60 mins', '/images/service_beauty.png', ARRAY['Nail paint','Cuticle care','Massage','Polishing']::TEXT[], 14, NULL, 4.7, 28500, 3, true
FROM service_categories sc WHERE sc.name = 'Beauty & Spa'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Facial Treatment', sc.id, 'Customized facial treatment for your skin type. Deep cleansing, scrubbing, and nourishment.', 599, NULL, NULL, NULL, '45 mins', '/images/service_beauty.png', ARRAY['Cleansing','Scrub','Face pack','Moisturizer']::TEXT[], 14, NULL, 4.6, 21300, 4, true
FROM service_categories sc WHERE sc.name = 'Beauty & Spa'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Hair Spa', sc.id, 'Rejuvenating hair spa treatment. Deep conditioning, oil massage, and steam therapy for healthy hair.', 699, NULL, NULL, NULL, '60 mins', '/images/service_beauty.png', ARRAY['Oil massage','Steam','Hair mask','Conditioning']::TEXT[], 14, NULL, 4.8, 19800, 5, true
FROM service_categories sc WHERE sc.name = 'Beauty & Spa'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Salon at Home - Men', sc.id, 'Professional grooming services for men at home. Haircut, shave, beard trim, and styling.', 349, NULL, NULL, NULL, '45 mins', '/images/service_beauty.png', ARRAY['Haircut','Shave','Beard trim','Styling']::TEXT[], 7, NULL, 4.7, 35600, 6, true
FROM service_categories sc WHERE sc.name = 'Beauty & Spa'
ON CONFLICT DO NOTHING;

-- Pest Control
INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Cockroach Treatment', sc.id, 'Effective cockroach treatment for your home. Gel and spray treatment with long-lasting protection.', 499, NULL, NULL, NULL, '60 mins', 'https://images.unsplash.com/photo-1624355284486-a4de69fc7241?w=400&q=80', ARRAY['Spray treatment','Gel application','Safety coat']::TEXT[], 90, NULL, 4.5, 18200, 1, true
FROM service_categories sc WHERE sc.name = 'Pest Control'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Termite Control', sc.id, 'Comprehensive termite control with chemical barriers. Long-lasting protection for your home.', 1999, NULL, NULL, NULL, '3-4 hrs', 'https://images.unsplash.com/photo-1624355284486-a4de69fc7241?w=400&q=80', ARRAY['Inspection','Chemical treatment','Barriers']::TEXT[], 365, 'professional', 4.6, 12400, 2, true
FROM service_categories sc WHERE sc.name = 'Pest Control'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Bed Bug Treatment', sc.id, 'Complete bed bug elimination using heat and chemical treatment. Includes mattress protection.', 1299, NULL, NULL, NULL, '2-3 hrs', 'https://images.unsplash.com/photo-1624355284486-a4de69fc7241?w=400&q=80', ARRAY['Heat treatment','Spray','Mattress cover']::TEXT[], 180, NULL, 4.4, 8900, 3, true
FROM service_categories sc WHERE sc.name = 'Pest Control'
ON CONFLICT DO NOTHING;

-- Car Care
INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Car Detailing', sc.id, 'Complete car detailing service. Interior and exterior cleaning, polishing, and protection.', 999, NULL, NULL, NULL, '2-3 hrs', 'https://images.unsplash.com/photo-1601362840469-51e4d8cb587a?w=400&q=80', ARRAY['Exterior wash','Interior cleaning','Polishing','Tyre shine']::TEXT[], 14, NULL, 4.7, 15600, 1, true
FROM service_categories sc WHERE sc.name = 'Car Care'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'AC Vent Cleaning', sc.id, 'Car AC vent deep cleaning and sanitization. Filter replacement and deodorization included.', 599, NULL, NULL, NULL, '60 mins', 'https://images.unsplash.com/photo-1601362840469-51e4d8cb587a?w=400&q=80', ARRAY['Vent cleaning','Filter replacement','Deodorization']::TEXT[], 30, NULL, 4.5, 8200, 2, true
FROM service_categories sc WHERE sc.name = 'Car Care'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Car Waxing', sc.id, 'Professional car waxing for lasting shine and paint protection. Hand wash and buffing included.', 799, NULL, NULL, NULL, '90 mins', 'https://images.unsplash.com/photo-1601362840469-51e4d8cb587a?w=400&q=80', ARRAY['Wash','Wax application','Buffing','Shine']::TEXT[], 30, NULL, 4.6, 11300, 3, true
FROM service_categories sc WHERE sc.name = 'Car Care'
ON CONFLICT DO NOTHING;

-- Appliances
INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Washing Machine Repair', sc.id, 'Expert washing machine repair for all brands. Quick diagnosis and fix for all issues.', 349, NULL, NULL, NULL, '60 mins', 'https://images.unsplash.com/photo-1556909212-d5b604d0c0d7?w=400&q=80', ARRAY['Diagnosis','Repair','Testing']::TEXT[], 30, NULL, 4.7, 22400, 1, true
FROM service_categories sc WHERE sc.name = 'Appliance'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Refrigerator Repair', sc.id, 'Refrigerator repair and maintenance. Cooling issues, gas top-up, and compressor repair.', 299, NULL, NULL, NULL, '45 mins', 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80', ARRAY['Cooling check','Repair','Gas top-up']::TEXT[], 30, NULL, 4.6, 18700, 2, true
FROM service_categories sc WHERE sc.name = 'Appliance'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Microwave Repair', sc.id, 'Microwave oven repair for all brands. Fix heating issues, turntable problems, and electrical faults.', 249, NULL, NULL, NULL, '45 mins', 'https://images.unsplash.com/photo-1574269909862-7a39afa545c9?w=400&q=80', ARRAY['Diagnosis','Repair','Testing']::TEXT[], 30, NULL, 4.5, 10200, 3, true
FROM service_categories sc WHERE sc.name = 'Appliance'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (name, category_id, description, price, price_min, price_max, original_price, duration, image_url, included, warranty_days, badge, rating, reviews, sort_order, is_active)
SELECT 'Geyser Installation', sc.id, 'Professional geyser/water heater installation. Includes safety check and usage demo.', 399, NULL, NULL, NULL, '60 mins', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', ARRAY['Installation','Safety check','Demo']::TEXT[], 90, NULL, 4.4, 7800, 4, true
FROM service_categories sc WHERE sc.name = 'Appliance'
ON CONFLICT DO NOTHING;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Service items columns added and data seeded successfully!' AS status;
