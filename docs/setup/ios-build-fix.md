# iOS Build Fix: RCT-Folly Compatibility

## Problem

iOS build fails with C++ compilation errors in RCT-Folly:

```
implicit instantiation of undefined template 'std::char_traits<unsigned char>'
```

## Root Cause

React Native has compatibility issues with Xcode 16.4 / iOS SDK 18.4. The RCT-Folly library requires a patch for the newer SDK.

## Solution Options

### Option 1: Use Android (Recommended)

Android does not have this issue:

```bash
cd client
npm run android
```

Use Android for development while iOS is being fixed.

### Option 2: Podfile Patch

Add the RCT-Folly fix to `client/ios/Podfile`. If a `post_install` block already exists, add the RCT-Folly block inside it. Otherwise add:

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if target.name == 'RCT-Folly'
      target.build_configurations.each do |config|
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_NO_CONFIG=1'
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
    end
  end
end
```

Then:

```bash
cd client/ios
pod install
cd ..
npm run ios
```

### Option 3: Use Xcode 15.x

If Xcode 15.x is installed:

```bash
sudo xcode-select --switch /Applications/Xcode-15.4.app
```

Then rebuild.

### Option 4: Update React Native

Upgrade to a version with better Xcode 16.4 support:

```bash
cd client
npm install react-native@0.76.9
npx expo prebuild --clean
npm run ios
```

## Alternative: Expo Go

Use Expo Go to run the app on a physical iOS device without building:

```bash
cd client
npx expo start --go
```

Scan the QR code with the Camera app. No native build required.
