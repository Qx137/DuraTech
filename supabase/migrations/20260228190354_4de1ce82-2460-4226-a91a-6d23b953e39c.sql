
-- Trigger to validate order_items prices match actual product prices
CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  actual_price numeric;
BEGIN
  -- Get the actual product price
  SELECT price INTO actual_price
  FROM public.products
  WHERE id = NEW.product_id;

  IF actual_price IS NULL THEN
    RAISE EXCEPTION 'Product not found: %', NEW.product_id;
  END IF;

  -- Enforce that the order item price matches the product price
  IF NEW.price != actual_price THEN
    RAISE EXCEPTION 'Order item price (%) does not match product price (%)', NEW.price, actual_price;
  END IF;

  -- Validate quantity is positive
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_item_price_trigger
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_item_price();

-- Trigger to validate order total matches sum of items after all items are inserted
-- We validate on order status update (when moving from pending) as a secondary check
CREATE OR REPLACE FUNCTION public.validate_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  items_total numeric;
BEGIN
  -- Only validate when order is being moved from pending to another status
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    SELECT COALESCE(SUM(price * quantity), 0) INTO items_total
    FROM public.order_items
    WHERE order_id = NEW.id;

    IF items_total = 0 THEN
      RAISE EXCEPTION 'Order has no items';
    END IF;

    -- Allow a small tolerance for rounding but catch major discrepancies
    IF ABS(NEW.total - items_total) > 1.00 THEN
      RAISE EXCEPTION 'Order total (%) does not match items total (%)', NEW.total, items_total;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_total_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_total();
