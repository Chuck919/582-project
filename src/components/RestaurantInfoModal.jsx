import React from "react";
import "./RestaurantInfoModal.css";

function RestaurantInfoModal({ restaurant, onClose }) {
  if (!restaurant) return null;

  const filteredTypes = restaurant.types
    ? restaurant.types
        .filter((type) => type.includes("_restaurant"))
        .map((type) =>
          type
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        )
        .join(", ")
    : "N/A";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>{restaurant.name}</h2>
        <p>Rating: {restaurant.rating || "N/A"}</p>
        <p>Cuisine: {filteredTypes || "N/A"}</p>
      </div>
    </div>
  );
}

export default RestaurantInfoModal;
