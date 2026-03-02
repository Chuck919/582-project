import React, { useEffect, useState } from "react";
import "./RestaurantInfoModal.css";
import DealForm from "./DealForm";
import { useAuth } from "../contexts/useAuth";
import { fetchDeals } from "../utils/deals";

function RestaurantInfoModal({ restaurant, onClose, deals, onDealAdded }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurant) return;

    const loadDeals = async () => {
      setLoading(true);
      try {
        const dealsData = await fetchDeals(restaurant.place_id);
        console.log('Deals query result:', dealsData);
      } catch (error) {
        console.error('Error fetching deals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDeals();
  }, [restaurant]);

  if (!restaurant) return null;

  const cuisineLabel = restaurant.cuisine?.length
    ? restaurant.cuisine.join(", ")
    : "N/A";

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>{restaurant.name}</h2>
        <p>Rating: {restaurant.rating || "N/A"}</p>
        <p>Cuisine: {cuisineLabel}</p>

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
        
        <div className="deals-section">
          <h3>Deals</h3>
          {loading ? (
            <p className="deals-loading">Loading deals...</p>
          ) : deals.length > 0 ? (
            <div className="deals-list">
              {deals.map((deal) => (
                <div key={deal.id} className="deal-item">
                  <p className="deal-description">{deal.description}</p>
                  <p className="deal-discount">Discount: ${deal.price} Off</p>
                  <p className="deal-expiration">
                    Expires: {formatDate(deal.expiration_date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-deals">N/A</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestaurantInfoModal;
