import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export const LocationPicker = ({ pickup, destination, onPickupChange, onDestinationChange }: LocationPickerProps) => {
    const [selecting, setSelecting] = useState<'pickup' | 'destination'>('pickup');

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

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={[-17.8252, 31.0335]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents onMapClick={handleMapClick} />

                {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
                {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />}
            </MapContainer>

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
