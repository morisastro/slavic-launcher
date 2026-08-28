@echo off
REM One-time backend setup for Slavic Launcher.
REM 1) Creates a superuser (admin) account.
REM 2) Starts PocketBase.
REM 3) Runs seed.js to create the launcher collections via the Admin API.

cd /d "%~dp0"

set PB_ADMIN_EMAIL=admin@slavic.local
set PB_ADMIN_PASSWORD=changeme123
set PB_URL=http://127.0.0.1:8090

echo.
echo === Slavic Launcher backend setup ===
echo.
echo Creating superuser (%PB_ADMIN_EMAIL% / %PB_ADMIN_PASSWORD%)...
pocketbase.exe superuser upsert %PB_ADMIN_EMAIL% %PB_ADMIN_PASSWORD%
if errorlevel 1 (
  echo Failed to create superuser.
  pause
  exit /b 1
)

echo.
echo Starting PocketBase on %PB_URL% ...
echo (Admin UI: %PB_URL%/_/  -- login with the credentials above)
echo.
start "" "%PB_URL%/_/"

REM Run PocketBase in the background, seed, then keep it running.
start "PocketBase" /min pocketbase.exe serve --http=127.0.0.1:8090

echo Waiting for server to come up...
timeout /t 3 /nobreak >nul

echo Seeding collections...
PB_ADMIN_EMAIL=%PB_ADMIN_EMAIL% PB_ADMIN_PASSWORD=%PB_ADMIN_PASSWORD% PB_URL=%PB_URL% node seed.js
if errorlevel 1 (
  echo Seeding failed. Make sure PocketBase is running and node is installed.
  pause
  exit /b 1
)

echo.
echo Backend is running at %PB_URL%
echo Admin UI:        %PB_URL%/_/  (login: %PB_ADMIN_EMAIL% / %PB_ADMIN_PASSWORD%)
echo.
echo Press Ctrl+C in the PocketBase window to stop it later.
pause
