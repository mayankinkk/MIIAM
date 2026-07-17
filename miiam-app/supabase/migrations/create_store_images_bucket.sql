INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('store-images', 'store-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for store-images'
  ) THEN
    CREATE POLICY "Public read access for store-images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'store-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated upload for store-images'
  ) THEN
    CREATE POLICY "Authenticated upload for store-images"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'store-images' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated delete for store-images'
  ) THEN
    CREATE POLICY "Authenticated delete for store-images"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'store-images' AND auth.uid() IS NOT NULL);
  END IF;
END $$;
