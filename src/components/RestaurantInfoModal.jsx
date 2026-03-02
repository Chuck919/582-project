import React from "react";
import "./RestaurantInfoModal.css";
import DealForm from "./DealForm";
import { useAuth } from "../contexts/useAuth";

function RestaurantInfoModal({ restaurant, onClose, deals, onDealAdded }) {
  const { user } = useAuth();
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
        
        <div className="deals-section">
          <h3>Current Deals</h3>
          {deals && deals.length > 0 ? (
            deals.map((deal, index) => (
              <div key={deal.deal_id || index} className="deal-item">
                <p><strong>{deal.title}</strong></p>
                {deal.description && <p>{deal.description}</p>}
                {deal.expiry_date && (
                  <p>Expires: {new Date(deal.expiry_date).toLocaleDateString()}</p>
                )}
                {deal.terms && <p>Terms: {deal.terms}</p>}
              </div>
            ))
          ) : (
            <p>No current deals available.</p>
          )}
        </div>

        <div className="deal-form-section">
          <h3>Submit a Deal</h3>
          {user ? (
            <DealForm
              restaurantId={restaurant.place_id}
              onSuccess={(deal) => {
                onDealAdded?.(deal);
              }}
            />
          ) : (
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
              Log in to submit a deal.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestaurantInfoModal;
