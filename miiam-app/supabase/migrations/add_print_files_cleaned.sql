-- Add column to track which print orders have had their files cleaned up
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS print_files_cleaned boolean DEFAULT null;
