import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Restaurant } from '../types';
import RestaurantOverlay from './RestaurantOverlay';

const defaultIcon = L.divIcon({
    className: 'custom-marker',
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.72 0 0 6.72 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.72 23.28 0 15 0z" fill="#e74c3c"/>
        <circle cx="15" cy="14" r="7" fill="#fff"/>
        <text x="15" y="18" text-anchor="middle" font-size="12" fill="#e74c3c">🍽</text>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
});

const selectedIcon = L.divIcon({
    className: 'custom-marker custom-marker-selected',
    html: `<svg width="36" height="48" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.72 0 0 6.72 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.72 23.28 0 15 0z" fill="#2ecc71"/>
        <circle cx="15" cy="14" r="7" fill="#fff"/>
        <text x="15" y="18" text-anchor="middle" font-size="12" fill="#2ecc71">🍽</text>
    </svg>`,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
});

interface MapViewProps {
    locations: Restaurant[];
    userLocation: [number, number] | null;
    selectedLocation: Restaurant | null;
    onLocationSelect: (location: Restaurant) => void;
    onClearSelection: () => void;
}

const FitToLocations: React.FC<{ locations: Restaurant[]; userLocation: [number, number] | null }> = ({ locations, userLocation }) => {
    const map = useMap();

    useEffect(() => {
        if (userLocation) {
            map.setView(userLocation, 7);
        } else if (locations.length > 0) {
            const bounds = L.latLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, locations, userLocation]);

    return null;
};

const MapView: React.FC<MapViewProps> = ({ locations, userLocation, selectedLocation, onLocationSelect, onClearSelection }) => {
    const defaultCenter: [number, number] = userLocation || [52.0, 19.0];

    return (
        <div className="map-container">
            <MapContainer
                center={defaultCenter}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <FitToLocations locations={locations} userLocation={userLocation} />
                {locations.map((location) => (
                    <Marker
                        key={location.id}
                        position={[location.latitude, location.longitude]}
                        icon={selectedLocation?.id === location.id ? selectedIcon : defaultIcon}
                        eventHandlers={{
                            click: () => onLocationSelect(location),
                        }}
                    />
                ))}
            </MapContainer>
            {selectedLocation && (
                <RestaurantOverlay
                    restaurant={selectedLocation}
                    onClose={onClearSelection}
                />
            )}
        </div>
    );
};

export default MapView;
