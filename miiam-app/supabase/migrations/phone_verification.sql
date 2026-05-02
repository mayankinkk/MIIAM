-- Add missing column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_delivery TIMESTAMP WITH TIME ZONE;

-- Create OTP verification table
CREATE TABLE IF NOT EXISTS phone_otp_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) DEFAULT 'signup', -- signup, login, password_reset
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_otp_phone ON phone_otp_verification(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_otp_expires ON phone_otp_verification(expires_at);

-- Add phone verification status to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Add is_primary_phone to user addresses
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;