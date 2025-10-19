-- Fix 1: Create user_roles table for proper RBAC (fixes privilege escalation)
CREATE TYPE public.app_role AS ENUM ('buyer', 'seller', 'driver');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own roles, not modify them
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Migrate existing user_type data to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, user_type::app_role
FROM public.profiles
WHERE user_type IN ('buyer', 'seller', 'driver')
ON CONFLICT (user_id, role) DO NOTHING;

-- Update RLS policies to use has_role function instead of user_type
DROP POLICY IF EXISTS "Sellers can create their own products" ON public.products;
CREATE POLICY "Sellers can create their own products"
ON public.products FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'seller'));

DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
CREATE POLICY "Sellers can update their own products"
ON public.products FOR UPDATE
USING (auth.uid() = seller_id AND public.has_role(auth.uid(), 'seller'));

DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;
CREATE POLICY "Sellers can delete their own products"
ON public.products FOR DELETE
USING (auth.uid() = seller_id AND public.has_role(auth.uid(), 'seller'));

-- Update profiles RLS to prevent user_type updates
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent changing user_type (it's now read-only)
  user_type = (SELECT user_type FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Public can view limited seller profiles" ON public.profiles;
CREATE POLICY "Public can view seller profiles"
ON public.profiles FOR SELECT
USING (
  -- Users can view seller profiles
  (user_type = 'seller' AND auth.uid() IS NOT NULL) OR
  -- Users can view their own profile
  auth.uid() = id
);

-- Fix 3: Drop the security definer view that was flagged
DROP VIEW IF EXISTS public.public_drivers;

-- Create a regular view instead (not security definer)
CREATE VIEW public.public_drivers AS
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