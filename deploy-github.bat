@echo off
echo ========================================
echo   平行宇宙 - GitHub 部署助手
echo ========================================
echo.

set /p REPO_URL=请输入 GitHub 仓库地址 (例如: https://github.com/username/repo.git):
set /p USERNAME=请输入 GitHub 用户名:

if "%REPO_URL%"=="" (
    set REPO_URL=https://github.com/%USERNAME%/parallel-universe.git
)

echo.
echo [1/4] 检查 Git 状态...
git status

echo.
echo [2/4] 添加所有更改...
git add .

echo.
echo [3/4] 创建提交...
set /p COMMIT_MSG=请输入提交说明 (留空使用默认):
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=更新项目
)

git commit -m "%COMMIT_MSG%"

echo.
echo [4/4] 推送到 GitHub...
echo.
echo 仓库地址: %REPO_URL%
echo.

git remote add origin %REPO_URL% 2>nul
git branch -M main 2>nul
git push -u origin main

echo.
echo ========================================
echo   部署完成!
echo ========================================
echo.
echo 仓库链接: %REPO_URL:.git=
echo.
pause
