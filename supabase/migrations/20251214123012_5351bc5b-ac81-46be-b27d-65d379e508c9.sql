-- Fix deliveries INSERT vulnerability
-- Remove the overly permissive INSERT policy that allows anyone to create deliveries

DROP POLICY IF EXISTS "System can create deliveries" ON public.deliveries;

-- Create a proper policy that only allows order owners to create deliveries for their own orders
-- Edge functions with service role bypass RLS anyway
CREATE POLICY "Users can create deliveries for their orders"
ON public.deliveries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND orders.user_id = auth.uid()
  )
);