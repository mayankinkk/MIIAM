-- Seed data for MIIAM verticals
-- Run after consolidated migration

-- ============================================================
-- VENDORS
-- ============================================================

-- Food vendors
INSERT INTO vendors (id, shop_name, description, address, lat, lng, pincode, phone, opening_hours, is_active, delivery_charge, min_order_amount, estimated_delivery_time)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Spice Garden', 'Authentic Indian cuisine with a modern twist', '12 MG Road, Mumbai', 19.0760, 72.8777, '400001', '+919876543210', '{"monday":{"open":"10:00","close":"22:00","is_closed":false},"tuesday":{"open":"10:00","close":"22:00","is_closed":false},"wednesday":{"open":"10:00","close":"22:00","is_closed":false},"thursday":{"open":"10:00","close":"22:00","is_closed":false},"friday":{"open":"10:00","close":"23:00","is_closed":false},"saturday":{"open":"10:00","close":"23:00","is_closed":false},"sunday":{"open":"11:00","close":"22:00","is_closed":false}}', true, 30, 150, 35),
  ('a1000000-0000-0000-0000-000000000002', 'Pizza Palace', 'Best wood-fired pizzas in town', '45 Link Road, Mumbai', 19.0800, 72.8850, '400002', '+919876543211', '{"monday":{"open":"11:00","close":"23:00","is_closed":false},"tuesday":{"open":"11:00","close":"23:00","is_closed":false},"wednesday":{"open":"11:00","close":"23:00","is_closed":false},"thursday":{"open":"11:00","close":"23:00","is_closed":false},"friday":{"open":"11:00","close":"00:00","is_closed":false},"saturday":{"open":"11:00","close":"00:00","is_closed":false},"sunday":{"open":"11:00","close":"23:00","is_closed":false}}', true, 25, 200, 30)
ON CONFLICT (id) DO NOTHING;

-- Grocery vendor
INSERT INTO vendors (id, shop_name, description, address, lat, lng, pincode, phone, opening_hours, is_active, delivery_charge, min_order_amount, estimated_delivery_time, business_type)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'FreshBasket Groceries', 'Farm-fresh groceries delivered in 30 minutes', '78 Hill Road, Mumbai', 19.0500, 72.8300, '400050', '+919876543220', '{"monday":{"open":"08:00","close":"22:00","is_closed":false},"tuesday":{"open":"08:00","close":"22:00","is_closed":false},"wednesday":{"open":"08:00","close":"22:00","is_closed":false},"thursday":{"open":"08:00","close":"22:00","is_closed":false},"friday":{"open":"08:00","close":"22:00","is_closed":false},"saturday":{"open":"08:00","close":"22:00","is_closed":false},"sunday":{"open":"09:00","close":"21:00","is_closed":false}}', true, 20, 100, 30, 'grocery')
ON CONFLICT (id) DO NOTHING;

-- Pharmacy vendor
INSERT INTO vendors (id, shop_name, description, address, lat, lng, pincode, phone, opening_hours, is_active, delivery_charge, min_order_amount, estimated_delivery_time, business_type)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'MediCare Pharmacy', 'Licensed pharmacy with 10,000+ medicines', '23 SV Road, Mumbai', 19.0400, 72.8200, '400060', '+919876543300', '{"monday":{"open":"08:00","close":"23:00","is_closed":false},"tuesday":{"open":"08:00","close":"23:00","is_closed":false},"wednesday":{"open":"08:00","close":"23:00","is_closed":false},"thursday":{"open":"08:00","close":"23:00","is_closed":false},"friday":{"open":"08:00","close":"23:00","is_closed":false},"saturday":{"open":"08:00","close":"23:00","is_closed":false},"sunday":{"open":"09:00","close":"22:00","is_closed":false}}', true, 15, 50, 25, 'pharmacy')
ON CONFLICT (id) DO NOTHING;

-- Flower vendor
INSERT INTO vendors (id, shop_name, description, address, lat, lng, pincode, phone, opening_hours, is_active, delivery_charge, min_order_amount, estimated_delivery_time, business_type)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Petal & Bloom', 'Fresh flowers and exotic bouquets for every occasion', '56 Carter Road, Mumbai', 19.0550, 72.8250, '400052', '+919876543400', '{"monday":{"open":"07:00","close":"21:00","is_closed":false},"tuesday":{"open":"07:00","close":"21:00","is_closed":false},"wednesday":{"open":"07:00","close":"21:00","is_closed":false},"thursday":{"open":"07:00","close":"21:00","is_closed":false},"friday":{"open":"07:00","close":"21:00","is_closed":false},"saturday":{"open":"07:00","close":"21:00","is_closed":false},"sunday":{"open":"08:00","close":"20:00","is_closed":false}}', true, 40, 200, 40, 'flowers')
ON CONFLICT (id) DO NOTHING;

-- Service vendor
INSERT INTO vendors (id, shop_name, description, address, lat, lng, pincode, phone, opening_hours, is_active, delivery_charge, min_order_amount, estimated_delivery_time, business_type)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Glamour Studio', 'Professional beauty and wellness services at your doorstep', '90 Bandstand, Mumbai', 19.0450, 72.8150, '400051', '+919876543500', '{"monday":{"open":"09:00","close":"20:00","is_closed":false},"tuesday":{"open":"09:00","close":"20:00","is_closed":false},"wednesday":{"open":"09:00","close":"20:00","is_closed":false},"thursday":{"open":"09:00","close":"20:00","is_closed":false},"friday":{"open":"09:00","close":"20:00","is_closed":false},"saturday":{"open":"09:00","close":"21:00","is_closed":false},"sunday":{"open":"10:00","close":"19:00","is_closed":false}}', true, 0, 500, 60, 'services')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FOOD MENU ITEMS
-- ============================================================

INSERT INTO menu_items (id, vendor_id, name, description, price, category, is_available, is_veg)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Butter Chicken', 'Creamy tomato-based chicken curry', 280, 'Main Course', true, false),
  ('f1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Paneer Tikka Masala', 'Grilled cottage cheese in spicy gravy', 250, 'Main Course', true, true),
  ('f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Garlic Naan', 'Soft naan with garlic butter', 40, 'Breads', true, true),
  ('f1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Biryani', 'Hyderabadi style dum biryani', 320, 'Rice', true, false),
  ('f1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Mango Lassi', 'Sweet yogurt drink with mango', 80, 'Beverages', true, true),
  ('f1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'Margherita Pizza', 'Classic tomato and mozzarella', 350, 'Pizza', true, true),
  ('f1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', 'Pepperoni Pizza', 'Loaded with spicy pepperoni', 450, 'Pizza', true, false),
  ('f1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002', 'Garlic Bread', 'Buttery garlic bread with cheese', 150, 'Sides', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- GROCERY ITEMS
-- ============================================================

INSERT INTO grocery_items (id, vendor_id, name, description, price, category, unit, is_available)
VALUES
  ('g1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Basmati Rice', 'Premium long grain basmati rice', 180, 'Grains', '1 kg', true),
  ('g1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Aashirvaad Atta', 'Whole wheat flour', 250, 'Grains', '5 kg', true),
  ('g1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Amul Butter', 'Fresh creamery butter', 56, 'Dairy', '100 g', true),
  ('g1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'Tomatoes', 'Fresh farm tomatoes', 40, 'Vegetables', '1 kg', true),
  ('g1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'Onions', 'Fresh red onions', 35, 'Vegetables', '1 kg', true),
  ('g1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'Tata Salt', 'Iodized table salt', 28, 'Essentials', '1 kg', true),
  ('g1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', 'Maggi Noodles', '2-minute instant noodles', 14, 'Snacks', 'Pack of 4', true),
  ('g1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'Coca-Cola', 'Refreshing cola drink', 40, 'Beverages', '750 ml', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PHARMACY ITEMS
-- ============================================================

INSERT INTO pharmacy_items (id, vendor_id, name, description, price, requires_prescription, is_available)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Paracetamol 500mg', 'Fever and pain relief tablets', 25, false, true),
  ('p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Vitamin C 1000mg', 'Immunity booster tablets', 180, false, true),
  ('p1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Band-Aid', 'Waterproof adhesive bandages', 35, false, true),
  ('p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Cetirizine 10mg', 'Antihistamine for allergies', 30, false, true),
  ('p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'ORS Sachets', 'Oral rehydration salts', 20, false, true),
  ('p1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001', 'Digital Thermometer', 'Accurate body temperature measurement', 250, false, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FLOWER ITEMS
-- ============================================================

INSERT INTO flower_items (id, vendor_id, name, description, price, is_available)
VALUES
  ('fl100000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Red Rose Bouquet', '12 premium red roses with baby breath', 499, true),
  ('fl100000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Mixed Flowers Basket', 'Seasonal mixed flower arrangement', 799, true),
  ('fl100000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'Lily & Orchid Combo', 'Elegant lilies with orchids', 999, true),
  ('fl100000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', 'Marigold Garland', 'Fresh marigold garland for pooja', 150, true),
  ('fl100000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000001', 'Sunflower Bunch', 'Bright sunflower bunch of 6', 350, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SERVICE BOOKINGS SEED
-- ============================================================

-- This table already exists from migrations, no seed needed for bookings
-- but we can seed service settings
INSERT INTO service_settings (id, key, value, created_at)
VALUES
  ('s1000000-0000-0000-0000-000000000001', 'service_charge', '30', now()),
  ('s1000000-0000-0000-0000-000000000002', 'min_advance_hours', '2', now()),
  ('s1000000-0000-0000-0000-000000000003', 'max_advance_days', '30', now())
ON CONFLICT (id) DO NOTHING;
