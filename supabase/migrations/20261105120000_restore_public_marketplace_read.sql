-- Restore public (logged-out) read access to the marketplace.
--
-- Symptom: on a device with no Supabase session -- a phone that has never been
-- signed in -- the marketplace renders "No products found". The REST call
-- succeeds (HTTP 200) but comes back with zero rows:
--
--   GET /rest/v1/products?select=id,name  ->  200, content-range: */0, []
--
-- Nothing in the client is device-specific (useIsMobile is unused outside the
-- shadcn sidebar); the only thing that differs between a desktop that works and
-- a phone that does not is anon vs authenticated. Two things are fixed here.
--
-- 1. public.products
--    "Anyone can view products" (USING (true), migration 20250716211834) is no
--    longer in effect on the live project -- the catalogue is invisible to anon.
--    Re-asserted below for anon + authenticated.
--
-- 2. public.profiles
--    "Public can view seller profiles" (migration 20251019152648) requires
--    auth.uid() IS NOT NULL, so for a logged-out visitor the seller embed in the
--    marketplace query (`select=*, profiles(name, business_name)`) resolves to
--    null and every card reads "Unknown Farmer". Seller rows are opened to anon
--    here, but the email column stays unreadable to anon: that is enforced with
--    column-level privileges instead of a row-level policy, so the hardening
--    from migration 20251018150235 (no public email harvesting) is preserved.

-- 1. Products: the catalogue is public ----------------------------------------

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Profiles: seller rows are public, sensitive columns are not ---------------

DROP POLICY IF EXISTS "Public can view limited seller profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view seller profiles" ON public.profiles;

CREATE POLICY "Public can view seller profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  user_type = 'seller'
  OR auth.uid() = id
);

-- Column-level privileges do the work a row-level policy cannot: anon may read
-- only the storefront columns. Selecting email (or any column added later and
-- not listed here) as anon fails with "permission denied for column", rather
-- than silently leaking. authenticated keeps its full table grant, so the
-- profile fetch in AuthContext (select('*')) is unaffected.
REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
  id,
  name,
  business_name,
  description,
  user_type,
  kyc_status
) ON public.profiles TO anon;

-- Verification (run in the SQL editor after applying):
--
--   select tablename, policyname, roles, cmd, qual
--     from pg_policies
--    where schemaname = 'public' and tablename in ('products', 'profiles');
--
--   select count(*) from public.products;   -- as the table owner: real row count
--
-- If anon still sees zero products after this, the policies are not the cause
-- and public.products is genuinely empty on this project.
