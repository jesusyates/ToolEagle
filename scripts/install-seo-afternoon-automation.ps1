# 安装 Windows 计划任务：每天 14:00 跑完整下午 SEO 栈
# 用法（建议在项目根）:
#   Set-ExecutionPolicy Bypass -Scope Process -Force; .\scripts\install-seo-afternoon-automation.ps1
#
# 会移除旧的 ToolEagle-ENDailyGrowth（功能已并入本栈，避免重复打 API）

$ErrorActionPreference = "Stop"

$taskName = "ToolEagle-AfternoonSEOStack"
$repoRoot = Split-Path -Parent $PSScriptRoot
$wrapperPs1 = Join-Path $repoRoot "scripts\run-afternoon-seo-automation.ps1"
$launcherCmd = Join-Path $repoRoot "scripts\run-afternoon-seo-automation.cmd"
$startTime = "14:00"

if (-not (Test-Path $wrapperPs1)) {
  throw "Missing script: $wrapperPs1"
}
if (-not (Test-Path $launcherCmd)) {
  throw "Missing launcher: $launcherCmd"
}

# 用 .cmd 启动，避免「powershell -File "路径"」在任务计划里被错误拆成 `\" \"`
$action = New-ScheduledTaskAction -Execute $launcherCmd

$trigger = New-ScheduledTaskTrigger -Daily -At $startTime
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# 避免与编排器里 EN blog 叠加同一套「日增」重复：旧任务卸掉（无则忽略）
Unregister-ScheduledTask -TaskName 'ToolEagle-ENDailyGrowth' -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "Unregistered legacy ToolEagle-ENDailyGrowth if it existed."

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description "ToolEagle daily 14:00: orchestrator + EN growth/indexing + watchdog. Log: logs\afternoon-seo-automation.log"

Write-Host ""
Write-Host "Installed: $taskName"
Write-Host "Schedule: every day at $startTime"
Write-Host "Launcher: $launcherCmd"
Write-Host "Log: $repoRoot\logs\afternoon-seo-automation.log"
Write-Host "Remove: Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false"
Write-Host ""
