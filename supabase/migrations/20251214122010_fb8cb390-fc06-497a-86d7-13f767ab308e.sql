-- Fix notification injection vulnerability
-- Remove the overly permissive INSERT policy that allows anyone to create notifications for any user

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Notifications should only be created by:
-- 1. Edge Functions with service role (bypasses RLS)
-- 2. Database triggers (bypasses RLS)
-- No client-side notification creation is needed