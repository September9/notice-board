# 腾讯文档数据同步脚本
$ErrorActionPreference = "Stop"

$fileId = "DWm5Mc3REcFVwcHNH"

Write-Host "正在获取腾讯文档数据..."

# 调用 mcporter 获取数据
$result = mcporter call tencent-docs.get_content file_id=$fileId 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ mcporter 调用失败"
    exit 1
}

# 解析 JSON
$json = $result | ConvertFrom-Json

if ($json.error) {
    Write-Host "❌ API 错误: $($json.error)"
    exit 1
}

# 解析表格内容
$lines = $json.content.Trim() -split "`n" | Where-Object { $_.Trim() -ne "" }

if ($lines.Count -lt 2) {
    Write-Host "没有数据"
    exit 0
}

# 跳过表头，解析数据行
$notices = @()

for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    if ($line -eq "" -or $line -notmatch '^\|') { continue }
    
    # 解析管道符分隔的数据
    $parts = $line -split '\|' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
    
    if ($parts.Count -ge 5) {
        $publishTime = $parts[0]
        $title = $parts[1]
        $content = $parts[2]
        $channel = $parts[3]
        $expireTime = $parts[4]
        
        $notices += @{
            id = "notice_$(Get-Date -Format 'yyyyMMddHHmmss')_$i"
            title = $title
            content = $content
            channel = $channel
            publishTime = $publishTime
            expireTime = $expireTime
            status = "active"
        }
    }
}

# 生成 notices.json
$noticesData = @{
    notices = $notices
    lastUpdated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

# 保存到文件
$outputPath = Join-Path $PSScriptRoot "notices.json"
$noticesData | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "✅ 成功同步 $($notices.Count) 条通知到 notices.json"
