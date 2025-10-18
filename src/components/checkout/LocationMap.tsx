import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Target } from 'lucide-react';

// Fix default marker icons for Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface LocationMapProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  selectedLocation: { lat: number; lng: number; address: string } | null;
}

// GraphHopper API configuration
const GRAPHHOPPER_API_KEY = import.meta.env.VITE_GRAPHHOPPER_API_KEY || '';

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (location: { lat: number; lng: number; address: string }) => void }) {
  const [marker, setMarker] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setMarker(e.latlng);

      // Reverse geocode using GraphHopper
      try {
        const response = await fetch(
          `https://graphhopper.com/api/1/geocode?reverse=true&point=${lat},${lng}&key=${GRAPHHOPPER_API_KEY}`
        );
        const data = await response.json();
        const address = data.hits?.[0]?.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        onLocationSelect({ lat, lng, address });
      } catch (error) {
        console.error('Error getting address:', error);
        onLocationSelect({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      }
    },
  });

  return marker ? <Marker position={marker} /> : null;
}

const LocationMap: React.FC<LocationMapProps> = ({ onLocationSelect, selectedLocation }) => {
  const [center, setCenter] = useState<[number, number]>([40, -74]);
  const [key, setKey] = useState(0);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          setCenter([latitude, longitude]);
          setKey(prev => prev + 1); // Force map re-render

          // Get address for current location using GraphHopper
          try {
            const response = await fetch(
              `https://graphhopper.com/api/1/geocode?reverse=true&point=${latitude},${longitude}&key=${GRAPHHOPPER_API_KEY}`
            );
            const data = await response.json();
            const address = data.hits?.[0]?.name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            onLocationSelect({ lat: latitude, lng: longitude, address });
          } catch (error) {
            console.error('Error getting address:', error);
            onLocationSelect({ lat: latitude, lng: longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
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
        
        <div className="w-full h-64 rounded-lg border border-border overflow-hidden">
          <MapContainer
            key={key}
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={onLocationSelect} />
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
            )}
          </MapContainer>
        </div>
        
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
