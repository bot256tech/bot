# 📱 AGRICHAIN 360 — APK BUILD COMPLETE

## ✅ APK Details

| Property | Value |
|----------|-------|
| **File** | `public/app/agrichain360.apk` |
| **Size** | 2.4 MB |
| **Package** | `com.agrichain360.app` |
| **Version** | 1.0.0 (versionCode: 1) |
| **Min SDK** | Android 7.0 (API 24) |
| **Target SDK** | Android 14 (API 34) |
| **Signed** | ✅ RSA 2048-bit, valid until 2053 |
| **Aligned** | ✅ zipalign 4-byte |
| **Files** | 388 resources |

## 📱 App Features

- ✅ **Splash Screen** — 2-second animated splash with AGRICHAIN 360 branding
- ✅ **WebView** — Full platform (agrichain360.onrender.com) in native wrapper
- ✅ **Offline Detection** — Shows friendly offline screen when no internet
- ✅ **Back Navigation** — Native back button navigates within the app
- ✅ **Exit Confirmation** — Asks before closing the app
- ✅ **File Downloads** — Handles file downloads (documents, images)
- ✅ **Geolocation** — Location access for nearby agents
- ✅ **Camera Permission** — QR code scanning support
- ✅ **Status Bar** — Branded deep green (#1B5E20) status bar
- ✅ **App Icon** — AGRICHAIN 360 icon at all densities (hdpi-xxxhdpi)
- ✅ **Custom User Agent** — `AGRICHAIN360-Android/1.0` for analytics
- ✅ **Cookie Support** — Full session/cookie persistence
- ✅ **JavaScript** — Full JS support for all platform features

## 🌐 Download URLs (After Deploy)

| URL | Purpose |
|-----|---------|
| `https://agrichain360.onrender.com/app/agrichain360.apk` | Direct APK download |
| `https://agrichain360.onrender.com/download-app` | Download page with QR code |
| `https://agrichain360.onrender.com/download-app.html` | Same page (alternate URL) |

## 🚀 Deploy to GitHub

```bash
cd agrichain360-live
git remote add origin https://github.com/bot256tech/bot.git
git push -u origin main
```

Render will auto-deploy in 2-3 minutes.

## 📋 Git Commits Ready to Push

```
63a1f00 feat: Build and deploy working APK (2.4MB) + download page + proper headers
6914847 feat: Add Android native project + build scripts + APK documentation
```

## 🔐 Release Keystore

- **Location**: `mobile/agrichain360-release.keystore`
- **Alias**: `agrichain360`
- **Password**: `agrichain360` (change for production!)
- **Valid Until**: December 2053
- **Use for**: All future APK updates

## 🔄 Rebuild Command

```bash
# To rebuild the APK in the future:
cd agrichain360-apk
export JAVA_HOME=/home/user/jdk17
export ANDROID_HOME=/home/user/android-sdk
./gradlew assembleRelease

# Sign and align:
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore agrichain360-release.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk agrichain360
zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk \
  ../agrichain360-live/public/app/agrichain360.apk
```
