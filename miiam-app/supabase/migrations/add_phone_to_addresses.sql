-- Add phone column to user_addresses
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS phone text;
