-- Fix 1: Restrict product-media uploads to sellers only with file extension restrictions
-- First drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload product media" ON storage.objects;

-- Create restricted policy: only sellers can upload, must be in their own folder, image files only
CREATE POLICY "Sellers can upload product media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-media'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'seller')
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

-- Fix 2: Create webhook_log table for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_reference text NOT NULL,
  webhook_status text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(webhook_reference, webhook_status)
);

-- Enable RLS on webhook_log (no user access needed, only service role)
ALTER TABLE public.webhook_log ENABLE ROW LEVEL SECURITY;
-- No policies = no client access, only service role can read/write
