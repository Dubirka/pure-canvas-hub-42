@echo off
echo ==========================================
echo Pushing to Lovable repository...
echo ==========================================
git push lovable main --force
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo [SUCCESS] Successfully pushed to Lovable!
    echo ==========================================
) else (
    echo.
    echo ==========================================
    echo [ERROR] Push failed. Please check your GitHub credentials.
    echo ==========================================
)
pause
