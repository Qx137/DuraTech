-- Drop existing problematic policies for sellers on orders table
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON orders;
DROP POLICY IF EXISTS "Sellers can update order status for their products" ON orders;

-- Create new policies that avoid recursion
-- Sellers can view orders that contain their products (using a simpler subquery)
CREATE POLICY "Sellers can view orders for their products" 
ON orders 
FOR SELECT 
USING (
  id IN (
    SELECT DISTINCT oi.order_id 
    FROM order_items oi
    WHERE oi.product_id IN (
      SELECT id 
      FROM products 
      WHERE seller_id = auth.uid()
    )
  )
);

-- Sellers can update order status for orders containing their products
CREATE POLICY "Sellers can update order status for their products" 
ON orders 
FOR UPDATE 
USING (
  id IN (
    SELECT DISTINCT oi.order_id 
    FROM order_items oi
    WHERE oi.product_id IN (
      SELECT id 
      FROM products 
      WHERE seller_id = auth.uid()
    )
  )
)
WITH CHECK (
  id IN (
    SELECT DISTINCT oi.order_id 
    FROM order_items oi
    WHERE oi.product_id IN (
      SELECT id 
      FROM products 
      WHERE seller_id = auth.uid()
    )
  )
);