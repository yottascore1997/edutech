#!/bin/bash
# Bash Script to Test AAB File
# Usage: ./test-aab.sh

echo "🧪 Testing AAB File..."

# Check if bundletool exists
if [ ! -f "bundletool.jar" ]; then
    echo ""
    echo "❌ bundletool.jar not found!"
    echo "📥 Download from: https://github.com/google/bundletool/releases"
    echo ""
    echo "Or download directly:"
    echo "   wget https://github.com/google/bundletool/releases/download/1.15.6/bundletool-all-1.15.6.jar -O bundletool.jar"
    exit 1
fi

# Check if AAB exists
AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
if [ ! -f "$AAB_PATH" ]; then
    echo ""
    echo "❌ AAB file not found at $AAB_PATH"
    echo "Please build the AAB first: cd android && ./gradlew bundleRelease"
    exit 1
fi

# Check Java
if ! command -v java &> /dev/null; then
    echo ""
    echo "❌ Java not found! Please install Java JDK."
    exit 1
else
    echo ""
    echo "✅ Java found"
fi

# Generate APKs
echo ""
echo "📦 Generating APK from AAB..."
echo "This may take a minute..."

java -jar bundletool.jar build-apks --bundle="$AAB_PATH" --output=app-release.apks --mode=universal

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK generated successfully!"
    echo ""
    echo "📱 Next steps:"
    echo "   1. Extract APK:"
    echo "      unzip app-release.apks -d extracted-apk"
    echo ""
    echo "   2. Install on device:"
    echo "      adb install extracted-apk/universal.apk"
    echo ""
    echo "   OR manually:"
    echo "      - Copy extracted-apk/universal.apk to your phone"
    echo "      - Open file manager and install"
else
    echo ""
    echo "❌ Failed to generate APK"
    echo "Check the error message above"
fi

