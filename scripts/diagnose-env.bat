@echo off
echo Generating environment diagnostics report...
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
node -v
git --version
echo Report completed.
