$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot "logs"
$logPath = Join-Path $logDir "optimization-bootstrap-watcher.log"

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

$start = Get-Date -Format "s"
"[$start] V121 watcher start" | Out-File -FilePath $logPath -Append -Encoding utf8

Push-Location $repoRoot
try {
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & node scripts/run-optimization-bootstrap-check.js 2>&1 | Tee-Object -FilePath $logPath -Append
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($exitCode -ne 0) {
    throw "Watcher exited with code $exitCode"
  }
  $end = Get-Date -Format "s"
  "[$end] V121 watcher end (exit=0)" | Out-File -FilePath $logPath -Append -Encoding utf8
} catch {
  $end = Get-Date -Format "s"
  "[$end] V121 watcher failed: $($_.Exception.Message)" | Out-File -FilePath $logPath -Append -Encoding utf8
  throw
} finally {
  Pop-Location
}
