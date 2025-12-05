# 📱 Google Play Store पर Deploy करें (EAS के बिना)

## Prerequisites (जरूरी चीजें)

1. ✅ Java JDK 17 या उससे ऊपर installed होना चाहिए
2. ✅ Android Studio installed होना चाहिए (SDK के लिए)
3. ✅ Google Play Console account ($25 one-time fee)
4. ✅ Keystore file (`examfrontend-release.keystore`) - पहले से मौजूद है ✅

---

## Step 1: Version Update करें

हर build से पहले version बढ़ाना जरूरी है।

### A. `app.json` में update करें:

```json
{
  "expo": {
    "version": "1.0.0",  // यह बढ़ाएं (जैसे "1.0.1")
    "android": {
      "versionCode": 1  // यह भी बढ़ाएं (जैसे 2, 3, 4...)
    }
  }
}
```

### B. `android/app/build.gradle` में update करें:

```gradle
defaultConfig {
    versionCode 1  // app.json के versionCode के साथ match करें
    versionName "1.0.0"  // app.json के version के साथ match करें
}
```

**Important:** हर नए release के लिए `versionCode` जरूर बढ़ाएं!

---

## Step 2: Keystore Configuration Verify करें

आपका keystore पहले से configure है। Verify करें:

**File:** `android/gradle.properties`
```
MYAPP_UPLOAD_STORE_FILE=examfrontend-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=examfrontend-key
MYAPP_UPLOAD_STORE_PASSWORD=Yottascore123@!
MYAPP_UPLOAD_KEY_PASSWORD=Yottascore123@!
```

**Important:** 
- Keystore file `android/app/examfrontend-release.keystore` में होना चाहिए
- Keystore password और alias को सुरक्षित रखें (कभी भी Git में commit न करें!)

---

## Step 3: Local Build तैयारी

### A. Dependencies Install करें:

```bash
npm install
```

या

```bash
npm ci
```

### B. Android Dependencies Sync करें:

```bash
cd android
./gradlew clean
cd ..
```

---

## Step 4: Release AAB Build बनाएं

### Windows PowerShell में:

```powershell
cd android
.\gradlew bundleRelease
```

### Linux/Mac में:

```bash
cd android
./gradlew bundleRelease
```

**यह command:**
- ✅ Release AAB file बनाएगा
- ✅ Keystore से automatically sign करेगा
- ✅ File location: `android/app/build/outputs/bundle/release/app-release.aab`

**Build time:** 5-15 minutes (पहली बार ज्यादा समय लग सकता है)

---

## Step 5: AAB File Verify करें

Build complete होने के बाद:

1. File check करें: `android/app/build/outputs/bundle/release/app-release.aab`
2. File size check करें (कम से कम 10-50 MB होना चाहिए)
3. File name verify करें: `app-release.aab`

---

## Step 6: Google Play Console Setup

### A. Google Play Console खोलें

1. https://play.google.com/console पर जाएं
2. Login करें (या नया account बनाएं - $25 fee)
3. "Create app" button click करें

### B. App Details Fill करें

1. **App name:** Exam-frontend (या अपना नाम)
2. **Default language:** Hindi/English
3. **App or Game:** App select करें
4. **Free or Paid:** Free/Paid select करें
5. **Developer Program Policies** accept करें

---

## Step 7: App Store Listing Complete करें

### Required Information:

1. **App name:** Exam-frontend
2. **Short description:** (80 characters max)
   - Example: "Practice exams and quizzes for competitive exams. Track your progress and improve your scores."
   
3. **Full description:** (4000 characters max)
   - Detailed app description
   - Features list
   - Benefits
   
4. **App icon:** 512x512 PNG (transparent background)
   - Location: `assets/images/icon.png`
   
5. **Feature graphic:** 1024x500 PNG
   - Promotional banner image
   
6. **Screenshots:** Minimum 2 required
   - Phone screenshots: 16:9 या 9:16 ratio
   - Tablet screenshots (optional): 16:9 या 9:16 ratio
   - Recommended: 4-8 screenshots
   
7. **Privacy Policy URL:** (जरूरी है!)
   - आपके app में privacy policy page होनी चाहिए
   - Example: `https://yourapp.com/privacy-policy`

---

## Step 8: App Release करें

### Internal Testing (पहले यह करें - Recommended)

1. Play Console में "Testing" → "Internal testing" → "Create new release"
2. **AAB file upload करें:**
   - `android/app/build/outputs/bundle/release/app-release.aab`
   - Drag & drop या "Upload" button use करें
3. **Release notes add करें:**
   - "What's new in this version?"
   - Example: "Initial release" या "Bug fixes and improvements"
4. **Save** → **Review release** → **Start rollout to Internal testing**
5. Testers add करें (email addresses)

**Internal testing में test करें:**
- App install हो रहा है या नहीं
- सभी features काम कर रहे हैं या नहीं
- Crashes या errors check करें

### Production Release

Internal testing successful होने के बाद:

1. Play Console में "Production" → "Create new release"
2. **AAB file upload करें:**
   - Same file: `app-release.aab`
   - या नया build (अगर changes किए हैं)
3. **Release notes fill करें:**
   - "What's new in this version?"
   - User-friendly language में लिखें
4. **Review release** → **Start rollout to Production**

---

## Step 9: Content Rating

1. "Content rating" section में जाएं
2. Questionnaire fill करें:
   - App category
   - Content type
   - Age restrictions
   - etc.
3. Submit करें
4. Rating certificate मिलेगा (कुछ minutes में)

---

## Step 10: Store Listing Complete करें

सभी sections fill करें:

1. **App access:**
   - Free या Paid
   
2. **Ads:**
   - Yes (अगर ads हैं)
   - No (अगर ads नहीं हैं)
   
3. **Target audience:**
   - Age group select करें
   
4. **Data safety:**
   - User data collection details
   - Privacy practices
   
5. **Pricing & Distribution:**
   - Countries where app available होगी
   - Pricing (अगर paid app है)

---

## Step 11: Submit for Review

सभी sections complete होने पर:

1. "Review" button पर click करें
2. सभी required sections check करें (green tick ✅)
3. "Send for review" button click करें
4. App automatically submit हो जाएगी

**Review time:** 1-7 days (typically 2-3 days)

---

## Step 12: App Approval के बाद

1. ✅ Email notification मिलेगी
2. ✅ Play Store पर app live हो जाएगी
3. ✅ Users download कर सकेंगे

---

## Future Updates के लिए (नए Versions)

हर update के लिए:

### 1. Version Update:
```json
// app.json
"version": "1.0.1",  // बढ़ाएं
"versionCode": 2     // बढ़ाएं
```

```gradle
// android/app/build.gradle
versionCode 2
versionName "1.0.1"
```

### 2. New Build:
```bash
cd android
./gradlew bundleRelease
```

### 3. Upload to Play Console:
- Production → Create new release
- नया AAB upload करें
- Release notes add करें
- Submit करें

---

## Important Commands Summary

```bash
# Dependencies install
npm install

# Clean build
cd android
./gradlew clean

# Release AAB build (Windows)
.\gradlew bundleRelease

# Release AAB build (Linux/Mac)
./gradlew bundleRelease

# Build location
android/app/build/outputs/bundle/release/app-release.aab

# Debug APK build (testing के लिए)
./gradlew assembleRelease
# Location: android/app/build/outputs/apk/release/app-release.apk
```

---

## Common Issues & Solutions

### 1. Build Failed - Gradle Error
**Solution:**
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### 2. Keystore Not Found
**Solution:**
- Verify keystore file path: `android/app/examfrontend-release.keystore`
- Check `gradle.properties` में correct path है

### 3. Version Code Error
**Error:** "Version code X has already been used"
**Solution:**
- `app.json` और `build.gradle` में `versionCode` बढ़ाएं
- Previous version से ज्यादा होना चाहिए

### 4. Signing Error
**Solution:**
- Verify keystore password in `gradle.properties`
- Check keystore file exists
- Verify key alias name

### 5. Build Takes Too Long
**Solution:**
- First build में time लगता है (dependencies download)
- Internet connection check करें
- Gradle daemon enable करें (default में on होता है)

### 6. AAB File Too Large
**Solution:**
- Check images optimization
- Remove unused assets
- Enable ProGuard (advanced)

---

## Security Best Practices

1. ✅ **Keystore को सुरक्षित रखें:**
   - कभी भी Git में commit न करें
   - Backup लें (secure location में)
   - Password को strong रखें

2. ✅ **gradle.properties को Git में commit न करें:**
   - `.gitignore` में add करें:
   ```
   android/gradle.properties
   ```

3. ✅ **Environment variables use करें:**
   - Production में keystore passwords environment variables से load करें

---

## Required Assets Checklist

- [ ] App Icon: 512x512 PNG
- [ ] Feature Graphic: 1024x500 PNG
- [ ] Screenshots: Minimum 2 (Phone)
- [ ] Screenshots: Tablet (Optional but recommended)
- [ ] Privacy Policy URL
- [ ] App Description (Short + Full)
- [ ] Release Notes

---

## Testing Before Release

1. ✅ Internal testing में test करें
2. ✅ Different devices पर test करें
3. ✅ All features verify करें
4. ✅ No crashes check करें
5. ✅ Performance check करें

---

## Support & Resources

- **Google Play Console:** https://play.google.com/console
- **Play Console Help:** https://support.google.com/googleplay/android-developer
- **Android Developer Docs:** https://developer.android.com

---

**Good Luck! 🚀**

अगर कोई problem आए तो build logs check करें या error message share करें।

