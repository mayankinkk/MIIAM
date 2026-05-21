ALTER TABLE public.grocery_products
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE public.pharmacy_medicines
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE public.flower_items
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_grocery_products_vendor_id ON public.grocery_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_medicines_vendor_id ON public.pharmacy_medicines(vendor_id);
CREATE INDEX IF NOT EXISTS idx_flower_items_vendor_id ON public.flower_items(vendor_id);

NOTIFY pgrst, 'reload schema';
