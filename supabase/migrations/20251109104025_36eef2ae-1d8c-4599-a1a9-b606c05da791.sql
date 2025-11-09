-- Add DELETE policies for orders and order_items tables
-- These policies ensure proper authorization for delete operations

-- Policy: Buyers can delete their own orders
CREATE POLICY "Buyers can delete their own orders"
ON public.orders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Buyers can delete their own order items (via order ownership)
CREATE POLICY "Buyers can delete their order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Add comment for clarity
COMMENT ON POLICY "Buyers can delete their own orders" ON public.orders IS 
'Allows authenticated users to delete only their own orders. Sellers should NOT delete orders.';

COMMENT ON POLICY "Buyers can delete their order items" ON public.order_items IS 
'Allows authenticated users to delete order items belonging to their orders only.';