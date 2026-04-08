# Mobile Expo Init — Design Spec

**Requirement ID:** 31  
**Date:** 2026-04-08  
**Approach:** Option A — additive scaffolding on top of existing `mobile/mobile/` project

---

## Overview

Scaffold the existing Expo managed-workflow project (`mobile/mobile/`) to satisfy requirement 31. The default template content is removed and replaced with app-specific structure: environment config, a Supabase client, an AuthContext, placeholder screens (Map, Login, Profile), and a directory layout mirroring the web app.

---

## Architecture

```
mobile/mobile/
├── app/
│   ├── _layout.tsx          ← root: AuthContext provider + auth gate redirect
│   ├── (auth)/
│   │   └── login.tsx        ← placeholder Login screen
│   └── (tabs)/
│       ├── _layout.tsx      ← bottom tab bar (Map, Profile)
│       ├── index.tsx        ← placeholder Map screen
│       └── profile.tsx      ← placeholder Profile screen
├── lib/
│   └── supabase.ts          ← Supabase client using EXPO_PUBLIC_ env vars
├── contexts/
│   └── AuthContext.tsx      ← auth state (user, profile, loading)
├── components/              ← empty, ready for future components
├── hooks/                   ← empty, ready for future hooks
├── utils/                   ← empty, ready for future utilities
├── .env                     ← local secrets (gitignored)
└── .env.example             ← documents required variables
```

---

## Environment Variables

Expo managed workflow reads env vars with the `EXPO_PUBLIC_` prefix at build time via `process.env`.

**Required vars (documented in `.env.example`):**
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

`.env` is added to `.gitignore`. `.env.example` is committed.

---

## Supabase Client (`lib/supabase.ts`)

Direct port of `src/lib/supabase.js`:
- Reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `process.env`
- Logs a console warning if either is missing
- Exports a single `supabase` client instance via `createClient`
- Requires `@supabase/supabase-js` to be installed

---

## Auth Context (`contexts/AuthContext.tsx`)

Port of `src/contexts/AuthContext.jsx`:
- Uses `supabase.auth.onAuthStateChange` to track session
- Fetches user profile from Supabase on sign-in
- Exports `{ user, profile, loading }` via `useAuth()` hook
- Provided at the root layout level

---

## Navigation

### Root layout (`app/_layout.tsx`)
- Wraps the entire app in `<AuthContext.Provider>`
- While `loading` is true: show a loading indicator
- If no authenticated `user`: redirect to `/(auth)/login`
- Otherwise: render the `(tabs)` stack

### Auth stack (`app/(auth)/login.tsx`)
- Placeholder screen: centered text "Login Screen"
- No functional auth UI at this stage

### Tab stack (`app/(tabs)/_layout.tsx`)
- Bottom tab bar with two tabs: **Map** (index) and **Profile**

### Placeholder screens
- `app/(tabs)/index.tsx`: centered text "Map Screen"
- `app/(tabs)/profile.tsx`: centered text "Profile Screen"

---

## Cleanup

Remove default template files that are no longer needed:
- `app/(tabs)/explore.tsx`
- `app/modal.tsx`
- `components/` demo components (hello-wave, parallax-scroll-view, etc.)
- `constants/theme.ts` (will be replaced by app theming later)
- `hooks/use-theme-color.ts`, `hooks/use-color-scheme.*` (keep if used by layout, remove if not)

---

## Dependencies to Add

- `@supabase/supabase-js` — Supabase client

---

## Success Criteria

- `npx expo start` runs without errors
- Unauthenticated state redirects to Login placeholder screen
- Authenticated state shows Map + Profile tab bar
- `lib/supabase.ts` exports a working Supabase client
- `contexts/AuthContext.tsx` exports `useAuth()` with `{ user, profile, loading }`
- `.env.example` documents all three required variables
- Directory structure includes `components/`, `hooks/`, `utils/`, `lib/`, `contexts/`
