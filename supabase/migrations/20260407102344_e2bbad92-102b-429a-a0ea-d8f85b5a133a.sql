ALTER TABLE public.deliveries
ADD COLUMN transport_type text,
ADD COLUMN offered_price numeric,
ADD COLUMN min_price numeric;