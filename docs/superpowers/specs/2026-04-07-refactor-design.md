# Refactor Design — 582-project

**Date:** 2026-04-07
**Branch:** ui_polish
**Goal:** Maximize architecture, readability, maintainability, and modularity scores without implementing tests.

---

## Background

A quality audit scored the codebase at **5.75 / 10** overall:

| Dimension | Score |
|---|---|
| Architecture | 5.5 |
| Readability | 7.0 |
| Maintainability | 5.0 |
| Modularity | 5.5 |

The primary driver of all four low scores is `App.jsx` (627 lines) acting as a god component — owning geolocation, Places API fetching, sessionStorage caching, deal fetching, filter management, distance calculation, fuzzy search, Supabase upserts, and rendering simultaneously.

---

## Approach

**Domain-first (Option B):** Fix the data/logic layer first, then component interfaces, then cleanup, then documentation. Each phase produces a coherent check-in with a self-contained story.

---

## Phase 1 — Utils Layer

### `src/utils/search.js` (new)
Move `levenshtein()` and `fuzzyMatch()` out of `App.jsx`. These are pure functions with no React dependency.

**Exports:** `levenshtein(a, b)`, `fuzzyMatch(query, name)`

### `src/utils/geo.js` (new)
Extract the Haversine distance formula from the `restaurantsWithDistance` useMemo in `App.jsx` (lines 378–406).

**Exports:** `calculateDistance(coordA, coordB) → { distanceMeters, distanceMiles }`

Where `coordA` and `coordB` are `{ lat: number, lng: number }`.

### `src/utils/validation.js` (update)
No changes to the file itself.

### `src/App.jsx` (update)
- Delete the inline `sanitize()` function (lines 31–36). Replace its call site in `handleSearch` with `sanitizeInput` imported from `validation.js`.
- Replace the inline `sessionStorage.removeItem(SESSION_RESTAURANT_FILTERS_KEY)` call (line 122) with `clearSessionRestaurantFilters()` imported from `sessionRestaurantFilters.js`.
- Replace the inline Haversine block in `restaurantsWithDistance` useMemo with a call to `calculateDistance`.
- Remove `levenshtein` and `fuzzyMatch` function definitions; import from `utils/search.js`.

---

## Phase 2 — Hooks Layer

### `src/hooks/useRestaurantSearch.js` (new)
Owns all state and logic for fetching restaurants from Google Places API.

**Responsibilities:**
- `hasSearched` state
- `isFetchingRestaurants` state
- `restaurants` state
- Places API `searchNearby` call and response normalization into internal restaurant shape
- sessionStorage cache (read on init, write on successful fetch)
- Supabase upsert that syncs fetched restaurants to the DB
- `hasActiveDealsByPlaceId` state and the two DB queries that populate it

**Inputs:** `{ map, currentPosition, searchRadius, isAuthLoading }`

**Exports:** `{ restaurants, hasActiveDealsByPlaceId, isFetchingRestaurants, resetSearch, placesError }`

`resetSearch()` sets `hasSearched` back to `false`, triggering a re-fetch. `App.jsx` calls this when `searchRadius` changes (replacing the current `useEffect` that calls `setHasSearched(false)`).

### `src/hooks/useRestaurantFilters.js` (new)
Owns all filter state and computed values derived from the restaurant list.

**Responsibilities:**
- `minRating`, `priceFilter`, `distanceFilter`, `cuisineFilter` state
- sessionStorage sync effect (read initial values via `readSessionRestaurantFilters`, write on change)
- `clearFilters()`
- `cuisineOptions` computed value (derived from restaurant list)
- Cuisine auto-clear effect (clears `cuisineFilter` if the selected cuisine is no longer in `cuisineOptions`)
- `filteredRestaurants` computed value (applies all four filters to the input restaurant list)

**Inputs:** `restaurantsWithDistance` (array of restaurant objects with `distanceMeters` and `distanceMiles` attached)

**Exports:** `{ filters, setFilter, clearFilters, filteredRestaurants, cuisineOptions }`

`filters` is `{ minRating, priceFilter, distanceFilter, cuisineFilter }`.
`setFilter(key, value)` replaces individual `setMinRating`, `setPriceFilter`, etc. calls.

### `src/App.jsx` (update)
After Phase 2, `App.jsx` loses approximately 200 lines. Its state declarations drop from 18 to ~10. Remaining responsibilities: geolocation, map instance, UI toggles (sidebar, profile, mapType), search bar query handling, and rendering.

---

## Phase 3 — Component Interfaces

### `RestaurantInfoModal` moved to `App.jsx`
Currently rendered inside `RestaurantMarkers`. After this change it is rendered directly in `App.jsx` alongside `<GoogleMap>`, receiving props from `App.jsx` directly.

`RestaurantMarkers` loses these props: `deals`, `refreshDeals`, `isFavorite`, `isFavoriteLoading`, `toggleFavorite`.

`RestaurantMarkers` retains: `restaurants`, `map`, `hasActiveDealsByPlaceId`, `selectedRestaurant`, `setSelectedRestaurant`.

### `Sidebar` prop interface consolidated
Replace 8 filter props with 2:
- Before: `minRating`, `onMinRatingChange`, `priceFilter`, `onPriceFilterChange`, `distanceFilter`, `onDistanceFilterChange`, `cuisineFilter`, `onCuisineFilterChange`
- After: `filters` (object), `setFilter` (function)

`onClearFilters` and `cuisineOptions` remain as separate props. Total props: 14 → 8.

### `sortBy` state — preserved
The `sortBy` state and sort `<select>` in `Sidebar` are kept as-is. They are intentional stubs for a future sort implementation.

---

## Phase 4 — Cleanup

### Remove debug `console.log`s from `App.jsx`
Remove lines 281–295 (three debug logs including one that references the Maps API key existence). `console.error` calls in catch blocks are kept.

### Fix `user_id` in `DealForm`
The `deals` table now has a `user_id uuid` column referencing `auth.users(id)`. `DealForm` will:
1. Call `const { user } = useAuth()`
2. Include `user_id: user.id` in the `dealInput` object before calling `createDeal`

### Inline styles → CSS
- `RestaurantMarkers` name label: extract inline style object to a new `RestaurantMarkers.css` class `.restaurant-label`
- Map-type toggle: the CSS custom property `--map-toggle-left` stays, but pixel values (`400px`, `42px`) are documented in `App.css` alongside the toggle rule

---

## Phase 5 — Documentation

All files created in `docs/architecture/`.

### `docs/architecture/overview.md`
- Mermaid `graph TD` showing layer relationships: lib → utils → hooks → contexts → components
- Describes data sources (Supabase, Google Places API) and where they enter the stack

### `docs/architecture/data-flow.md`
- Restaurant data flow: Places API → normalization → Supabase upsert → filter/distance → UI
- Deals flow: Supabase fetch → grouped by restaurant → markers + modal
- Favorites flow: Supabase fetch → optimistic updates → sidebar + modal

### `docs/architecture/component-tree.md`
- Mermaid `graph TD` of component hierarchy after refactor
- Annotations showing which hooks each component consumes
- Prop interface summary for components with non-trivial interfaces

---

## Deferred / Out of Scope

- Tests (explicitly deferred per user instruction)
- Adding `NOT NULL` constraint to `deals.user_id` (requires backfilling existing null rows — separate migration)
- Implementing the `sortBy` sort options in Sidebar (future feature)
- Adding file size validation to avatar uploads (separate concern)
- Pagination for `fetchDeals` (separate concern)
