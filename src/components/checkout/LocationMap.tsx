import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Target } from 'lucide-react';

// You'll need to add your Mapbox token here
const MAPBOX_TOKEN = 'pk.eyJ1IjoidXNlcm5hbWUiLCJhIjoiY2xrZjBvNDBhMDA0ODNxcGNkZzVmZGN4ZiJ9.XYZ'; // Replace with actual token

interface LocationMapProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  selectedLocation: { lat: number; lng: number; address: string } | null;
}

const LocationMap: React.FC<LocationMapProps> = ({ onLocationSelect, selectedLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40],
      zoom: 9
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      
      // Remove existing marker
      if (marker.current) {
        marker.current.remove();
      }

      // Add new marker
      marker.current = new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
        );
        const data = await response.json();
        const address = data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        onLocationSelect({ lat, lng, address });
      } catch (error) {
        console.error('Error getting address:', error);
        onLocationSelect({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [onLocationSelect]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          const { latitude, longitude } = position.coords;
          
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 14
            });

            // Remove existing marker
            if (marker.current) {
              marker.current.remove();
            }

            // Add marker at current location
            marker.current = new mapboxgl.Marker({ color: '#10b981' })
              .setLngLat([longitude, latitude])
              .addTo(map.current);

            // Get address for current location
            fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
            )
              .then(response => response.json())
              .then(data => {
                const address = data.features[0]?.place_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                onLocationSelect({ lat: latitude, lng: longitude, address });
              })
              .catch(error => {
                console.error('Error getting address:', error);
                onLocationSelect({ lat: latitude, lng: longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
              });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Delivery Location</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Use Current Location
          </Button>
        </div>
        
        <div 
          ref={mapContainer} 
          className="w-full h-64 rounded-lg border border-border"
        />
        
        {selectedLocation && (
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 mt-1 text-primary" />
              <div>
                <p className="text-sm font-medium">Selected Location:</p>
                <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          Click on the map to select your delivery location or use your current location.
        </p>
      </CardContent>
    </Card>
  );
};

export default LocationMap;