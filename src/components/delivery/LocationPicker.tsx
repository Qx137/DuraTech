import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Fix for default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface Location {
    lat: number;
    lng: number;
}

interface LocationPickerProps {
    pickup: Location | null;
    destination: Location | null;
    onPickupChange: (loc: Location) => void;
    onDestinationChange: (loc: Location) => void;
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Helper component to center map on location
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export const LocationPicker = ({ pickup, destination, onPickupChange, onDestinationChange }: LocationPickerProps) => {
    const [selecting, setSelecting] = useState<'pickup' | 'destination'>('pickup');
    const [locating, setLocating] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-17.8252, 31.0335]);
    const [zoom, setZoom] = useState(13);

    // Switch to destination mode if pickup is set
    useEffect(() => {
        if (pickup && !destination) {
            setSelecting('destination');
        }
    }, [pickup, destination]);

    const handleMapClick = (lat: number, lng: number) => {
        if (selecting === 'pickup') {
            onPickupChange({ lat, lng });
        } else {
            onDestinationChange({ lat, lng });
        }
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                if (selecting === 'pickup') {
                    onPickupChange({ lat: latitude, lng: longitude });
                } else {
                    onDestinationChange({ lat: latitude, lng: longitude });
                }
                setMapCenter([latitude, longitude]);
                setZoom(16);
                setLocating(false);
                toast.success(`Set ${selecting} to current location`);
            },
            (error) => {
                console.error('Error getting location:', error);
                toast.error('Could not access your location. Please check permissions.');
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <ChangeView center={mapCenter} zoom={zoom} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents onMapClick={handleMapClick} />

                {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
                {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />}
            </MapContainer>

            {/* Geolocation Button */}
            <div className="absolute bottom-20 right-4 z-[1000] pointer-events-auto">
                <button
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="w-12 h-12 bg-background border rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors disabled:opacity-50 group"
                    title="Use my location"
                >
                    {locating ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                        <Target className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    )}
                </button>
            </div>

            {/* Mode Toggle Overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 bg-background/95 backdrop-blur-sm border p-1 rounded-full shadow-lg">
                <button
                    onClick={() => setSelecting('pickup')}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selecting === 'pickup' ? 'bg-green-600 text-white shadow-sm' : 'hover:bg-muted'
                        }`}
                >
                    Set Pickup
                </button>
                <button
                    onClick={() => setSelecting('destination')}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selecting === 'destination' ? 'bg-red-600 text-white shadow-sm' : 'hover:bg-muted'
                        }`}
                >
                    Set Destination
                </button>
            </div>

            <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm border p-3 rounded-lg shadow-lg text-xs max-w-[200px]">
                <p className="font-semibold mb-1">How to use:</p>
                <p className="text-muted-foreground">Click on the map to set the markers. Toggle between Pickup and Destination using the top buttons.</p>
            </div>
        </div>
    );
};
