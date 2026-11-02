@echo off
REM Simple script to install dependencies and start the Lumen Hollow dev server

REM Change to the project directory (in case script is executed from elsewhere)
cd /d "%~dp0"

REM Install any missing node modules
if not exist node_modules (
    echo Installing npm dependencies...
    npm install
) else (
    echo npm dependencies already installed.
)

REM Start the Vite dev server
echo Starting the game server...
npm run dev
