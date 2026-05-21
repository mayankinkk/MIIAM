-- Create the grocery-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('grocery-images', 'grocery-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to the bucket
CREATE POLICY "Grocery Images Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'grocery-images' );

-- Allow authenticated users to insert/upload images
CREATE POLICY "Grocery Images Auth Insert"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'grocery-images' AND auth.role() = 'authenticated' );
