@echo off
title Lumen Hollow - Launcher
echo.
echo  ██╗     ██╗   ██╗███╗   ███╗███████╗███╗   ██╗
echo  ██║     ██║   ██║████╗ ████║██╔════╝████╗  ██║
echo  ██║     ██║   ██║██╔████╔██║█████╗  ██╔██╗ ██║
echo  ██║     ██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║
echo  ███████╗╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║
echo  ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝
echo  ██╗  ██╗ ██████╗ ██╗     ██╗      ██████╗ ██╗    ██╗
echo  ██║  ██║██╔═══██╗██║     ██║     ██╔═══██╗██║    ██║
echo  ███████║██║   ██║██║     ██║     ██║   ██║██║ █╗ ██║
echo  ██╔══██║██║   ██║██║     ██║     ██║   ██║██║███╗██║
echo  ██║  ██║╚██████╔╝███████╗███████╗╚██████╔╝╚███╔███╔╝
echo  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝ ╚═════╝  ╚══╝╚══╝
echo.
echo  Starting game server...
echo.

:: Change to the game directory
cd /d "%~dp0"

:: Check if node_modules exists, install if not
if not exist "node_modules" (
    echo  [!] First run detected - installing dependencies...
    echo      This only happens once, please wait...
    echo.
    call npm install
    echo.
)

:: Start Vite in background and open browser after a short delay
echo  [*] Launching Lumen Hollow at http://localhost:5173
echo  [*] Press Ctrl+C in this window to stop the server.
echo.

:: Open browser after 2 seconds (runs in parallel)
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

:: Start the dev server (keeps this window open)
npx vite --port 5173 --host

pause
