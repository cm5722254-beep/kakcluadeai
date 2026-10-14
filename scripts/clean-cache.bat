@echo off
echo Cleaning temporary cache files...
if exist *.tmp del /q *.tmp
if exist *.log del /q *.log
echo Cache cleared successfully.
