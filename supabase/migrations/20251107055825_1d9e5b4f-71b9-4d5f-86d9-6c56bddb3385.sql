-- Enable realtime for drivers table
ALTER TABLE public.drivers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;

-- Enable realtime for deliveries table
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;

-- Add distance tracking to deliveries
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS distance_km numeric;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS estimated_price numeric;

-- Create index for faster driver queries
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON public.drivers USING GIN(current_location);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

-- Add RLS policy for drivers to view available deliveries
CREATE POLICY "Drivers can view available deliveries"
ON public.deliveries
FOR SELECT
USING (
  status IN ('pending', 'assigned') 
  AND EXISTS (
    SELECT 1 FROM drivers 
    WHERE drivers.user_id = auth.uid()
  )
);

-- Add RLS policy for drivers to accept deliveries
CREATE POLICY "Drivers can accept pending deliveries"
ON public.deliveries
FOR UPDATE
USING (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM drivers 
    WHERE drivers.user_id = auth.uid()
    AND drivers.status = 'available'
  )
);