import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);
export default AuthContext;

const DEFAULT_PROFILE = {
  searchRadius: 5,
  avatar: null,
};

function normalizeProfile(metadata) {
  const profile = metadata?.profile ?? {};
  const parsedRadius = Number(profile.searchRadius);

  return {
    searchRadius: Number.isFinite(parsedRadius) ? Math.min(Math.max(parsedRadius, 1), 15) : DEFAULT_PROFILE.searchRadius,
    avatar: typeof profile.avatar === "string" && profile.avatar ? profile.avatar : null,
  };
}

function loadLegacyProfile() {
  try {
    const storedPrefs = localStorage.getItem("user_preferences");
    const storedAvatar = localStorage.getItem("user_avatar");
    const parsedPrefs = storedPrefs ? JSON.parse(storedPrefs) : {};
    const parsedRadius = Number(parsedPrefs?.searchRadius);

    return {
      searchRadius: Number.isFinite(parsedRadius) ? Math.min(Math.max(parsedRadius, 1), 15) : DEFAULT_PROFILE.searchRadius,
      avatar: storedAvatar || null,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function hasLegacyProfile(profile) {
  return profile.searchRadius !== DEFAULT_PROFILE.searchRadius || !!profile.avatar;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session (handles reload – user stays logged in)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setProfile(nextUser ? normalizeProfile(nextUser.user_metadata) : DEFAULT_PROFILE);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setProfile(nextUser ? normalizeProfile(nextUser.user_metadata) : DEFAULT_PROFILE);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.user_metadata?.profile) return;

    const legacyProfile = loadLegacyProfile();
    if (!hasLegacyProfile(legacyProfile)) return;

    supabase.auth
      .updateUser({
        data: {
          ...user.user_metadata,
          profile: legacyProfile,
        },
      })
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to migrate legacy profile:", error);
          return;
        }

        if (data.user) {
          setUser(data.user);
          setProfile(normalizeProfile(data.user.user_metadata));
        }
      });
  }, [user]);

  const signUp = async (email, password, options = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options.username ? { username: options.username } : undefined,
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates) => {
    if (!user) {
      return { data: null, error: new Error("You must be signed in to update your profile.") };
    }

    const nextProfile = normalizeProfile({
      profile: {
        ...profile,
        ...updates,
      },
    });

    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        profile: nextProfile,
      },
    });

    if (!error && data.user) {
      setUser(data.user);
      setProfile(normalizeProfile(data.user.user_metadata));
    }

    return { data, error };
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isLoggedIn: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

