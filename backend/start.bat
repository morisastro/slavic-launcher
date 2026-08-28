@echo off
REM Start the Slavic Launcher backend (PocketBase).
REM First run: run "backend\setup.bat" to apply migrations + create admin.
REM Usage: start.bat

cd /d "%~dp0"
pocketbase.exe serve --http=127.0.0.1:8090
