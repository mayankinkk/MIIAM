-- Create the menu-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
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
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Menu Images Public Access' AND tablename = 'objects') THEN
    DROP POLICY "Menu Images Public Access" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Menu Images Auth Insert' AND tablename = 'objects') THEN
    DROP POLICY "Menu Images Auth Insert" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Menu Images Admin All' AND tablename = 'objects') THEN
    DROP POLICY "Menu Images Admin All" ON storage.objects;
  END IF;
END $$;

-- Anyone can read (public bucket)
CREATE POLICY "Menu Images Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- Authenticated users can upload
CREATE POLICY "Menu Images Auth Insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Service role full access
CREATE POLICY "Menu Images Admin All"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'menu-images')
WITH CHECK (bucket_id = 'menu-images');

NOTIFY pgrst, 'reload schema';
SELECT 'Menu images bucket created!' AS status;
