@echo off
echo Backing up project workspace configurations...
if not exist backups mkdir backups
xcopy /s /y /q *.bat backups\
echo Backup complete.
