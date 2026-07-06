$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

if (-not (Test-Path ".env.production")) {
    throw ".env.production was not found. Copy .env.production.example to .env.production first."
}

if (-not (Test-Path "dist/main.js")) {
    throw "dist/main.js was not found. Run deploy\\windows\\prepare-backend.ps1 first."
}

. "$PSScriptRoot\load-env.ps1"
Import-EnvFile ".env.production"
$env:NODE_ENV = "production"

Write-Host "Starting backend on http://$($env:HOST):$($env:PORT) ..."
node dist/main.js
