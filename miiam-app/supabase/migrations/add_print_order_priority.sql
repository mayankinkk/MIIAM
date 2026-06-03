ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;
