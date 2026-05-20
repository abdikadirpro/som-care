@echo off
echo Starting Som Care Pharmacy ERP...
echo.
echo [1/2] Starting Backend API (port 5000)...
start "Som Care Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 2 /nobreak >nul
echo [2/2] Starting Frontend (port 5173)...
start "Som Care Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Both servers starting!
echo Backend: http://localhost:5000/api/health
echo Frontend: http://localhost:5173
echo.
pause
