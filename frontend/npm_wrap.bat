@echo off
set "PATH=C:\Users\Admin\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64;%PATH%"
cd /d "%~dp0"
call npm %*
