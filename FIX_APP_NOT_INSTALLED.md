# Fix: "App not installed" Error

## Problem
APK install करते समय "App not installed" error आ रहा है।

## Common Causes & Solutions

---

## Solution 1: Previous Version Uninstall करें

अगर पहले से same app installed है (different signature के साथ):

### Steps:
1. Phone में **Settings** → **Apps** खोलें
2. App name search करें: "Exam-frontend" या "examfrontend"
3. अगर मिले तो **Uninstall** करें
4. फिर नया APK install करें

**या ADB से:**
```bash
adb uninstall com.yottascore.examfrontend
```

फिर install करें:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Solution 2: Unknown Sources Allow करें

### Android 8.0+ (Oreo):
1. **Settings** → **Apps & notifications** → **Special app access**
2. **Install unknown apps** select करें
3. File Manager app select करें (जिससे install कर रहे हैं)
4. **Allow from this source** enable करें

### Older Android:
1. **Settings** → **Security**
2. **Unknown sources** enable करें

---

## Solution 3: Storage Space Check करें

1. **Settings** → **Storage** check करें
2. कम से कम 100MB free space होना चाहिए
3. अगर space कम है तो files delete करें

---

## Solution 4: APK File Corrupt Check करें

APK file properly download/transfer हुई है या नहीं check करें:

### File Size Check:
```bash
# Windows PowerShell में
(Get-Item "android\app\build\outputs\apk\debug\app-debug.apk").Length
```

File size reasonable होनी चाहिए (कम से कम 10-20 MB)।

### Rebuild करें:
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## Solution 5: ADB से Install करें (More Reliable)

ADB से install करना ज्यादा reliable है:

### Step 1: USB Debugging Enable करें
1. Phone में **Settings** → **About phone**
2. **Build number** को 7 बार tap करें
3. **Settings** → **Developer options**
4. **USB debugging** enable करें

### Step 2: Phone Connect करें
1. USB cable से computer से connect करें
2. Phone पर **"Allow USB debugging"** prompt accept करें

### Step 3: Install करें
```bash
# Check device connected
adb devices

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**अगर "device unauthorized" error आए:**
- Phone पर prompt accept करें
- फिर try करें

---

## Solution 6: Package Name Conflict

अगर different package name के साथ app पहले से installed है:

### Check Installed Apps:
```bash
adb shell pm list packages | grep yotta
adb shell pm list packages | grep exam
```

### Uninstall All Related:
```bash
adb uninstall com.yottascore.examfrontend
adb uninstall com.anonymous.Examfrontend
```

फिर install करें।

---

## Solution 7: Different Signature Issue

अगर पहले से app installed है different keystore से signed:

### Force Uninstall:
```bash
adb uninstall -k com.yottascore.examfrontend
```

**-k flag:** Data keep करता है, सिर्फ app uninstall करता है।

---

## Solution 8: Android Version Compatibility

### Check Minimum SDK:
`android/app/build.gradle` में:
```gradle
minSdkVersion 24  // Android 7.0+
```

अगर phone Android 7.0 से पुराना है, तो app install नहीं होगी।

### Check Phone Android Version:
1. **Settings** → **About phone** → **Android version**

---

## Solution 9: Rebuild और Reinstall

Complete clean build करें:

```bash
# Project root से
cd android

# Clean everything
./gradlew clean
rm -rf app/build
rm -rf .gradle

# Rebuild
./gradlew assembleDebug

# Install
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## Solution 10: Use Release APK Instead

Debug APK में कभी-कभी issues होते हैं। Release APK try करें:

```bash
cd android
./gradlew assembleRelease
```

**Install करें:**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Note:** Release APK signed होगी (keystore से), इसलिए properly install होगी।

---

## Quick Troubleshooting Checklist

- [ ] Previous version uninstall किया
- [ ] Unknown sources allow किया
- [ ] Storage space sufficient है
- [ ] APK file size reasonable है
- [ ] USB debugging enabled है
- [ ] ADB device connected है
- [ ] Package name conflict नहीं है
- [ ] Android version compatible है

---

## Most Common Solution

**90% cases में यह काम करता है:**

1. **Previous app uninstall करें:**
   ```bash
   adb uninstall com.yottascore.examfrontend
   ```

2. **Clean rebuild करें:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

3. **ADB से install करें:**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## Alternative: Use Expo Command

अगर direct APK install में problem हो, Expo command use करें:

```bash
# Project root से
npx expo run:android
```

यह automatically:
- Build करेगा
- Install करेगा
- App launch करेगा

---

## Still Not Working?

अगर अभी भी problem है:

1. **Error message का screenshot लें**
2. **ADB log check करें:**
   ```bash
   adb logcat | grep -i "package"
   ```
3. **Phone model और Android version share करें**

---

**Try करें और बताएं कौन सा solution काम किया!** 🔧

