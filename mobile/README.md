# AGRICHAIN 360 Mobile App

## Quick Start

### Run Locally (Development)
```bash
npm install
npx expo start
```
Scan the QR code with Expo Go app on your phone.

### Build APK for Local Distribution

#### Option 1: Using EAS Build (Recommended)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
Download the APK from the Expo build URL and copy to `public/app/agrichain360.apk`

#### Option 2: Using Expo Build (Legacy)
```bash
npm install -g expo-cli
expo build:android -t apk
```

#### Option 3: Using the build script
```bash
chmod +x build-apk.sh
./build-apk.sh
```

## App Structure

```
mobile/
├── App.js                    # Entry point
├── app.json                  # Expo configuration
├── eas.json                  # EAS Build configuration
├── build-apk.sh              # Build script
└── src/
    ├── navigation/
    │   └── TabNavigator.js   # Navigation (Splash → Login → Tabs)
    ├── screens/
    │   ├── SplashScreen.js   # Animated splash screen
    │   ├── LoginScreen.js    # Login/Signup with role selection
    │   ├── HomeScreen.js     # Home dashboard
    │   ├── MarketplaceScreen.js
    │   ├── ProductDetailScreen.js
    │   ├── PassportScreen.js
    │   ├── AIAdvisorScreen.js
    │   ├── ScannerScreen.js
    │   └── ProfileScreen.js
    ├── services/
    │   └── api.js            # API client
    └── utils/
        └── constants.js      # Colors, sizes, shadows
```

## Download Page

Once the APK is built and placed in `public/app/agrichain360.apk`, users can download it from:
- Website: https://agrichain360.onrender.com/download-app.html
- Direct link: https://agrichain360.onrender.com/app/agrichain360.apk

## Distribution

### Before Play Store
1. Build APK using EAS Build
2. Copy APK to `public/app/agrichain360.apk`
3. Users download from website
4. Enable "Install from unknown sources" on Android

### After Play Store Access
1. Build AAB: `eas build --platform android --profile production`
2. Upload to Google Play Console
3. Update download page to link to Play Store

## Current Status
- ✅ React Native app built (9 screens)
- ✅ Splash → Login → Main flow
- ✅ API integration ready
- ⏳ APK build pending (requires Expo account)
- ⏳ Play Store listing pending
