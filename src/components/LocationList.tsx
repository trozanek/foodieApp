import React from 'react';
import { Restaurant } from '../types';

interface LocationListProps {
    locations: Restaurant[];
    selectedLocationId: string | null;
    onSelectLocation: (id: string) => void;
}

const LocationList: React.FC<LocationListProps> = ({ locations, selectedLocationId, onSelectLocation }) => {
    return (
        <div className="location-list">
            <h2>Restaurants</h2>
            <ul>
                {locations.map(location => (
                    <li
                        key={location.id}
                        onClick={() => onSelectLocation(location.id)}
                        className={selectedLocationId === location.id ? 'selected' : ''}
                    >
                        {location.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LocationList;