# 一键启动「硅谷速递」演示：后端(同时托管前端) + Cloudflare 免费公网隧道。
# 跑这一条命令，等十几秒，会打印一个 https://xxx.trycloudflare.com 网址，
# 把这个网址发给别人（或自己手机）就能打开 App。Ctrl+C 关闭时后端一起停。
#
# 用法（在项目根目录 PowerShell 里）：
#     ./start-demo.ps1            # 用已有的 dist 前端
#     ./start-demo.ps1 -Build     # 改过前端代码时，先重新打包再起
#
# 前置：①pipeline/.env 配好密钥 ②已 npm install ③已 winget install Cloudflare.cloudflared

param([switch]$Build)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 定位 cloudflared（PATH 里没有就去 winget 安装目录找）
$cf = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $cf) {
    $found = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter cloudflared.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $cf = $found.FullName }
}
if (-not $cf) {
    Write-Host "❌ 找不到 cloudflared，先运行：winget install Cloudflare.cloudflared" -ForegroundColor Red
    exit 1
}

# 可选：重新打包前端（改过前端代码时用 -Build）
if ($Build -or -not (Test-Path "$root\dist\index.html")) {
    Write-Host "📦 打包前端..." -ForegroundColor Cyan
    Push-Location $root
    cmd /c "npm run build"
    Pop-Location
    if (-not (Test-Path "$root\dist\index.html")) { Write-Host "❌ 打包失败" -ForegroundColor Red; exit 1 }
}

# 1) 起后端（uvicorn 同时托管 dist 前端 + API），后台
Write-Host "🚀 启动后端 (localhost:8787)..." -ForegroundColor Cyan
$backend = Start-Process -PassThru -WindowStyle Hidden python `
    -ArgumentList "-m","uvicorn","server:app","--port","8787" `
    -WorkingDirectory "$root\pipeline"

Start-Sleep -Seconds 5

# 2) 起 Cloudflare 隧道（前台，会打印公网网址并保持运行）
Write-Host ""
Write-Host "🌐 启动公网隧道——下面输出里找这一行带 https://xxx.trycloudflare.com 的网址，发出去就能用：" -ForegroundColor Green
Write-Host "   （演示结束按 Ctrl+C，会自动关闭后端）" -ForegroundColor DarkGray
Write-Host ""
try {
    & $cf tunnel --url http://localhost:8787
}
finally {
    Write-Host "`n🛑 关闭后端..." -ForegroundColor Cyan
    if ($backend -and -not $backend.HasExited) { Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue }
}
