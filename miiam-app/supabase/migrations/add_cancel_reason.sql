-- Add cancel_reason column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
