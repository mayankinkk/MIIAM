-- Add veg/non-veg classification to menu_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'is_veg') THEN
    ALTER TABLE menu_items ADD COLUMN is_veg BOOLEAN DEFAULT NULL;
  END IF;
END $$;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_is_veg ON menu_items(is_veg);
