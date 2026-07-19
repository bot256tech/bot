# 📱 Building AGRICHAIN 360 APK

## Prerequisites

Before building the APK, you need:

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Java Development Kit (JDK) 17** - [Download](https://adoptium.net/)
3. **Android Studio** OR **Android SDK Command-line Tools**
   - [Android Studio](https://developer.android.com/studio) (easier, includes everything)
   - OR [Command-line Tools](https://developer.android.com/studio#command-line-tools-only) (lightweight)

## Quick Build (Recommended)

### Option 1: Using EAS Build (Cloud - No Setup Required)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK (cloud build, no local Android SDK needed)
eas build --platform android --profile preview

# Download the APK from the provided URL
```

### Option 2: Local Build (Requires Android SDK)

```bash
# 1. Install dependencies
npm install

# 2. Generate native Android project (already done in this repo)
npx expo prebuild --platform android

# 3. Set environment variables
export JAVA_HOME=/path/to/jdk17
export ANDROID_HOME=/path/to/android-sdk

# 4. Build APK
cd android
./gradlew assembleRelease

# 5. Find the APK
# Location: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

## Detailed Instructions

### Step 1: Install Java JDK 17

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

**macOS:**
```bash
brew install openjdk@17
```

**Windows:**
Download from [Adoptium](https://adoptium.net/temurin/releases/?version=17)

Verify:
```bash
java -version
# Should show: openjdk version "17.x.x"
```

### Step 2: Install Android SDK

**Easiest: Install Android Studio**
1. Download from https://developer.android.com/studio
2. Open Android Studio → More Actions → SDK Manager
3. Install:
   - Android 14 (API 34)
   - Android SDK Build-Tools 34.0.0
   - Android SDK Platform-Tools

**Alternative: Command-line Tools Only**
```bash
# Download from https://developer.android.com/studio#command-line-tools-only
# Extract to ~/android-sdk/cmdline-tools/latest

# Set environment variables
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Accept licenses
sdkmanager --licenses

# Install components
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
```

### Step 3: Build the APK

```bash
cd /path/to/agrichain360-live/mobile

# Install dependencies (if not already done)
npm install

# Set environment variables (adjust paths)
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64  # Linux
# export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home  # macOS
export ANDROID_HOME=~/Android/Sdk  # Linux
# export ANDROID_HOME=~/Library/Android/sdk  # macOS

# Build release APK
cd android
./gradlew assembleRelease

# The APK will be at:
# android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Step 4: Sign the APK (Required for Installation)

```bash
# Generate a keystore (do this once)
keytool -genkey -v -keystore agrichain360-release-key.keystore \
  -alias agrichain360 \
  -keyalg RSA -keysize 2048 -validity 10000

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore agrichain360-release-key.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  agrichain360

# Align the APK
$ANDROID_HOME/build-tools/34.0.0/zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  app/build/outputs/apk/release/agrichain360.apk
```

### Step 5: Install on Device

```bash
# Enable USB debugging on your Android phone
# Connect via USB

# Install APK
adb install app/build/outputs/apk/release/agrichain360.apk

# Or copy the APK to your phone and install manually
```

## Troubleshooting

### Build fails with "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=/path/to/android-sdk
```

### Build fails with "Java version mismatch"
Ensure `JAVA_HOME` points to JDK 17:
```bash
echo $JAVA_HOME
java -version
```

### Out of memory during build
Edit `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

### Build is very slow
- First build downloads many dependencies (can take 10-20 minutes)
- Subsequent builds are much faster
- Use `--offline` flag after first build: `./gradlew assembleRelease --offline`

## APK Distribution

Once you have the signed APK (`agrichain360.apk`):

1. **Copy to web server:**
   ```bash
   cp app/build/outputs/apk/release/agrichain360.apk ../public/app/
   ```

2. **Users can download from:**
   ```
   https://agrichain360.onrender.com/app/agrichain360.apk
   ```

3. **Upload to Google Play Store:**
   - Create a Google Play Console account ($25 one-time fee)
   - Create new app → Upload APK
   - Fill in store listing, screenshots, etc.

## Build Scripts

### Quick Build Script (Linux/macOS)
```bash
#!/bin/bash
set -e

echo "🔨 Building AGRICHAIN 360 APK..."

# Check dependencies
command -v node >/dev/null || { echo "❌ Node.js not found"; exit 1; }
command -v java >/dev/null || { echo "❌ Java not found"; exit 1; }
[ -n "$ANDROID_HOME" ] || { echo "❌ ANDROID_HOME not set"; exit 1; }

# Install dependencies
npm install

# Build APK
cd android
./gradlew assembleRelease

echo "✅ Build complete!"
echo "📦 APK: android/app/build/outputs/apk/release/app-release-unsigned.apk"
```

### One-Command Build
```bash
cd mobile && npm install && cd android && ./gradlew assembleRelease
```

## Next Steps

After building the APK:
1. ✅ Test on physical Android device
2. ✅ Upload to `public/app/agrichain360.apk` for download
3. ⏳ Submit to Google Play Store
4. ⏳ Build iOS version: `eas build --platform ios`

## Support

- Expo Documentation: https://docs.expo.dev/
- React Native: https://reactnative.dev/
- Android Studio: https://developer.android.com/studio

---

**Build Time:** ~15-30 minutes (first build), ~5 minutes (subsequent builds)  
**APK Size:** ~50-80 MB  
**Min Android Version:** Android 7.0 (API 24)
