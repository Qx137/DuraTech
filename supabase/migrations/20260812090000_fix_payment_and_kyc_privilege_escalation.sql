-- =====================================================================================
-- Security fix: close RLS gaps that let a client forge payment/KYC state directly.
--
-- Root cause: several UPDATE policies used USING() for ownership but had no WITH CHECK
-- (or a WITH CHECK that only re-checked ownership, not which columns/values changed).
-- Since Postgres reuses USING as the check when WITH CHECK is absent, and WITH CHECK
-- alone can't compare against the row's *previous* values, any authenticated user could
-- update their own order's payment_status/total straight to "paid", or their own
-- kyc_status/kyc_verifications.status straight to "verified" - bypassing the payment
-- webhook and KYC review entirely.
--
-- auth.role() reflects the PostgREST JWT role claim: 'authenticated'/'anon' for normal
-- app traffic (anon/publishable key + user session), 'service_role' for edge functions
-- using the service role key, and NULL for direct DB access (migrations, SQL editor,
-- manual admin review). We only enforce these checks for normal app traffic so the
-- payment webhook and manual KYC review continue to work.
-- =====================================================================================

-- ---------------------------------------------------------------------------
-- 1. Orders: payment_status/total/tax become immutable to normal app traffic.
--    Only the service-role webhook (contipay-webhook) may change them.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_order_financial_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.role() IS NULL OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    RAISE EXCEPTION 'payment_status can only be changed by the payment system';
  END IF;

  IF NEW.total IS DISTINCT FROM OLD.total OR NEW.tax IS DISTINCT FROM OLD.tax THEN
    RAISE EXCEPTION 'total/tax cannot be modified after order creation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_order_financial_columns_trigger ON public.orders;
CREATE TRIGGER protect_order_financial_columns_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.protect_order_financial_columns();

-- Replace the buyer UPDATE policy (previously "USING (auth.uid() = user_id)" with no
-- WITH CHECK at all, so a buyer could set any column on their own order to anything).
-- Buyers only ever need to: set payment_method while still pending, or cancel a
-- pending order. Everything else client-side is now blocked by the trigger above.
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

CREATE POLICY "Buyers can update their own pending orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

-- Tighten the sellers' fulfillment-status policy: it previously had no restriction
-- on which status values a seller could write, so a seller could set an order
-- containing one of their products straight to status = 'delivered' (payment_status
-- forgery on top of that is now blocked by the trigger regardless).
DROP POLICY IF EXISTS "Sellers can update order status for their products" ON public.orders;

CREATE POLICY "Sellers can update order status for their products"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  status IN ('confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery')
  AND EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = orders.id
    AND p.seller_id = auth.uid()
  )
)
WITH CHECK (
  status IN ('preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled')
  AND EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = orders.id
    AND p.seller_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- 2. KYC: users can only ever submit/resubmit into "pending". Approving
--    ("verified") or rejecting is a manual review action, never client-settable.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_kyc_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.role() IS NULL OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status AND NEW.kyc_status != 'pending' THEN
    RAISE EXCEPTION 'kyc_status can only be set to pending by the account holder; verification requires manual review';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_kyc_status_trigger ON public.profiles;
CREATE TRIGGER protect_kyc_status_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_kyc_status();

DROP POLICY IF EXISTS "Users can create their own KYC verification" ON public.kyc_verifications;
CREATE POLICY "Users can create their own KYC verification"
ON public.kyc_verifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can update their own KYC verification" ON public.kyc_verifications;
CREATE POLICY "Users can update their own KYC verification"
ON public.kyc_verifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status = 'pending');
