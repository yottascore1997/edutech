# Debug APK Install करने का Guide

## ✅ Build Successful!

आपका Debug APK successfully build हो गया है!

**APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Method 1: ADB से Install करें (Recommended)

### Step 1: Android Device Connect करें

1. Phone में **Developer Options** enable करें:
   - Settings → About phone → Build number को 7 बार tap करें
2. **USB Debugging** enable करें:
   - Settings → Developer options → USB debugging ON
3. USB cable से computer से connect करें
4. Phone पर **"Allow USB debugging"** prompt accept करें

### Step 2: ADB से Install करें

```bash
# Project root से
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**या full path:**
```bash
adb install C:\Users\Polestar\Desktop\yotta-front\android\app\build\outputs\apk\debug\app-debug.apk
```

### Step 3: Verify

- Phone पर app install हो जाएगी
- App icon दिखेगा
- Open करके test करें

---

## Method 2: Manual Install (Phone में Copy करके)

### Step 1: APK File Copy करें

1. APK file को phone में transfer करें:
   - USB cable से
   - या Email/WhatsApp से send करें
   - या Google Drive/Dropbox use करें

### Step 2: Install करें

1. Phone में **File Manager** open करें
2. APK file location पर जाएं
3. APK file tap करें
4. **"Install"** button click करें
5. **"Unknown sources"** allow करें (अगर prompt आए)
6. Installation complete होने का wait करें

### Step 3: Open App

- App icon home screen पर दिखेगा
- Tap करके open करें

---

## Method 3: Android Studio Emulator में Install करें

### Step 1: Emulator Start करें

1. Android Studio open करें
2. **AVD Manager** → Emulator start करें

### Step 2: Install करें

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

या drag & drop:
- APK file को emulator में drag करें
- Automatically install हो जाएगी

---

## Testing Checklist

App install होने के बाद:

- [ ] App install successfully हुई
- [ ] App icon दिख रहा है
- [ ] App open हो रही है
- [ ] Splash screen दिख रहा है
- [ ] Login/Registration screen दिख रहा है
- [ ] सभी main features काम कर रहे हैं
- [ ] No crashes
- [ ] Performance OK है
- [ ] UI properly display हो रहा है

---

## Debug vs Release APK

### Debug APK (Current):
- ✅ Quick testing के लिए
- ✅ Development features enabled
- ✅ Larger file size
- ✅ Not signed with release keystore
- ❌ Play Store के लिए use नहीं कर सकते

### Release APK/AAB (Play Store के लिए):
- ✅ Production ready
- ✅ Signed with release keystore
- ✅ Optimized size
- ✅ Play Store upload के लिए ready

---

## अगर Release AAB चाहिए

Play Store के लिए Release AAB build करें:

```bash
cd android
./gradlew bundleRelease
```

**AAB Location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Common Issues & Solutions

### Issue 1: "App not installed" Error

**Solution:**
- Previous version uninstall करें
- Storage space check करें
- Unknown sources allow करें

### Issue 2: ADB Command Not Found

**Solution:**
- Android SDK platform-tools install करें
- या Android Studio install करें (ADB included है)
- PATH में add करें

### Issue 3: "Device not found" (ADB)

**Solution:**
- USB debugging enable है या नहीं check करें
- USB cable properly connected है या नहीं
- `adb devices` command से device list check करें

---

## Quick Commands Summary

```bash
# Debug APK build (already done ✅)
cd android
./gradlew assembleDebug

# APK location
android/app/build/outputs/apk/debug/app-debug.apk

# Install via ADB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Check connected devices
adb devices

# Release AAB build (for Play Store)
./gradlew bundleRelease
```

---

**App install करके test करें! 🚀**

