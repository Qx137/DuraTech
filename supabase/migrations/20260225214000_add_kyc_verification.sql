-- Migration: Add KYC Verification
-- Created at: 2026-02-25 21:40:00

-- Add KYC status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'none' 
CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected'));

-- Create KYC verifications table
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_type TEXT NOT NULL CHECK (id_type IN ('national_id', 'passport', 'drivers_license')),
  id_front_url TEXT NOT NULL,
  id_back_url TEXT,
  selfie_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for kyc_verifications
CREATE POLICY "Users can view their own KYC verification" ON public.kyc_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own KYC verification" ON public.kyc_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KYC verification" ON public.kyc_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Update handle_new_user function to include kyc_status if needed
-- (Though it has a default, it's good practice to be explicit if the trigger function recreates records)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, user_type, kyc_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', 'User'),
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'buyer'),
    'none'
  );
  RETURN new;
END;
$$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON public.kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON public.kyc_verifications(status);
