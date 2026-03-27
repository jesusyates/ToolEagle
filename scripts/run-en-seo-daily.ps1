$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot "logs"
$logPath = Join-Path $logDir "en-daily-growth.log"

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

$start = Get-Date -Format "s"
"[$start] ToolEagle EN daily autopilot start" | Out-File -FilePath $logPath -Append -Encoding utf8

Push-Location $repoRoot
try {
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & node scripts/run-en-seo-daily.js 2>&1 | Tee-Object -FilePath $logPath -Append
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($exitCode -ne 0) {
    throw "run-en-seo-daily exited with code $exitCode"
  }

  $end = Get-Date -Format "s"
  "[$end] ToolEagle EN daily autopilot end (exit=0)" | Out-File -FilePath $logPath -Append -Encoding utf8
} catch {
  $end = Get-Date -Format "s"
  "[$end] ToolEagle EN daily autopilot failed: $($_.Exception.Message)" | Out-File -FilePath $logPath -Append -Encoding utf8
  throw
} finally {
  Pop-Location
}
