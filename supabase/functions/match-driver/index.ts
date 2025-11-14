import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Location {
  latitude: number;
  longitude: number;
}

// add driver interface used in the function
interface Driver {
  id: string;
  user_id?: string;
  current_location?: Location | null;
  rating?: number;
  vehicle_type?: string;
  status?: string;
  // include any other fields you expect from the drivers table
}

// Calculate distance between two points using Haversine formula
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

if (typeof Deno !== 'undefined' && typeof (Deno as any).serve === 'function') {
  (Deno as any).serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      const { deliveryId, pickupLocation } = await req.json();

      if (!deliveryId || !pickupLocation) {
        return new Response(
          JSON.stringify({ error: 'Missing deliveryId or pickupLocation' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log('Matching driver for delivery:', deliveryId);
      console.log('Pickup location:', pickupLocation);

      // Fetch available drivers
      const driversRes: any = await (supabaseClient.from('drivers') as any)
        .select('*')
        .eq('status', 'available');
      const drivers: Driver[] = driversRes?.data ?? [];
      const driversError = driversRes?.error ?? null;

      if (driversError) {
        console.error('Error fetching drivers:', driversError);
        throw driversError;
      }

      if (!drivers || drivers.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No available drivers found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      console.log('Found available drivers:', drivers.length);

      // Calculate distances and find best match
      const driversWithDistance = drivers
        .filter((driver: Driver) => !!driver.current_location)
        .map((driver: Driver) => {
          const driverLocation = driver.current_location as Location;
          const distance = calculateDistance(pickupLocation, driverLocation);
          return {
            ...driver,
            distance,
            score: distance * 0.7 + (5 - (driver.rating ?? 5)) * 0.3 // Weighted score: distance (70%) + rating (30%)
          };
        })
        .sort((a, b) => a.score - b.score);

      if (driversWithDistance.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No drivers with location data found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const bestDriver = driversWithDistance[0];
      console.log('Best matched driver:', bestDriver.id, 'Distance:', bestDriver.distance.toFixed(2), 'km');

      // Assign delivery to driver
      const updateRes: any = await (supabaseClient.from('deliveries') as any)
        .update({
          driver_id: bestDriver.id,
          status: 'assigned'
        })
        .eq('id', deliveryId);
      const updateError = updateRes?.error ?? null;

      if (updateError) {
        console.error('Error updating delivery:', updateError);
        throw updateError;
      }

      // Update driver status to busy
      const driverUpdateRes: any = await (supabaseClient.from('drivers') as any)
        .update({ status: 'busy' })
        .eq('id', bestDriver.id);
      const driverUpdateError = driverUpdateRes?.error ?? null;

      if (driverUpdateError) {
        console.error('Error updating driver status:', driverUpdateError);
        throw driverUpdateError;
      }

      // Create notification for driver
      const notificationRes: any = await (supabaseClient.from('notifications') as any)
        .insert({
          user_id: bestDriver.user_id,
          type: 'delivery_assigned',
          title: 'New Delivery Assignment',
          message: `You have been assigned a new delivery ${bestDriver.distance.toFixed(1)} km away`,
          data: { delivery_id: deliveryId, distance: bestDriver.distance }
        });
      const notificationError = notificationRes?.error ?? null;

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          driver: {
            id: bestDriver.id,
            name: bestDriver.user_id,
            distance: bestDriver.distance,
            rating: bestDriver.rating,
            vehicle_type: bestDriver.vehicle_type
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (err) {
      console.error('Error in match-driver function:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      return new Response(
        JSON.stringify({ error: errMsg }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  });
} else {
  throw new Error('Deno.serve is not available in this runtime');
}
