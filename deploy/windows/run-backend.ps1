$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

if (-not (Test-Path ".env.production")) {
    throw ".env.production was not found. Copy .env.production.example to .env.production first."
}

if (-not (Test-Path "dist/main.js")) {
    throw "dist/main.js was not found. Run deploy\\windows\\prepare-backend.ps1 first."
}

$env:NODE_ENV = "production"

Write-Host "Starting backend on http://127.0.0.1:3000 ..."
node dist/main.js
