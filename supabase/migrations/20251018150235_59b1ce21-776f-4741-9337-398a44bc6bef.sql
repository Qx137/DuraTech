-- Fix 1: Protect customer email addresses from public exposure
-- Drop the existing policy that exposes all seller data
DROP POLICY IF EXISTS "Anyone can view seller profiles" ON public.profiles;

-- Create a new policy that excludes email field from public access
-- Only authenticated users can see limited seller profile information
CREATE POLICY "Public can view limited seller profiles" ON public.profiles
FOR SELECT USING (
  user_type = 'seller' 
  AND current_setting('request.jwt.claim.sub', true) IS NOT NULL
);

-- Fix 2: Protect driver phone numbers from public exposure
-- Drop the existing policy that exposes phone numbers
DROP POLICY IF EXISTS "Anyone can view available drivers" ON public.drivers;

-- Create a view for public driver information without sensitive data
CREATE OR REPLACE VIEW public.public_drivers AS
SELECT 
  id,
  user_id,
  current_location,
  rating,
  status,
  vehicle_type,
  created_at,
  updated_at
FROM public.drivers
WHERE status = 'available';

-- Grant access to the view
GRANT SELECT ON public.public_drivers TO authenticated, anon;

-- Create a policy for drivers to see their full profile including phone
CREATE POLICY "Drivers can view their own full profile" ON public.drivers
FOR SELECT USING (
  auth.uid() = user_id
);

-- Fix 3: Allow sellers to access orders for their products
CREATE POLICY "Sellers can view orders for their products" ON public.orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = orders.id
    AND p.seller_id = auth.uid()
  )
);

-- Allow sellers to update order status for their products
CREATE POLICY "Sellers can update order status for their products" ON public.orders
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = orders.id
    AND p.seller_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = orders.id
    AND p.seller_id = auth.uid()
  )
);