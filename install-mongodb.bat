@echo off
cd /d "%~dp0"
echo ====================================================
echo Launching MongoDB Server Installer...
echo.
echo IMPORTANT TIPS DURING SETUP:
echo 1. Choose "Complete" setup type.
echo 2. Keep "Run service as Network Service user" selected.
echo 3. Keep "Install MongoDB as a Service" checked.
echo ====================================================
start "" "%~dp0MongoDB_9.0.2_Machine_X64_wix_en-US.msi"
