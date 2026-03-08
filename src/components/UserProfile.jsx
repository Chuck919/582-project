import { useState, useRef } from "react";
import { useAuth } from "../contexts/useAuth";
import "./UserProfile.css";

const PREFS_KEY = "user_preferences";
const AVATAR_KEY = "user_avatar";

function loadPreferences() {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    return stored
      ? JSON.parse(stored)
      : { searchRadius: 5 };
  } catch {
    return { searchRadius: 5 };
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
  const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || null);
  const fileInputRef = useRef(null);

  const savePrefs = (updated) => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
      localStorage.setItem(AVATAR_KEY, ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRadiusChange = (e) => {
    const updated = { ...preferences, searchRadius: Number(e.target.value) };
    setPreferences(updated);
    savePrefs(updated);
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
          <button
            className="profile-avatar-btn"
            onClick={handleAvatarClick}
            title="Change profile picture"
            aria-label="Change profile picture"
          >
            {avatar
              ? <img src={avatar} alt="Profile" className="profile-avatar-img" />
              : <span className="profile-avatar-initials">{getInitials(user?.email)}</span>
            }
            <span className="profile-avatar-overlay">Edit</span>
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

        <div className="profile-preferences-section">
          <h3 className="profile-section-title">Preferences</h3>

          {/* Search radius */}
          <div className="profile-pref-col">
            <div className="profile-pref-label-group">
              <span className="profile-pref-label">Search Radius</span>
              <span className="profile-pref-value">{preferences.searchRadius} mi</span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={preferences.searchRadius}
              onChange={handleRadiusChange}
              className="profile-slider"
              style={{ "--val": preferences.searchRadius }}
              aria-label="Search radius in miles"
            />
            <div className="profile-slider-labels">
              <span>1 mi</span>
              <span>15 mi</span>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
