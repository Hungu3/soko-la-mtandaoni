@echo off
title Soko la Mtandaoni - Usakinishaji
cd /d "%~dp0"

echo ================================================
echo   Soko la Mtandaoni - Kuanzisha Mfumo
echo ================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

pause
