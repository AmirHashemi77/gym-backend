$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

if (-not (Test-Path ".env.production")) {
    throw ".env.production was not found. Copy .env.production.example to .env.production first."
}

. "$PSScriptRoot\load-env.ps1"
Import-EnvFile ".env.production"
$env:NODE_ENV = "production"

Write-Host "Syncing .env from .env.production for Prisma commands..."
Copy-Item ".env.production" ".env" -Force

Write-Host "Installing dependencies including build-time tools..."
npm ci --include=dev
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Generating Prisma client..."
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Applying database migrations..."
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Building application..."
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Backend is prepared for production."
