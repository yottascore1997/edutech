# 📱 Play Store पर App Publish करने का Complete Guide

## Step 1: EAS CLI Install करें

```bash
npm install -g eas-cli
```

## Step 2: Expo Account ब Creature/login करें

```bash
eas login
```

या नया account बनाएं:
```bash
eas register
```

## Step 3: EAS Project Configure करें

```bash
eas build:configure
```

## Step 4: App.json में Important Settings

**Package Name Change करें** (अपना unique package name):
```json
"package": "com.yourcompany.Examfrontend"
```

**Version Code हमेशा बढ़ाएं** हर build के लिए:
```json
"versionCode": 1  // हर build में इसे बढ़ाएं
```

## Step 5: Production Build बनाएं (AAB format)

```bash
eas build --platform android --profile production
```

यह command:
- ✅ AAB (Android App Bundle) file बनाएगा
- ✅ Play Store के लिए optimized होगा
- ✅ Cloud पर build होगा (आपको local Android setup की जरूरत नहीं)

## Step 6: Build Status Check करें

```bash
eas build:list
```

## Step 7: AAB File Download करें

Build complete होने पर:
1. Expo dashboard (https://expo.dev) पर जाएं
2. अपना project select करें
3. Builds section में जाएं
4. Production buildF का AAB file download करें

## Step 8: Google Play Console Setup

### A. Google Play Console खोलें
- https://play.google.com/console पर जाएं
- $25 one-time registration fee pay करें

### B. New App Create करें
1. "Create app" button click करें
2. App name, default language, app/ game select करें
3. Developer program policies accept करें

### C. App Store Listing Fill करें
- App name
- Short description (80 characters)
- Full description (4000 characters)
- Screenshots (minimum 2, recommended: phone, tablet)
- Feature graphic (1024 x 500)
- App icon (512 x 512)
- Privacy policy URL (जरूरी है)

## Step 9: App Release करें

### Internal Testing (पहले यह करें)
1. "Testing" → "Internal testing" → "Create new release"
2. AAB file upload करें
3. Release notes add करें
4. "Save" → "Review release" → "Start rollout to Internal testing"

### Production Release
1. "Production" → "Create new release"
2. AAB file upload करें
3. "What's new in this version?" section fill करें
4. "Review release" → "Start rollout to Production"

## Step 10: Content Rating

1. "Content rating" section में जाएं
2. Questionnaire fill करें
3. Submit करें

## Step 11: Store Listing Complete करें

- App access (Free/Paid)
- Ads (Yes/No)
- Target audience
- News apps (if applicable)
- COVID-19 contact tracing (if applicable)

## Step 12: Pricing & Distribution

- Countries where app will be available
- Pricing (if paid app)

## Step 13: Submit for Review

सभी sections complete होने पर:
1. "Review" button पर click करें
2. App automatically submit हो जाएगा
3. Google review करेगा (1-7 days typically)

## Important Commands Summary

```bash
# Login
eas login

# Configure
eas build:configure

# Production build
eas build --platform android --profile production

# Build status
eas build:list

# Update app.json version
# version: "1.0.0" और versionCode: 1 बढ़—

# Auto submit to Play Store (optional)
eas submit --platform android
```

## Common Issues & Solutions

### 1. Package Name Already Exists
- Solution: `app.json` में unique package name use करें

### 2. Version Code Error
- Solution: हर बार versionCode बढ़ाएं

### 3. Keystore Issues
- Solution: EAS automatically handle करता है

### 4. Build Failed
- Solution: `eas build:list` से logs check करें

## Future Updates के लिए

हर update के लिए:
1. `app.json` में `version` और `versionCode` बढ़ाएं
2. `eas build --platform android --profile production` run करें
3. नया AAB Play Console में upload करें

## Required Assets (Images)

- App Icon: 512x512 PNG (transparent background)
- Feature Graphic: 1024x500 PNG
- Screenshots: 
  - Phone: 16:9 या 9:16 ratio
  - Tablet: 16:9 या 9:16 ratio
- Adaptive Icon: 1024x1024 PNG (foreground + background)

---

اشت ✨ Good Luck! App successfully publish होने के बाद notification मिलेगी।

