import "./RestaurantInfoModal.css";
import DealForm from "./DealForm";
import { useAuth } from "../contexts/useAuth";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

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
