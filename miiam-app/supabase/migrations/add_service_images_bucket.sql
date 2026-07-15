-- Service Images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop old policies if they exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_images_read' AND tablename = 'objects') THEN
    DROP POLICY "service_images_read" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_images_upload' AND tablename = 'objects') THEN
    DROP POLICY "service_images_upload" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_images_admin_all' AND tablename = 'objects') THEN
    DROP POLICY "service_images_admin_all" ON storage.objects;
  END IF;
END $$;

-- Anyone can read (public bucket)
CREATE POLICY "service_images_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- Authenticated users can upload
CREATE POLICY "service_images_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-images');

-- Service role full access
CREATE POLICY "service_images_admin_all"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'service-images')
WITH CHECK (bucket_id = 'service-images');

NOTIFY pgrst, 'reload schema';
SELECT 'Service images bucket created!' AS status;
