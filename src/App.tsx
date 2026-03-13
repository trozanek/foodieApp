import React, { useState, useEffect } from 'react';
import LocationList from './components/LocationList';
import MapView from './components/MapView';
import restaurantsData from './data/restaurants-pl.json';
import { Restaurant } from './types';
import './App.css';

const App: React.FC = () => {
    const [locations, setLocations] = useState<Restaurant[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Restaurant | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    useEffect(() => {
        setLocations(restaurantsData);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude]);
            },
            () => {
                // Geolocation denied or unavailable — default to center of Poland
                setUserLocation(null);
            }
        );
    }, []);

    const handleLocationSelect = (location: Restaurant) => {
        setSelectedLocation(location);
    };

    const handleClearSelection = () => {
        setSelectedLocation(null);
    };

    return (
        <div className="app">
            <LocationList
                locations={locations}
                selectedLocationId={selectedLocation?.id ?? null}
                onSelectLocation={(id) => {
                    const location = locations.find(loc => loc.id === id);
                    if (location) {
                        handleLocationSelect(location);
                    }
                }}
            />
            <MapView
                locations={locations}
                userLocation={userLocation}
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                onClearSelection={handleClearSelection}
            />
        </div>
    );
};

export default App;
