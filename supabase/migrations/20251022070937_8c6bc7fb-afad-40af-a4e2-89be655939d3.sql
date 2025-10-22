-- Drop the problematic policies again
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON orders;
DROP POLICY IF EXISTS "Sellers can update order status for their products" ON orders;

-- Create a security definer function to check if a seller has products in an order
CREATE OR REPLACE FUNCTION public.seller_has_order(_seller_id uuid, _order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = _order_id
      AND p.seller_id = _seller_id
  )
$$;

-- Create new policies using the security definer function
CREATE POLICY "Sellers can view orders for their products" 
ON orders 
FOR SELECT 
USING (
  auth.uid() = user_id OR public.seller_has_order(auth.uid(), id)
);

CREATE POLICY "Sellers can update order status for their products" 
ON orders 
FOR UPDATE 
USING (
  public.seller_has_order(auth.uid(), id)
)
WITH CHECK (
  public.seller_has_order(auth.uid(), id)
);