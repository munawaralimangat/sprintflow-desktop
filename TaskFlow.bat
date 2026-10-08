@echo off
title SprintFlow Desktop
cd /d "%~dp0"

:: Launch local Electron binary instantly
if exist "node_modules\electron\dist\electron.exe" (
  start "" "node_modules\electron\dist\electron.exe" .
) else (
  start "" npx electron .
)

exit
