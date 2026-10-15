@echo off
chcp 65001 >nul
echo ========================================================
echo        DANG TIEN HANH DAY CODE LEN GITHUB
echo   Repo: https://github.com/dangbinhduongwork-ai/Toolkit
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Kiem tra va khoi tao Git neu chua co
if not exist ".git" (
    echo [*] Dang khoi tao Git repository...
    git init -b main
    if errorlevel 1 (
        echo [!] Loi khi git init. Thu khoi tao mac dinh...
        git init
        git branch -M main
    )
) else (
    echo [*] Git repository da ton tai.
)

:: 2. Cau hinh Remote Origin
echo [*] Dang cau hinh Remote Origin...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin https://github.com/dangbinhduongwork-ai/Toolkit.git
    echo [+] Da them remote origin: https://github.com/dangbinhduongwork-ai/Toolkit.git
) else (
    git remote set-url origin https://github.com/dangbinhduongwork-ai/Toolkit.git
    echo [*] Da cap nhat remote origin: https://github.com/dangbinhduongwork-ai/Toolkit.git
)

:: 3. Them tat ca file vao Staging
echo [*] Dang them cac file (git add .)...
git add .

:: 4. Commit
set /p commit_msg="Nhap commit message (Enter de dung mac dinh: 'Update Toolkit'): "
if "%commit_msg%"=="" set commit_msg=Update Toolkit

echo [*] Dang commit: "%commit_msg%"...
git commit -m "%commit_msg%"

:: 5. Chuyen sang nhanh main
git branch -M main

:: 6. Day len GitHub
echo [*] Dang push len GitHub (main)...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================================
    echo [CANH BAO] Push that bai! Co the tren GitHub da co san file (README/License).
    echo Ban co muon pull rebase roi push lai khong? (Y/N)
    echo ========================================================
    set /p retry="Nhap lua chon (Y/N): "
    if /i "%retry%"=="Y" (
        echo [*] Dang pull --rebase tu origin main...
        git pull origin main --rebase
        echo [*] Dang thu push lai...
        git push -u origin main
    )
)

echo.
echo ========================================================
echo Hoan tat!
echo ========================================================
pause
