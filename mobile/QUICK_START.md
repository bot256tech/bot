# 🚀 AGRICHAIN 360 — APK Build Quick Start

## Fastest Method: EAS Build (Cloud - Recommended)

**Time: 5 minutes setup + 20 minutes build**

### Step 1: Create Expo Account
Go to https://expo.dev/signup and create a free account.

### Step 2: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 3: Login
```bash
eas login
```

### Step 4: Initialize EAS Project
```bash
cd mobile
eas init
```
This will create an `eas.json` and link your project to Expo.

### Step 5: Build APK
```bash
eas build --platform android --profile preview
```

**What happens:**
- Your code is uploaded to Expo's cloud build servers
- They build the APK with all native dependencies
- You get a download URL when complete (~20 minutes)

### Step 6: Download APK
```bash
# The build output will show a URL like:
# https://expo.dev/artifacts/eas/xxxxx.apk

# Download it
curl -L "BUILD_URL_HERE" -o agrichain360.apk

# Copy to public/app/
mkdir -p ../public/app
mv agrichain360.apk ../public/app/
```

### Step 7: Deploy
```bash
cd ..
git add -A
git commit -m "Add APK for download"
git push
```

**Your APK is now downloadable at:**
```
https://agrichain360.onrender.com/app/agrichain360.apk
```

---

## Alternative: Local Build (Advanced)

**Time: 30-60 minutes setup + 15-30 minutes build**  
**Requirements: 8GB+ RAM, 20GB disk space**

### Prerequisites

#### Install Java JDK 17
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# macOS
brew install openjdk@17

# Verify
java -version
```

#### Install Android Studio
1. Download from https://developer.android.com/studio
2. Install and open Android Studio
3. Go to **More Actions → SDK Manager**
4. Install:
   - ✅ Android 14 (API 34)
   - ✅ Android SDK Build-Tools 34
   - ✅ Android SDK Platform-Tools

#### Set Environment Variables
```bash
# Add to ~/.bashrc or ~/.zshrc
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64  # Linux
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home  # macOS
export ANDROID_HOME=$HOME/Android/Sdk  # Linux
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Reload
source ~/.bashrc
```

### Build the APK

```bash
cd mobile

# Install dependencies
npm install

# Run the automated build script
./build-release.sh

# Or manually:
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Sign the APK (Required for Installation)

```bash
# Generate keystore (one time)
keytool -genkey -v -keystore agrichain360.keystore \
  -alias agrichain360 -keyalg RSA -keysize 2048 -validity 10000

# Sign
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore agrichain360.keystore \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  agrichain360

# Align
$ANDROID_HOME/build-tools/34.0.0/zipalign -v 4 \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  android/app/build/outputs/apk/release/agrichain360.apk

# Copy to public
cp android/app/build/outputs/apk/release/agrichain360.apk public/app/
```

---

## Troubleshooting

### "SDK location not found"
```bash
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

### "Java version mismatch"
```bash
# Check JAVA_HOME
echo $JAVA_HOME
ls -la $JAVA_HOME

# Update if needed
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### "Out of memory"
```bash
# Edit android/gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### "Build takes forever"
- First build: 20-40 minutes (downloads dependencies)
- Subsequent builds: 5-10 minutes (cached)
- Use `--offline` flag after first build

---

## Test the APK

### Install on Physical Device
```bash
# Enable USB debugging on phone
# Connect via USB
adb install public/app/agrichain360.apk
```

### Install via QR Code
1. Upload APK to web server
2. Generate QR code pointing to APK URL
3. Scan with phone → Download → Install

---

## Next Steps After Build

1. ✅ **Test on device** - Install and verify all features work
2. ✅ **Upload to server** - Copy to `public/app/agrichain360.apk`
3. ⏳ **Google Play Store** - Submit for review ($25 one-time fee)
4. ⏳ **iOS Build** - `eas build --platform ios` (requires Mac)
5. ⏳ **Beta Testing** - Use Firebase App Distribution or TestFlight

---

## Support Resources

- **Expo Docs**: https://docs.expo.dev/build/setup/
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **React Native**: https://reactnative.dev/docs/signed-apk-android
- **Android Signing**: https://developer.android.com/studio/publish/app-signing

---

## Quick Reference Commands

```bash
# Cloud build (easiest)
eas build --platform android --profile preview

# Local build
cd mobile && ./build-release.sh

# Install on device
adb install public/app/agrichain360.apk

# Clean and rebuild
cd mobile/android && ./gradlew clean && ./gradlew assembleRelease

# Check APK info
aapt dump badging public/app/agrichain360.apk
```

---

**Status:** ✅ Project ready to build  
**Last Updated:** July 17, 2026  
**Build Method:** EAS Cloud Build (recommended) or Local Gradle Build
