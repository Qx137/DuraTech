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
    const apiKey = Deno.env.get('GRAPHHOPPER_API_KEY');
    if (!apiKey) {
      throw new Error('GRAPHHOPPER_API_KEY not configured');
    }

    const { lat, lng, address, type, points } = await req.json();

    let url: string;
    if (type === 'reverse') {
      // Reverse geocoding: coordinates to address
      if (!lat || !lng) {
        throw new Error('Latitude and longitude are required for reverse geocoding');
      }
      url = `https://graphhopper.com/api/1/geocode?reverse=true&point=${lat},${lng}&key=${apiKey}`;
    } else if (type === 'forward') {
      // Forward geocoding: address to coordinates
      if (!address) {
        throw new Error('Address is required for forward geocoding');
      }
      url = `https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(address)}&key=${apiKey}`;
    } else if (type === 'route') {
      // Route calculation
      if (!points || points.length < 2) {
        throw new Error('At least 2 points are required for routing');
      }
      const pointsParam = points.map((p: [number, number]) => `point=${p[0]},${p[1]}`).join('&');
      url = `https://graphhopper.com/api/1/route?${pointsParam}&vehicle=car&locale=en&key=${apiKey}&calc_points=false&instructions=false`;
    } else {
      throw new Error('Invalid type. Use "reverse", "forward", or "route"');
    }

    console.log('GraphHopper API request:', { type, url: url.replace(apiKey, '***') });

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('GraphHopper API error:', data);
      
      // If rate limit exceeded, return a fallback response for route calculations
      if (data.message && data.message.includes('API limit')) {
        console.log('Rate limit exceeded, using fallback calculation');
        
        if (type === 'route' && points && points.length === 2) {
          // Calculate straight-line distance as fallback
          const [lat1, lng1] = points[0];
          const [lat2, lng2] = points[1];
          const R = 6371; // Earth's radius in km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c * 1000; // Convert to meters
          
          return new Response(JSON.stringify({
            paths: [{
              distance: distance * 1.3 // Add 30% for actual road distance estimate
            }]
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      throw new Error(data.message || 'GraphHopper API request failed');
    }

    return new Response(JSON.stringify(data), {
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
