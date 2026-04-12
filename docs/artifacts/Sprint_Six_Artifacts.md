# Sprint 6 — Requirements Artifacts

This document provides the artifacts for all requirements scheduled for Sprint 6. Sprint 6 is the second wave of the React Native (Expo) mobile migration begun in Sprint 5. Its scope brings the mobile application to feature parity with the existing web app by adding the restaurant list view, distance sorting, custom deal markers, favorites (save / view / persist), the user profile screen, name search, and the deals API integration. Artifacts are derived from `Requirements_Stack.xlsx` and are written to be verifiable by a GTA.

---

## Requirement ID: 37 — Restaurant list view (mobile)

- **Title:** Restaurant list view (mobile)
- **Description:** Provide a mobile-friendly scrollable list of nearby restaurants alongside the map, allowing users to browse results in a list format complementary to map markers.
- **Story Points:** 5
- **Artifact Type:** Feature

**Verifiable features:**

- List presentation: A scrollable list of nearby restaurants is accessible from the map screen via a button, tab, or bottom-sheet gesture appropriate for mobile UX.
- Data parity: Each list item shows the restaurant name, distance from the user, rating, and a deal indicator when applicable.
- Data source consistency: The list reflects the same restaurant set currently shown as map markers; active filters and search queries apply to both views.
- Tap-to-detail: Tapping a list item opens the same restaurant detail modal used for marker taps (Req 34).
- Empty state: When no restaurants match the current filter set, the list displays a clear empty-state message rather than rendering blank.

---

## Requirement ID: 38 — Sort restaurants by distance (mobile)

- **Title:** Sort restaurants by distance (mobile)
- **Description:** Order the mobile restaurant list by ascending distance from the user's current location, mirroring the sorting behavior of the web sidebar.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Distance calculation: Each restaurant's distance from the user's current coordinates is computed using a Haversine (or equivalent) formula.
- Default order: The list view from Req 37 displays restaurants sorted by ascending distance by default.
- Distance display: Each list item shows the computed distance in a human-readable unit (e.g., km or mi).
- Recompute on location change: When the user's location updates significantly, distances and ordering refresh accordingly.
- Stable sort: Restaurants tied on distance maintain a consistent display order across renders.

---

## Requirement ID: 39 — Display restaurants with deals using custom marker (mobile)

- **Title:** Display restaurants with deals using custom marker (mobile)
- **Description:** Visually distinguish restaurants that have active deals on the map and ensure they surface to the top of the restaurant list.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Visual differentiation: Restaurants that have at least one active deal are rendered with a visually distinct marker (color, icon, or badge) on the map.
- Data lookup: The "has deal" determination uses the Supabase deals table joined against the restaurant's place ID, mirroring the web app's `hasActiveDealsByPlaceId` utility.
- List ordering: In the list view (Req 37), restaurants with deals appear before restaurants without deals, after which the secondary sort by distance applies.
- Live update: When deals data is fetched or refreshed, marker styles and list ordering update without requiring an app restart.
- Missing-data handling: Restaurants whose deal status cannot be determined are treated as having no deals and rendered with the default marker.

---

## Requirement ID: 40 — Save restaurant as favorite (mobile)

- **Title:** Save restaurant as favorite (mobile)
- **Description:** Allow authenticated users to mark a restaurant as a favorite directly from the restaurant detail modal on mobile.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Favorite control: The restaurant detail modal (Req 34) includes a control (heart icon, button) to mark or unmark a restaurant as a favorite.
- Auth gating: The favorite control is only enabled when the user is authenticated; unauthenticated users are prompted to log in.
- Visual state: The favorite control reflects the current saved state for the displayed restaurant (filled vs. unfilled icon).
- Optimistic feedback: Tapping the control updates UI state immediately and rolls back gracefully on error.
- Toggle behavior: Tapping a favorited restaurant's control unfavorites it, and the change is reflected in the favorites list (Req 41).

---

## Requirement ID: 41 — View list of saved favorite restaurants (mobile)

- **Title:** View list of saved favorite restaurants (mobile)
- **Description:** Provide a dedicated screen on mobile that lists all restaurants the authenticated user has marked as favorites.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Favorites screen: A dedicated screen or tab lists all restaurants the current user has favorited.
- Data display: Each entry shows the restaurant name, address, and a way to navigate to its detail view.
- Empty state: When the user has no favorites, the screen shows a friendly empty-state message.
- Auth gating: The favorites screen is only accessible to authenticated users; unauthenticated users are redirected to login or shown a prompt.
- Unfavorite: Users can remove a restaurant from their favorites directly from this screen, and the list updates immediately.

---

## Requirement ID: 42 — Persist favorites in Supabase (mobile)

- **Title:** Persist favorites in Supabase (mobile)
- **Description:** Store and retrieve user favorites from the existing Supabase backend so the mobile app shares favorites data with the web app.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Supabase table reuse: Favorites are stored in the same Supabase table used by the web app, keyed by user ID and restaurant place ID.
- Cross-device sync: A user who favorites a restaurant on the mobile app sees it in the web app (and vice versa) after refresh.
- Auth-scoped queries: All favorites reads and writes are scoped to the authenticated user via Supabase row-level security or equivalent query filters.
- Error handling: Network or database failures during favorite operations are caught and surfaced to the user without crashing the app.
- Persistence across sessions: Favorites remain available after the user logs out and logs back in, or after closing and reopening the app.

---

## Requirement ID: 43 — User profile screen (mobile)

- **Title:** User profile screen (mobile)
- **Description:** Provide a dedicated profile screen on mobile that shows account information, links to saved data, and offers a logout control.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Profile screen: A dedicated profile screen displays the authenticated user's email and any other available account metadata.
- Navigation: The profile screen is reachable from the main map screen via a clear navigation entry point (tab, drawer, or button).
- Logout: A logout control on the profile screen ends the session and returns the user to the login screen, consistent with the auth flow from Req 35.
- Saved data summary: The profile screen shows or links to the user's favorites (Req 41).
- Auth gating: The profile screen is only accessible to authenticated users.

---

## Requirement ID: 44 — Search restaurants by name (mobile)

- **Title:** Search restaurants by name (mobile)
- **Description:** Allow users to search for restaurants by name on mobile using a typo-tolerant fuzzy match, mirroring the search behavior of the web app.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Search input: A search input is accessible from the map and/or list screen and accepts text queries.
- Fuzzy matching: The search uses a fuzzy/typo-tolerant match (parallel to the web app's `fuzzyMatch` in `src/utils/search.js`) so minor misspellings still return relevant results.
- Filter integration: Search results combine with active filters (Req 36) using intersection logic — only restaurants matching both the search and the filters are shown.
- Map and list sync: Search narrows both the map markers and the list view (Req 37) simultaneously.
- Clear behavior: Clearing the search input restores the unfiltered (filter-respecting) restaurant set.

---

## Requirement ID: 45 — Integrate deals API with restaurant data (mobile)

- **Title:** Integrate deals API with restaurant data (mobile)
- **Description:** Fetch active deals from the Supabase backend and display them within the mobile restaurant detail modal, joining deals to restaurants by place ID.
- **Story Points:** 8
- **Artifact Type:** Integration

**Verifiable features:**

- Deals fetch: On app startup or when restaurants are fetched, active deals are loaded from the Supabase deals table.
- Detail modal display: The restaurant detail modal (Req 34) displays any active deals associated with the restaurant — title, description, and expiration as available.
- Data join: Deals are matched to restaurants by place ID, consistent with the web app's join logic.
- Missing-data handling: Restaurants with no active deals show no deals section (rather than an empty placeholder or blank space).
- Caching: Deals data is cached to avoid redundant fetches on every restaurant interaction, mirroring the web app's caching strategy.
- Error handling: Failures to fetch deals do not block restaurant display; the user sees restaurants with deals omitted gracefully and a non-blocking error indicator if appropriate.
