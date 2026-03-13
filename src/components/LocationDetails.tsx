import React from 'react';
import { Restaurant } from '../types';

interface LocationDetailsProps {
    location: Restaurant;
    onClose: () => void;
}

const LocationDetails: React.FC<LocationDetailsProps> = ({ location, onClose }) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            padding: '20px',
            minWidth: '280px',
            maxWidth: '400px',
            zIndex: 1000,
        }}>
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '4px 8px',
                    lineHeight: 1,
                }}
                aria-label="Close details"
            >
                &times;
            </button>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.2em' }}>{location.name}</h2>
            <p style={{ margin: '4px 0', color: '#444' }}>{location.address}</p>
            <p style={{ margin: '4px 0', color: '#888', fontSize: '0.85em' }}>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
        </div>
    );
};

export default LocationDetails;
