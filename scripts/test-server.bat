@echo off
echo Testing FCC Server connectivity on port 8082...
curl -s http://127.0.0.1:8082/health
echo.
