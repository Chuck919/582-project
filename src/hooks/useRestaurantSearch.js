import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/useAuth";

/**
 * Normalizes a Google Places API Place object into the internal restaurant shape.
 * @param {google.maps.places.Place} place
 */
function normalizePlace(place) {
  return {
    place_id: place.id,
    name: place.displayName,
    vicinity: place.formattedAddress,
    geometry: {
      location: {
        lat: place.location.lat(),
        lng: place.location.lng(),
      },
    },
    rating: place.rating,
    cuisine:
      place.types
        ?.filter((t) => t.includes("_restaurant"))
        .map((t) =>
          t
            .replace(/_/g, " ")
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        ) || null,
    price_range:
      place.priceRange?.startPrice && place.priceRange?.endPrice
        ? [
            place.priceRange.startPrice.units + place.priceRange.startPrice.nanos / 1e9,
            place.priceRange.endPrice.units + place.priceRange.endPrice.nanos / 1e9,
          ]
        : null,
  };
}

/**
 * Manages nearby restaurant fetching from the Google Places API,
 * sessionStorage caching, Supabase upsert, and hasActiveDealsByPlaceId sync.
 *
 * @param {{ map: object|null, currentPosition: {lat:number,lng:number}|null, searchRadius: number, isAuthLoading: boolean }} params
 * @returns {{
 *   restaurants: Array,
 *   hasActiveDealsByPlaceId: Record<string, boolean>,
 *   setHasActiveDealsByPlaceId: Function,
 *   isFetchingRestaurants: boolean,
 *   placesError: string|null,
 *   resetSearch: () => void,
 *   dismissPlacesError: () => void,
 * }}
 */
export function useRestaurantSearch({ map, currentPosition, searchRadius, isAuthLoading }) {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFetchingRestaurants, setIsFetchingRestaurants] = useState(false);
  const [placesError, setPlacesError] = useState(null);
  const [hasActiveDealsByPlaceId, setHasActiveDealsByPlaceId] = useState({});

  const resetSearch = useCallback(() => {
    setHasSearched(false);
    setRestaurants([]);
  }, []);

  // Fetch from Google Places API (or sessionStorage cache)
  useEffect(() => {
    if (isAuthLoading) return;
    if (!map || !currentPosition || hasSearched) return;

    const cacheKey = `restaurants_${currentPosition.lat.toFixed(3)}_${currentPosition.lng.toFixed(3)}_${searchRadius}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      const cachedRestaurants = JSON.parse(cached);
      queueMicrotask(() => {
        setRestaurants(cachedRestaurants);
        setHasSearched(true);
      });
      return;
    }

    const request = {
      fields: ["id", "displayName", "formattedAddress", "location", "types", "rating", "priceRange"],
      locationRestriction: {
        center: currentPosition,
        radius: Math.round(searchRadius * 1609.34),
      },
      includedTypes: ["restaurant"],
      maxResultCount: 20,
    };

    setIsFetchingRestaurants(true);
    window.google.maps.places.Place.searchNearby(request)
      .then((response) => {
        const { places } = response;
        if (places && places.length > 0) {
          const formatted = places.map(normalizePlace);
          setRestaurants(formatted);
          sessionStorage.setItem(cacheKey, JSON.stringify(formatted));
        }
        setHasSearched(true);
      })
      .catch((error) => {
        console.error("Places API search failed:", error);
        const message = navigator.onLine
          ? "Could not load nearby restaurants. The map is still available."
          : "No internet connection. Restaurant data could not be loaded.";
        setPlacesError(message);
        setHasSearched(true);
      })
      .finally(() => {
        setIsFetchingRestaurants(false);
      });
  }, [map, currentPosition, hasSearched, isAuthLoading, searchRadius]);

  // Upsert fetched restaurants into Supabase so the DB stays in sync
  useEffect(() => {
    if (!user || !restaurants.length) return;
    const rows = restaurants.map((r) => ({
      id: r.place_id,
      name: r.name,
      cuisine: r.cuisine,
      rating: r.rating ?? 0,
      price_range: r.price_range,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
    }));
    supabase
      .from("restaurants")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
      .then(({ error }) => {
        if (error) console.error("Supabase upsert failed:", error);
      });
  }, [user, restaurants]);

  // Load hasActiveDealsByPlaceId from DB when restaurant list changes
  useEffect(() => {
    if (!restaurants.length) return;
    const placeIds = restaurants.map((r) => r.place_id);
    supabase
      .from("restaurants")
      .select("id, has_active_deals")
      .in("id", placeIds)
      .then(({ data, error }) => {
        if (error) return;
        const next = {};
        (data || []).forEach((row) => {
          next[row.id] = !!row.has_active_deals;
        });
        setHasActiveDealsByPlaceId((prev) => ({ ...prev, ...next }));
      });
  }, [restaurants]);

  return {
    restaurants,
    hasActiveDealsByPlaceId,
    setHasActiveDealsByPlaceId,
    isFetchingRestaurants,
    placesError,
    resetSearch,
    dismissPlacesError: () => setPlacesError(null),
  };
}
