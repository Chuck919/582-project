import { useState } from "react";
import { useAuth } from "../contexts/useAuth";
import "./UserProfile.css";

const CUISINE_OPTIONS = [
  "Italian", "Chinese", "Japanese", "Mexican", "Indian",
  "American", "Thai", "Mediterranean", "French", "Korean",
  "Vietnamese", "Greek", "Spanish", "Middle Eastern", "Caribbean",
];

const PREFS_KEY = "user_preferences";

function loadPreferences() {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    return stored ? JSON.parse(stored) : { cuisines: [] };
  } catch {
    return { cuisines: [] };
  }
}

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

export default function UserProfile({ onClose }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(loadPreferences);
  const [saved, setSaved] = useState(false);

  const toggleCuisine = (cuisine) => {
    setPreferences((prev) => {
      const cuisines = prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter((c) => c !== cuisine)
        : [...prev.cuisines, cuisine];
      return { ...prev, cuisines };
    });
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
    setSaved(true);
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

        <div className="profile-preferences-section">
          <h3 className="profile-section-title">Preferences</h3>
          <p className="profile-prefs-label">Preferred Cuisines</p>
          <div className="profile-cuisine-grid">
            {CUISINE_OPTIONS.map((cuisine) => (
              <button
                key={cuisine}
                type="button"
                className={`profile-cuisine-chip${preferences.cuisines.includes(cuisine) ? " profile-cuisine-chip--active" : ""}`}
                onClick={() => toggleCuisine(cuisine)}
              >
                {cuisine}
              </button>
            ))}
          </div>
          <button className="profile-btn-save" onClick={handleSave}>
            {saved ? "Saved ✓" : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
