#!/bin/bash
# ============================================================
# AGRICHAIN 360™ — Build Android APK (Automated)
# ============================================================
# Usage: bash build-release.sh
# Requirements: Node.js 18+, JDK 17, Android SDK
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🌾 AGRICHAIN 360™ — APK Build Script${NC}"
echo ""

# ---- Check Dependencies ----
echo "📋 Checking dependencies..."

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Install from https://nodejs.org/${NC}"
    exit 1
fi
echo "  ✅ Node.js $(node --version)"

# Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java not found. Install JDK 17 from https://adoptium.net/${NC}"
    exit 1
fi
JAVA_VER=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}' | cut -d. -f1)
if [ "$JAVA_VER" -lt 17 ]; then
    echo -e "${YELLOW}⚠️  Java version $(java -version 2>&1 | head -1) detected. JDK 17+ required.${NC}"
    echo "  Install JDK 17: sudo apt install openjdk-17-jdk (Linux)"
    echo "  Or: brew install openjdk@17 (macOS)"
    exit 1
fi
echo "  ✅ Java $(java -version 2>&1 | head -1)"

# Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    # Try common locations
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    elif [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
    elif [ -d "/opt/android-sdk" ]; then
        export ANDROID_HOME="/opt/android-sdk"
    else
        echo -e "${RED}❌ ANDROID_HOME not set. Install Android Studio or set ANDROID_HOME.${NC}"
        echo "  export ANDROID_HOME=\$HOME/Android/Sdk"
        exit 1
    fi
fi
export ANDROID_SDK_ROOT="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
echo "  ✅ Android SDK: $ANDROID_HOME"

echo ""

# ---- Get Script Directory ----
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# ---- Install Dependencies ----
echo "📦 Installing npm dependencies..."
npm install --silent 2>/dev/null
echo "  ✅ Dependencies installed"
echo ""

# ---- Generate Android Project (if not exists) ----
if [ ! -d "android" ]; then
    echo "🔧 Generating native Android project..."
    npx expo prebuild --platform android --clean
    echo "  ✅ Android project generated"
    echo ""
fi

# ---- Set Gradle Properties ----
echo "⚙️  Configuring build settings..."
cat > android/gradle.properties << 'GRADLE'
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.caching=true
android.useAndroidX=true
android.enableJetifier=true
newArchEnabled=false
hermesEnabled=true
GRADLE

# ---- Build APK ----
echo "🔨 Building release APK..."
echo "  (First build may take 15-30 minutes. Subsequent builds are faster.)"
echo ""

cd android
chmod +x gradlew

./gradlew assembleRelease 2>&1

echo ""

# ---- Check Output ----
APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo ""
    echo "📦 APK Location: android/$APK_PATH"
    echo "📦 APK Size: $APK_SIZE"
    echo ""

    # Copy to public/app/
    mkdir -p ../public/app
    cp "$APK_PATH" ../public/app/agrichain360.apk
    echo "📋 Copied to: public/app/agrichain360.apk"
    echo ""
    echo "📲 Install on device:"
    echo "   adb install android/$APK_PATH"
    echo ""
    echo "🌐 Download URL (after deploy):"
    echo "   https://agrichain360.onrender.com/app/agrichain360.apk"
else
    echo -e "${RED}❌ Build failed. Check the output above for errors.${NC}"
    exit 1
fi
