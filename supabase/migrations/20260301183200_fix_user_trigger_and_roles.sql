
-- Step 1: Fix handle_new_user function to ensure it populates both profiles and user_roles
-- We must merge the logic from various migrations (KYC, Roles, Social)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Insert into profiles table
  INSERT INTO public.profiles (id, name, email, user_type, kyc_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', 'User'),
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'buyer'),
    'none'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type;
  
  -- 2. Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data ->> 'user_type')::app_role, 'buyer'::app_role)
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Step 2: Backfill missing user_roles records from existing profiles
-- This ensures users who registered while the trigger was broken can now add products
INSERT INTO public.user_roles (user_id, role)
SELECT id, user_type::app_role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Ensure products insert policy is correctly set (re-applying just in case)
DROP POLICY IF EXISTS "Sellers can create their own products" ON public.products;
CREATE POLICY "Sellers can create their own products"
ON public.products FOR INSERT
WITH CHECK (
  auth.uid() = seller_id 
  AND public.has_role(auth.uid(), 'seller')
);
