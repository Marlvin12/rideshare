# Quick Start Guide

Consolidated setup guide for the rideshare app. Complete these steps before running the app.

## Prerequisites

- **Node.js** v20 or higher
- **MongoDB** (local or Atlas)
- **Expo CLI** (`npm install -g expo-cli` or use `npx expo`)
- **Google Maps API key** (Cloud Console)
- **Firebase project** (for auth; optional for basic testing)

## Environment Setup

### Server (.env)

Copy `server/.env.example` to `server/.env` and set values:

```env
MONGO_URI=mongodb://localhost:27017/ride_app
ACCESS_TOKEN_SECRET=your-access-token-secret-min-32-chars
ACCESS_TOKEN_EXPIRY=4d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
REFRESH_TOKEN_EXPIRY=30d
PORT=3000
```

For MongoDB Atlas, use a connection string like:
`mongodb+srv://user:password@cluster.example.com/ride_app?retryWrites=true&w=majority`

### Client Config

Create `client/.env` from `client/.env.example`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
```

For real device testing, replace `localhost` with your machine's local IP (see Real Device Testing below).

## Installation

### Server

```bash
cd server
npm install
```

### Client

```bash
cd client
npm install --legacy-peer-deps
```

## Google Maps API Configuration

Replace the placeholder key in these 5 files:

| File | Location |
|------|----------|
| `client/app.json` | `expo.ios.config.googleMapsApiKey` |
| `client/app.json` | `expo.android.config.googleMaps.apiKey` |
| `client/ios/RideApp/Info.plist` | `GMSApiKey` |
| `client/ios/RideApp/AppDelegate.mm` | (if present; some setups use Swift instead) |
| `client/android/app/src/main/AndroidManifest.xml` | `com.google.android.geo.API_KEY` meta-data |

If using `client/configure-maps.sh`:

```bash
cd client
./configure-maps.sh YOUR_GOOGLE_MAPS_API_KEY
```

**Google Cloud Console setup:**
1. Create a project at https://console.cloud.google.com/
2. Enable: Maps SDK for iOS, Maps SDK for Android, Directions API, Geocoding API
3. Create credentials > API Key

## Starting the App

### Terminal 1: Server

```bash
cd server
npm start
```

Expected: `HTTP server is running on port http://localhost:3000`

### Terminal 2: Client

**iOS (simulator):**
```bash
cd client
npx expo prebuild
npm run ios
```

**Android (emulator):**
```bash
cd client
npx expo prebuild
npm run android
```

**Expo Go (no native build):**
```bash
cd client
npx expo start --go
```

Then scan the QR code with Expo Go on your device. Phone and computer must be on the same WiFi.

## Real Device Testing

1. Find your local IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `client/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
   EXPO_PUBLIC_WS_URL=ws://YOUR_LOCAL_IP:3000
   ```

3. For Expo Go, restart the dev server. For native builds, run `npx expo prebuild --clean` then rebuild.

**Android emulator:** Use `10.0.2.2` instead of `localhost` to reach the host machine.

## Troubleshooting

### Server won't start
- Ensure MongoDB is running (see `docs/setup/mongodb-setup.md`)
- Check port 3000: `lsof -i :3000`
- Verify `server/.env` exists and `MONGO_URI` is correct

### Client build errors
- Run `npx expo prebuild` before iOS/Android
- Clear cache: `npx expo start -c`
- Reinstall: `rm -rf node_modules && npm install --legacy-peer-deps`

### Maps not showing
- Verify API key in all 5 files
- Enable Maps SDK for iOS/Android in Google Cloud Console
- Ensure billing is enabled on the project

### WebSocket connection failed
- Confirm server is running
- For real devices, use local IP in client config
- Check firewall allows port 3000

### iOS build fails (Xcode 16.4)
- See `docs/setup/ios-build-fix.md` for RCT-Folly compatibility fix
