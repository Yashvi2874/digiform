@echo off
echo Setting up Industrial Design AI Platform...
echo.

echo Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install Node.js dependencies
    exit /b %errorlevel%
)

echo.
echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    exit /b 1
)

echo.
echo Installing Python dependencies (optional for CAD export)...
pip install -r python_backend/requirements.txt
if %errorlevel% neq 0 (
    echo Warning: Python dependencies installation failed
    echo The app will work without CAD export functionality
)

echo.
echo Creating output directory...
if not exist "output" mkdir output

echo.
echo Setup complete!
echo.
echo To start the application, run: npm run dev
echo.
pause
