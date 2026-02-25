import React from "react";
import "./RestaurantInfoModal.css";

function RestaurantInfoModal({ restaurant, onClose, deals }) {
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
        
        {deals && deals.length > 0 && (
          <div className="deals-section">
            <h3>Current Deals</h3>
            {deals.map((deal) => (
              <div key={deal.deal_id} className="deal-item">
                <p><strong>{deal.description}</strong></p>
                {deal.expiry_date && (
                  <p>Expires: {new Date(deal.expiry_date).toLocaleDateString()}</p>
                )}
                {deal.terms && <p>Terms: {deal.terms}</p>}
              </div>
            ))}
          </div>
        )}
        
        {deals && deals.length === 0 && (
          <p>No current deals available.</p>
        )}
      </div>
    </div>
  );
}

export default RestaurantInfoModal;
