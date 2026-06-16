ALTER TABLE service_bookings
ADD COLUMN IF NOT EXISTS technician_name TEXT,
ADD COLUMN IF NOT EXISTS technician_phone TEXT;
