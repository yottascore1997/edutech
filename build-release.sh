#!/bin/bash
# Bash Script for Building Release AAB (Linux/Mac)
# Usage: ./build-release.sh

echo "🚀 Starting Release Build Process..."

# Step 1: Check if we're in the right directory
if [ ! -d "android" ]; then
    echo "❌ Error: android folder not found. Please run this script from project root."
    exit 1
fi

# Step 2: Check if keystore exists
KEYSTORE_PATH="android/app/examfrontend-release.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "⚠️  Warning: Keystore file not found at $KEYSTORE_PATH"
    echo "   Make sure keystore file exists before building."
fi

# Step 3: Clean previous builds
echo ""
echo "📦 Cleaning previous builds..."
cd android
./gradlew clean
if [ $? -ne 0 ]; then
    echo "❌ Clean failed!"
    cd ..
    exit 1
fi

# Step 4: Build Release AAB
echo ""
echo "🔨 Building Release AAB..."
./gradlew bundleRelease
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    cd ..
    exit 1
fi

cd ..

# Step 5: Check if AAB file was created
AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
if [ -f "$AAB_PATH" ]; then
    FILE_SIZE=$(du -h "$AAB_PATH" | cut -f1)
    
    echo ""
    echo "✅ Build Successful!"
    echo "📦 AAB File Location: $AAB_PATH"
    echo "📊 File Size: $FILE_SIZE"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Upload this AAB file to Google Play Console"
    echo "   2. Go to: https://play.google.com/console"
    echo "   3. Create new release and upload the AAB file"
else
    echo "❌ AAB file not found at expected location!"
    exit 1
fi

