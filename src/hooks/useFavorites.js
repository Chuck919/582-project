import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/useAuth";

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Set());
  const [favoritesError, setFavoritesError] = useState(null);
  const inFlightRef = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setFavorites(new Set());
        return;
      }
      const { data, error } = await supabase
        .from("favorites")
        .select("restaurant_id")
        .eq("user_id", user.id);

      if (cancelled) return;
      if (error) {
        console.error("Failed to fetch favorites:", error);
        setFavoritesError("Your saved restaurants could not be loaded. Please refresh the page.");
        return;
      }
      setFavorites(new Set((data ?? []).map((row) => row.restaurant_id)));
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  const toggleFavorite = useCallback(
    async (restaurantId) => {
      if (!user) return;
      if (inFlightRef.current.has(restaurantId)) return;

      inFlightRef.current.add(restaurantId);

      // Read current state inside the updater to avoid stale closure bugs
      // on rapid successive clicks.
      let isFav;
      setFavorites((prev) => {
        isFav = prev.has(restaurantId);
        const next = new Set(prev);
        isFav ? next.delete(restaurantId) : next.add(restaurantId);
        return next;
      });

      try {
        const { error } = isFav
          ? await supabase
              .from("favorites")
              .delete()
              .eq("user_id", user.id)
              .eq("restaurant_id", restaurantId)
          : await supabase
              .from("favorites")
              .insert({ user_id: user.id, restaurant_id: restaurantId });

        if (error) {
          console.error("Failed to toggle favorite:", error);
          // Rollback optimistic update
          setFavorites((prev) => {
            const next = new Set(prev);
            isFav ? next.add(restaurantId) : next.delete(restaurantId);
            return next;
          });
          throw error;
        }
      } finally {
        inFlightRef.current.delete(restaurantId);
      }
    },
    [user]
  );

  const isFavorite = useCallback(
    (restaurantId) => favorites.has(restaurantId),
    [favorites]
  );

  return { isFavorite, toggleFavorite, favoritesError, dismissFavoritesError: () => setFavoritesError(null) };
}
