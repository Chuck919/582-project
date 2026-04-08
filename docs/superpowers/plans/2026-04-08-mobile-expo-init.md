# Mobile Expo Init Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the existing `mobile/mobile/` Expo project with env config, Supabase client, AuthContext, auth-gated navigation, and placeholder screens for Map, Login, and Profile.

**Architecture:** Additive changes on the existing template — install Supabase, add env files, create `lib/`, `contexts/`, and empty `components/`, `hooks/`, `utils/` dirs, replace default template screens with app-specific placeholders, and wire up an auth gate in the root layout.

**Tech Stack:** Expo ~54 (managed workflow), expo-router ~6, TypeScript, @supabase/supabase-js, React Native

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `mobile/mobile/.env` | Local secrets (gitignored) |
| Create | `mobile/mobile/.env.example` | Documents required env vars |
| Modify | `mobile/mobile/.gitignore` | Add `.env` to ignored files |
| Create | `mobile/mobile/lib/supabase.ts` | Supabase client singleton |
| Create | `mobile/mobile/contexts/AuthContext.tsx` | Auth state + actions |
| Modify | `mobile/mobile/app/_layout.tsx` | Provide AuthContext, auth gate redirect |
| Create | `mobile/mobile/app/(auth)/login.tsx` | Placeholder Login screen |
| Modify | `mobile/mobile/app/(tabs)/_layout.tsx` | Replace Explore tab with Profile tab |
| Modify | `mobile/mobile/app/(tabs)/index.tsx` | Replace template content with Map placeholder |
| Create | `mobile/mobile/app/(tabs)/profile.tsx` | Placeholder Profile screen |
| Delete | `mobile/mobile/app/(tabs)/explore.tsx` | Remove default template screen |
| Delete | `mobile/mobile/app/modal.tsx` | Remove default template modal |
| Create | `mobile/mobile/components/.gitkeep` | Preserve empty dir in git |
| Create | `mobile/mobile/hooks/.gitkeep` | Preserve empty dir in git |
| Create | `mobile/mobile/utils/.gitkeep` | Preserve empty dir in git |

---

## Task 1: Install @supabase/supabase-js

**Files:**
- Modify: `mobile/mobile/package.json` (via npm install)

- [ ] **Step 1: Install the package**

```bash
cd mobile/mobile
npm install @supabase/supabase-js
```

Expected output: package added to `dependencies` in `package.json`, no errors.

- [ ] **Step 2: Verify install**

```bash
grep '"@supabase/supabase-js"' package.json
```

Expected: a line like `"@supabase/supabase-js": "^2.x.x"`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(mobile): install @supabase/supabase-js"
```

---

## Task 2: Configure environment files

**Files:**
- Create: `mobile/mobile/.env`
- Create: `mobile/mobile/.env.example`
- Modify: `mobile/mobile/.gitignore`

- [ ] **Step 1: Add `.env` to .gitignore**

Open `mobile/mobile/.gitignore`. The current entry for env files is:
```
# local env files
.env*.local
```

Replace that block with:
```
# local env files
.env
.env*.local
```

- [ ] **Step 2: Create `.env.example`**

Create `mobile/mobile/.env.example` with this content:

```
# Supabase project URL — found in Supabase dashboard > Settings > API
EXPO_PUBLIC_SUPABASE_URL=

# Supabase anon/public key — found in Supabase dashboard > Settings > API
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Google Maps API key — from Google Cloud Console
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

- [ ] **Step 3: Create `.env` with your actual values**

Create `mobile/mobile/.env` with the same keys filled in:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key-here
```

(This file is gitignored and will not be committed.)

- [ ] **Step 4: Verify `.env` is gitignored**

```bash
git status
```

Expected: `.env` does NOT appear in untracked files. `.env.example` and `.gitignore` do appear.

- [ ] **Step 5: Commit**

```bash
git add .gitignore mobile/mobile/.env.example
git commit -m "feat(mobile): add env config and .env.example"
```

---

## Task 3: Create Supabase client

**Files:**
- Create: `mobile/mobile/lib/supabase.ts`

- [ ] **Step 1: Create `lib/supabase.ts`**

Create `mobile/mobile/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
```

- [ ] **Step 2: Commit**

```bash
git add mobile/mobile/lib/supabase.ts
git commit -m "feat(mobile): add Supabase client module"
```

---

## Task 4: Create AuthContext

**Files:**
- Create: `mobile/mobile/contexts/AuthContext.tsx`

- [ ] **Step 1: Create `contexts/AuthContext.tsx`**

Create `mobile/mobile/contexts/AuthContext.tsx`:

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  searchRadius: number;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile;
  loading: boolean;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const DEFAULT_PROFILE: Profile = { searchRadius: 5 };

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeProfile(metadata: Record<string, unknown> | undefined): Profile {
  const raw = (metadata?.profile ?? {}) as Record<string, unknown>;
  const parsed = Number(raw.searchRadius);
  return {
    searchRadius: Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 15) : DEFAULT_PROFILE.searchRadius,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setProfile(nextUser ? normalizeProfile(nextUser.user_metadata) : DEFAULT_PROFILE);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setProfile(nextUser ? normalizeProfile(nextUser.user_metadata) : DEFAULT_PROFILE);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: username ? { username } : undefined },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Must be signed in to update profile.') };

    const nextProfile = normalizeProfile({
      ...user.user_metadata,
      profile: { ...(user.user_metadata?.profile ?? {}), ...updates },
    });

    const { data, error } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, profile: nextProfile },
    });

    if (!error && data.user) {
      setUser(data.user);
      setProfile(normalizeProfile(data.user.user_metadata));
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isLoggedIn: !!user, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/mobile/contexts/AuthContext.tsx
git commit -m "feat(mobile): add AuthContext with useAuth hook"
```

---

## Task 5: Update root layout with auth gate

**Files:**
- Modify: `mobile/mobile/app/_layout.tsx`

The current `_layout.tsx` wraps a `<Stack>` with theme providers. We need to:
1. Wrap everything in `<AuthProvider>`
2. Show a loading spinner while `loading` is true
3. Redirect to `/(auth)/login` when there's no authenticated user

- [ ] **Step 1: Replace `app/_layout.tsx`**

Replace the entire contents of `mobile/mobile/app/_layout.tsx` with:

```typescript
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { loading, isLoggedIn } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      </Stack>
      {!isLoggedIn && <Redirect href="/(auth)/login" />}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/mobile/app/_layout.tsx
git commit -m "feat(mobile): add auth gate and AuthProvider to root layout"
```

---

## Task 6: Create Login placeholder screen

**Files:**
- Create: `mobile/mobile/app/(auth)/login.tsx`

- [ ] **Step 1: Create `app/(auth)/login.tsx`**

Create `mobile/mobile/app/(auth)/login.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Login Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/mobile/app/'(auth)'/login.tsx
git commit -m "feat(mobile): add Login placeholder screen"
```

---

## Task 7: Replace Map screen (index) and create Profile screen

**Files:**
- Modify: `mobile/mobile/app/(tabs)/index.tsx`
- Create: `mobile/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Replace `app/(tabs)/index.tsx` with Map placeholder**

Replace the entire contents of `mobile/mobile/app/(tabs)/index.tsx` with:

```typescript
import { View, Text, StyleSheet } from 'react-native';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Map Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Create `app/(tabs)/profile.tsx`**

Create `mobile/mobile/app/(tabs)/profile.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Profile Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/mobile/app/'(tabs)'/index.tsx mobile/mobile/app/'(tabs)'/profile.tsx
git commit -m "feat(mobile): add Map and Profile placeholder screens"
```

---

## Task 8: Update tab bar layout

**Files:**
- Modify: `mobile/mobile/app/(tabs)/_layout.tsx`

Replace the two tabs (Home + Explore) with Map + Profile.

- [ ] **Step 1: Replace `app/(tabs)/_layout.tsx`**

Replace the entire contents of `mobile/mobile/app/(tabs)/_layout.tsx` with:

```typescript
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/mobile/app/'(tabs)'/_layout.tsx
git commit -m "feat(mobile): update tab bar to Map and Profile tabs"
```

---

## Task 9: Remove default template files

**Files:**
- Delete: `mobile/mobile/app/(tabs)/explore.tsx`
- Delete: `mobile/mobile/app/modal.tsx`

- [ ] **Step 1: Delete template files**

```bash
cd mobile/mobile
rm app/'(tabs)'/explore.tsx app/modal.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore(mobile): remove default Expo template screens"
```

---

## Task 10: Create empty project structure directories

**Files:**
- Create: `mobile/mobile/components/.gitkeep`
- Create: `mobile/mobile/hooks/.gitkeep`
- Create: `mobile/mobile/utils/.gitkeep`

Note: `components/`, `hooks/` already exist in the template with demo files. Check what's there before proceeding.

- [ ] **Step 1: Check existing contents**

```bash
ls mobile/mobile/components/
ls mobile/mobile/hooks/
```

The existing `components/` contains demo files (`haptic-tab.tsx`, `hello-wave.tsx`, etc.) that are still referenced by the tab layout. **Do not delete them** — they are used by `app/(tabs)/_layout.tsx` via `@/components/haptic-tab` and `@/components/ui/icon-symbol`. Only ensure `utils/` exists.

- [ ] **Step 2: Create `utils/` directory**

```bash
touch mobile/mobile/utils/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add mobile/mobile/utils/.gitkeep
git commit -m "chore(mobile): add utils/ directory to match web app structure"
```

---

## Task 11: Verify the project starts

- [ ] **Step 1: Run expo-doctor to catch config issues**

```bash
cd mobile/mobile
npx expo-doctor
```

Expected: all checks pass or only advisory warnings (no errors blocking startup).

- [ ] **Step 2: Start the dev server**

```bash
npx expo start
```

Expected: Metro bundler starts, QR code displayed, no red error output in terminal.

- [ ] **Step 3: Verify on device or simulator**

Open the app in Expo Go or a simulator. Expected behaviour:
- Unauthenticated state: Login placeholder screen is shown ("Login Screen" centered text)
- No tab bar visible on the Login screen
- If you manually sign in via Supabase (or temporarily remove the `!isLoggedIn` redirect), the tab bar shows Map and Profile tabs with their placeholder text

- [ ] **Step 4: Final commit (if any uncommitted changes remain)**

```bash
git status
# commit any remaining changes
```
