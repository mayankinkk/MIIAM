-- MIIAM Print Services: dedicated storage bucket with strict RLS
-- Bucket "print-files" stores uploaded print jobs. Lifecycle: auto-delete
-- after 24 hours. Backed by Supabase storage with private ACL — files are
-- never world-readable.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'print-files',
  'print-files',
  false,
  52428800, -- 50 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Reset policies for the print-files bucket
DELETE FROM storage.policies WHERE bucket_id = 'print-files';

-- Authenticated users can upload to their own folder (prefix = user_id)
CREATE POLICY "print_files_upload_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'print-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own files
CREATE POLICY "print_files_read_own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'print-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role (admin client) gets full access for order processing
CREATE POLICY "print_files_admin_all"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'print-files')
WITH CHECK (bucket_id = 'print-files');

-- Vendors assigned to PRINTING_VENDOR_ID can read customer files
CREATE POLICY "print_files_vendor_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'print-files'
  AND EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.user_id = auth.uid()
      AND v.id = 'f1111111-1111-4000-8000-000000000000'::uuid
  )
);

-- Add print_files_cleaned_at column on orders (was print_files_cleaned);
-- a TIMESTAMPTZ gives the cleanup job a real cutoff.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS print_files_cleaned_at TIMESTAMPTZ;

-- Index for the cleanup cron
CREATE INDEX IF NOT EXISTS idx_orders_print_status
  ON orders (vendor_id, status, print_files_cleaned_at)
  WHERE vendor_id = 'f1111111-1111-4000-8000-000000000000'::uuid;
