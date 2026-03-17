# v60.2 设置 Windows 计划任务 - 每 3 天自动部署（EN + ZH）
# 以管理员身份运行 PowerShell，然后执行:
#   Set-ExecutionPolicy Bypass -Scope Process -Force; .\scripts\setup-auto-deploy-task.ps1

$projectPath = (Get-Item $PSScriptRoot).Parent.FullName
$batPath = Join-Path $projectPath "scripts\run-deploy-auto.bat"
$taskName = "SEO-Auto-Deploy"

$action = New-ScheduledTaskAction -Execute $batPath -WorkingDirectory $projectPath
$trigger = New-ScheduledTaskTrigger -Daily -At "21:00" -DaysInterval 3
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force

Write-Host "`n计划任务已创建: $taskName"
Write-Host "每 3 天晚上 21:00 自动运行 deploy:auto（英文 + 中文）"
Write-Host "查看任务: taskschd.msc -> 任务计划程序库"
Write-Host "删除任务: Unregister-ScheduledTask -TaskName '$taskName'`n"
