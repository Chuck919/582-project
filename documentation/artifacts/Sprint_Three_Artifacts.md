# Sprint 3 — Requirements Artifacts

This document provides the artifacts for all requirements scheduled for Sprint 3. Artifacts are derived from `Requirements_Stack.xlsx` and are written to be verifiable by a GTA.

---

## Requirement ID: 13 — Display restaurants with deals using custom marker

- **Title:** Display restaurants with deals using custom marker
- **Description:** Visualize restaurants with active deals using distinct custom markers on the map.
- **Story Points:** 2
- **Artifact Type:** Feature

**Verifiable features:**

- Custom marker design: Restaurants with deals are displayed using visually distinct markers.
- Accurate placement: Markers appear at the correct geographic coordinates.
- Marker visibility: Custom markers are clearly distinguishable from regular markers.
- Performance: Rendering remains responsive for typical nearby restaurant counts.
- Visual confirmation: Users can easily identify restaurants with deals on the map.

**Notes:**

- Ensure the custom marker design aligns with the overall app theme for consistency.
- Test marker visibility under different map zoom levels to avoid overlap or clutter.
- Consider performance optimizations for rendering markers if the number of restaurants is large.

---

## Requirement ID: 14 — Implement a sidebar with list of restaurants

- **Title:** Implement a sidebar with list of restaurants
- **Description:** Add a sidebar to display a list of nearby restaurants fetched from the API.
- **Story Points:** 5
- **Artifact Type:** Feature

**Verifiable features:**

- Sidebar layout: A collapsible sidebar is added to the application UI.
- Restaurant listing: The sidebar displays a scrollable list of nearby restaurants.
- Interaction: Clicking a restaurant in the list pans the map to its location and opens the info popup.
- Responsiveness: The sidebar adapts to different screen sizes without breaking the layout.
- Data accuracy: The list matches the data fetched from the API.

**Notes:**

- Ensure the sidebar does not obstruct critical map elements, especially on smaller screens.
- Test the collapsible functionality across different devices and browsers.
- Consider lazy-loading restaurant data in the sidebar to improve performance.

---

## Requirement ID: 15 — Sort restaurants by distance

- **Title:** Sort restaurants by distance
- **Description:** Enable sorting of the restaurant list by distance from the user’s current location.
- **Story Points:** 8
- **Artifact Type:** Feature

**Verifiable features:**

- Sorting functionality: Restaurants are sorted in ascending order of distance.
- Dynamic updates: Sorting updates automatically when the user’s location changes.
- UI clarity: The sorted list is visually clear and easy to navigate.
- Performance: Sorting is efficient and does not introduce noticeable delays.
- Debug validation: Sorted distances can be inspected during development.

**Notes:**

- Verify the accuracy of distance calculations, especially in edge cases like large search radii.
- Test sorting behavior when the user’s location changes rapidly (e.g., in a moving vehicle).
- Ensure the sorting logic is consistent with the displayed distances in the UI.

---

## Requirement ID: 16 — Ensure restaurants with deals are on top of list view

- **Title:** Ensure restaurants with deals are on top of list view
- **Description:** Modify the restaurant list to prioritize restaurants with active deals.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Prioritization: Restaurants with deals appear at the top of the list.
- Secondary sorting: Within the deals group, restaurants are sorted by distance.
- UI clarity: The prioritization is visually clear to the user.
- Data accuracy: The list reflects the correct prioritization based on deal availability.
- Debug validation: Prioritization logic can be inspected during development.

**Notes:**

- Clearly indicate in the UI that restaurants with deals are prioritized.
- Test the prioritization logic with varying numbers of restaurants with and without deals.
- Ensure the prioritization does not negatively impact sorting by distance.

---

## Requirement ID: 17 — View list of saved favorite restaurants

- **Title:** View list of saved favorite restaurants
- **Description:** Allow users to view a list of their saved favorite restaurants.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Favorites list: A dedicated section displays the user’s saved favorite restaurants.
- Interaction: Clicking a favorite restaurant pans the map to its location and opens the info popup.
- UI clarity: The favorites list is visually distinct from other UI elements.
- Data accuracy: The list matches the user’s saved data.
- Responsiveness: The favorites list adapts to different screen sizes.

**Notes:**

- Ensure the favorites list updates dynamically when a restaurant is added or removed.
- Test the interaction between the favorites list and the map to ensure smooth navigation.
- Consider adding a visual indicator for restaurants already saved as favorites.

---

## Requirement ID: 18 — Save restaurant as favorite

- **Title:** Save restaurant as favorite
- **Description:** Enable users to save a restaurant as a favorite for quick access later.
- **Story Points:** 5
- **Artifact Type:** Feature

**Verifiable features:**

- Save functionality: Users can mark a restaurant as a favorite via a button or similar UI element.
- Visual feedback: The UI provides confirmation when a restaurant is saved as a favorite.
- Data persistence: Saved favorites are stored in the application state.
- Debug validation: Saved favorites can be inspected during development.
- Error handling: The application gracefully handles errors during the save process.

**Notes:**

- Ensure the save button is accessible and clearly visible in the UI.
- Test the save functionality under different network conditions to handle potential delays.
- Provide meaningful error messages if the save operation fails.

---

## Requirement ID: 19 — User profile page (view saved data)

- **Title:** User profile page (view saved data)
- **Description:** Add a user profile page to display saved data, including favorite restaurants.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Profile layout: A dedicated user profile page is added to the application.
- Saved data display: The page shows the user’s saved favorite restaurants.
- Navigation: Users can navigate to the profile page via a menu or button.
- UI clarity: The profile page is visually distinct and easy to navigate.
- Responsiveness: The profile page adapts to different screen sizes.

**Notes:**

- Ensure the profile page is secure and only accessible to authenticated users.
- Test the navigation flow to and from the profile page to ensure a seamless user experience.
- Consider adding additional user data (e.g., profile picture, preferences) to enhance the page.

---

## Requirement ID: 20 — Persist favorites in Supabase database

- **Title:** Persist favorites in Supabase database
- **Description:** Store user favorite restaurants in the Supabase database for long-term persistence.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Database schema: A `favorites` table exists in Supabase with appropriate columns (e.g., user ID, restaurant ID).
- Data persistence: Favorite restaurants are stored in the Supabase database.
- Data retrieval: The application can fetch favorite restaurants from the database.
- Data integrity: Favorites include required fields and valid data types enforced by the schema.
- Debug validation: Favorite data can be inspected during development via browser console or Supabase dashboard.

**Notes:**

- Ensure the `favorites` table schema supports scalability for a large number of users.
- Test database operations (insert, update, delete) to ensure data integrity.
- Implement proper error handling for database connectivity issues.
