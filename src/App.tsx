import React, { useState, useEffect } from 'react';
import LocationList from './components/LocationList';
import MapView from './components/MapView';
import LocationDetails from './components/LocationDetails';
import restaurantsData from './data/restaurants-pl.json';
import { Restaurant } from './types';

const App: React.FC = () => {
    const [locations, setLocations] = useState<Restaurant[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Restaurant | null>(null);

    useEffect(() => {
        setLocations(restaurantsData);
    }, []);

    const handleLocationSelect = (location: Restaurant) => {
        setSelectedLocation(location);
    };

    const handleCloseDetails = () => {
        setSelectedLocation(null);
    };

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <LocationList 
                locations={locations} 
                selectedLocation={selectedLocation} 
                onLocationSelect={handleLocationSelect} 
            />
            <div style={{ flex: 1, position: 'relative' }}>
                <MapView 
                    locations={locations} 
                    selectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect} 
                />
                {selectedLocation && (
                    <LocationDetails 
                        location={selectedLocation} 
                        onClose={handleCloseDetails} 
                    />
                )}
            </div>
        </div>
    );
};

export default App;
