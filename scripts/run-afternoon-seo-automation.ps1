# V156 — 下午 SEO 全自动栈（与计划任务共用；也可手动运行）
# 顺序：V170 daily-engine（生产入口）→ V122 EN 日增（索引/增长链）→ V195（链分析 + 规则 + apply-top1）→ V155 看门狗
# 日志：logs/afternoon-seo-automation.log

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot "logs"
$logPath = Join-Path $logDir "afternoon-seo-automation.log"

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

function Write-Log([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "s"), $msg
  $line | Out-File -FilePath $logPath -Append -Encoding utf8
  Write-Host $line
}

Write-Log "=== afternoon SEO stack start ==="
Push-Location $repoRoot

try {
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  Write-Log "step: daily-engine (V170 production entry)"
  & npm.cmd run daily-engine 2>&1 | Tee-Object -FilePath $logPath -Append
  $orch = $LASTEXITCODE
  Write-Log "daily-engine exit=$orch"

  Write-Log "step: run-en-seo-daily.js (growth + indexing)"
  & node scripts/run-en-seo-daily.js 2>&1 | Tee-Object -FilePath $logPath -Append
  $en = $LASTEXITCODE
  Write-Log "en-daily exit=$en"

  Write-Log "step: v195 (completion + diagnosis + optimization rules + apply-top1)"
  & npm.cmd run v195 2>&1 | Tee-Object -FilePath $logPath -Append
  $v195 = $LASTEXITCODE
  Write-Log "v195 exit=$v195"

  Write-Log "step: seo:watchdog"
  & npx.cmd tsx scripts/run-seo-watchdog.ts 2>&1 | Tee-Object -FilePath $logPath -Append
  $wd = $LASTEXITCODE
  Write-Log "watchdog exit=$wd"

  $ErrorActionPreference = $prevEap

  if ($orch -ne 0 -or $en -ne 0) {
    Write-Log "stack completed with non-zero stage(s) orch=$orch en=$en wd=$wd"
    exit ([Math]::Max([int]$orch, [int]$en))
  }
  Write-Log "=== afternoon SEO stack end (ok) ==="
  exit 0
} catch {
  Write-Log "FATAL: $($_.Exception.Message)"
  throw
} finally {
  Pop-Location
}
