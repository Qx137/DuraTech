-- Create delivery companies table
CREATE TABLE public.delivery_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  rating NUMERIC(3,2) DEFAULT 5.0,
  is_verified BOOLEAN DEFAULT FALSE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add company_id to drivers table (nullable for individual drivers)
ALTER TABLE public.drivers 
ADD COLUMN company_id UUID REFERENCES public.delivery_companies(id) ON DELETE SET NULL;

-- Create delivery bids table for competitive bidding
CREATE TABLE public.delivery_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.delivery_companies(id) ON DELETE CASCADE,
  bid_amount NUMERIC NOT NULL,
  estimated_time_minutes INTEGER NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, withdrawn
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bid_provider_check CHECK (
    (driver_id IS NOT NULL AND company_id IS NULL) OR 
    (driver_id IS NULL AND company_id IS NOT NULL) OR
    (driver_id IS NOT NULL AND company_id IS NOT NULL)
  )
);

-- Add bidding-related columns to deliveries
ALTER TABLE public.deliveries
ADD COLUMN bidding_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN bidding_deadline TIMESTAMPTZ,
ADD COLUMN selected_bid_id UUID REFERENCES public.delivery_bids(id),
ADD COLUMN buyer_can_select BOOLEAN DEFAULT TRUE;

-- Enable RLS on new tables
ALTER TABLE public.delivery_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_companies
CREATE POLICY "Anyone can view verified companies"
ON public.delivery_companies FOR SELECT
USING (is_verified = true OR owner_id = auth.uid());

CREATE POLICY "Owners can create their company"
ON public.delivery_companies FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their company"
ON public.delivery_companies FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their company"
ON public.delivery_companies FOR DELETE
USING (auth.uid() = owner_id);

-- RLS Policies for delivery_bids
CREATE POLICY "Delivery owners can view bids"
ON public.delivery_bids FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    WHERE d.id = delivery_bids.delivery_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Bidders can view their own bids"
ON public.delivery_bids FOR SELECT
USING (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  OR company_id IN (SELECT id FROM delivery_companies WHERE owner_id = auth.uid())
);

CREATE POLICY "Drivers can create bids"
ON public.delivery_bids FOR INSERT
WITH CHECK (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  OR company_id IN (SELECT id FROM delivery_companies WHERE owner_id = auth.uid())
);

CREATE POLICY "Bidders can update their pending bids"
ON public.delivery_bids FOR UPDATE
USING (
  status = 'pending' AND (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    OR company_id IN (SELECT id FROM delivery_companies WHERE owner_id = auth.uid())
  )
)
WITH CHECK (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  OR company_id IN (SELECT id FROM delivery_companies WHERE owner_id = auth.uid())
);

CREATE POLICY "Buyers can accept/reject bids on their deliveries"
ON public.delivery_bids FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    WHERE d.id = delivery_bids.delivery_id
    AND o.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_delivery_bids_delivery_id ON public.delivery_bids(delivery_id);
CREATE INDEX idx_delivery_bids_driver_id ON public.delivery_bids(driver_id);
CREATE INDEX idx_delivery_bids_company_id ON public.delivery_bids(company_id);
CREATE INDEX idx_delivery_bids_status ON public.delivery_bids(status);
CREATE INDEX idx_drivers_company_id ON public.drivers(company_id);
CREATE INDEX idx_delivery_companies_owner_id ON public.delivery_companies(owner_id);

-- Enable realtime for bids
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_bids;

-- Trigger for updated_at on delivery_companies
CREATE TRIGGER update_delivery_companies_updated_at
BEFORE UPDATE ON public.delivery_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on delivery_bids
CREATE TRIGGER update_delivery_bids_updated_at
BEFORE UPDATE ON public.delivery_bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();