import { useState, useEffect, useCallback, useMemo } from "react";
import {
  readSessionRestaurantFilters,
  clearSessionRestaurantFilters,
  SESSION_RESTAURANT_FILTERS_KEY,
} from "../utils/sessionRestaurantFilters";

const getInitialFilters = (() => {
  let cached;
  return () => {
    if (cached === undefined) {
      cached = readSessionRestaurantFilters() ?? {
        minRating: 0,
        priceFilter: "",
        distanceFilter: "",
        cuisineFilter: "",
      };
    }
    return cached;
  };
})();

/**
 * Manages the four restaurant list filters, their sessionStorage persistence,
 * and the derived filteredRestaurants and cuisineOptions values.
 *
 * @param {Array} restaurantsWithDistance - Restaurant objects with distanceMeters and distanceMiles attached.
 * @returns {{
 *   filters: { minRating: number, priceFilter: string, distanceFilter: string, cuisineFilter: string },
 *   setFilter: (key: string, value: any) => void,
 *   clearFilters: () => void,
 *   filteredRestaurants: Array,
 *   cuisineOptions: string[],
 * }}
 */
export function useRestaurantFilters(restaurantsWithDistance) {
  const initial = getInitialFilters();
  const [minRating, setMinRating] = useState(initial.minRating);
  const [priceFilter, setPriceFilter] = useState(initial.priceFilter);
  const [distanceFilter, setDistanceFilter] = useState(initial.distanceFilter);
  const [cuisineFilter, setCuisineFilter] = useState(initial.cuisineFilter);

  // Persist filters to sessionStorage on every change
  useEffect(() => {
    const isDefault =
      minRating === 0 && priceFilter === "" && distanceFilter === "" && cuisineFilter === "";
    if (isDefault) {
      clearSessionRestaurantFilters();
    } else {
      sessionStorage.setItem(
        SESSION_RESTAURANT_FILTERS_KEY,
        JSON.stringify({ minRating, priceFilter, distanceFilter, cuisineFilter })
      );
    }
  }, [minRating, priceFilter, distanceFilter, cuisineFilter]);

  const cuisineOptions = useMemo(() => {
    const set = new Set();
    restaurantsWithDistance.forEach((r) => {
      if (Array.isArray(r.cuisine)) {
        r.cuisine.forEach((c) => set.add(c));
      }
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [restaurantsWithDistance]);

  // Clear cuisineFilter if the currently selected cuisine is no longer available
  useEffect(() => {
    if (!cuisineFilter) return;
    if (cuisineOptions.length > 0 && !cuisineOptions.includes(cuisineFilter)) {
      queueMicrotask(() => setCuisineFilter(""));
    }
  }, [cuisineOptions, cuisineFilter]);

  const setFilter = useCallback((key, value) => {
    switch (key) {
      case "minRating": setMinRating(value); break;
      case "priceFilter": setPriceFilter(value); break;
      case "distanceFilter": setDistanceFilter(value); break;
      case "cuisineFilter": setCuisineFilter(value); break;
      default: console.warn(`useRestaurantFilters: unknown filter key "${key}"`);
    }
  }, []);

  const clearFilters = useCallback(() => {
    setMinRating(0);
    setPriceFilter("");
    setDistanceFilter("");
    setCuisineFilter("");
  }, []);

  const filteredRestaurants = useMemo(() => {
    const priceCeilings = { "$": 15, "$$": 30, "$$$": 60, "$$$$": Infinity };
    const priceFloors = { "$": 0, "$$": 15, "$$$": 30, "$$$$": 60 };
    return restaurantsWithDistance.filter((r) => {
      if (minRating > 0 && !(r.rating && r.rating >= minRating)) return false;
      if (priceFilter && priceCeilings[priceFilter] !== undefined) {
        if (!r.price_range) return false;
        const maxPrice = r.price_range[1];
        if (maxPrice > priceCeilings[priceFilter] || maxPrice <= priceFloors[priceFilter]) return false;
      }
      if (distanceFilter && r.distanceMiles != null) {
        if (r.distanceMiles > Number(distanceFilter)) return false;
      }
      if (cuisineFilter && !(Array.isArray(r.cuisine) && r.cuisine.includes(cuisineFilter))) return false;
      return true;
    });
  }, [restaurantsWithDistance, minRating, priceFilter, distanceFilter, cuisineFilter]);

  return {
    filters: { minRating, priceFilter, distanceFilter, cuisineFilter },
    setFilter,
    clearFilters,
    filteredRestaurants,
    cuisineOptions,
  };
}
