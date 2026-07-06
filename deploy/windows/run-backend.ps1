$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

if (-not (Test-Path ".env.production")) {
    throw ".env.production was not found. Copy .env.production.example to .env.production first."
}

. "$PSScriptRoot\load-env.ps1"
Import-EnvFile ".env.production"
$env:NODE_ENV = "production"

$entryFile = if (Test-Path "dist/main.js") { "dist/main.js" } elseif (Test-Path "dist/src/main.js") { "dist/src/main.js" } else { $null }

if (-not $entryFile) {
    throw "No built entry file was found. Run deploy\\windows\\prepare-backend.ps1 first."
}

Write-Host "Starting backend on http://$($env:HOST):$($env:PORT) ..."
node $entryFile
