# Sprint 2 — Requirements Artifacts

This document provides the artifacts for all requirements scheduled for Sprint 2. Artifacts are derived from `Requirements_Stack.xlsx` and are written to be verifiable by a GTA.

---

## Requirement ID: 7 — Basic Supabase project setup (DB + config)

- **Title:** Basic Supabase project setup (DB + config)
- **Description:** Set up a Supabase project with database schema and application configuration for use by other Sprint 2 features.
- **Story Points:** 3
- **Artifact Type:** Setup

**Verifiable features:**

- Supabase project creation: A Supabase project has been created and is accessible via the Supabase dashboard.
- Database schema: Initial tables are defined to support deals and user data (e.g., deals, users).
- Client configuration: The Supabase client library is installed and configured in the application with environment variables for the API URL and anon key.
- Environment setup: A `.env.example` file is updated to include required Supabase environment variables.
- Connection verification: The application can successfully connect to the Supabase instance and perform a basic query.

---

## Requirement ID: 8 — Add deals functionality

- **Title:** Add deals functionality
- **Description:** Implement the ability to create, store, and retrieve restaurant deals from the Supabase database.
- **Story Points:** 5
- **Artifact Type:** Feature

**Verifiable features:**

- Database table: A `deals` table exists in Supabase with appropriate columns (e.g., restaurant name/ID, deal description, discount, expiration date).
- Data retrieval: The application can fetch deals from the Supabase database.
- Deal association: Each deal is associated with a specific restaurant.
- Data integrity: Deals include required fields and valid data types enforced by the schema.
- Debug validation: Deal data can be inspected during development via browser console or Supabase dashboard.

---

## Requirement ID: 9 — Error handling for failed API calls

- **Title:** Error handling for failed API calls
- **Description:** Implement user-facing error handling for failed API calls to Google Maps, Places, and Supabase services.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Error detection: The application detects and catches errors from Google Maps API, Places API, and Supabase calls.
- User notification: When an API call fails, a meaningful error message is displayed to the user (not a raw error or blank screen).
- Graceful degradation: The application remains usable even when one or more API calls fail (e.g., map still renders if deals fail to load).
- Network failure handling: The application handles scenarios such as no internet connection or API timeouts.
- Console logging: Errors are logged to the console with sufficient detail for debugging.

---

## Requirement ID: 10 — Display deals in restaurant popup

- **Title:** Display deals in restaurant popup
- **Description:** Show available deals within the restaurant info popup when a user clicks on a restaurant marker.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Deal display: When a restaurant has associated deals, they are shown inside the existing info popup.
- Deal content: Each deal displays relevant information (e.g., description, discount amount, expiration date).
- No-deal state: If a restaurant has no deals, the popup gracefully indicates this or omits the deals section.
- Data accuracy: Displayed deals match the data stored in the Supabase database.
- UI clarity: Deal information is readable and does not overcrowd or break the popup layout.

---

## Requirement ID: 11 — Search restaurants by name

- **Title:** Search restaurants by name
- **Description:** Allow users to search for restaurants by name using a text input field.
- **Story Points:** 3
- **Artifact Type:** Feature

**Verifiable features:**

- Search input: A text input field is visible and accessible in the application UI.
- Search execution: Entering a restaurant name filters or queries restaurants matching the input.
- Results display: Matching restaurants are highlighted on the map or presented in a visible list.
- Empty results: If no restaurants match the query, the user is informed with an appropriate message.
- Case insensitivity: Search is case-insensitive so users can find results regardless of capitalization.

---

## Requirement ID: 12 — User sign up and login

- **Title:** User sign up and login
- **Description:** Implement user authentication with sign-up and login functionality using Supabase Auth.
- **Story Points:** 5
- **Artifact Type:** Feature

**Verifiable features:**

- Sign-up flow: Users can create a new account with email and password via a sign-up form.
- Login flow: Registered users can log in with their credentials via a login form.
- Session management: Authenticated sessions are maintained so users remain logged in across page reloads.
- Logout: Users can log out, which clears the session and returns them to an unauthenticated state.
- Auth state in UI: The application UI reflects the user's authentication state (e.g., showing login/logout buttons appropriately).
- Input validation: Sign-up and login forms validate required fields and display errors for invalid input (e.g., malformed email, short password).
