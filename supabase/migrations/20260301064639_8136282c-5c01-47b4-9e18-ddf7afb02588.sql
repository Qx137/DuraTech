
-- ============================================
-- FIX 1: Order total validation on INSERT
-- Add a trigger to also validate on INSERT that total is recalculated server-side
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_order_total_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cart_total numeric;
BEGIN
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

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_total_on_insert_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_total_on_insert();

-- ============================================
-- FIX 2: Remove user self-role-escalation
-- Drop the UPDATE policy on user_roles entirely
-- ============================================

DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;

-- ============================================
-- FIX 3: Restrict buyer bid updates to status-only changes
-- Replace the overly permissive UPDATE policy with a constrained one
-- ============================================

DROP POLICY IF EXISTS "Buyers can accept/reject bids on their deliveries" ON public.delivery_bids;

CREATE POLICY "Buyers can accept/reject bids on their deliveries"
ON public.delivery_bids FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    WHERE d.id = delivery_bids.delivery_id
    AND o.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Only allow changing status to accepted or rejected
  status IN ('accepted', 'rejected')
  -- Ensure bid_amount is not tampered with
  AND bid_amount = (SELECT db.bid_amount FROM public.delivery_bids db WHERE db.id = delivery_bids.id)
  -- Ensure driver_id is not tampered with
  AND driver_id IS NOT DISTINCT FROM (SELECT db.driver_id FROM public.delivery_bids db WHERE db.id = delivery_bids.id)
  -- Ensure company_id is not tampered with
  AND company_id IS NOT DISTINCT FROM (SELECT db.company_id FROM public.delivery_bids db WHERE db.id = delivery_bids.id)
  -- Ensure estimated_time is not tampered with
  AND estimated_time_minutes = (SELECT db.estimated_time_minutes FROM public.delivery_bids db WHERE db.id = delivery_bids.id)
);
