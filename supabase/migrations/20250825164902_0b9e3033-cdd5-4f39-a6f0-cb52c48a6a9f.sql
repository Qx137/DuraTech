-- Add latitude and longitude columns to products table for accurate pickup location
ALTER TABLE public.products 
ADD COLUMN pickup_latitude NUMERIC,
ADD COLUMN pickup_longitude NUMERIC;

-- Add index for better performance on location queries
CREATE INDEX idx_products_location ON public.products (pickup_latitude, pickup_longitude);

-- Update the existing text location column to be optional since we now have coordinates
ALTER TABLE public.products 
ALTER COLUMN location DROP NOT NULL;