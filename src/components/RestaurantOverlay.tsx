import React from 'react';
import { Restaurant } from '../types';

interface RestaurantOverlayProps {
    restaurant: Restaurant;
    onClose: () => void;
}

const RestaurantOverlay: React.FC<RestaurantOverlayProps> = ({ restaurant, onClose }) => {
    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <span className="stars">
                {'★'.repeat(fullStars)}
                {hasHalfStar && '½'}
                {'☆'.repeat(emptyStars)}
            </span>
        );
    };

    return (
        <div className="restaurant-overlay" onClick={onClose}>
            <div className="restaurant-overlay-card" onClick={(e) => e.stopPropagation()}>
                <button className="restaurant-overlay-close" onClick={onClose} aria-label="Close">
                    ×
                </button>
                <h2 className="restaurant-overlay-name">{restaurant.name}</h2>
                <p className="restaurant-overlay-address">{restaurant.address}</p>
                <div className="restaurant-overlay-rating">
                    {renderStars(restaurant.rating)}
                    <span className="rating-value">{restaurant.rating.toFixed(1)}</span>
                </div>
                <p className="restaurant-overlay-description">{restaurant.description}</p>
            </div>
        </div>
    );
};

export default RestaurantOverlay;
