# Setup Script untuk MCSP Login System
Write-Host "=== Setup MCSP KPK Login System ===" -ForegroundColor Cyan

# Cek dan baca .env
$envFile = ".\.env"
if (!(Test-Path $envFile)) {
    Write-Host "ERROR: File .env tidak ditemukan!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/4] Membaca konfigurasi dari .env..." -ForegroundColor Yellow
$envContent = Get-Content $envFile
$databaseUrl = ($envContent | Select-String "DATABASE_URL" | ForEach-Object { $_.ToString().Split("=")[1].Trim('"') })
$authSecret = ($envContent | Select-String "AUTH_SECRET" | ForEach-Object { $_.ToString().Split("=")[1].Trim('"') })
$adminEmail = ($envContent | Select-String "DEFAULT_ADMIN_EMAIL" | ForEach-Object { $_.ToString().Split("=")[1].Trim('"') })
$adminPass = ($envContent | Select-String "DEFAULT_ADMIN_PASSWORD" | ForEach-Object { $_.ToString().Split("=")[1].Trim('"') })

Write-Host "  ✓ DATABASE_URL: $databaseUrl" -ForegroundColor Green
Write-Host "  ✓ AUTH_SECRET: configured" -ForegroundColor Green
Write-Host "  ✓ ADMIN_EMAIL: $adminEmail" -ForegroundColor Green

Write-Host "`n[2/4] Install dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install gagal!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

Write-Host "`n[3/4] Setup database schema..." -ForegroundColor Yellow
npx prisma db push --skip-generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Prisma db push gagal!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Database schema created" -ForegroundColor Green

Write-Host "`n[4/4] Seed database dengan data default..." -ForegroundColor Yellow
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Database seed gagal!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Database seeded" -ForegroundColor Green

Write-Host "`n=== Setup Selesai ===" -ForegroundColor Cyan
Write-Host "`nCredential untuk login:" -ForegroundColor Green
Write-Host "  Email   : $adminEmail" -ForegroundColor White
Write-Host "  Password: $adminPass" -ForegroundColor White
Write-Host "`nJalankan: npm run dev" -ForegroundColor Yellow
