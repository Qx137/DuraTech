
-- Add order_type column to orders table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_type') THEN
        ALTER TABLE public.orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'marketplace' CHECK (order_type IN ('marketplace', 'service'));
    END IF;
END $$;

-- Update the validate_order_total_on_insert function to check order_type
CREATE OR REPLACE FUNCTION public.validate_order_total_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cart_total numeric;
BEGIN
  -- Only validate for marketplace orders
  IF NEW.order_type = 'marketplace' THEN
    -- Calculate the actual total from current product prices based on the user's cart
    SELECT COALESCE(SUM(p.price * ci.quantity), 0) INTO cart_total
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.user_id = NEW.user_id;

    -- If cart has items, enforce the total matches (with small tolerance for tax/rounding)
    IF cart_total > 0 THEN
      -- The order total should be at least the cart total (total includes tax)
      -- But should not be less than the items total
      IF NEW.total < cart_total THEN
        RAISE EXCEPTION 'Order total (%) is less than cart items total (%)', NEW.total, cart_total;
      END IF;
      -- Ensure total is not unreasonably higher (e.g. more than 50% above items for tax/fees)
      IF NEW.total > cart_total * 1.5 THEN
        RAISE EXCEPTION 'Order total (%) is unreasonably higher than cart items total (%)', NEW.total, cart_total;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
