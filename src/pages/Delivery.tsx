import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LocationPicker } from '@/components/delivery/LocationPicker';
import { DeliveryRequestPanel } from '@/components/delivery/DeliveryRequestPanel';
import { getDistance, calculatePrice } from '@/utils/delivery';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  lat: number;
  lng: number;
}

const Delivery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [pickupName, setPickupName] = useState('');
  const [destinationName, setDestinationName] = useState('');

  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Update distance and price when locations change
  useEffect(() => {
    if (pickup && destination) {
      const dist = getDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
      setDistance(dist);
      setPrice(calculatePrice(dist));
    } else {
      setDistance(null);
      setPrice(null);
    }
  }, [pickup, destination]);

  const handleRequest = async () => {
    if (!user) {
      toast.error('Please login to request a delivery');
      navigate('/login');
      return;
    }

    if (!pickup || !destination || !pickupName || !destinationName) {
      toast.error('Please fill in all details');
      return;
    }

    setLoading(true);
    try {
      // 1. Create a "Delivery Service" order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total: price || 0,
          payment_method: 'cash', // Default for now
          payment_status: 'pending',
          delivery_address: {
            latitude: destination.lat,
            longitude: destination.lng,
            address: destinationName
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create the delivery record
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: order.id,
          pickup_address: {
            latitude: pickup.lat,
            longitude: pickup.lng,
            address: pickupName
          },
          delivery_address: {
            latitude: destination.lat,
            longitude: destination.lng,
            address: destinationName
          },
          status: 'pending',
          distance_km: distance
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      toast.success('Delivery request submitted! Drivers are being notified.');
      navigate(`/delivery-tracking?orderId=${order.id}`);

    } catch (error: any) {
      console.error('Error creating delivery request:', error);
      toast.error(error.message || 'Failed to create delivery request');
    } finally {
      setLoading(false);
    }
  };

  const isValid = !!(pickup && destination && pickupName && destinationName);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row relative bg-background overflow-hidden">
      {/* Header Mobile / Back Button */}
      <div className="absolute top-4 left-4 z-[2000] pointer-events-auto">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full shadow-md bg-white/90 backdrop-blur-sm border border-border"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Map Section - Main background on mobile, left on desktop */}
      <div className="flex-1 w-full h-full z-0">
        <LocationPicker
          pickup={pickup}
          destination={destination}
          onPickupChange={setPickup}
          onDestinationChange={setDestination}
        />
      </div>

      {/* Panel Section - Floats over map on mobile, right on desktop */}
      <div className="absolute inset-x-0 bottom-0 md:relative md:inset-auto md:w-auto p-4 md:p-6 z-[1500] pointer-events-none flex justify-center items-end md:items-center">
        <DeliveryRequestPanel
          pickupName={pickupName}
          destinationName={destinationName}
          onPickupNameChange={setPickupName}
          onDestinationNameChange={setDestinationName}
          distance={distance}
          price={price}
          onRequest={handleRequest}
          loading={loading}
          isValid={isValid}
        />
      </div>
    </div>
  );
};

export default Delivery;