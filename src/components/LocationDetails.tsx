import React from 'react';
import { Restaurant } from '../types';

interface LocationDetailsProps {
    selectedLocation: Restaurant | null;
}

const LocationDetails: React.FC<LocationDetailsProps> = ({ selectedLocation }) => {
    if (!selectedLocation) {
        return <div>Select a location to see the details.</div>;
    }

    return (
        <div>
            <h2>{selectedLocation.name}</h2>
            <p>Address: {selectedLocation.address}</p>
            <p>Latitude: {selectedLocation.latitude}</p>
            <p>Longitude: {selectedLocation.longitude}</p>
        </div>
    );
};

export default LocationDetails;