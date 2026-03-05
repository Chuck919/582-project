import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/useAuth";
import { fetchFavorites, removeFavorite } from "../utils/favorites";
import "./UserProfile.css";

function getInitials(email) {
  if (!email) return "?";
  return email.charAt(0).toUpperCase();
}

function formatJoinDate(dateString) {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

export default function UserProfile({ onClose, onNavigate }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFavorites(user.id);
      setFavorites(data);
    } catch (err) {
      console.error("Failed to load favorites:", err);
      setError("Could not load favorites. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemoveFavorite = async (restaurantId) => {
    try {
      await removeFavorite(user.id, restaurantId);
      setFavorites((prev) => prev.filter((f) => f.restaurant_id !== restaurantId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const username = user?.user_metadata?.username;
  const joinedDate = formatJoinDate(user?.created_at);

  return (
    <div className="profile-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="User profile">
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2 className="profile-title">My Profile</h2>
          <button
            className="profile-close"
            onClick={onClose}
            aria-label="Close profile"
          >
            &times;
          </button>
        </div>

        <div className="profile-user-section">
          <div className="profile-avatar" aria-hidden="true">
            {getInitials(user?.email)}
          </div>
          <div className="profile-user-info">
            {username && <p className="profile-username">{username}</p>}
            <p className="profile-email" title={user?.email}>{user?.email}</p>
            <p className="profile-joined">Member since {joinedDate}</p>
          </div>
        </div>

        <div className="profile-favorites-section">
          <h3 className="profile-section-title">
            Favorite Restaurants
            {!loading && (
              <span className="profile-favorites-count">{favorites.length}</span>
            )}
          </h3>

          {loading && <p className="profile-state-msg">Loading favorites…</p>}
          {error && <p className="profile-state-msg profile-state-error">{error}</p>}

          {!loading && !error && favorites.length === 0 && (
            <div className="profile-empty">
              <p>No favorite restaurants yet.</p>
              <p className="profile-empty-hint">
                Open a restaurant on the map and tap the ♡ Save button to add it here.
              </p>
            </div>
          )}

          {!loading && favorites.length > 0 && (
            <ul className="profile-favorites-list">
              {favorites.map((fav) => {
                const restaurant = fav.restaurants;
                const cuisineLabel =
                  restaurant?.cuisine?.length
                    ? restaurant.cuisine.join(", ")
                    : null;
                return (
                  <li key={fav.restaurant_id} className="profile-favorite-card">
                    <div className="profile-favorite-info">
                      <span className="profile-favorite-name">
                        {restaurant?.name ?? fav.restaurant_id}
                      </span>
                      {cuisineLabel && (
                        <span className="profile-favorite-cuisine">{cuisineLabel}</span>
                      )}
                      {restaurant?.rating != null && (
                        <span className="profile-favorite-rating">
                          ★ {Number(restaurant.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="profile-favorite-actions">
                      {onNavigate && (
                        <button
                          className="profile-btn-navigate"
                          onClick={() => onNavigate(fav.restaurant_id)}
                          title="View on map"
                        >
                          View on map
                        </button>
                      )}
                      <button
                        className="profile-btn-remove"
                        onClick={() => handleRemoveFavorite(fav.restaurant_id)}
                        title="Remove from favorites"
                        aria-label={`Remove ${restaurant?.name ?? "restaurant"} from favorites`}
                      >
                        &times;
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
