@echo off
echo =========================================
echo MedAssist First Aid Application
echo =========================================
echo.
echo Installing dependencies (this may take a few minutes)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing dependencies. Please ensure Node.js is installed properly.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Starting MedAssist application...
echo The application will open in your default browser automatically.
echo If it doesn't open, please visit http://localhost:5000 manually.
echo.
echo Press Ctrl+C to stop the application when finished.
echo =========================================
start http://localhost:5000
npm run dev
