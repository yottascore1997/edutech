# Fix expo-firebase-core build.gradle for Gradle 8+ compatibility
Write-Host "🔧 Fixing expo-firebase-core build.gradle for Gradle 8+ compatibility..." -ForegroundColor Green

$buildGradlePath = "node_modules\expo-firebase-core\android\build.gradle"

if (Test-Path $buildGradlePath) {
    Write-Host "📁 Found expo-firebase-core build.gradle at: $buildGradlePath" -ForegroundColor Yellow
    
    # Read the file content
    $content = Get-Content $buildGradlePath -Raw
    
    # Replace classifier with archiveClassifier.set()
    $oldPattern = "classifier = 'sources'"
    $newPattern = "archiveClassifier.set('sources')"
    
    if ($content -match $oldPattern) {
        $content = $content -replace [regex]::Escape($oldPattern), $newPattern
        Set-Content $buildGradlePath $content -NoNewline
        Write-Host "✅ Successfully fixed classifier issue in expo-firebase-core build.gradle" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Pattern not found. The file might already be fixed or have different content." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ expo-firebase-core build.gradle not found. The package might not be installed." -ForegroundColor Red
}

Write-Host "🧹 Cleaning Android build files..." -ForegroundColor Green

# Clean Android build
if (Test-Path "android\gradlew.bat") {
    Set-Location android
    .\gradlew.bat clean
    Set-Location ..
    Write-Host "✅ Android build cleaned successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Android gradlew.bat not found" -ForegroundColor Yellow
}

Write-Host "🎉 Fix completed! You can now run: npx expo run:android" -ForegroundColor Green


