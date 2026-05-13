
-- Update the validate_order_total_on_insert function to relax total checks
-- This allows for high shipping costs relative to the product subtotal
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
      IF NEW.total < cart_total THEN
        RAISE EXCEPTION 'Order total (%) is less than cart items total (%)', NEW.total, cart_total;
      END IF;
      
      -- Relaxed: Allow total up to 10x the cart total to accommodate high shipping fees
      -- Previously this was restricted to 1.5x, which blocked orders with high delivery costs.
      IF NEW.total > cart_total * 10.0 THEN
        RAISE EXCEPTION 'Order total (%) is unusually high (over 10x) compared to cart items total (%)', NEW.total, cart_total;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
