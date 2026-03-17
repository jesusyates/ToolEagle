# v60.2 设置 Windows 计划任务 - 每 3 天自动部署（EN + ZH）
# 以管理员身份运行 PowerShell，然后执行:
#   Set-ExecutionPolicy Bypass -Scope Process -Force; .\scripts\setup-auto-deploy-task.ps1

$projectPath = (Get-Item $PSScriptRoot).Parent.FullName
$batPath = Join-Path $projectPath "scripts\run-deploy-auto.bat"
$taskName = "SEO-Auto-Deploy"

$action = New-ScheduledTaskAction -Execute $batPath -WorkingDirectory $projectPath
$trigger = New-ScheduledTaskTrigger -Daily -At "21:00" -DaysInterval 3
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 5 `
  -RestartInterval (New-TimeSpan -Minutes 15)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force

Write-Host ""
Write-Host "Plan task created: $taskName"
Write-Host "Runs every 3 days at 21:00 - deploy:auto (EN + ZH)"
Write-Host "If missed (offline/no network): runs when PC is back online"
Write-Host "On push failure: retries every 15 min, max 5 times"
Write-Host "View task: taskschd.msc -> Task Scheduler Library"
Write-Host "Remove task: Unregister-ScheduledTask -TaskName $taskName"
Write-Host ""
