-- Add DND mode column to rider_settings
ALTER TABLE rider_settings ADD COLUMN IF NOT EXISTS dnd_mode BOOLEAN DEFAULT FALSE;

