import { createClient } from '@supabase/supabase-js';

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

// Map internal errors to safe client messages
function getSafeErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'Missing authorization header': 'Authentication required',
    'Unauthorized': 'Authentication required',
    'Missing deliveryId or pickupLocation': 'Invalid request',
    'Delivery not found': 'Unable to find delivery',
    'You are not authorized to request a driver for this delivery': 'Access denied',
    'No available drivers found': 'No drivers available at this time',
    'No drivers with location data found': 'No drivers available at this time',
  };

  for (const [pattern, message] of Object.entries(errorMap)) {
    if (error.includes(pattern)) {
      return message;
    }
  }

  return 'Unable to process request. Please try again.';
}

if (typeof Deno !== 'undefined' && typeof (Deno as any).serve === 'function') {
  (Deno as any).serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Create client with user's JWT to verify authentication
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        console.error('Missing authorization header');
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Client for verifying user auth
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      // Get the authenticated user
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !user) {
        console.error('Auth error:', userError);
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      console.log('Authenticated user:', user.id);

      // Service role client for privileged operations
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      const { deliveryId, pickupLocation } = await req.json();

      if (!deliveryId || !pickupLocation) {
        console.error('Missing required fields:', { deliveryId, pickupLocation });
        return new Response(
          JSON.stringify({ error: 'Invalid request' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log('Matching driver for delivery:', deliveryId);

      // AUTHORIZATION CHECK: Verify the user owns the order associated with this delivery
      const { data: delivery, error: deliveryError } = await supabaseAdmin
        .from('deliveries')
        .select('id, order_id, orders!inner(user_id)')
        .eq('id', deliveryId)
        .single();

      if (deliveryError || !delivery) {
        console.error('Delivery fetch error:', deliveryError);
        return new Response(
          JSON.stringify({ error: 'Unable to find delivery' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Check if the authenticated user owns the order
      const orderUserId = (delivery as any).orders?.user_id;
      if (orderUserId !== user.id) {
        console.error('Authorization failed: User', user.id, 'does not own order for delivery', deliveryId);
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      console.log('Authorization passed');

      // Fetch available drivers
      const driversRes: any = await (supabaseAdmin.from('drivers') as any)
        .select('*')
        .eq('status', 'available');
      const drivers: Driver[] = driversRes?.data ?? [];
      const driversError = driversRes?.error ?? null;

      if (driversError) {
        console.error('Error fetching drivers:', driversError);
        return new Response(
          JSON.stringify({ error: 'Unable to process request. Please try again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (!drivers || drivers.length === 0) {
        console.log('No available drivers found');
        return new Response(
          JSON.stringify({ error: 'No drivers available at this time' }),
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
        console.log('No drivers with location data found');
        return new Response(
          JSON.stringify({ error: 'No drivers available at this time' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const bestDriver = driversWithDistance[0];
      console.log('Best matched driver:', bestDriver.id, 'Distance:', bestDriver.distance.toFixed(2), 'km');

      // Assign delivery to driver
      const updateRes: any = await (supabaseAdmin.from('deliveries') as any)
        .update({
          driver_id: bestDriver.id,
          status: 'assigned'
        })
        .eq('id', deliveryId);
      const updateError = updateRes?.error ?? null;

      if (updateError) {
        console.error('Error updating delivery:', updateError);
        return new Response(
          JSON.stringify({ error: 'Unable to process request. Please try again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Update driver status to busy
      const driverUpdateRes: any = await (supabaseAdmin.from('drivers') as any)
        .update({ status: 'busy' })
        .eq('id', bestDriver.id);
      const driverUpdateError = driverUpdateRes?.error ?? null;

      if (driverUpdateError) {
        console.error('Error updating driver status:', driverUpdateError);
        // Don't fail the request, just log
      }

      // Create notification for driver
      const notificationRes: any = await (supabaseAdmin.from('notifications') as any)
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
        // Don't fail the request, just log
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
      const internalError = err instanceof Error ? err.message : String(err);
      console.error('Error in match-driver function:', internalError);

      const safeMessage = getSafeErrorMessage(internalError);

      return new Response(
        JSON.stringify({ error: safeMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  });
} else {
  throw new Error('Deno.serve is not available in this runtime');
}
