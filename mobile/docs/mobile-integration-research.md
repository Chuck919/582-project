## Spike Research Findings: Mobile Migration (ID: 30)

This document outlines the research into migrating the current web application to a mobile platform using the **Expo** managed workflow.

---

### 1. Expo Managed Workflow Evaluation
The **Expo managed workflow** is recommended for this project. It abstracts away complex native builds (Xcode/Android Studio) while providing high-level APIs for device hardware.

* **Build Tooling:** EAS (Expo Application Services) handles cloud builds and internal distribution.
* **OTA Updates:** EAS Update allows us to push critical bug fixes directly to users without waiting for App Store/Play Store review.
* **Development Server:** Expo Go enables real-time testing on physical devices by scanning a QR code, significantly reducing developer friction.

---

### 2. Mapping Library Research
To replace `@react-google-maps/api`, the industry standard is **`react-native-maps`**.

* **Provider:** It supports both Apple Maps (default on iOS) and Google Maps (default on Android). For a consistent experience, we should use the Google Maps provider on both.
* **Configuration:** Requires installation of `react-native-maps` and specific configuration in `app.json` to include the Google Maps API key for the respective platforms.

---

### 3. Location Services: `expo-location`
The web app's browser Geolocation API must be replaced with **`expo-location`**.

* **Permissions:** Mobile requires explicit foreground permission requests (`requestForegroundPermissionsAsync`).
* **Accuracy:** Offers granular control (e.g., `Accuracy.Balanced` vs. `Accuracy.Highest`) to manage battery consumption, which is not a factor in browser-based geolocation.
* **Differences:** Unlike the browser API, `expo-location` provides better background tracking capabilities (if needed) and more robust error handling for GPS availability.

---

### 4. Google Maps API Key Reuse
**Recommendation:** Create new, platform-specific API keys rather than reusing the web key.

* **Restrictions:** The web key is restricted by HTTP Referrer. Mobile keys require:
    * **Android:** SHA-1 certificate fingerprint and Package Name.
    * **iOS:** Bundle Identifier.
* **Billing:** While they share the same billing account, separate keys allow for better usage tracking and tighter security.

---

### 5. Library Equivalence Mapping

| Web Dependency | React Native Equivalent | Notes |
| :--- | :--- | :--- |
| `<div>`, `<section>`, `<span>` | `<View>`, `<Text>` | Native components required for layout. |
| `@react-google-maps/api` | `react-native-maps` | Full feature parity for markers/polylines. |
| `@supabase/supabase-js` | `@supabase/supabase-js` | Fully compatible; requires `react-native-url-polyfill`. |
| CSS / SCSS | `StyleSheet` / `NativeWind` | `NativeWind` allows for Tailwind-style classes. |
| `react-router-dom` | `expo-router` | Recommended for file-based routing. |

---

### 6. Navigation Research
We compared the two primary navigation solutions for React Native:

1.  **React Navigation:** The "manual" standard. Very flexible but requires more boilerplate.
2.  **Expo Router:** Built on top of React Navigation. It brings **file-based routing** (similar to Next.js or Vite-based file routers) to mobile.

**Recommendation:** **`expo-router`**.
Since the team is coming from a web background, the file-based convention is more intuitive and handles deep-linking automatically, which is often a pain point in mobile development.

---

### 7. Outcome Summary
The migration is feasible with minimal logic changes to the backend integration (Supabase). The primary effort will reside in translating UI components from HTML elements to Native components and configuring platform-specific API keys for Maps.