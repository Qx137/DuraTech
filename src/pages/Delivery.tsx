import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LocationPicker } from '@/components/delivery/LocationPicker';
import { DeliveryRequestPanel } from '@/components/delivery/DeliveryRequestPanel';
import { TransportType } from '@/components/delivery/TransportTypeSelector';
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

  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState<'pickup' | 'destination' | null>(null);

  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [transportMultiplier, setTransportMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);

  // Reverse geocoding helper
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Auto-locate on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const loc = { lat: latitude, lng: longitude };
          setPickup(loc);
          const address = await reverseGeocode(latitude, longitude);
          setPickupName(address);
        },
        (error) => {
          console.error('Error getting initial location:', error);
        }
      );
    }
  }, []);

  // Search logic for Nominatim (Debounced)
  useEffect(() => {
    const searchLocation = async (query: string, type: 'pickup' | 'destination') => {
      if (query.length < 3 || query.includes(',') || query === 'My Location' || query === 'Destination') {
        if (type === 'pickup') setPickupSuggestions([]);
        else setDestinationSuggestions([]);
        return;
      }

      setSearching(type);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        const data = await response.json();
        if (type === 'pickup') setPickupSuggestions(data);
        else setDestinationSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setSearching(null);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      if (pickupName && !pickupName.includes('My Location') && pickupName.length > 5) {
        // Only search if it's not a reverse geocoded address (heuristic: contains commas)
        if (!pickupName.includes(',')) {
          searchLocation(pickupName, 'pickup');
        }
      }
      if (destinationName && destinationName !== 'Destination' && destinationName.length > 5) {
        if (!destinationName.includes(',')) {
          searchLocation(destinationName, 'destination');
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [pickupName, destinationName]);

  // Update distance and price when locations change
  useEffect(() => {
    if (pickup && destination) {
      const dist = getDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
      setDistance(dist);
      setPrice(calculatePrice(dist) * transportMultiplier);
    } else {
      setDistance(null);
      setPrice(null);
    }
  }, [pickup, destination, transportMultiplier]);

  const handleTransportSelect = (type: TransportType) => {
    setSelectedTransport(type.id);
    setTransportMultiplier(type.priceMultiplier);
  };

  const handleSelectSuggestion = (suggestion: any, type: 'pickup' | 'destination') => {
    const loc = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
    if (type === 'pickup') {
      setPickup(loc);
      setPickupName(suggestion.display_name);
      setPickupSuggestions([]);
    } else {
      setDestination(loc);
      setDestinationName(suggestion.display_name);
      setDestinationSuggestions([]);
    }
  };

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
      // Get user name parts
      const nameParts = user.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // 1. Create a "Delivery Service" order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total: price || 0,
          payment_method: 'cash', // Default for now
          payment_status: 'pending',
          // order_type: 'service',
          delivery_address: {
            firstName,
            lastName,
            address: destinationName,
            phone: user.phone || '',
            coordinates: {
              latitude: destination.lat,
              longitude: destination.lng,
            }
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
            firstName,
            lastName,
            address: pickupName,
            phone: user.phone || '',
            coordinates: {
              latitude: pickup.lat,
              longitude: pickup.lng,
            }
          },
          delivery_address: {
            firstName,
            lastName,
            address: destinationName,
            phone: user.phone || '',
            coordinates: {
              latitude: destination.lat,
              longitude: destination.lng,
            }
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
          onPickupChange={async (loc) => {
            setPickup(loc);
            const address = await reverseGeocode(loc.lat, loc.lng);
            setPickupName(address);
          }}
          onDestinationChange={async (loc) => {
            setDestination(loc);
            const address = await reverseGeocode(loc.lat, loc.lng);
            setDestinationName(address);
          }}
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
          pickupSuggestions={pickupSuggestions}
          destinationSuggestions={destinationSuggestions}
          onSelectSuggestion={handleSelectSuggestion}
          searching={searching}
        />
      </div>
    </div>
  );
};

export default Delivery;