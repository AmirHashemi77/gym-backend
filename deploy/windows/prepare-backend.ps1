$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

if (-not (Test-Path ".env.production")) {
    throw ".env.production was not found. Copy .env.production.example to .env.production first."
}

Write-Host "Installing dependencies including build-time tools..."
npm ci --include=dev
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Generating Prisma client..."
node --env-file=.env.production .\node_modules\prisma\build\index.js generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Applying database migrations..."
node --env-file=.env.production .\node_modules\prisma\build\index.js migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Building application..."
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Backend is prepared for production."
