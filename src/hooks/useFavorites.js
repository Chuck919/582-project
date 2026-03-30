import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/useAuth";

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [favoritesError, setFavoritesError] = useState(null);
  const inFlightRef = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setFavorites(new Set());
        setFavoriteRestaurants([]);
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
      const ids = (data ?? []).map((row) => row.restaurant_id);
      setFavorites(new Set(ids));

      if (ids.length > 0) {
        const { data: rows, error: rowsError } = await supabase
          .from("restaurants")
          .select("id, name, lat, lng, rating, cuisine, price_range")
          .in("id", ids);

        if (cancelled) return;
        if (!rowsError) {
          setFavoriteRestaurants(
            (rows ?? []).map((row) => ({
              place_id: row.id,
              name: row.name,
              geometry: { location: { lat: row.lat, lng: row.lng } },
              rating: row.rating,
              cuisine: row.cuisine,
              price_range: row.price_range,
            }))
          );
        }
      } else {
        setFavoriteRestaurants([]);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  const removedRestaurantsRef = useRef(new Map());

  const toggleFavorite = useCallback(
    async (restaurantId, restaurantData) => {
      if (!user) return;
      if (inFlightRef.current.has(restaurantId)) return;

      inFlightRef.current.add(restaurantId);

      const isFav = favorites.has(restaurantId);

      setFavorites((prev) => {
        const next = new Set(prev);
        isFav ? next.delete(restaurantId) : next.add(restaurantId);
        return next;
      });

      if (isFav) {
        // Optimistic remove: capture per-ID so concurrent unfavorites don't clobber each other
        setFavoriteRestaurants((prev) => {
          const removed = prev.find((r) => r.place_id === restaurantId);
          if (removed) removedRestaurantsRef.current.set(restaurantId, removed);
          return prev.filter((r) => r.place_id !== restaurantId);
        });
      } else if (restaurantData) {
        // Optimistic add — normalize to the same shape the DB query returns so
        // the list stays consistent regardless of which fields the caller passes.
        const normalized = {
          place_id: restaurantData.place_id,
          name: restaurantData.name,
          geometry: restaurantData.geometry,
          rating: restaurantData.rating ?? null,
          cuisine: restaurantData.cuisine ?? null,
          price_range: restaurantData.price_range ?? null,
        };
        setFavoriteRestaurants((prev) => [normalized, ...prev]);
      }

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
          const removed = removedRestaurantsRef.current.get(restaurantId);
          if (isFav && removed) {
            setFavoriteRestaurants((prev) => [removed, ...prev]);
          } else if (!isFav) {
            setFavoriteRestaurants((prev) => prev.filter((r) => r.place_id !== restaurantId));
          }
          throw error;
        }
      } finally {
        inFlightRef.current.delete(restaurantId);
        removedRestaurantsRef.current.delete(restaurantId);
      }
    },
    [user, favorites]
  );

  const isFavorite = useCallback(
    (restaurantId) => favorites.has(restaurantId),
    [favorites]
  );

  return { isFavorite, toggleFavorite, favoriteRestaurants, favoritesError, dismissFavoritesError: () => setFavoritesError(null) };
}
