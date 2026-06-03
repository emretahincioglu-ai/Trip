@echo off
title West Coast Run -- Publish
cd /d "%~dp0"
echo.
echo ================================
echo   WEST COAST RUN -- PUBLISH
echo ================================
echo.
echo Folder: %CD%
echo.

REM check git
where git >nul 2>&1
if errorlevel 1 (
  echo [X] Git not found on this PC.
  echo     Open GitHub Desktop once to install it, then retry.
  goto END
)

REM check repo
if not exist ".git\" (
  echo [X] This folder is not a git repo yet.
  echo     Make sure publish.bat is sitting INSIDE the cloned folder
  echo     ^(the one GitHub Desktop made^).
  goto END
)

echo Changed files:
echo --------------------------------
git status --short
echo --------------------------------
echo.

REM count changes
set CHANGES=0
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
if "%CHANGES%"=="0" (
  echo Nothing to publish -- repo is already up to date.
  goto END
)

REM commit message
set "MSG="
set /p MSG=Commit message ^(Enter for 'update app'^): 
if "%MSG%"=="" set "MSG=update app"

echo.
echo Committing...
git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo [X] Commit failed.
  goto END
)

echo.
echo Pushing to GitHub...
git push
if errorlevel 1 (
  echo.
  echo [X] Push failed.
  echo     Open GitHub Desktop once, sign in, then retry.
  goto END
)

echo.
echo ================================
echo   DONE. Pages redeploys in ~1 minute.
echo ================================

:END
echo.
echo Press any key to close...
pause >nul
