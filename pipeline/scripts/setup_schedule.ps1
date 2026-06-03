# 硅谷速递 · Windows 计划任务注册脚本
# ─────────────────────────────────────────────────────────────────
# 功能：注册「硅谷速递-每日生成」计划任务，每天 06:00 自动运行
# 前提：以管理员身份运行（右键 → "以管理员身份运行"）
# 用法：pwsh -File setup_schedule.ps1
# ─────────────────────────────────────────────────────────────────

#Requires -RunAsAdministrator

$taskName   = "硅谷速递-每日生成"
$scriptPath = Join-Path $PSScriptRoot "daily_run.ps1"
$runTime    = "06:00"

if (-not (Test-Path $scriptPath)) {
    Write-Error "找不到 daily_run.ps1，请确认 pipeline\scripts\ 目录结构正确"
    exit 1
}

$action = New-ScheduledTaskAction `
    -Execute "pwsh.exe" `
    -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -Daily -At $runTime

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -StartWhenAvailable `
    -WakeToRun

# 以当前登录用户身份运行（无需密码弹窗），若需要无人值守可改 -RunLevel Highest + 密码
$principal = New-ScheduledTaskPrincipal `
    -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) `
    -LogonType Interactive `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName $taskName `
    -Action   $action `
    -Trigger  $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "硅谷速递每日 AI 日报自动生成：爬取→摘要→音频→视频→封面图→发布 Supabase" `
    -Force | Out-Null

Write-Host ""
Write-Host "✓ 计划任务「$taskName」已注册"
Write-Host "  运行时间：每天 $runTime"
Write-Host "  脚本路径：$scriptPath"
Write-Host ""
Write-Host "常用操作："
Write-Host "  立即测试：Start-ScheduledTask -TaskName '$taskName'"
Write-Host "  查看日志：Get-Content pipeline\output\logs\$(Get-Date -Format 'yyyy-MM-dd').log"
Write-Host "  暂停任务：Disable-ScheduledTask -TaskName '$taskName'"
Write-Host "  取消任务：Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
