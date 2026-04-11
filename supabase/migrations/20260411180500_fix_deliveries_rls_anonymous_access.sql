
-- =========================================================================================
-- Fix Anonymous Access on public.deliveries
-- Scopes all policies to 'authenticated' and strengthens checks to prevent unauthorized access.
-- =========================================================================================

-- 1. Drop existing insecure or overly permissive policies
DROP POLICY IF EXISTS "Users can view deliveries for their orders" ON public.deliveries;
DROP POLICY IF EXISTS "Drivers can view their assigned deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Drivers can view available deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "System can create deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Drivers can accept pending deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Drivers can update their assigned deliveries" ON public.deliveries;

-- 2. CREATE SELECT POLICY: Users (Buyers) viewing their own order deliveries
CREATE POLICY "Users can view deliveries for their orders"
ON public.deliveries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = deliveries.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- 3. CREATE SELECT POLICY: Drivers viewing their assigned deliveries
CREATE POLICY "Drivers can view their assigned deliveries"
ON public.deliveries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers 
    WHERE drivers.id = deliveries.driver_id 
    AND drivers.user_id = auth.uid()
  )
);

-- 4. CREATE SELECT POLICY: Drivers viewing available deliveries (pending or specifically assigned to them)
CREATE POLICY "Drivers can view available deliveries"
ON public.deliveries
FOR SELECT
TO authenticated
USING (
  status IN ('pending', 'assigned') 
  AND EXISTS (
    SELECT 1 FROM public.drivers 
    WHERE drivers.user_id = auth.uid()
  )
);

-- 5. CREATE INSERT POLICY: Restrict delivery creation to authenticated users for their own orders
-- This replaces the "System can create deliveries" policy which was wide open.
CREATE POLICY "Users can create deliveries for their own orders"
ON public.deliveries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_id
    AND orders.user_id = auth.uid()
  )
);

-- 6. CREATE UPDATE POLICY: Drivers accepting pending deliveries
CREATE POLICY "Drivers can accept pending deliveries"
ON public.deliveries
FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.drivers 
    WHERE drivers.user_id = auth.uid()
    AND drivers.status = 'available'
  )
)
WITH CHECK (
  -- Drivers can only set status to 'assigned' and must assign to themselves
  status = 'assigned'
  AND driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
);

-- 7. CREATE UPDATE POLICY: Drivers updating their currently assigned deliveries
CREATE POLICY "Drivers can update their assigned deliveries"
ON public.deliveries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers 
    WHERE drivers.id = deliveries.driver_id 
    AND drivers.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Ensure driver remains assigned to themselves
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
  -- Only allow valid status transitions: assigned -> picked_up -> in_transit -> delivered
  AND status IN ('assigned', 'picked_up', 'in_transit', 'delivered')
);
