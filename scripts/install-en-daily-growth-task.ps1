$ErrorActionPreference = "Stop"

$taskName = "ToolEagle-ENDailyGrowth"
$repoRoot = Split-Path -Parent $PSScriptRoot
$wrapperPath = Join-Path $repoRoot "scripts\\run-en-seo-daily.ps1"
# 默认已并入 ToolEagle-AfternoonSEOStack（14:00）。若仍单独安装本任务，请改时间避免与编排器同时跑。
$startTime = "15:30"

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$wrapperPath`""

$trigger = New-ScheduledTaskTrigger -Daily -At $startTime
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description "Daily EN SEO autopilot (growth + indexing). No optimization writes."

Write-Host "Installed task: $taskName"
Write-Host "Schedule: daily at $startTime"
Write-Host "Concurrency policy: IgnoreNew (non-reentrant)"
Write-Host "Wrapper: $wrapperPath"
Write-Host "Log file: $repoRoot\\logs\\en-daily-growth.log"
