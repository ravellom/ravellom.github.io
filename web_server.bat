@echo off
set PORT=8000
set PID_FILE=server.pid

if "%1"=="start" goto START
if "%1"=="stop" goto STOP

echo Usage:
echo   server.bat start
echo   server.bat stop
goto END

:START
if exist %PID_FILE% (
    echo Server already running.
    goto END
)

echo Starting Python web server on port %PORT%...
start /B python -m http.server %PORT% > server.log 2>&1

REM Give time to start and capture PID
for /f "tokens=2" %%a in ('tasklist ^| findstr /i "python.exe"') do (
    echo %%a > %PID_FILE%
    goto END
)

:STOP
if not exist %PID_FILE% (
    echo No running server found.
    goto END
)

set /p PID=<%PID_FILE%
echo Stopping server (PID %PID%)...
taskkill /PID %PID% /F
del %PID_FILE%

:END
echo Done.
