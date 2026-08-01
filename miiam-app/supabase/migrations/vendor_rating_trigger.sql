-- Vendor rating auto-recalculation trigger
-- When a review is inserted, updated, or deleted, recalculate the vendor's average rating

CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_vendor_id UUID;
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Get the vendor_id from the affected row
  IF TG_OP = 'DELETE' THEN
    target_vendor_id := OLD.vendor_id;
  ELSE
    target_vendor_id := NEW.vendor_id;
  END IF;

  -- Calculate new average rating and count
  SELECT 
    COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 4.0),
    COUNT(*)::INTEGER
  INTO avg_rating, review_count
  FROM reviews
  WHERE vendor_id = target_vendor_id;

  -- Update the vendor record
  UPDATE vendors
  SET 
    rating = avg_rating,
    review_count = review_count,
    updated_at = NOW()
  WHERE id = target_vendor_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on reviews table
DROP TRIGGER IF EXISTS trigger_update_vendor_rating ON reviews;
CREATE TRIGGER trigger_update_vendor_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_rating();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_rating ON reviews(vendor_id, rating);
