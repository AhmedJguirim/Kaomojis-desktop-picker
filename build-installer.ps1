# build-installer.ps1
# Builds a standalone Windows installer (.exe) for Kaomoji Picker.
# Usage:  right-click > "Run with PowerShell"  -- or -- from a terminal:  .\build-installer.ps1

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

Write-Host "==> Kaomoji Picker installer build" -ForegroundColor Cyan

# 1. Check Node.js / npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm was not found. Install Node.js from https://nodejs.org and re-run this script."
}

# 2. Install dependencies (electron + electron-builder) if needed
if (-not (Test-Path (Join-Path $PSScriptRoot 'node_modules\electron-builder'))) {
    Write-Host "==> Installing dependencies (this can take a minute)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed." }
} else {
    Write-Host "==> Dependencies already present, skipping npm install." -ForegroundColor DarkGray
}

# 3. Build the installer
Write-Host "==> Packaging installer with electron-builder..." -ForegroundColor Cyan
npm run dist
if ($LASTEXITCODE -ne 0) { Write-Error "electron-builder failed." }

# 4. Report where the installer landed
$installer = Get-ChildItem -Path (Join-Path $PSScriptRoot 'dist') -Filter '*.exe' -ErrorAction SilentlyContinue |
             Where-Object { $_.Name -match 'Setup' } |
             Select-Object -First 1

if ($installer) {
    Write-Host ""
    Write-Host "Done. Installer created at:" -ForegroundColor Green
    Write-Host "    $($installer.FullName)" -ForegroundColor Green
    Write-Host "Double-click it to install Kaomoji Picker." -ForegroundColor Green
} else {
    Write-Host "Build finished, but no Setup .exe was found in .\dist - check the output above." -ForegroundColor Yellow
}
