## Requirement ID: 31
**Type:** Setup
**Story Points:** 5

## Description
Create a new Expo project with the managed workflow, configure navigation, set up environment variables for API keys, and establish a project structure that mirrors the patterns used in the existing web application.

## Verifiable Features
- [ ] **Project creation:** An Expo project has been initialized using the managed workflow and runs successfully on at least one platform (iOS simulator or Android emulator).
- [ ] **Navigation setup:** A navigation framework (`expo-router`) is installed and configured with placeholder screens for core app sections (Map, Login, Profile).
- [ ] **Environment configuration:** Environment variables for the Google Maps API key and Supabase credentials are configured using a supported method (e.g., `expo-constants`, `.env` with `expo-env`), and a `.env.example` file documents required variables.
- [ ] **Project structure:** The source directory follows a structure consistent with the web app's organization (e.g., `components/`, `contexts/`, `hooks/`, `lib/`, `utils/`).
- [ ] **Supabase client:** The `@supabase/supabase-js` library is installed and a Supabase client module is configured, mirroring the existing `src/lib/supabase.js` from the web app.
- [ ] **Development workflow:** The project starts without errors via `npx expo start` and can be previewed on a device or emulator.