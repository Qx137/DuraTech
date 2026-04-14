import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LocationPicker } from '@/components/delivery/LocationPicker';
import { DeliveryRequestPanel } from '@/components/delivery/DeliveryRequestPanel';
import { TransportType } from '@/components/delivery/TransportTypeSelector';
import { getDistance, calculatePrice } from '@/utils/delivery';
import { toast } from 'sonner';
import { Truck } from 'lucide-react';

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
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [offeredPrice, setOfferedPrice] = useState<number | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [transportMultiplier, setTransportMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user]);

  const fetchCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            seller_id
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };

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
        if (!pickupName.includes(',')) searchLocation(pickupName, 'pickup');
      }
      if (destinationName && destinationName !== 'Destination' && destinationName.length > 5) {
        if (!destinationName.includes(',')) searchLocation(destinationName, 'destination');
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [pickupName, destinationName]);

  useEffect(() => {
    if (pickup && destination) {
      const dist = getDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
      setDistance(dist);
      const calculated = calculatePrice(dist) * transportMultiplier;
      setMinPrice(calculated);
      setOfferedPrice(calculated);
    } else {
      setDistance(null);
      setMinPrice(null);
      setOfferedPrice(null);
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

  const handleOfferedPriceChange = (value: number) => {
    if (minPrice !== null && value >= minPrice) {
      setOfferedPrice(value);
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
    if (offeredPrice !== null && minPrice !== null && offeredPrice < minPrice) {
      toast.error('Offered price cannot be below the minimum');
      return;
    }

    setLoading(true);
    try {
      const nameParts = user.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const subtotal = cartItems.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);
      const deliveryFee = offeredPrice || 0;
      const tax = subtotal * 0.1;
      const total = subtotal + deliveryFee + tax;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total: total,
          tax: tax,
          payment_method: 'contipay',
          payment_status: 'pending',
          delivery_address: {
            firstName,
            lastName,
            address: destinationName,
            phone: user.phone || '',
            coordinates: { latitude: destination.lat, longitude: destination.lng }
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items from cart
      for (const cartItem of cartItems) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: cartItem.product_id,
            quantity: cartItem.quantity,
            price: cartItem.products.price
          });

        if (itemError) throw itemError;
      }

      // Clear cart
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (clearCartError) throw clearCartError;

      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: order.id,
          pickup_address: {
            firstName, lastName,
            address: pickupName,
            phone: user.phone || '',
            coordinates: { latitude: pickup.lat, longitude: pickup.lng }
          },
          delivery_address: {
            firstName, lastName,
            address: destinationName,
            phone: user.phone || '',
            coordinates: { latitude: destination.lat, longitude: destination.lng }
          },
          status: 'pending',
          distance_km: distance,
          transport_type: selectedTransport,
          offered_price: offeredPrice,
          min_price: minPrice,
          bidding_enabled: true,
          buyer_can_select: true,
          bidding_deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      toast.success('Request sent! Drivers will review your offer.');
      navigate(`/delivery-bids/${delivery.id}`);
    } catch (error: any) {
      console.error('Error creating delivery request:', error);
      toast.error(error.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const isValid = !!(pickup && destination && pickupName && destinationName && selectedTransport);

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden">
      {/* DuraGo Header */}
      <div className="bg-white border-[3px] border-orange-500 rounded-full mx-auto mt-6 px-8 py-3 flex items-center justify-center relative shadow-xl z-[2000] w-auto inline-flex min-w-[280px]">
        <button onClick={() => navigate(-1)} className="absolute left-6 text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 p-1.5 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex items-center justify-center pl-8">
          <img src="/DURAGO.webp" alt="DuraGo Logo" className="h-16 md:h-20 w-auto object-contain transform scale-[1.35] translate-y-1" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-6">
        {/* Map Frame */}
        <div className="h-[40vh] md:h-full md:flex-1 w-full bg-white border border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
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

        {/* Panel Frame */}
        <div className="flex-1 md:flex-none md:w-[420px] overflow-y-auto bg-white border border-slate-200 shadow-2xl rounded-[3rem] p-4 md:p-6">
          <DeliveryRequestPanel
            pickupName={pickupName}
            destinationName={destinationName}
            onPickupNameChange={setPickupName}
            onDestinationNameChange={setDestinationName}
            distance={distance}
            minPrice={minPrice}
            offeredPrice={offeredPrice}
            onOfferedPriceChange={handleOfferedPriceChange}
            onRequest={handleRequest}
            loading={loading}
            isValid={isValid}
            pickupSuggestions={pickupSuggestions}
            destinationSuggestions={destinationSuggestions}
            onSelectSuggestion={handleSelectSuggestion}
            searching={searching}
            selectedTransport={selectedTransport}
            onTransportSelect={handleTransportSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default Delivery;
