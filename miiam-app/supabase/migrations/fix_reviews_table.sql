-- Add missing columns to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS type TEXT;

NOTIFY pgrst, 'reload schema';
