# AAB File को Test करने के तरीके

## ⚠️ Important Note
AAB (Android App Bundle) file को directly install नहीं किया जा सकता। AAB को APK में convert करना होगा या Play Store के internal testing track में upload करके test करना होगा।

---

## Method 1: AAB को APK में Convert करें (Recommended for Local Testing)

### Step 1: Bundletool Download करें

Google का `bundletool` download करें:

**Download Link:**
https://github.com/google/bundletool/releases

Latest version download करें (जैसे `bundletool-all-1.15.6.jar`)

**या Command से:**
```bash
# Windows PowerShell में
Invoke-WebRequest -Uri "https://github.com/google/bundletool/releases/download/1.15.6/bundletool-all-1.15.6.jar" -OutFile "bundletool.jar"
```

### Step 2: APK Generate करें

```bash
# Project root से
java -jar bundletool.jar build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab --output=app-release.apks --mode=universal
```

**यह command:**
- ✅ AAB file से universal APK बनाएगा
- ✅ `app-release.apks` file generate होगी
- ✅ Universal APK = सभी devices के लिए compatible

### Step 3: APK Extract करें

`.apks` file एक ZIP file है। Extract करें:

**Windows में:**
```powershell
# .apks file को .zip में rename करें
Rename-Item -Path "app-release.apks" -NewName "app-release.zip"
# Extract करें
Expand-Archive -Path "app-release.zip" -DestinationPath "extracted-apk"
```

**Linux/Mac में:**
```bash
unzip app-release.apks -d extracted-apk
```

### Step 4: APK Install करें

Extracted folder में `universal.apk` मिलेगा। इसे install करें:

**ADB से (Android device connected होना चाहिए):**
```bash
adb install extracted-apk/universal.apk
```

**या Directly:**
- APK file को phone में transfer करें
- File manager से open करें
- Install करें (Unknown sources allow करना होगा)

---

## Method 2: Play Store Internal Testing (Best for Real Testing)

यह method सबसे अच्छा है क्योंकि:
- ✅ Real Play Store environment में test होता है
- ✅ App signing verify होता है
- ✅ Production जैसा experience मिलता है

### Step 1: Google Play Console में जाएं

1. https://play.google.com/console पर login करें
2. अपना app select करें

### Step 2: Internal Testing Track Create करें

1. Left sidebar में **"Testing"** → **"Internal testing"** click करें
2. **"Create new release"** button click करें

### Step 3: AAB Upload करें

1. **"Upload"** button click करें
2. AAB file select करें: `android/app/build/outputs/bundle/release/app-release.aab`
3. Upload complete होने का wait करें

### Step 4: Release Notes Add करें

- "What's new in this version?" section में notes add करें
- Example: "Initial release" या "First test build"

### Step 5: Testers Add करें

1. **"Testers"** tab में जाएं
2. **"Create email list"** click करें
3. Testers के email addresses add करें (minimum 1)
4. List name दें (जैसे "Internal Testers")
5. **"Save changes"** click करें

### Step 6: Release करें

1. **"Review release"** button click करें
2. सभी details verify करें
3. **"Start rollout to Internal testing"** click करें

### Step 7: Test Link Share करें

1. Internal testing page पर **"Copy link"** button मिलेगा
2. यह link testers को share करें
3. Testers इस link से app install कर सकेंगे

**Link Format:**
```
https://play.google.com/apps/internaltest/[test-code]
```

---

## Method 3: Debug APK Build करें (Quick Testing)

अगर आपको जल्दी test करना है और release signing की जरूरत नहीं:

### Debug APK Build:

```bash
cd android
./gradlew assembleDebug
```

**APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Install करें:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Note:** Debug APK release APK से different होता है, लेकिन quick testing के लिए OK है।

---

## Method 4: Release APK Build करें (Signing के साथ)

अगर आप signed APK चाहते हैं (AAB convert करने के बजाय):

### Release APK Build:

```bash
cd android
./gradlew assembleRelease
```

**APK Location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

**Install करें:**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Note:** यह APK signed होगा (keystore से), लेकिन size बड़ा होगा (सभी architectures के लिए)।

---

## Quick Test Scripts

### Windows PowerShell Script:

```powershell
# test-aab.ps1
Write-Host "🧪 Testing AAB File..." -ForegroundColor Cyan

# Check if bundletool exists
if (-not (Test-Path "bundletool.jar")) {
    Write-Host "❌ bundletool.jar not found!" -ForegroundColor Red
    Write-Host "Download from: https://github.com/google/bundletool/releases" -ForegroundColor Yellow
    exit 1
}

# Check if AAB exists
$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
if (-not (Test-Path $aabPath)) {
    Write-Host "❌ AAB file not found at $aabPath" -ForegroundColor Red
    exit 1
}

# Generate APKs
Write-Host "`n📦 Generating APK from AAB..." -ForegroundColor Yellow
java -jar bundletool.jar build-apks --bundle=$aabPath --output=app-release.apks --mode=universal

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ APK generated successfully!" -ForegroundColor Green
    Write-Host "`n📱 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Rename app-release.apks to app-release.zip" -ForegroundColor White
    Write-Host "   2. Extract the zip file" -ForegroundColor White
    Write-Host "   3. Install universal.apk on your device" -ForegroundColor White
    Write-Host "`n   OR use ADB:" -ForegroundColor Yellow
    Write-Host "   adb install extracted-apk/universal.apk" -ForegroundColor White
} else {
    Write-Host "❌ Failed to generate APK" -ForegroundColor Red
}
```

### Linux/Mac Bash Script:

```bash
#!/bin/bash
# test-aab.sh

echo "🧪 Testing AAB File..."

# Check if bundletool exists
if [ ! -f "bundletool.jar" ]; then
    echo "❌ bundletool.jar not found!"
    echo "Download from: https://github.com/google/bundletool/releases"
    exit 1
fi

# Check if AAB exists
AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
if [ ! -f "$AAB_PATH" ]; then
    echo "❌ AAB file not found at $AAB_PATH"
    exit 1
fi

# Generate APKs
echo ""
echo "📦 Generating APK from AAB..."
java -jar bundletool.jar build-apks --bundle="$AAB_PATH" --output=app-release.apks --mode=universal

if [ $? -eq 0 ]; then
    echo "✅ APK generated successfully!"
    echo ""
    echo "📱 Next steps:"
    echo "   1. Extract app-release.apks: unzip app-release.apks -d extracted-apk"
    echo "   2. Install universal.apk: adb install extracted-apk/universal.apk"
else
    echo "❌ Failed to generate APK"
fi
```

---

## Testing Checklist

### Before Testing:
- [ ] AAB file size verify करें (reasonable size होनी चाहिए)
- [ ] Keystore file backup लें
- [ ] Version code और version name check करें

### During Testing:
- [ ] App install हो रहा है या नहीं
- [ ] App open हो रहा है या नहीं
- [ ] All features काम कर रहे हैं या नहीं
- [ ] No crashes
- [ ] Performance check करें
- [ ] Different devices पर test करें (अगर possible हो)

### After Testing:
- [ ] Issues note करें
- [ ] Fixes apply करें
- [ ] New build करें (version code बढ़ाकर)
- [ ] Again test करें

---

## Common Issues & Solutions

### Issue 1: "App not installed" Error
**Solution:**
- Previous version uninstall करें
- Unknown sources allow करें
- Storage space check करें

### Issue 2: "Package appears to be corrupt" Error
**Solution:**
- AAB file properly signed है या नहीं check करें
- Keystore configuration verify करें
- New build करें

### Issue 3: Bundletool Command Not Found
**Solution:**
- Java installed है या नहीं check करें: `java -version`
- Bundletool.jar file path verify करें
- Full path use करें: `java -jar C:\path\to\bundletool.jar ...`

---

## Recommended Approach

**Best Method:** Play Store Internal Testing (Method 2)

क्योंकि:
- ✅ Real production environment
- ✅ Proper signing verification
- ✅ Easy tester management
- ✅ Production जैसा experience
- ✅ No manual APK conversion needed

**Quick Testing:** Method 1 (AAB to APK conversion)

अगर आपको जल्दी local testing चाहिए।

---

**Good Luck with Testing! 🚀**

