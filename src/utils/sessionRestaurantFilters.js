/** Session-only persistence for restaurant list filters (Requirement 27 / #63). */

export const SESSION_RESTAURANT_FILTERS_KEY = "582-restaurant-filters";

const ALLOWED_MIN_RATINGS = new Set([0, 3, 3.5, 4, 4.5]);
const ALLOWED_PRICE = new Set(["", "$", "$$", "$$$", "$$$$"]);
const ALLOWED_DISTANCE = new Set(["", "1", "3", "5", "10"]);

function normalizeCuisine(value) {
  if (typeof value !== "string") return "";
  return value.length > 200 ? value.slice(0, 200) : value;
}

/**
 * @returns {{ minRating: number, priceFilter: string, distanceFilter: string, cuisineFilter: string } | null}
 */
export function readSessionRestaurantFilters() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_RESTAURANT_FILTERS_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return null;
    const minRating =
      typeof o.minRating === "number" && ALLOWED_MIN_RATINGS.has(o.minRating) ? o.minRating : 0;
    const priceFilter =
      typeof o.priceFilter === "string" && ALLOWED_PRICE.has(o.priceFilter) ? o.priceFilter : "";
    const distanceFilter =
      typeof o.distanceFilter === "string" && ALLOWED_DISTANCE.has(o.distanceFilter)
        ? o.distanceFilter
        : "";
    const cuisineFilter = normalizeCuisine(o.cuisineFilter);
    return { minRating, priceFilter, distanceFilter, cuisineFilter };
  } catch {
    return null;
  }
}

export function clearSessionRestaurantFilters() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(SESSION_RESTAURANT_FILTERS_KEY);
}
