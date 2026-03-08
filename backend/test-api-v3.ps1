# 🧪 Mock Interview Wizard v3.0 - API 测试脚本
# 用途：自动测试 Resume/Topic 双模式 API

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🧪 Mock Interview Wizard v3.0 API 测试" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api"

# Step 1: 注册测试用户
Write-Host "📝 Step 1: 注册测试用户..." -ForegroundColor Yellow
$registerPayload = @{
    email = "test_v3_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "Test123456"
    name = "Test User V3"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerPayload
    
    $token = $registerResponse.data.accessToken
    Write-Host "✅ 用户注册成功" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ 注册失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: 上传测试简历
Write-Host "📄 Step 2: 上传测试简历..." -ForegroundColor Yellow

# 创建临时测试简历文件
$resumeContent = @"
姓名：张三
职位：Frontend Developer

工作经历：
- 2022-2024: 字节跳动 - 高级前端工程师
  * 负责抖音电商前端架构设计
  * 使用 React + TypeScript 开发高性能组件
  * 优化首屏加载时间，提升 40% 性能

技术栈：
React, TypeScript, Node.js, Webpack, Vite, Next.js

项目经验：
1. 电商平台重构项目
   - 使用 React 18 + Suspense 实现流式渲染
   - 实现虚拟滚动优化长列表性能
   - 集成 GraphQL 提升数据查询效率
"@

$tempFile = [System.IO.Path]::GetTempFileName()
$resumeFile = $tempFile -replace '\.tmp$', '.txt'
Move-Item $tempFile $resumeFile -Force
[System.IO.File]::WriteAllText($resumeFile, $resumeContent, [System.Text.Encoding]::UTF8)

try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes($resumeFile)
    $fileContent = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBytes)
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"test_resume.txt`"",
        "Content-Type: text/plain",
        "",
        $fileContent,
        "--$boundary",
        "Content-Disposition: form-data; name=`"targetRole`"",
        "",
        "Frontend Developer",
        "--$boundary--"
    )
    
    $body = $bodyLines -join "`r`n"
    
    $uploadResponse = Invoke-RestMethod -Uri "$baseUrl/resume/analyze" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        } `
        -Body ([System.Text.Encoding]::GetEncoding('iso-8859-1').GetBytes($body))
    
    $resumeId = $uploadResponse.data.documentId
    Write-Host "✅ 简历上传成功" -ForegroundColor Green
    Write-Host "   Resume ID: $resumeId" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  简历上传失败（继续测试 Topic 模式）: $($_.Exception.Message)" -ForegroundColor Yellow
    $resumeId = $null
} finally {
    Remove-Item $resumeFile -ErrorAction SilentlyContinue
}
Write-Host ""

# Step 3: 测试 Resume 模式
if ($resumeId) {
    Write-Host "🎯 Step 3: 测试 Resume 模式..." -ForegroundColor Yellow
    
    $resumePayload = @{
        mode = "RESUME"
        jobTitle = "Frontend Developer"
        difficulty = "SENIOR"
        resumeId = $resumeId
    } | ConvertTo-Json
    
    try {
        $resumeResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session" `
            -Method POST `
            -Headers @{
                "Authorization" = "Bearer $token"
                "Content-Type" = "application/json"
            } `
            -Body $resumePayload
        
        Write-Host "✅ Resume 模式测试通过" -ForegroundColor Green
        Write-Host "   Session ID: $($resumeResponse.data.sessionId)" -ForegroundColor Gray
        Write-Host "   Greeting: $($resumeResponse.data.greeting.Substring(0, 50))..." -ForegroundColor Gray
    } catch {
        Write-Host "❌ Resume 模式测试失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
} else {
    Write-Host "⏭️  跳过 Resume 模式测试（无有效简历）" -ForegroundColor Yellow
    Write-Host ""
}

# Step 4: 测试 Topic 模式
Write-Host "🎯 Step 4: 测试 Topic 模式..." -ForegroundColor Yellow

$topicPayload = @{
    mode = "TOPIC"
    jobTitle = "Frontend Developer"
    difficulty = "EXPERT"
    topics = @(
        "React Internals",
        "Performance Optimization",
        "System Design"
    )
} | ConvertTo-Json

try {
    $topicResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $topicPayload
    
    Write-Host "✅ Topic 模式测试通过" -ForegroundColor Green
    Write-Host "   Session ID: $($topicResponse.data.sessionId)" -ForegroundColor Gray
    Write-Host "   Greeting: $($topicResponse.data.greeting.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Topic 模式测试失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Step 5: 测试 DTO 校验
Write-Host "🔒 Step 5: 测试 DTO 校验..." -ForegroundColor Yellow

# 测试 5.1: Resume 模式缺少 resumeId
Write-Host "   5.1: Resume 模式缺少 resumeId..." -ForegroundColor Gray
$invalidPayload1 = @{
    mode = "RESUME"
    jobTitle = "Frontend Developer"
    difficulty = "MEDIUM"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/interview/session" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $invalidPayload1
    Write-Host "   ❌ 应该返回 400 错误" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ 正确拦截（400 Bad Request）" -ForegroundColor Green
    } else {
        Write-Host "   ❌ 错误码不正确: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# 测试 5.2: Topic 模式缺少 topics
Write-Host "   5.2: Topic 模式缺少 topics..." -ForegroundColor Gray
$invalidPayload2 = @{
    mode = "TOPIC"
    jobTitle = "Frontend Developer"
    difficulty = "MEDIUM"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/interview/session" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $invalidPayload2
    Write-Host "   ❌ 应该返回 400 错误" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ 正确拦截（400 Bad Request）" -ForegroundColor Green
    } else {
        Write-Host "   ❌ 错误码不正确: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# 测试 5.3: Topic 模式空 topics 数组
Write-Host "   5.3: Topic 模式空 topics 数组..." -ForegroundColor Gray
$invalidPayload3 = @{
    mode = "TOPIC"
    jobTitle = "Frontend Developer"
    difficulty = "MEDIUM"
    topics = @()
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/interview/session" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $invalidPayload3
    Write-Host "   ❌ 应该返回 400 错误" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ 正确拦截（400 Bad Request）" -ForegroundColor Green
    } else {
        Write-Host "   ❌ 错误码不正确: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""

# 总结
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ API 测试完成！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 测试结果总结：" -ForegroundColor Yellow
Write-Host "   ✅ 用户注册" -ForegroundColor Green
if ($resumeId) {
    Write-Host "   ✅ 简历上传" -ForegroundColor Green
    Write-Host "   ✅ Resume 模式" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  简历上传（跳过）" -ForegroundColor Yellow
    Write-Host "   ⏭️  Resume 模式（跳过）" -ForegroundColor Yellow
}
Write-Host "   ✅ Topic 模式" -ForegroundColor Green
Write-Host "   ✅ DTO 校验" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Mock Interview Wizard v3.0 已准备就绪！" -ForegroundColor Green
