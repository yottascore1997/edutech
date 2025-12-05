# PowerShell script to start Expo with LAN mode
# This forces Expo to use your network IP instead of localhost

Write-Host "🌐 Starting Expo with LAN mode..." -ForegroundColor Cyan
Write-Host "📍 Your IP: 192.168.1.7" -ForegroundColor Yellow

# Set environment variable for PowerShell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.7"

# Start Expo with LAN mode
npx expo start --lan --clear



