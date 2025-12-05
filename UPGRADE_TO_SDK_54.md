# Expo SDK 51 se 54.0.0 Upgrade Guide

## Steps to Upgrade

### Step 1: Install Latest Expo CLI (if needed)
```bash
npm install -g expo-cli@latest
```

### Step 2: Update Expo Package
```bash
npm install expo@~54.0.0
```

### Step 3: Fix All Expo Dependencies (Most Important!)
```bash
npx expo install --fix
```

Yeh command automatically sabhi Expo packages ko SDK 54 compatible versions me update kar degi.

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Clear Cache and Restart
```bash
npx expo start --clear
```

---

## What Gets Updated

`expo install --fix` automatically update karega:
- All `expo-*` packages
- React Native version (if needed)
- React version (if needed)
- Other compatible dependencies

---

## Verify Upgrade

1. **Check package.json:**
   - `expo` should be `~54.0.0`

2. **Check app.json:**
   - SDK version automatically update ho jayega

3. **Start Expo:**
   ```bash
   npm start
   ```
   - Ab SDK 54.0.0 compatible hoga

---

## Common Issues After Upgrade

### Issue 1: Type Errors
```bash
npm install --save-dev @types/react@~18.2.0
```

### Issue 2: Metro Bundler Errors
```bash
npx expo start --clear
```

### Issue 3: Native Module Errors
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

---

## Rollback (If Needed)

Agar koi issue aaye, to rollback karein:

```bash
npm install expo@~51.0.0
npx expo install --fix
```

---

**Note:** SDK 54 me kuch breaking changes ho sakte hain. Code review karein aur test karein.

