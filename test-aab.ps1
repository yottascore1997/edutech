# PowerShell Script to Test AAB File
# Usage: .\test-aab.ps1

Write-Host "🧪 Testing AAB File..." -ForegroundColor Cyan

# Check if bundletool exists
if (-not (Test-Path "bundletool.jar")) {
    Write-Host "`n❌ bundletool.jar not found!" -ForegroundColor Red
    Write-Host "📥 Download from: https://github.com/google/bundletool/releases" -ForegroundColor Yellow
    Write-Host "`nOr download directly:" -ForegroundColor Yellow
    Write-Host "   Invoke-WebRequest -Uri 'https://github.com/google/bundletool/releases/download/1.15.6/bundletool-all-1.15.6.jar' -OutFile 'bundletool.jar'" -ForegroundColor Cyan
    exit 1
}

# Check if AAB exists
$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
if (-not (Test-Path $aabPath)) {
    Write-Host "`n❌ AAB file not found at $aabPath" -ForegroundColor Red
    Write-Host "Please build the AAB first: cd android && .\gradlew bundleRelease" -ForegroundColor Yellow
    exit 1
}

# Check Java
try {
    $javaVersion = java -version 2>&1
    Write-Host "`n✅ Java found" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Java not found! Please install Java JDK." -ForegroundColor Red
    exit 1
}

# Generate APKs
Write-Host "`n📦 Generating APK from AAB..." -ForegroundColor Yellow
Write-Host "This may take a minute..." -ForegroundColor Gray

java -jar bundletool.jar build-apks --bundle=$aabPath --output=app-release.apks --mode=universal

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ APK generated successfully!" -ForegroundColor Green
    Write-Host "`n📱 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Extract APK:" -ForegroundColor White
    Write-Host "      Rename-Item -Path 'app-release.apks' -NewName 'app-release.zip'" -ForegroundColor Gray
    Write-Host "      Expand-Archive -Path 'app-release.zip' -DestinationPath 'extracted-apk'" -ForegroundColor Gray
    Write-Host "`n   2. Install on device:" -ForegroundColor White
    Write-Host "      adb install extracted-apk\universal.apk" -ForegroundColor Gray
    Write-Host "`n   OR manually:" -ForegroundColor Yellow
    Write-Host "      - Copy extracted-apk\universal.apk to your phone" -ForegroundColor White
    Write-Host "      - Open file manager and install" -ForegroundColor White
} else {
    Write-Host "`n❌ Failed to generate APK" -ForegroundColor Red
    Write-Host "Check the error message above" -ForegroundColor Yellow
}

