$ErrorActionPreference = "Stop"

$taskName = "ToolEagle-OptimizationBootstrapWatcher"
$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $repoRoot "scripts\run-optimization-bootstrap-check.ps1"
# 略早于 14:00 主栈，只做只读检查
$startTime = "13:45"

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

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
  -Description "Daily passive watcher for optimization bootstrap readiness (no writes)."

Write-Host "Installed task: $taskName"
Write-Host "Schedule: daily at $startTime"
Write-Host "Concurrency policy: IgnoreNew (non-reentrant)"
Write-Host "Wrapper: $scriptPath"
Write-Host "Log file: $repoRoot\logs\optimization-bootstrap-watcher.log"
