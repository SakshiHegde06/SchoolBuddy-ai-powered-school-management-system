@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
set "PATH=%JAVA_HOME%\bin;C:\projects\tools\maven-mvnd-2.0.0-rc-3-windows-amd64\mvn\bin;%PATH%"
cd /d "%~dp0backend"
echo ====================================================
echo Starting SchoolBuddy Spring Boot Backend...
echo Java: OpenJDK 17
echo Database: mongodb://localhost:27017/schoolbuddy
echo Endpoint: http://localhost:8080
echo ====================================================
call mvn spring-boot:run
pause
