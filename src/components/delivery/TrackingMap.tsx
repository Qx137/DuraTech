import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Package } from 'lucide-react';

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

// Custom driver marker icon
const driverIcon = new L.DivIcon({
  className: 'custom-driver-marker',
  html: `
    <div style="
      background: hsl(var(--primary));
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border: 3px solid white;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Custom destination marker icon
const destinationIcon = new L.DivIcon({
  className: 'custom-destination-marker',
  html: `
    <div style="
      background: hsl(var(--destructive));
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border: 3px solid white;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

interface TrackingMapProps {
  driverLocation: { latitude: number; longitude: number } | null;
  destinationLocation: { latitude: number; longitude: number };
  driverName?: string;
  showRoute?: boolean;
}

// Component to update map bounds when locations change
function MapUpdater({ driverLocation, destinationLocation }: { 
  driverLocation: { latitude: number; longitude: number } | null;
  destinationLocation: { latitude: number; longitude: number };
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([]);
    
    if (driverLocation) {
      bounds.extend([driverLocation.latitude, driverLocation.longitude]);
    }
    bounds.extend([destinationLocation.latitude, destinationLocation.longitude]);

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [driverLocation, destinationLocation, map]);

  return null;
}

const TrackingMap = ({ 
  driverLocation, 
  destinationLocation, 
  driverName = 'Driver',
  showRoute = true 
}: TrackingMapProps) => {
  const [mapKey, setMapKey] = useState(0);
  
  // Default center point (will be adjusted by MapUpdater)
  const defaultCenter: [number, number] = [
    destinationLocation.latitude,
    destinationLocation.longitude
  ];

  // Create route line coordinates
  const routeCoordinates: [number, number][] = driverLocation && showRoute
    ? [
        [driverLocation.latitude, driverLocation.longitude],
        [destinationLocation.latitude, destinationLocation.longitude]
      ]
    : [];

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border relative">
      <MapContainer
        key={mapKey}
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater 
          driverLocation={driverLocation} 
          destinationLocation={destinationLocation} 
        />

        {/* Driver Location Marker */}
        {driverLocation && (
          <Marker 
            position={[driverLocation.latitude, driverLocation.longitude]}
            icon={driverIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{driverName}</p>
                <p className="text-xs text-muted-foreground">Current Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        <Marker 
          position={[destinationLocation.latitude, destinationLocation.longitude]}
          icon={destinationIcon}
        >
          <Popup>
            <div className="text-center">
              <p className="font-semibold">Delivery Destination</p>
              <p className="text-xs text-muted-foreground">
                {destinationLocation.latitude.toFixed(4)}, {destinationLocation.longitude.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Route Line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: 'hsl(var(--primary))',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 10'
            }}
          />
        )}
      </MapContainer>

      {/* Live Indicator */}
      {driverLocation && (
        <div className="absolute top-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            </div>
            <span className="text-xs font-medium">Live Tracking</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingMap;
