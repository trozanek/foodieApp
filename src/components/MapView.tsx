import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Restaurant } from '../types';

interface MapViewProps {
    locations: Restaurant[];
    selectedLocation: Restaurant | null;
    onLocationSelect: (location: Restaurant) => void;
}

const MapView: React.FC<MapViewProps> = ({ locations, selectedLocation, onLocationSelect }) => {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            setUserLocation([position.coords.latitude, position.coords.longitude]);
        });
    }, []);

    const handleMarkerClick = (location: Restaurant) => {
        onLocationSelect(location);
    };

    return (
        <MapContainer
            center={userLocation || [51.505, -0.09]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => {
                if (userLocation) {
                    map.setView(userLocation, 13);
                }
            }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {locations.map((location) => (
                <Marker
                    key={location.name}
                    position={[location.latitude, location.longitude]}
                    icon={L.icon({
                        iconUrl: selectedLocation?.name === location.name ? '/marker-selected.png' : '/marker.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                    })}
                    eventHandlers={{
                        click: () => handleMarkerClick(location),
                    }}
                >
                    <Popup>
                        <div>
                            <h2>{location.name}</h2>
                            <p>{location.address}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapView;