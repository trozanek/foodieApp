import React, { useState, useEffect } from 'react';
import LocationList from './components/LocationList';
import MapView from './components/MapView';
import LocationDetails from './components/LocationDetails';
import restaurantsData from './data/restaurants-pl.json';
import { Restaurant } from './types';

const App: React.FC = () => {
    const [locations, setLocations] = useState<Restaurant[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Restaurant | null>(null);
    const [userLocation, setUserLocation] = useState<GeolocationCoordinates | null>(null);

    useEffect(() => {
        setLocations(restaurantsData);
        navigator.geolocation.getCurrentPosition((position) => {
            setUserLocation(position.coords);
        });
    }, []);

    const handleLocationSelect = (location: Restaurant) => {
        setSelectedLocation(location);
    };

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <LocationList 
                locations={locations} 
                selectedLocation={selectedLocation} 
                onLocationSelect={handleLocationSelect} 
            />
            {selectedLocation ? (
                <LocationDetails location={selectedLocation} />
            ) : (
                <MapView 
                    locations={locations} 
                    userLocation={userLocation} 
                    onLocationSelect={handleLocationSelect} 
                />
            )}
        </div>
    );
};

export default App;