import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, address, type, points } = await req.json();

    let url: string;
    let transformedData: any;

    if (type === 'reverse') {
      // Reverse geocoding using Nominatim: coordinates to address
      if (!lat || !lng) {
        throw new Error('Latitude and longitude are required for reverse geocoding');
      }
      url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      
      console.log('Nominatim reverse geocoding request:', { type, lat, lng });
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'ZimbaMarket/1.0' }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Nominatim API request failed');
      }

      // Transform Nominatim response to match expected format
      transformedData = {
        hits: [{
          point: { lat: parseFloat(data.lat), lng: parseFloat(data.lon) },
          name: data.display_name,
          country: data.address?.country,
          city: data.address?.city || data.address?.town || data.address?.village,
          state: data.address?.state
        }]
      };

    } else if (type === 'forward') {
      // Forward geocoding using Nominatim: address to coordinates
      if (!address) {
        throw new Error('Address is required for forward geocoding');
      }
      url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      
      console.log('Nominatim forward geocoding request:', { type, address });
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'ZimbaMarket/1.0' }
      });
      const data = await response.json();

      if (!response.ok || data.length === 0) {
        throw new Error('Nominatim API request failed or no results found');
      }

      // Transform Nominatim response to match expected format
      transformedData = {
        hits: data.map((item: any) => ({
          point: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
          name: item.display_name,
          country: item.address?.country,
          city: item.address?.city || item.address?.town || item.address?.village,
          state: item.address?.state
        }))
      };

    } else if (type === 'route') {
      // Route calculation using OSRM
      if (!points || points.length < 2) {
        throw new Error('At least 2 points are required for routing');
      }
      const [lat1, lng1] = points[0];
      const [lat2, lng2] = points[1];
      url = `http://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
      
      console.log('OSRM routing request:', { type, points });
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.code !== 'Ok') {
        throw new Error('OSRM routing request failed');
      }

      // Transform OSRM response to match expected format
      transformedData = {
        paths: [{
          distance: data.routes[0].distance // OSRM returns distance in meters
        }]
      };

    } else {
      throw new Error('Invalid type. Use "reverse", "forward", or "route"');
    }

    return new Response(JSON.stringify(transformedData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in graphhopper-geocode function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
