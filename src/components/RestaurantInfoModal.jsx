import React from "react";
import "./RestaurantInfoModal.css";

function RestaurantInfoModal({ restaurant, onClose }) {
  if (!restaurant) return null;

  const cuisineLabel = restaurant.cuisine?.length
    ? restaurant.cuisine.join(", ")
    : "N/A";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>{restaurant.name}</h2>
        <p>Rating: {restaurant.rating || "N/A"}</p>
        <p>Cuisine: {cuisineLabel}</p>
      </div>
    </div>
  );
}

export default RestaurantInfoModal;
