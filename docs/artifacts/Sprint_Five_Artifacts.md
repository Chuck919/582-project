# Sprint 5 — Requirements Artifacts

This document provides the artifacts for all requirements scheduled for Sprint 5. Sprint 5 begins the transition from the existing React web application to a React Native (Expo) mobile application. The scope covers core mobile foundation, authentication, and basic filtering as the MVP mobile experience. Artifacts are derived from `Requirements_Stack.xlsx` and are written to be verifiable by a GTA.

---

## Requirement ID: 30 — Spike: Research React Native/Expo for mobile migration

- **Title:** Research React Native/Expo for mobile migration
- **Description:** Investigate Expo (managed workflow), React Native mapping libraries, device location APIs, and library equivalents needed to migrate the existing web application to a mobile platform.
- **Story Points:** 3
- **Artifact Type:** Spike (Research)

**Verifiable features:**

- Expo evaluation: The Expo managed workflow has been reviewed for compatibility with project needs, including build tooling, over-the-air updates, and development server capabilities.
- Mapping library research: `react-native-maps` has been evaluated as the replacement for `@react-google-maps/api`, including Google Maps provider configuration for both iOS and Android.
- Location services research: `expo-location` has been reviewed for foreground location permissions, accuracy options, and differences from the browser Geolocation API used in the web app.
- API key reuse analysis: A determination has been made on whether the existing Google Maps API key can be reused for mobile platforms, including any required key restriction changes (Android SHA-1, iOS bundle ID).
- Library equivalence mapping: A written mapping exists identifying React Native equivalents for key web dependencies (e.g., `@react-google-maps/api` → `react-native-maps`, `@supabase/supabase-js` compatibility in React Native, CSS → StyleSheet/NativeWind).
- Navigation research: Routing options (`expo-router` or `react-navigation`) have been compared and a recommendation is documented.
- Outcome artifact: Findings are documented in a shared document accessible to the team.

---

## Requirement ID: 31 — Initialize Expo React Native project

- **Title:** Initialize Expo React Native project
- **Description:** Create a new Expo project with the managed workflow, configure navigation, set up environment variables for API keys, and establish a project structure that mirrors the patterns used in the existing web application.
- **Story Points:** 5
- **Artifact Type:** Setup

**Verifiable features:**

- Project creation: An Expo project has been initialized using the managed workflow and runs successfully on at least one platform (iOS simulator or Android emulator).
- Navigation setup: A navigation framework (`expo-router` or `react-navigation`) is installed and configured with placeholder screens for core app sections (Map, Login, Profile).
- Environment configuration: Environment variables for the Google Maps API key and Supabase credentials are configured using a supported method (e.g., `expo-constants`, `.env` with `expo-env`), and a `.env.example` file documents required variables.
- Project structure: The source directory follows a structure consistent with the web app's organization (e.g., `components/`, `contexts/`, `hooks/`, `lib/`, `utils/`).
- Supabase client: The `@supabase/supabase-js` library is installed and a Supabase client module is configured, mirroring the existing `src/lib/supabase.js` from the web app.
- Development workflow: The project starts without errors via `npx expo start` and can be previewed on a device or emulator.

---

## Requirement ID: 32 — Display interactive map with user location

- **Title:** Display interactive map with user location
- **Description:** Render an interactive map using `react-native-maps` with the Google Maps provider, request device location permissions using `expo-location`, and display the user's current position on the map.
- **Story Points:** 8
- **Artifact Type:** Feature

**Verifiable features:**

- Map rendering: A full-screen interactive map is displayed within the application using `react-native-maps` with the Google Maps provider.
- Permission request: The application requests foreground location permission from the user on both iOS and Android, with appropriate permission prompt messages.
- Permission granted behavior: When permission is granted, the map centers on the user's current latitude and longitude and displays a user location marker.
- Permission denied behavior: When permission is denied, the map centers on a predefined default location and the user is informed that location access is required for full functionality.
- Map interactivity: The user can pan, zoom, and interact with the map using standard touch gestures (pinch-to-zoom, drag-to-pan).
- Platform verification: The map renders correctly on at least one platform (iOS simulator or Android emulator).

---

## Requirement ID: 33 — Fetch and display nearby restaurants on map

- **Title:** Fetch and display nearby restaurants on map
- **Description:** Integrate with the Google Places API from React Native to fetch nearby restaurants based on the user's location and display them as markers on the map.
- **Story Points:** 8
- **Artifact Type:** Feature

**Verifiable features:**

- API integration: The application calls the Google Places API (Nearby Search or equivalent) from within the React Native environment using `fetch` or a compatible HTTP client.
- Location-based query: API requests use the user's current coordinates and a defined search radius, consistent with the web app's existing query parameters.
- Restaurant markers: A map marker is created for each restaurant returned by the API, placed at the correct geographic coordinates.
- Marker visibility: Multiple markers are displayed simultaneously and remain distinguishable at typical zoom levels.
- Data caching: A caching strategy is implemented to avoid redundant API calls when the user's location has not changed significantly, mirroring the session caching approach from the web app.
- Error handling: API failures (network errors, rate limits, invalid responses) are caught and the user receives a meaningful message rather than a crash or blank screen.
- Debug validation: API responses can be inspected during development via console logs or React Native debugging tools.

---

## Requirement ID: 34 — Restaurant detail modal

- **Title:** Restaurant detail modal
- **Description:** Allow users to tap a restaurant marker on the map to view detailed information in a mobile-friendly modal or bottom sheet component.
- **Story Points:** 5
- **Artifact Type:** Feature

**Verifiable features:**

- Marker interaction: Tapping a restaurant marker on the map opens a detail view (modal, bottom sheet, or callout).
- Displayed data: The detail view shows the restaurant name, address, rating, cuisine or category, price range (when available), and approximate distance from the user.
- Data accuracy: Information displayed in the detail view matches the data returned by the API.
- Missing data handling: Fields without available data (e.g., no price range, no rating) are handled gracefully and do not produce blank entries or layout errors.
- Dismiss behavior: The user can dismiss the detail view by tapping outside it, swiping it away, or pressing a close control, returning focus to the map.
- UI clarity: The detail view is readable, does not obscure the entire map, and follows mobile UI conventions for the chosen presentation pattern.

---

## Requirement ID: 35 — User authentication (login and signup)

- **Title:** User authentication (login and signup)
- **Description:** Implement login and signup screens using Supabase Auth adapted for React Native, with session persistence using secure device storage and auth state management through a context provider.
- **Story Points:** 5
- **Artifact Type:** Feature

**Verifiable features:**

- Signup flow: Users can create a new account using email and password via a dedicated signup screen with appropriate mobile input fields.
- Login flow: Registered users can log in with their credentials via a dedicated login screen.
- Session persistence: Authenticated sessions are persisted to device storage (`expo-secure-store` or `AsyncStorage`) so users remain logged in after closing and reopening the app.
- Auth state management: An auth context provider (mirroring the web app's `AuthContext.jsx`) manages authentication state and exposes it to the component tree.
- Logout: Users can log out, which clears the stored session and returns them to the login screen.
- Auth-aware navigation: The application conditionally navigates to the login screen or the main map screen based on the user's authentication state.
- Input validation: Signup and login forms validate required fields and display errors for invalid input (e.g., malformed email, short password), consistent with the web app's validation behavior.

---

## Requirement ID: 36 — Basic restaurant filters (cuisine, distance, price, rating)

- **Title:** Basic restaurant filters (cuisine, distance, price, rating)
- **Description:** Provide mobile-adapted filter controls for cuisine type, distance radius, price range, and minimum rating, allowing users to narrow the visible restaurants on the map.
- **Story Points:** 5
- **Artifact Type:** Feature

**Verifiable features:**

- Filter UI: A filter panel is accessible from the main map screen via a button or gesture, presented as a bottom sheet, modal, or dedicated filter screen appropriate for mobile interaction.
- Cuisine filter: Users can select a cuisine type to filter visible restaurants; available cuisine values are derived from restaurant data returned by the API.
- Distance filter: Users can set a distance threshold to show only restaurants within a selected radius from their current location.
- Price range filter: Users can filter restaurants by price level; restaurants without price data are handled gracefully.
- Rating filter: Users can set a minimum rating threshold; only restaurants at or above the selected rating are shown.
- Filter application: Applying filters updates the restaurant markers displayed on the map in real time.
- Combined filters: Multiple filters can be applied simultaneously and their effects combine correctly (intersection logic).
- Clear/reset behavior: Users can clear all filters to restore the full set of nearby restaurants.
- Empty-state handling: If no restaurants match the active filters, the user is informed with an appropriate message.
