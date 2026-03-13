import React from 'react';
import { Restaurant } from '../types';

interface LocationListProps {
    locations: Restaurant[];
    selectedLocation: Restaurant | null;
    onLocationSelect: (location: Restaurant) => void;
}

const LocationList: React.FC<LocationListProps> = ({ locations, selectedLocation, onLocationSelect }) => {
    return (
        <div className="location-list" style={{
            width: '300px',
            minWidth: '300px',
            overflowY: 'auto',
            borderRight: '1px solid #ddd',
            backgroundColor: '#fff',
        }}>
            <h2 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #eee' }}>Restaurants</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {locations.map(location => (
                    <li
                        key={location.name}
                        onClick={() => onLocationSelect(location)}
                        style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            backgroundColor: selectedLocation?.name === location.name ? '#e3f2fd' : 'transparent',
                            fontWeight: selectedLocation?.name === location.name ? 600 : 400,
                            transition: 'background-color 0.2s',
                        }}
                    >
                        <div style={{ fontWeight: 'inherit' }}>{location.name}</div>
                        <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{location.address}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LocationList;
