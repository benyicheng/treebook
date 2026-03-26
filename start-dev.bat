@echo off
echo Starting frontend and backend services...

:: Start backend in a new window
start "Backend Server" cmd /k "cd /d %~dp0\api && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 2 /nobreak >nul

:: Start frontend in a new window
start "Frontend Server" cmd /k "cd /d %~dp0 && npm run dev"

echo Services started! Close this window to stop them.
pause
