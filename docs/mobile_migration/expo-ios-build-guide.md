# Expo iOS Build Guide

How to build and run the mobile app on the iOS Simulator using EAS (Expo Application Services).

## Prerequisites

- Node.js installed
- Xcode installed (required for the iOS Simulator)
- An Expo account — sign up at [expo.dev](https://expo.dev)
- `mobile/.env` file populated (copy from `mobile/.env.example` and fill in all keys)

---

## First-time setup

### 1. Install the EAS CLI

If you don't have it globally installed (or get a permissions error), use `npx` to run it without installing:

```bash
# No install needed — npx downloads it on demand
npx eas-cli --version
```

### 2. Log in to Expo

If you signed up with Google (no password), use SSO:

```bash
npx eas-cli login --sso
```

This opens a browser to authenticate. Standard email/password login:

```bash
npx eas-cli login
```

### 3. Configure EAS for this project (one-time)

```bash
cd mobile
npx eas-cli build:configure
```

Select **iOS** (or both platforms). This links the project to your Expo account and updates `eas.json`.

---

## Building for the iOS Simulator

> **Why a special profile?** The default `development` profile targets physical devices and requires an Apple Developer account ($99/year). The `simulator` profile builds a `.app` that runs on the Xcode Simulator for free.

```bash
cd mobile
npx eas-cli build --profile simulator --platform ios
```

The build runs on Expo's cloud servers — no Xcode build required locally. It takes a few minutes. When complete, EAS prints a download URL and you can also find it at **expo.dev → your project → Builds**.

> **Note:** The Google Maps API key and other env vars from `mobile/.env` are baked into the binary at build time. If you change any env vars, you must rebuild.

---

## Installing and launching on the simulator

### 1. Start the iOS Simulator

```bash
open -a Simulator
```

In the Simulator menu bar: **File → Open Simulator** → pick a device (e.g. iPhone 16). Wait for it to fully boot to the home screen.

### 2. Download the build

From the EAS build page, download the `.tar.gz` artifact. Extract it:

```bash
tar -xzf ~/Downloads/application-<id>.tar.gz -C ~/Downloads/
```

This produces a `mobile.app` folder.

### 3. Install on the booted simulator

```bash
xcrun simctl install booted ~/Downloads/mobile.app
```

### 4. Launch the app

```bash
xcrun simctl launch booted com.foodly.mobile
```

---

## Verifying the map screen

After launch:

1. A location permission prompt appears — tap **Allow While Using App**.
2. The map centers on your simulated location with a blue dot.
3. To test the **deny** flow: go to **Simulator → Features → Location → None**, reinstall, and relaunch. A yellow banner should appear and the map should fall back to the default center (Vancouver, BC).

To change the simulated location: **Simulator → Features → Location → Custom Location…**

---

## Rebuilding

You need to rebuild (repeat the `eas build` command) whenever you:

- Change native dependencies in `package.json`
- Add or modify Expo plugins in `app.json`
- Change environment variables in `mobile/.env`

For JS-only changes (editing `.tsx`/`.ts` files), a rebuild is **not** needed if you are using a development client with a live reload server (`npx expo start`). However, since `react-native-maps` requires native modules, you must always use the EAS-built binary — not Expo Go.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `No devices are booted` | Open Simulator and wait for a device to fully boot |
| `No podspec found for react-native-google-maps` | Ensure `react-native-maps` plugin is in `app.json` plugins array |
| Blank map / gray screen | Check that `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `mobile/.env` and rebuild |
| `EACCES` on `npm install -g` | Use `npx eas-cli` instead of a global install |
| `command not found: eas` | Use `npx eas-cli` instead |
