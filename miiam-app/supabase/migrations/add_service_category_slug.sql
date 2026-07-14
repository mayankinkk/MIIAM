ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS slug TEXT;

-- Set slugs for existing rows based on their names
UPDATE service_categories SET slug = LOWER(REPLACE(name, ' ', '_')) WHERE slug IS NULL;

-- Set default for future inserts
ALTER TABLE service_categories ALTER COLUMN slug SET DEFAULT '';
