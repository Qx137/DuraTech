ALTER TABLE public.kyc_verifications 
  ADD COLUMN IF NOT EXISTS seller_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS certificate_of_incorporation_url text,
  ADD COLUMN IF NOT EXISTS tax_clearance_url text;