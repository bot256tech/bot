#!/bin/bash
# AGRICHAIN 360 - Build Android APK
# This script builds the Android APK for local distribution

echo "🔨 Building AGRICHAIN 360 Android APK..."
echo ""

# Check if eas is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Build APK for internal distribution (no Play Store needed)
echo "📦 Building APK for local distribution..."
eas build --platform android --profile preview --non-interactive

echo ""
echo "✅ Build complete!"
echo ""
echo "📥 To download the APK:"
echo "1. Go to the Expo build URL shown above"
echo "2. Download the APK file"
echo "3. Copy it to: public/app/agrichain360.apk"
echo ""
echo "The APK will be available for download at:"
echo "https://agrichain360.onrender.com/app/agrichain360.apk"
