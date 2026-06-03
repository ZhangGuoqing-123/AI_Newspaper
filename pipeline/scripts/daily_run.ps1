# 硅谷速递 · 每日自动生成脚本
# ─────────────────────────────────────────────────────────────────
# 功能：爬取 → 预过滤 → Kimi 日报 → DeepSeek 质检 → edge-tts 音频
#        → 小硅口播视频 → SiliconFlow 封面图 → 写入 Supabase
# 前提：
#   1. Python 虚拟环境已激活，或 python 在 PATH
#   2. pipeline/.env 已填写所有 API key
# 用法（手动）：pwsh -File daily_run.ps1
# ─────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

# 定位到 pipeline 目录（无论从哪里运行都能找到）
$pipelineDir = Split-Path -Parent $PSScriptRoot
Set-Location $pipelineDir

# 日志文件（每天一个）
$today   = Get-Date -Format "yyyy-MM-dd"
$logDir  = Join-Path $pipelineDir "output\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir "$today.log"

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Log "===== 硅谷速递 每日生成 开始 ====="

# 检查 python
$py = (Get-Command python -ErrorAction SilentlyContinue)?.Source
if (-not $py) { Log "错误：找不到 python，请检查 PATH"; exit 1 }
Log "Python: $py"

# 运行 pipeline（全套：爬取 + 视频 + 封面图 + 发布 Supabase）
$args = "--crawl --media --images --publish"
Log "运行：python run.py $args"

try {
    $output = & python run.py --crawl --media --images --publish 2>&1
    $output | ForEach-Object { Log $_ }
    if ($LASTEXITCODE -ne 0) { throw "退出码 $LASTEXITCODE" }
    Log "===== 生成完成 ====="
} catch {
    Log "错误：$_"
    Log "===== 生成失败 ====="
    exit 1
}
