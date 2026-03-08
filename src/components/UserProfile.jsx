import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/useAuth";
import { fetchFavorites, removeFavorite } from "../utils/favorites";
import "./UserProfile.css";

const MAX_RADIUS_MI = 15;
const MIN_RADIUS_MI = 1;

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

export default function UserProfile({
  onClose,
  onNavigate,
  theme,
  onThemeChange,
  searchRadius,
  onSearchRadiusChange,
}) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [activeTab, setActiveTab] = useState("favorites");
  const fileInputRef = useRef(null);

  // Load saved avatar from localStorage
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`avatar_${user.id}`);
    if (saved) setAvatarSrc(saved);
  }, [user]);

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

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setAvatarSrc(dataUrl);
      localStorage.setItem(`avatar_${user.id}`, dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const username = user?.user_metadata?.username;
  const joinedDate = formatJoinDate(user?.created_at);

  return (
    <div className="profile-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="User profile">
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── Sticky header ── */}
        <div className="profile-header">
          <h2 className="profile-title">My Profile</h2>
          <button className="profile-close" onClick={onClose} aria-label="Close profile">
            &times;
          </button>
        </div>

        {/* ── User banner ── */}
        <div className="profile-user-section">
          <button
            className="profile-avatar-btn"
            onClick={handleAvatarClick}
            aria-label="Change profile picture"
            title="Click to change photo"
          >
            {avatarSrc
              ? <img src={avatarSrc} alt="Profile" className="profile-avatar-img" />
              : <span className="profile-avatar-initials">{getInitials(user?.email)}</span>
            }
            <span className="profile-avatar-overlay" aria-hidden="true">✏️</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
          <div className="profile-user-info">
            {username && <p className="profile-username">{username}</p>}
            <p className="profile-email" title={user?.email}>{user?.email}</p>
            <p className="profile-joined">Member since {joinedDate}</p>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="profile-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "favorites"}
            className={`profile-tab${activeTab === "favorites" ? " profile-tab--active" : ""}`}
            onClick={() => setActiveTab("favorites")}
          >
            Favorites
            {!loading && <span className="profile-tab-badge">{favorites.length}</span>}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "preferences"}
            className={`profile-tab${activeTab === "preferences" ? " profile-tab--active" : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            Preferences
          </button>
        </div>

        {/* ── Favorites tab ── */}
        {activeTab === "favorites" && (
          <div className="profile-tab-content">
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
                  const cuisineLabel = restaurant?.cuisine?.length
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
        )}

        {/* ── Preferences tab ── */}
        {activeTab === "preferences" && (
          <div className="profile-tab-content">

            {/* Theme */}
            <div className="pref-row">
              <div className="pref-label-group">
                <span className="pref-label">Theme</span>
                <span className="pref-hint">Changes the app's colour scheme</span>
              </div>
              <div className="pref-theme-toggle" role="group" aria-label="Choose theme">
                <button
                  className={`pref-theme-btn${theme === "light" ? " pref-theme-btn--active" : ""}`}
                  onClick={() => onThemeChange?.("light")}
                  aria-pressed={theme === "light"}
                >
                  ☀️ Light
                </button>
                <button
                  className={`pref-theme-btn${theme === "dark" ? " pref-theme-btn--active" : ""}`}
                  onClick={() => onThemeChange?.("dark")}
                  aria-pressed={theme === "dark"}
                >
                  🌙 Dark
                </button>
              </div>
            </div>

            {/* Search radius */}
            <div className="pref-row pref-row--column">
              <div className="pref-label-group">
                <span className="pref-label">Search Radius</span>
                <span className="pref-hint">
                  Restaurants &amp; deals within <strong>{searchRadius} mi</strong>
                </span>
              </div>
              <div className="pref-slider-wrap">
                <span className="pref-slider-edge">{MIN_RADIUS_MI} mi</span>
                <input
                  type="range"
                  min={MIN_RADIUS_MI}
                  max={MAX_RADIUS_MI}
                  step={1}
                  value={searchRadius}
                  onChange={(e) => onSearchRadiusChange?.(Number(e.target.value))}
                  className="pref-slider"
                  aria-label="Search radius in miles"
                />
                <span className="pref-slider-edge">{MAX_RADIUS_MI} mi</span>
              </div>
              <p className="pref-radius-note">
                Changing the radius will reload nearby restaurants on the map.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
