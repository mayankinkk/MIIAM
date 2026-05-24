-- Add user_id column to vendors table to link vendors to auth users
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
