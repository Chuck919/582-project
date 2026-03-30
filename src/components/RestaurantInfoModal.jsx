import { useState } from "react";
import { useAuth } from "../contexts/useAuth";
import "./RestaurantInfoModal.css";
import DealForm from "./DealForm";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function RestaurantInfoModal({ restaurant, onClose, deals, onDealAdded, isFavorite, isFavoriteLoading, toggleFavorite }) {
  const { user } = useAuth();
  const [toggleError, setToggleError] = useState(null);

  if (!restaurant) return null;

  const cuisineLabel = restaurant.cuisine?.length
    ? restaurant.cuisine.join(", ")
    : "N/A";

  const favorited = isFavorite?.(restaurant.place_id);
  const isLoading = isFavoriteLoading?.(restaurant.place_id);

  async function handleToggleFavorite() {
    setToggleError(null);
    try {
      await toggleFavorite(restaurant.place_id, restaurant);
    } catch {
      setToggleError("Could not update your saved restaurants. Please try again.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>{restaurant.name}</h2>

        {user ? (
          <>
            <button
              className={`favorite-btn${favorited ? " favorite-btn--active" : ""}`}
              onClick={handleToggleFavorite}
              disabled={isLoading}
              aria-label={favorited ? "Remove from favorites" : "Save as favorite"}
              style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
            >
              {isLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <div className="loading-spinner small" style={{ borderColor: "rgba(0,0,0,0.1)", borderTopColor: favorited ? "#d32f2f" : "#00509d", width: "14px", height: "14px", borderWidth: "2px" }}></div>
                  Saving...
                </div>
              ) : (
                favorited ? "★ Saved" : "☆ Save"
              )}
            </button>
            {toggleError && (
              <p className="favorite-error" role="alert">{toggleError}</p>
            )}
          </>
        ) : (
          <p className="favorite-login-hint">Log in to save favorites.</p>
        )}

        <p>Rating: {restaurant.rating || "N/A"}</p>
        {restaurant.price_range && (
          <p>Price: ${restaurant.price_range[0].toFixed(0)} – ${restaurant.price_range[1].toFixed(0)}</p>
        )}
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
          {deals && deals.length > 0 ? (
            <div className="deals-list">
              {deals.map((deal) => (
                <div key={deal.id} className="deal-item">
                  <p className="deal-description">{deal.title}</p>
                  {deal.description && <p>{deal.description}</p>}
                  <p className="deal-discount">Discount: ${deal.price} Off</p>
                  <p className="deal-expiration">
                    Expires: {formatDate(deal.expiry_date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-deals">No current deals available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestaurantInfoModal;
