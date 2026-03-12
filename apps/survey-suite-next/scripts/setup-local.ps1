param(
  [switch]$SkipNpmInstall = $false
)

$ErrorActionPreference = 'Stop'

Write-Host '== Survey Suite Next: Local setup ==' -ForegroundColor Cyan

if (-not (Test-Path '.env.local')) {
  Copy-Item '.env.example' '.env.local'
  Write-Host 'Created .env.local from .env.example' -ForegroundColor Green
} else {
  Write-Host '.env.local already exists' -ForegroundColor Yellow
}

Write-Host 'Starting Docker services (Postgres + MinIO)...' -ForegroundColor Cyan
docker compose up -d

if (-not $SkipNpmInstall) {
  Write-Host 'Installing npm dependencies...' -ForegroundColor Cyan
  npm install
}

Write-Host 'Generating Prisma client...' -ForegroundColor Cyan
npm run db:generate

Write-Host 'Pushing schema to database...' -ForegroundColor Cyan
npm run db:push

Write-Host 'Setup complete. Run: npm run dev' -ForegroundColor Green
