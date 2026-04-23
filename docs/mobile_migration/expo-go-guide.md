# Running the App in Expo Go

Expo Go is the fastest way to preview the mobile app without building a native binary. It is best suited for iterating on UI, navigation, auth, and non-map features.

> **Map provider note:** When running in Expo Go, the map screen uses Apple Maps (iOS) or the default Google Maps tile layer (Android) instead of the Google Maps SDK. This is expected — `PROVIDER_GOOGLE` requires a native dev/EAS build. For full Google Maps fidelity, use the EAS simulator build described in [expo-ios-build-guide.md](./expo-ios-build-guide.md).

---

## 1. Install Expo Go

**iOS (physical device)**
1. Open the App Store on your iPhone.
2. Search for **Expo Go** and install it (publisher: Expo Project).

**iOS Simulator**
Expo Go is not available in the Simulator App Store. Use the direct install command:

```bash
# Download and install Expo Go into the currently booted iOS Simulator
npx expo install-expo-go
```

Or install manually:
1. Download the latest Expo Go `.app` from [expo.dev/go](https://expo.dev/go) → select your SDK version (SDK 54) → iOS Simulator.
2. Extract the `.tar.gz` and install:

```bash
tar -xzf ~/Downloads/Exponent-*.tar.gz -C ~/Downloads/
xcrun simctl install booted ~/Downloads/Exponent.app
```

**Android (physical device)**
1. Open the Play Store.
2. Search for **Expo Go** and install it.

**Android Emulator**
The Play Store is available on most emulator images. Search for **Expo Go** and install it, or sideload the APK from [expo.dev/go](https://expo.dev/go).

---

## 2. Start the Expo development server

All commands run from the `mobile/` subdirectory:

```bash
cd mobile
npx expo start
```

You will see a QR code and a menu in the terminal.

**Important:** Do not run `npx expo start` from the repo root — the mobile project lives in `mobile/` and has its own `package.json`.

---

## 3. Open the app in Expo Go

**Physical device (iOS or Android)**
1. Make sure your phone and dev machine are on the **same Wi-Fi network**.
2. On iOS: open the **Camera** app and point it at the QR code in the terminal — tap the Expo Go banner.
3. On Android: open **Expo Go** → tap **Scan QR code** → point at the terminal QR code.

**iOS Simulator**
Press `i` in the terminal (or `Shift+I` to pick a specific simulator). Expo Go must already be installed in the simulator (see Step 1).

**Android Emulator**
Press `a` in the terminal. The emulator must have Expo Go installed.

---

## 4. Live reloading

After the first load, any change you save to a `.tsx` / `.ts` file triggers an automatic hot reload — no QR re-scan needed.

To force a full JS bundle reload: shake the device (or press `Cmd+D` in the iOS Simulator) → tap **Reload**.

---

## 5. Environment variables

Expo Go reads variables prefixed with `EXPO_PUBLIC_` from `mobile/.env`. Copy the example and fill in your keys before starting the server:

```bash
cp mobile/.env.example mobile/.env
# Then edit mobile/.env and set:
# EXPO_PUBLIC_SUPABASE_URL=...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=...
# EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...  (used by EAS builds; ignored in Expo Go)
```

The Google Maps API key is not used in Expo Go (default map provider requires no key), but it must be present to avoid a runtime warning.

---

## 6. Limitations vs. the EAS dev build

| Feature | Expo Go | EAS simulator / device build |
|---|---|---|
| Auth, Supabase | ✅ | ✅ |
| Navigation, all screens | ✅ | ✅ |
| Map (default provider) | ✅ Apple Maps / default | ✅ Google Maps |
| Map (Google provider) | ❌ native module missing | ✅ |
| expo-location | ✅ | ✅ |
| Custom native modules | ❌ | ✅ |

Use Expo Go for fast iteration on auth, screens, and non-map UI. Switch to the EAS build (see [expo-ios-build-guide.md](./expo-ios-build-guide.md)) when you need to test Google Maps tile rendering, custom markers, or any other native-module feature.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| QR code scan opens browser instead of Expo Go | Ensure Expo Go is installed; on iOS use the Camera app, not a third-party QR scanner |
| `Network response timed out` | Phone and laptop must be on the same Wi-Fi; disable VPN |
| Map screen is blank / grey in Expo Go | Expected if `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is missing; verify `.env` has the key set to any non-empty value |
| `Unable to resolve "expo-constants"` | Run `npm install expo-constants` inside `mobile/` |
| Simulator shows "Expo Go not installed" | Run `npx expo install-expo-go` or manually install per Step 1 |
