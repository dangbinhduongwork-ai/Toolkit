# Script đẩy code lên GitHub Toolkit
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "        ĐANG TIẾN HÀNH ĐẨY CODE LÊN GITHUB" -ForegroundColor Cyan
Write-Host "   Repo: https://github.com/dangbinhduongwork-ai/Toolkit" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot

# 1. Khởi tạo Git nếu chưa có
if (-not (Test-Path ".git")) {
    Write-Host "[*] Khởi tạo Git repository..." -ForegroundColor Yellow
    git init -b main
    if ($LASTEXITCODE -ne 0) {
        git init
        git branch -M main
    }
} else {
    Write-Host "[*] Git repository đã tồn tại." -ForegroundColor Green
}

# 2. Cấu hình Remote Origin
$remoteCheck = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add origin https://github.com/dangbinhduongwork-ai/Toolkit.git
    Write-Host "[+] Đã thêm remote origin." -ForegroundColor Green
} else {
    git remote set-url origin https://github.com/dangbinhduongwork-ai/Toolkit.git
    Write-Host "[*] Đã cập nhật remote origin." -ForegroundColor Green
}

# 3. Add & Commit
git add .
$msg = Read-Host "Nhập commit message (Bấm Enter để dùng mặc định 'Update Toolkit')"
if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "Update Toolkit" }

git commit -m $msg
git branch -M main

# 4. Push
Write-Host "[*] Đang đẩy lên origin main..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Push thất bại do có thể xung đột/file trên GitHub." -ForegroundColor Red
    $choice = Read-Host "Bạn có muốn pull --rebase rồi push lại không? (Y/N)"
    if ($choice -eq "Y" -or $choice -eq "y") {
        git pull origin main --rebase
        git push -u origin main
    }
}

Write-Host "`nHoàn tất! Bấm phím bất kỳ để thoát..." -ForegroundColor Green
[Console]::ReadKey() | Out-Null
