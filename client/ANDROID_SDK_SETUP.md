# Android SDK Manager – what to install

This project (Expo SDK 54) targets **Android 14 (API 34)**. In Android Studio, open **SDK Manager** (e.g. **Settings / Preferences → Appearance & Behavior → System Settings → Android SDK**) and install the following.

## Required

| Tab / section | Component | Notes |
|---------------|-----------|--------|
| **SDK Platforms** | **Android 14.0 ("UpsideDownCake") – API Level 34** | Project `compileSdk` / `targetSdk` |
| **SDK Tools** | **Android SDK Build-Tools 34** | e.g. 34.0.0 or latest 34.x |
| **SDK Tools** | **Android SDK Command-line Tools (latest)** | Needed for `adb`, etc. |

## Optional but useful

| Tab / section | Component |
|---------------|-----------|
| **SDK Tools** | **Android Emulator** |
| **SDK Tools** | **Android SDK Platform-Tools** | Often installed with command-line tools |

## After installing

1. Set in your shell config (e.g. `~/.zshrc`):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
2. Restart the terminal or run `source ~/.zshrc`.
3. From repo root: `./dev.sh` (server + ngrok).
4. In another terminal: `cd client && npx expo run:android`.
