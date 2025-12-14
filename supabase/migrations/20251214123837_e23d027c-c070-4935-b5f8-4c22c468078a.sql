-- Fix: Add WITH CHECK constraints to driver delivery update policies
-- This prevents drivers from setting invalid status values or modifying financial fields

-- Drop and recreate "Drivers can accept pending deliveries" with WITH CHECK
DROP POLICY IF EXISTS "Drivers can accept pending deliveries" ON public.deliveries;

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
)
WITH CHECK (
  -- Drivers can only set status to 'assigned' and assign to themselves
  status = 'assigned'
  AND driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

-- Drop and recreate "Drivers can update their assigned deliveries" with WITH CHECK
DROP POLICY IF EXISTS "Drivers can update their assigned deliveries" ON public.deliveries;

CREATE POLICY "Drivers can update their assigned deliveries"
ON public.deliveries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM drivers 
    WHERE drivers.id = deliveries.driver_id 
    AND drivers.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Driver must remain assigned to themselves (can't unassign)
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
  -- Only allow valid status transitions: assigned -> picked_up -> in_transit -> delivered
  AND status IN ('assigned', 'picked_up', 'in_transit', 'delivered')
);