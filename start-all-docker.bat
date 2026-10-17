@echo off
cd /d "%~dp0"
echo ====================================================
echo Starting SchoolBuddy Full Stack (Docker Compose)...
echo - MongoDB (Port 27017)
echo - AI Service (Port 8000)
echo - Spring Boot Backend (Port 8080)
echo - React Frontend (Port 80)
echo ====================================================
docker compose up --build
pause
