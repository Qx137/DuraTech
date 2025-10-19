-- Check and drop public_drivers view if it exists, then recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.public_drivers;

-- Recreate the view explicitly with SECURITY INVOKER to avoid the security definer issue
CREATE VIEW public.public_drivers 
WITH (security_invoker=true)
AS
SELECT 
  id,
  user_id,
  current_location,
  rating,
  created_at,
  updated_at,
  vehicle_type,
  status
FROM public.drivers
WHERE status = 'online';