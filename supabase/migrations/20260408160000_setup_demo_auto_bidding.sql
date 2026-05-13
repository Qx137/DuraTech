-- Add column for simulated bids
ALTER TABLE public.delivery_bids 
ADD COLUMN IF NOT EXISTS demo_provider_name TEXT;

-- Relax the check constraint to allow bids without a real driver_id/company_id (for demo purposes)
ALTER TABLE public.delivery_bids 
DROP CONSTRAINT IF EXISTS bid_provider_check;

ALTER TABLE public.delivery_bids 
ADD CONSTRAINT bid_provider_check CHECK (
  (driver_id IS NOT NULL AND company_id IS NULL) OR 
  (driver_id IS NULL AND company_id IS NOT NULL) OR
  (driver_id IS NOT NULL AND company_id IS NOT NULL) OR
  (demo_provider_name IS NOT NULL)
);

-- Function to generate demo bids automatically
CREATE OR REPLACE FUNCTION public.populate_demo_bids()
RETURNS TRIGGER AS $$
DECLARE
    items_subtotal NUMERIC;
    base_bid NUMERIC;
BEGIN
    -- Only generate bids for deliveries that have bidding enabled
    IF NEW.bidding_enabled = true THEN
        -- Use the user's offered_price as the base
        base_bid := NEW.offered_price;
        
        -- Bid 1: FastTrack Logistics (0% increment)
        INSERT INTO public.delivery_bids (
            delivery_id, 
            bid_amount, 
            estimated_time_minutes, 
            message, 
            status, 
            demo_provider_name
        ) VALUES (
            NEW.id, 
            ROUND(base_bid), 
            15, 
            'Available immediately, I''m nearby!', 
            'pending', 
            'FastTrack Logistics'
        );

        -- Bid 2: Swift Carrier (2% increment)
        INSERT INTO public.delivery_bids (
            delivery_id, 
            bid_amount, 
            estimated_time_minutes, 
            message, 
            status, 
            demo_provider_name
        ) VALUES (
            NEW.id, 
            ROUND(base_bid * 1.02), 
            25, 
            'Can handle this easily within the hour.', 
            'pending', 
            'Swift Carrier'
        );

        -- Bid 3: Pro Express (3% increment)
        INSERT INTO public.delivery_bids (
            delivery_id, 
            bid_amount, 
            estimated_time_minutes, 
            message, 
            status, 
            demo_provider_name
        ) VALUES (
            NEW.id, 
            ROUND(base_bid * 1.03), 
            20, 
            'Premium vehicle available for safe transport.', 
            'pending', 
            'Pro Express'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function after a new delivery is created
DROP TRIGGER IF EXISTS trigger_populate_demo_bids ON public.deliveries;
CREATE TRIGGER trigger_populate_demo_bids
AFTER INSERT ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.populate_demo_bids();

-- Add comment
COMMENT ON COLUMN public.delivery_bids.demo_provider_name IS 'Used for demonstration purposes to show simulated provider names.';
