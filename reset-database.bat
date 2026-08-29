@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo PERINGATAN: container dan volume database MCSP akan dihapus permanen.
set /p CONFIRM=Ketik HAPUS MCSP untuk melanjutkan: 

if /I not "%CONFIRM%"=="HAPUS MCSP" (
    echo Dibatalkan.
    pause
    exit /b 1
)

docker compose down -v --remove-orphans
if errorlevel 1 (
    echo Gagal menghapus container atau volume Docker MCSP.
    pause
    exit /b 1
)

echo.
echo Container dan database MCSP berhasil dihapus.
echo Data seed tidak dibuat ulang.
pause