-- Add live-tracking coordinates to service_bookings (used by TechnicianTracker map)
ALTER TABLE public.service_bookings
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Add photo + item-level review support
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS item_name TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_photos ON reviews USING GIN (photos);
CREATE INDEX IF NOT EXISTS idx_reviews_item_name ON reviews (item_name);

NOTIFY pgrst, 'reload schema';
