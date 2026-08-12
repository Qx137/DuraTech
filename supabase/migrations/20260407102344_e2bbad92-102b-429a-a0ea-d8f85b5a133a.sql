ALTER TABLE public.deliveries
ADD COLUMN IF NOT EXISTS transport_type text,
ADD COLUMN IF NOT EXISTS offered_price numeric,
ADD COLUMN IF NOT EXISTS min_price numeric;