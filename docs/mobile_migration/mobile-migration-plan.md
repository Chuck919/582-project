# Mobile Migration Plan — Req 32–45 (14 PRs)

## Context

The web app (`src/`) is a React + Vite app that shows nearby restaurants on Google Maps, with Supabase auth, deals, and favorites. Issues **#77–#94 (Req 32–45)** migrate that functionality to a React Native (Expo) app in `mobile/`. The Expo scaffold is already in place from Req 31 (#76): expo-router tabs, Supabase client at `mobile/lib/supabase.ts`, env template, placeholder Login/Map/Profile screens.

This plan sequences the 14 features into one PR per requirement, reordered for dependency correctness. Each PR branches from the latest `main` after the prior PR merges (team review process gates each merge). Verification is manual via iOS simulator / Android emulator.

### Global decisions

- **Web app is the source of truth for feature behavior.** Before writing any mobile code for a PR, open the matching files in `src/` listed in that PR's "Web reference" section and read them end-to-end. Mirror data shapes, state transitions, error handling, and edge-case behavior (missing fields, empty states, loading, auth gates) unless a mobile platform constraint forces a change. When in doubt, match the web app.
- **Branch flow**: branch from latest `main` → implement → PR → review → merge → pull `main` → branch for next PR. Do not stack branches; we avoid rebase churn since reviews are serialized.
- **Commits per PR**: multiple small commits grouped logically (e.g., "port utility", "wire into screen", "handle empty state"). No squash locally.
- **Build workflow**: EAS dev client (`eas build --profile development`) for iOS and Android. Expo Go is insufficient because `react-native-maps` with the Google provider requires native modules.
- **When to EAS build vs when to just start**: `npx expo start` (then press `i` for iOS simulator) is the day-to-day workflow once a dev client is installed — JS changes hot-reload instantly with no rebuild. Only run `eas build` when native code actually changes: adding or removing a native dependency, changing `app.config.js` settings that affect iOS/Android config (permissions, plugins, bundle ID), or first-time setup. A quick way to tell if a new package needs a rebuild: check if it ships an `ios/` directory or lists CocoaPods (`pod install`) in its readme — if yes, rebuild; if it's pure JS, just `npm install` and restart Metro. On the free EAS plan, builds are slow, so treat them as a once-per-PR step at most.
- **Verification**: every PR includes a short manual test plan in the PR body. No test framework is added (matches the web app's current state).
- **Cache migration**: web uses `sessionStorage`; mobile uses `@react-native-async-storage/async-storage` (installed in PR #1 below and reused).
- **Port strategy**: pure-JS utilities (`src/utils/search.js`, `src/utils/geo.js`, `src/utils/deals.js`, `src/utils/validation.js`) are copied verbatim into `mobile/utils/` in the PR that first needs them. `useFavorites`, `useRestaurantFilters` are ported with storage adapter swap.

### PR execution order (dependency-ordered)

| # | Issue | Req | Title | Depends on |
|---|---|---|---|---|
| 1 | #77 | 32 | ~~Interactive map + user location~~ ✅ PR #95 | — |
| 2 | #78 | 33 | Fetch & display nearby restaurants | 32 |
| 3 | #79 | 34 | Restaurant detail modal | 33 |
| 4 | #80 | 35 | Auth (login + signup) | — |
| 5 | #81 | 36 | Basic filters | 33 |
| 6 | #86 | 37 | Restaurant list view | 33, 34 |
| 7 | #87 | 38 | Sort list by distance | 37 |
| 8 | #94 | 45 | Deals API integration | 33, 34 |
| 9 | #88 | 39 | Custom marker for restaurants with deals | 37, 45 |
| 10 | #91 | 42 | Persist favorites in Supabase | 35 |
| 11 | #89 | 40 | Save restaurant as favorite | 34, 35, 42 |
| 12 | #90 | 41 | Favorites list screen | 40 |
| 13 | #92 | 43 | User profile screen | 35 |
| 14 | #93 | 44 | Search by name | 33, 36 |

---

## PR 1 — Req 32: Interactive map + user location (#77)

**Branch**: `feat/mobile-req-32-map`

**Web reference** (read before coding):
- `src/App.jsx` — geolocation flow (`navigator.geolocation.getCurrentPosition`), default-center fallback constant, permission-denied UX, map container setup via `@react-google-maps/api`.

**Changes**
- `mobile/package.json`: add `react-native-maps`, `expo-location`, `@react-native-async-storage/async-storage`.
- `mobile/app.json` / `app.config.ts`: add iOS `NSLocationWhenInUseUsageDescription`, Android `ACCESS_FINE_LOCATION`, and `expo-location` plugin config. Add Google Maps API key for iOS (`config.googleMapsApiKey`) and Android (`config.googleMaps.apiKey`).
- `mobile/app/(tabs)/index.tsx`: replace placeholder Map screen with full-screen `<MapView provider={PROVIDER_GOOGLE}>`. Request foreground location permission on mount; on grant, center on user coords and show user marker; on deny, fall back to a constant default center (reuse the web app's default from `src/App.jsx`) and show a toast/banner explaining location is needed.
- `mobile/hooks/useUserLocation.ts`: new hook wrapping `Location.requestForegroundPermissionsAsync` + `Location.getCurrentPositionAsync`. Returns `{ coords, permissionStatus, error }`.

**Commit sequence**
1. Add deps + Expo config for location and maps keys.
2. Add `useUserLocation` hook.
3. Render `MapView` on the Map tab with user marker + permission handling.

**Verify**
- Build dev client: `cd mobile && eas build --profile development --platform ios` (and android).
- Launch on simulator/emulator. Confirm:
  - Permission prompt appears on first open.
  - Grant → map centers on user, user marker visible, pan/pinch work.
  - Deny → map centers on default, info message shown.

---

## PR 2 — Req 33: Fetch & display nearby restaurants (#78)

**Branch**: `feat/mobile-req-33-places`

**Web reference** (read before coding):
- `src/hooks/useRestaurantSearch.js` — Places API call shape, 10 km radius, 20-result cap, sessionStorage cache key format, Supabase `has_active_deals` upsert, `hasActiveDealsByPlaceId` helper.
- `src/App.jsx` — how the hook is invoked + when refetch happens.
- `src/components/RestaurantMarkers.jsx` — marker rendering pattern and what restaurant fields are used.
- `src/utils/geo.js` — Haversine source (copy verbatim).

**Changes**
- Port `src/utils/geo.js` → `mobile/utils/geo.ts` (unchanged Haversine).
- `mobile/hooks/useRestaurantSearch.ts`: adapted port of `src/hooks/useRestaurantSearch.js`. Replace the web-only `google.maps.places.Place.searchNearby()` call with a `fetch` to the **Places API (New) HTTP endpoint** `https://places.googleapis.com/v1/places:searchNearby` using `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`. Keep the 10 km radius, 20-result cap, and the Supabase `has_active_deals` upsert step. Replace `sessionStorage` reads/writes with `AsyncStorage` under key `restaurants:<lat>_<lng>_<radius>`.
- `mobile/app/(tabs)/index.tsx`: call the hook, render a `<Marker>` per restaurant at the correct coordinates, and render an error banner on fetch failure.

**Commit sequence**
1. Port `geo.ts` utility.
2. Add `useRestaurantSearch` hook with AsyncStorage caching and Places HTTP call.
3. Render markers on map + error handling.

**Verify**
- Relaunch dev client. Map centers on user, 1–20 restaurant markers appear within ~5 s. Kill and relaunch: markers appear immediately from cache (no network call). Turn airplane mode on, clear cache, relaunch: error banner appears, app does not crash.

---

## PR 3 — Req 34: Restaurant detail modal (#79)

**Branch**: `feat/mobile-req-34-detail-modal`

**Web reference** (read before coding):
- `src/components/RestaurantInfoModal.jsx` — displayed fields, missing-data handling, layout sections (header, rating, address, cuisine, price, distance link).
- `src/components/RestaurantMarkers.jsx` — InfoWindow content + close/dismiss behavior.
- `src/App.jsx` — how a marker click becomes a selected-restaurant state.

**Changes**
- `mobile/components/RestaurantDetailSheet.tsx`: new component using `@gorhom/bottom-sheet` (add dep) or RN's `Modal`. Shows name, address, rating, price, cuisine, and distance (computed via `geo.ts`). Handles missing fields gracefully (`??` fallbacks, conditional rendering).
- `mobile/app/(tabs)/index.tsx`: on `<Marker onPress>`, open the sheet with the tapped restaurant. Dismiss on backdrop tap, swipe down, or close button.

**Commit sequence**
1. Add bottom-sheet dependency.
2. Add `RestaurantDetailSheet` component.
3. Wire marker taps to open the sheet.

**Verify**
- Tap marker → sheet slides up with details. Missing fields (e.g., no price) are hidden, no blank rows. Swipe down / tap backdrop → sheet closes.

---

## PR 4 — Req 35: Auth (login + signup) (#80)

**Branch**: `feat/mobile-req-35-auth`

**Web reference** (read before coding):
- `src/contexts/AuthContext.jsx` + `src/contexts/useAuth.js` — context shape, exposed methods, session listener.
- `src/components/Login.jsx` + `src/components/SignUp.jsx` — form fields, validation rules, error display, success flow.
- `src/lib/supabase.js` — client init (note: mobile needs SecureStore-backed session persistence, not present on web).
- `src/utils/validation.js` — email + password rules (copy verbatim).

**Changes**
- `mobile/lib/supabase.ts`: pass `storage: SecureStore`-backed adapter (see Supabase RN guide) so sessions persist across launches. Add `detectSessionInUrl: false`.
- `mobile/contexts/AuthContext.tsx`: port of `src/contexts/AuthContext.jsx`. Exposes `{ session, user, signIn, signUp, signOut, loading }`. Subscribes to `supabase.auth.onAuthStateChange`.
- `mobile/app/_layout.tsx`: wrap tree in `<AuthProvider>`. Gate `(tabs)` vs `(auth)` routes based on session (redirect via `expo-router` `<Stack.Protected>` pattern or conditional render).
- `mobile/app/(auth)/login.tsx`: email/password form, validation (email format, password length) mirroring web `src/utils/validation.js` (port as `mobile/utils/validation.ts`), `signIn` on submit.
- `mobile/app/(auth)/signup.tsx`: new screen; email + password + confirm-password; `signUp` on submit.
- Add logout button on Profile placeholder (full profile screen arrives in Req 43).

**Commit sequence**
1. Port `validation.ts` utility.
2. Configure Supabase client with SecureStore session persistence.
3. Add `AuthContext` + provider.
4. Add login + signup screens and auth-aware routing.
5. Add temporary logout control on Profile tab.

**Verify**
- Sign up → tab nav appears. Kill app → reopen → still signed in (session persisted). Log out → bounced to login. Invalid email / short password → inline error.

---

## PR 5 — Req 36: Filters (cuisine, distance, price, rating) (#81)

**Branch**: `feat/mobile-req-36-filters`

**Web reference** (read before coding):
- `src/hooks/useRestaurantFilters.js` — filter shape, `PRICE_CEILINGS`/`PRICE_FLOORS` constants, intersection logic, sessionStorage persistence.
- `src/utils/sessionRestaurantFilters.js` — persistence wrapper (adapt to AsyncStorage).
- `src/components/Sidebar.jsx` — filter control layout and how selections feed back into the hook.

**Changes**
- Port `src/hooks/useRestaurantFilters.js` → `mobile/hooks/useRestaurantFilters.ts`. Replace `sessionStorage` with `AsyncStorage` (key: `restaurantFilters`). Keep `PRICE_CEILINGS`/`PRICE_FLOORS` constants.
- `mobile/components/FilterSheet.tsx`: bottom-sheet UI with cuisine picker (distinct values derived from current restaurants), distance slider, price range toggles, min-rating stepper, "Clear all" button.
- `mobile/app/(tabs)/index.tsx`: add filter button on map (top-right FAB). Apply filter function from hook to restaurant set before rendering markers. Empty-state banner when 0 match.

**Commit sequence**
1. Port `useRestaurantFilters.ts` hook with AsyncStorage adapter.
2. Add `FilterSheet` component.
3. Wire filter button + apply to markers + empty-state.

**Verify**
- Open filter sheet, set min-rating 4.5 → fewer markers. Clear → all return. Set combination (rating + distance) → intersection applies. Kill/reopen → filters persist.

---

## PR 6 — Req 37: Restaurant list view (#86)

**Branch**: `feat/mobile-req-37-list`

**Web reference** (read before coding):
- `src/components/Sidebar.jsx` — list row layout (name, distance, rating, deal indicator placeholder), empty-state copy, tap-to-open-detail behavior.
- `src/App.jsx` — how the same filtered restaurant set feeds both the map and the sidebar list.

**Changes**
- `mobile/components/RestaurantListSheet.tsx`: bottom-sheet (or pullable panel) containing a `FlatList` of restaurants. Each row: name, distance, rating, placeholder for deal indicator (wired up in Req 39). Tapping a row opens `RestaurantDetailSheet` (reuse from Req 34).
- `mobile/app/(tabs)/index.tsx`: add "list" toggle button. The same filtered restaurant set from Req 36 feeds both markers and the list. Empty state message when 0.

**Commit sequence**
1. Add `RestaurantListSheet` component.
2. Toggle button + shared filtered data source.
3. Wire list item taps to detail sheet.

**Verify**
- Open list → items shown. Apply filter → list and markers shrink together. Tap row → detail sheet opens. Clear filter → list restored.

---

## PR 7 — Req 38: Sort list by distance (#87)

**Branch**: `feat/mobile-req-38-sort`

**Web reference** (read before coding):
- `src/components/Sidebar.jsx` — sort ordering, distance formatting (km vs mi), tie-break behavior.
- `src/utils/geo.js` — `calculateDistance` already ported in PR 2; reuse.

**Changes**
- `mobile/components/RestaurantListSheet.tsx`: compute distance for each restaurant using `geo.ts`, render in km (or mi — reuse the web app's unit convention), sort ascending by default. Stable tie-break by `place_id` so renders are consistent.
- Recompute distances when user location updates beyond a small delta (e.g., 50 m) — piggyback on `useUserLocation` subscription.

**Commit sequence**
1. Compute & display distance per row.
2. Sort ascending with stable tie-break.
3. Refresh on location change.

**Verify**
- List is ordered nearest → farthest. Move simulator location → list reorders within a few seconds. Each row shows distance to ~0.1 km precision.

---

## PR 8 — Req 45: Deals API integration (#94)

**Branch**: `feat/mobile-req-45-deals`

**Web reference** (read before coding):
- `src/utils/deals.js` — `fetchDeals`, `createDeal`, `groupByRestaurant` (copy verbatim; Supabase queries work on RN unchanged).
- `src/App.jsx` — when deals are fetched, how they're cached, how they're joined against restaurants by `place_id`.
- `src/components/RestaurantInfoModal.jsx` — deals section layout (title/description/expiration) and empty-vs-present handling.
- `src/hooks/useRestaurantSearch.js` — `has_active_deals` upsert (ensure not duplicated here).

**Changes**
- Port `src/utils/deals.js` → `mobile/utils/deals.ts` (`fetchDeals`, `groupByRestaurant`, etc.) — Supabase queries work unchanged.
- `mobile/hooks/useDeals.ts`: fetch active deals on mount (and on restaurant list refresh), cache in AsyncStorage under `deals:active` with a short TTL (e.g., 5 min), expose `getDealsForPlace(placeId)`.
- `mobile/components/RestaurantDetailSheet.tsx`: render deals section when `getDealsForPlace` returns non-empty (title, description, expiration). Hide section entirely when empty.
- Graceful failure: deals fetch error sets a state flag but does not block restaurant rendering.

**Commit sequence**
1. Port `deals.ts` utility.
2. Add `useDeals` hook with AsyncStorage caching + failure flag.
3. Render deals section inside `RestaurantDetailSheet`.

**Verify**
- Tap a restaurant known to have a deal (insert test row in Supabase if needed) → deal info shown. Tap one without → no empty section. Airplane mode + no cache → detail still renders, deals absent, non-blocking banner.

---

## PR 9 — Req 39: Custom marker for restaurants with deals (#88)

**Branch**: `feat/mobile-req-39-deal-markers`

**Web reference** (read before coding):
- `src/components/RestaurantMarkers.jsx` — custom marker styling for deal-bearing restaurants (icon/color/badge choice).
- `src/components/Sidebar.jsx` — list sort: deals-first, then distance; deal-badge rendering.
- `src/hooks/useRestaurantSearch.js` — `hasActiveDealsByPlaceId` dictionary (already in place from PR 2).

**Changes**
- `mobile/app/(tabs)/index.tsx`: pass a custom marker image or color (e.g., red pin vs. default) to `<Marker>` when `hasActiveDealsByPlaceId(place_id)` is true (reuse logic from `useRestaurantSearch`).
- `mobile/components/RestaurantListSheet.tsx`: sort primary = "has deal" desc, secondary = distance asc. Show a badge/tag on rows with deals.
- Reactivity: when deals data refreshes, markers and list re-render (already covered if `useDeals` is the source of truth — verify).

**Commit sequence**
1. Custom marker styling for deal restaurants.
2. List sort: deal first, then distance; add badge.
3. Ensure reactivity on deals refresh.

**Verify**
- Deal-bearing restaurants render with distinct marker and appear at top of list. Manually toggle a deal's `is_active` in Supabase and pull-to-refresh → marker and list order update.

---

## PR 10 — Req 42: Persist favorites in Supabase (#91)

**Branch**: `feat/mobile-req-42-favorites-backend`

**Web reference** (read before coding):
- `src/hooks/useFavorites.js` — table schema (`user_id` + `place_id`), optimistic update pattern, rollback on error, in-flight refs to prevent duplicate requests.
- `src/lib/supabase.js` — query style and RLS expectations.
- `src/contexts/AuthContext.jsx` — `user.id` access pattern.

**Changes**
- Port `src/hooks/useFavorites.js` → `mobile/hooks/useFavorites.ts`. Same Supabase queries (`favorites` table, keyed by `user_id` + `place_id`). Keep optimistic update + rollback pattern. No storage adapter change needed (no sessionStorage use).
- Gate calls on authenticated user (`AuthContext.user`). Surface errors via a toast/banner utility (add simple `mobile/utils/toast.ts` or reuse existing component pattern if present).

**Commit sequence**
1. Port `useFavorites.ts` hook.
2. Wire into `AuthContext` (read `user.id`, short-circuit when unauthenticated).
3. Add toast/banner error surface.

**Verify**
- From a temporary dev button (or stub), call `toggleFavorite` for a known place_id. Confirm row inserted/deleted in Supabase. Disconnect network → action fails gracefully with error banner, state rolls back.

---

## PR 11 — Req 40: Save restaurant as favorite (#89)

**Branch**: `feat/mobile-req-40-favorite-ui`

**Web reference** (read before coding):
- `src/components/RestaurantInfoModal.jsx` — heart button placement, filled-vs-outline icon state, unauthenticated prompt copy.
- `src/hooks/useFavorites.js` — already ported in PR 10; consume its `toggleFavorite` + current-state selector.

**Changes**
- `mobile/components/RestaurantDetailSheet.tsx`: add heart icon button. When `user` is present, tapping calls `toggleFavorite` (from Req 42 hook). Icon reflects current state (filled vs outline). When unauthenticated, show a "Log in to favorite" prompt linking to `(auth)/login`.

**Commit sequence**
1. Add heart icon button + authenticated/unauthenticated branches.
2. Wire to `useFavorites.toggleFavorite` with optimistic UI.

**Verify**
- Signed-in user: tap heart → fills immediately; force an error (kill Supabase creds) → rolls back. Sign out: heart shows login prompt. Re-tap filled heart: unfavorites, row removed in Supabase.

---

## PR 12 — Req 41: Favorites list screen (#90)

**Branch**: `feat/mobile-req-41-favorites-list`

**Web reference** (read before coding):
- `src/components/UserProfile.jsx` (or the web app's favorites view, whichever renders the list) — row layout, remove control, empty state copy, auth gate behavior.
- `src/hooks/useFavorites.js` — selectors for the current user's favorites.

**Changes**
- `mobile/app/(tabs)/favorites.tsx`: new tab (add to `(tabs)/_layout.tsx`). Fetches the user's favorites via `useFavorites`, joins against cached restaurant list for name/address. Each row has a remove control that calls `toggleFavorite`.
- Empty state: "No favorites yet — tap the heart on a restaurant to save it."
- Redirect to login if not authenticated.
- Tap a row → open `RestaurantDetailSheet` for that restaurant.

**Commit sequence**
1. Add Favorites tab + layout registration.
2. List rendering + remove control.
3. Empty state + auth guard + row-tap navigation.

**Verify**
- Favorite 2 restaurants from map → Favorites tab shows both. Remove one → list updates immediately. Sign out → tab redirects to login.

---

## PR 13 — Req 43: User profile screen (#92)

**Branch**: `feat/mobile-req-43-profile`

**Web reference** (read before coding):
- `src/components/UserProfile.jsx` — profile layout, displayed metadata (email, avatar, search radius), logout control.
- `src/components/AuthHeader.jsx` — alternate logout entry point, if relevant.
- `src/utils/avatarStorage.js` — avatar URL handling (port only if trivial; otherwise defer).

**Changes**
- `mobile/app/(tabs)/profile.tsx`: replace placeholder. Show user email (+ any available metadata from `AuthContext`). Add link/button to Favorites tab (Req 41). Keep logout control (wire to `signOut` — replaces the temp button from Req 35). Optionally show avatar if `src/utils/avatarStorage.js` has a usable port; otherwise defer.
- Auth guard: route redirects unauthenticated users to login (already covered by `_layout.tsx` auth gate; verify).

**Commit sequence**
1. Replace placeholder Profile screen with real layout.
2. Wire logout + favorites link.

**Verify**
- Profile tab shows logged-in email. Logout → returns to login. Favorites link → Favorites tab.

---

## PR 14 — Req 44: Search by name (#93)

**Branch**: `feat/mobile-req-44-search`

**Web reference** (read before coding):
- `src/utils/search.js` — Levenshtein + `fuzzyMatch` (copy verbatim).
- `src/components/SearchBar.jsx` — input UX, debounce timing, clear-button behavior.
- `src/App.jsx` — how search AND-combines with filters before markers + list update.

**Changes**
- Port `src/utils/search.js` → `mobile/utils/search.ts` (Levenshtein + `fuzzyMatch`), unchanged.
- `mobile/components/SearchBar.tsx`: `TextInput` with clear button. Debounced change events (~200 ms).
- `mobile/app/(tabs)/index.tsx`: render `SearchBar` at the top of the map (or inside list sheet header). Apply `fuzzyMatch` against current filtered set (AND with filters from Req 36). Markers and list narrow together. Clear input → restore filter-respecting set.

**Commit sequence**
1. Port `search.ts` utility.
2. Add `SearchBar` component.
3. Integrate with restaurant pipeline (search ∩ filters).

**Verify**
- Type "piza" → pizza restaurants returned (fuzzy). Apply a filter + search → intersection shown. Clear search → only filters apply.

---

## Critical files to reuse / reference

- `src/App.jsx` — geolocation + Places + caching pattern to mirror (PRs 1, 2, 5).
- `src/hooks/useRestaurantSearch.js` — caching strategy & `hasActiveDealsByPlaceId` logic (PR 2, 9).
- `src/hooks/useRestaurantFilters.js` — filter shape + persistence (PR 5).
- `src/hooks/useFavorites.js` — optimistic-update + rollback pattern (PR 10, 11).
- `src/utils/geo.js` — Haversine (PR 2).
- `src/utils/search.js` — `fuzzyMatch` (PR 14).
- `src/utils/deals.js` — Supabase deals fetch + grouping (PR 8).
- `src/utils/validation.js` — input sanitation (PR 4).
- `src/contexts/AuthContext.jsx` — context shape + auth listener (PR 4).
- `src/components/RestaurantInfoModal.jsx` — detail view content + missing-field handling (PR 3).
- `src/components/Sidebar.jsx` — list view layout reference (PR 6).
- `src/components/SearchBar.jsx` — search UX reference (PR 14).
- `mobile/lib/supabase.ts` — already set up; augment with SecureStore adapter in PR 4.
- `mobile/app/_layout.tsx` — auth gate lives here (PR 4).
- `mobile/app/(tabs)/_layout.tsx` — tab registration (PR 12 adds favorites; PR 13 rewires profile).

## End-to-end verification (post-PR-14)

After all 14 PRs merge:
1. Build fresh dev client: `cd mobile && eas build --profile development --platform ios && eas build --profile development --platform android`.
2. Install on simulator/device, sign up a new account.
3. Map loads, centered on location, restaurants appear with markers (deal-bearing distinguished).
4. Open list → sorted by distance, deals first. Tap item → detail sheet with deals + favorite button.
5. Favorite 2 restaurants → visible in Favorites tab and in the web app after refresh (cross-platform parity).
6. Apply filter (rating ≥ 4), search "pizza" → intersection narrows both list and markers.
7. Logout from Profile → returned to login. Sign back in → session + favorites restored.
