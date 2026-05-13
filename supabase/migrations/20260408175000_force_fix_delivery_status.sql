
-- Robust fix for delivery status check constraints
-- This script drops any existing check constraints on the status column and recreates it properly

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Find and drop all check constraints on the deliveries table that involve the status column
    FOR r IN (
        SELECT conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public' 
          AND rel.relname = 'deliveries'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
    END LOOP;
END $$;

-- Now add the definitive constraint
ALTER TABLE public.deliveries
ADD CONSTRAINT deliveries_status_check 
CHECK (status IN (
  'pending', 
  'awaiting_bids', 
  'scanning', 
  'assigned', 
  'pickup', 
  'picked_up', 
  'delivery', 
  'in_transit', 
  'delivered', 
  'cancelled'
));

-- Update comment for clarity
COMMENT ON COLUMN public.deliveries.status IS 'Delivery status: pending, awaiting_bids, scanning, assigned, pickup, picked_up, delivery, in_transit, delivered, or cancelled.';

-- Also ensure any existing 'pending' deliveries that should be 'awaiting_bids' are updated if they have bidding enabled
UPDATE public.deliveries 
SET status = 'awaiting_bids' 
WHERE status = 'pending' AND bidding_enabled = true;
