@echo off
REM Artist's 3D Toolkit - Windows Launcher

echo ==========================================
echo   ARTIST'S 3D TOOLKIT
echo ==========================================
echo.
echo Starting local server on port 3000...
echo.

cd dist

REM Try Python 3 first
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Server running at: http://localhost:3000
    echo.
    echo Press Ctrl+C to stop the server
    echo ==========================================
    echo.
    python -m http.server 3000
    goto :end
)

REM Try Python 2
python2 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Server running at: http://localhost:3000
    echo.
    echo Press Ctrl+C to stop the server
    echo ==========================================
    echo.
    python2 -m SimpleHTTPServer 3000
    goto :end
)

echo ERROR: Python not found!
echo.
echo Please install Python from https://www.python.org/downloads/
echo Or open dist\index.html in Chrome/Firefox/Edge
pause

:end
