@echo off
REM V156 — 安全启动下午 SEO 栈（无 cmd "start" 引号坑；计划任务 / 双击均可）
cd /d "%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-afternoon-seo-automation.ps1"
exit /b %ERRORLEVEL%
