@echo off
if exist "%~dp0fcc-desktop-app\dist\win-unpacked\Claude Code Studio IDE.exe" (
  start "" "%~dp0fcc-desktop-app\dist\win-unpacked\Claude Code Studio IDE.exe"
) else if exist "%~dp0fcc-desktop-app\dist\Claude Code Studio IDE 1.0.0.exe" (
  start "" "%~dp0fcc-desktop-app\dist\Claude Code Studio IDE 1.0.0.exe"
) else (
  cd /d "%~dp0fcc-desktop-app"
  start "" npx electron .
)
