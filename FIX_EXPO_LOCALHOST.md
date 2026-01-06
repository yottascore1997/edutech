# Fix: Expo showing 127.0.0.1 instead of Network IP

## Problem
Expo Metro bundler `127.0.0.1:8081` dikha raha hai, jo phone se connect nahi hoga.

## Quick Solutions

### ✅ Solution 1: ADB Port Forwarding (Best for Android!)

**Agar phone USB se connected hai, ADB port forwarding use karein:**

1. **Phone ko USB se connect karein** (USB Debugging enabled hona chahiye)

2. **ADB port forward karein:**
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```

3. **Expo server start karein** (127.0.0.1 par bhi chalega):
   ```bash
   npm start
   ```

4. **Expo Go me QR code scan karein** - ab kaam karega kyunki port forward ho gaya hai

**Verify:**
```bash
# Check device connected
adb devices

# Port forward
adb reverse tcp:8081 tcp:8081
```

**Note:** Ye solution sirf USB connected devices ke liye hai. WiFi se connected devices ke liye Solution 2 try karein.

---

### Solution 2: Restart with LAN flag

1. **Current server stop karein:** `Ctrl+C`

2. **LAN mode me restart karein:**
   ```bash
   npx expo start --lan --clear
   ```

3. Ab network IP dikhna chahiye (jaise `192.168.1.3:8081`)

---

### Solution 3: Use PowerShell Script

```powershell
.\start-lan.ps1
```

Ya manually:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.3"
npx expo start --lan --clear
```

---

### Solution 4: Windows Firewall Check

Agar phir bhi issue ho:

1. **Windows Security** → **Firewall & network protection**
2. **Advanced settings**
3. **Inbound Rules** → **New Rule**
4. **Port** → **TCP** → **8081** → **Allow connection**
5. **Node.js** ko bhi allow karein

---

### Solution 5: Check Network Isolation

Agar router me "AP Isolation" ya "Client Isolation" enabled hai:

1. Router admin panel me login karein
2. Wireless settings me "AP Isolation" disable karein
3. Phir try karein

---

### Solution 6: Expo Go App me Connection Tab

**Expo Go app me manually URL enter karne ka tareeka:**

1. **Expo Go** app open karein
2. Bottom me **"Connection"** tab me jao
3. Ya **"Settings"** → **"Connection"**
4. **"Enter URL"** ya **"Manual Connection"** option dhundho
5. Ye URL enter karein: `exp://192.168.1.3:8081`

**Agar option nahi dikhe**, to:
- Expo Go app ko **update** karein (Play Store se)
- Ya **"Scan QR Code"** me manually type karein

---

## Verify Network IP

Check karein ki network IP sahi hai:

```bash
ipconfig | findstr /i "IPv4"
```

Aapka IP `192.168.1.3` hona chahiye.

---

## Important Notes

1. **Same Network:** Phone aur computer same WiFi par hain?
2. **QR Code:** Kabhi-kabhi QR code me network IP hota hai, chahe terminal me 127.0.0.1 dikhe
3. **Manual URL:** Expo Go me manually URL enter karna sabse reliable hai

---

## Most Reliable Fix

**Expo Go me manually URL enter karein:**
```
exp://192.168.1.3:8081
```

Yeh hamesha kaam karta hai! ✅

---

## If Still Not Working

1. **Check same network:** Phone aur computer same WiFi par hain?
2. **Try tunnel mode:**
   ```bash
   npm run start:tunnel
   ```
   (Note: Tunnel mode slow ho sakta hai, lekin hamesha kaam karta hai)

3. **Check Expo Go app:** Phone me Expo Go app installed hai?

4. **Update Expo:**
   ```bash
   npm install -g expo-cli@latest
   npx expo install --fix
   ```
