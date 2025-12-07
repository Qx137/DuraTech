-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create driver_applications table for storing driver registration applications
CREATE TABLE public.driver_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  national_id TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  
  -- Document Information
  drivers_license TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  
  -- Vehicle Information
  vehicle_type TEXT NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year TEXT NOT NULL,
  vehicle_color TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  
  -- Banking Information (masked for security)
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number_masked TEXT NOT NULL,
  mobile_money_number_masked TEXT,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own applications"
  ON public.driver_applications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON public.driver_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending applications"
  ON public.driver_applications
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Create indexes
CREATE INDEX idx_driver_applications_user_id ON public.driver_applications(user_id);
CREATE INDEX idx_driver_applications_status ON public.driver_applications(status);

-- Create trigger for updated_at
CREATE TRIGGER update_driver_applications_updated_at
  BEFORE UPDATE ON public.driver_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();