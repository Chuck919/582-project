import React from "react";
import "./RestaurantInfoModal.css";
import DealForm from "./DealForm";

function RestaurantInfoModal({ restaurant, onClose, deals, onDealAdded }) {
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
        
        {deals && deals.length > 0 && (
          <div className="deals-section">
            <h3>Current Deals</h3>
            {deals.map((deal, index) => (
              <div key={deal.deal_id || index} className="deal-item">
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

        {/* allow users to submit their own deal for this restaurant */}
        <div className="deal-form-section">
          <h3>Submit a Deal</h3>
          <DealForm
            restaurantId={restaurant.place_id}
            onSuccess={(deal) => {
              // bubble event up to parent so it can refresh its data
              onDealAdded?.(deal);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default RestaurantInfoModal;
