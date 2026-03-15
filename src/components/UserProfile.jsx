import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/useAuth";
import { removeAvatar, uploadAvatar } from "../utils/avatarStorage";
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

function fileToResizedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Failed to load image."));
      image.onload = () => {
        const maxDimension = 256;
        const scale = Math.min(maxDimension / image.width, maxDimension / image.height, 1);
        const canvas = document.createElement("canvas");

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Failed to prepare image."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to prepare image."));
              return;
            }

            resolve(new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "avatar"}.jpg`, {
              type: "image/jpeg",
            }));
          },
          "image/jpeg",
          0.82
        );
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

export default function UserProfile({ onClose }) {
  const { user, profile, updateProfile } = useAuth();
  const [preferences, setPreferences] = useState({ searchRadius: profile.searchRadius });
  const [avatar, setAvatar] = useState(profile.avatarUrl);
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreferences({ searchRadius: profile.searchRadius });
    setAvatar(profile.avatarUrl);
  }, [profile]);

  useEffect(() => {
    if (preferences.searchRadius === profile.searchRadius) return;

    setSaveState("saving");
    setSaveError("");

    const timeoutId = window.setTimeout(async () => {
      const { error } = await updateProfile({ searchRadius: preferences.searchRadius });

      if (error) {
        setSaveState("error");
        setSaveError(error.message || "Could not save your preferences.");
        return;
      }

      setSaveState("saved");
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [preferences.searchRadius, profile.searchRadius, updateProfile]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setSaveState("saving");
    setSaveError("");

    try {
      const optimizedFile = await fileToResizedFile(file);
      const previousAvatarPath = profile.avatarPath;
      const { path, publicUrl } = await uploadAvatar({
        userId: user.id,
        file: optimizedFile,
      });

      setAvatar(publicUrl);

      const { error } = await updateProfile({ avatarPath: path });
      if (error) {
        await removeAvatar(path);
        setAvatar(profile.avatarUrl);
        setSaveState("error");
        setSaveError(error.message || "Could not save your profile picture.");
        return;
      }

      window.localStorage.removeItem("user_avatar");

      if (previousAvatarPath && previousAvatarPath !== path) {
        removeAvatar(previousAvatarPath).catch((removeError) => {
          console.error("Could not remove previous avatar:", removeError);
        });
      }

      setSaveState("saved");
    } catch (error) {
      setAvatar(profile.avatarUrl);
      setSaveState("error");
      setSaveError(error.message || "Could not process that image.");
    } finally {
      e.target.value = "";
    }
  };

  const handleRadiusChange = (e) => {
    const updated = { ...preferences, searchRadius: Number(e.target.value) };
    setPreferences(updated);
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

          {saveState === "saving" && <p className="profile-email">Saving profile...</p>}
          {saveState === "saved" && !saveError && <p className="profile-email">Profile saved across devices.</p>}
          {saveError && <p className="profile-email">{saveError}</p>}

        </div>
      </div>
    </div>
  );
}
