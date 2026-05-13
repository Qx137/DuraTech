-- Drop the existing constraint so we can recreate it with new values
ALTER TABLE public.deliveries 
DROP CONSTRAINT IF EXISTS deliveries_status_check;

-- Add the updated constraint including bidding and scanning statuses
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

-- Add comments for clarity
COMMENT ON COLUMN public.deliveries.status IS 'Delivery status: pending, awaiting_bids, scanning, assigned, pickup, picked_up, delivery, in_transit, delivered, or cancelled.';
