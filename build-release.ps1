# PowerShell Script for Building Release AAB (Windows)
# Usage: .\build-release.ps1

Write-Host "🚀 Starting Release Build Process..." -ForegroundColor Green

# Step 1: Check if we're in the right directory
if (-not (Test-Path "android")) {
    Write-Host "❌ Error: android folder not found. Please run this script from project root." -ForegroundColor Red
    exit 1
}

# Step 2: Check if keystore exists
$keystorePath = "android\app\examfrontend-release.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "⚠️  Warning: Keystore file not found at $keystorePath" -ForegroundColor Yellow
    Write-Host "   Make sure keystore file exists before building." -ForegroundColor Yellow
}

# Step 3: Clean previous builds
Write-Host "`n📦 Cleaning previous builds..." -ForegroundColor Cyan
Set-Location android
& .\gradlew clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Clean failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Step 4: Build Release AAB
Write-Host "`n🔨 Building Release AAB..." -ForegroundColor Cyan
& .\gradlew bundleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Step 5: Check if AAB file was created
$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    $fileInfo = Get-Item $aabPath
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    
    Write-Host "`n✅ Build Successful!" -ForegroundColor Green
    Write-Host "📦 AAB File Location: $aabPath" -ForegroundColor Cyan
    Write-Host "📊 File Size: $fileSizeMB MB" -ForegroundColor Cyan
    Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Upload this AAB file to Google Play Console" -ForegroundColor White
    Write-Host "   2. Go to: https://play.google.com/console" -ForegroundColor White
    Write-Host "   3. Create new release and upload the AAB file" -ForegroundColor White
} else {
    Write-Host "❌ AAB file not found at expected location!" -ForegroundColor Red
    exit 1
}

