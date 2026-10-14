@echo off
title CHEATZ ADMIN CLAUDE AI - Cyberpunk Control Center
echo ==============================================================
echo   Starting CHEATZ ADMIN CLAUDE AI
echo   Multi-Provider LLM Router & Free Claude Code Control Center
echo ==============================================================

rem Check if fcc-server.exe is running
tasklist /FI "IMAGENAME eq fcc-server.exe" 2>NUL | find /I /N "fcc-server.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Free Claude Code Server is already running on port 8082.
) else (
    echo [STARTING] Launching Free Claude Code Server in background...
    start "" /B "C:\Users\NIN\.local\bin\fcc-server.exe"
    timeout /t 2 /nobreak >nul
)

cd /d "%~dp0cheatz-admin-claude-ai"
if exist "dist\win-unpacked\CHEATZ ADMIN CLAUDE AI.exe" (
    start "" "dist\win-unpacked\CHEATZ ADMIN CLAUDE AI.exe"
) else if exist "..\fcc-desktop-app\node_modules\electron\dist\electron.exe" (
    start "" "..\fcc-desktop-app\node_modules\electron\dist\electron.exe" .
) else (
    start "" npx electron .
)
exit
