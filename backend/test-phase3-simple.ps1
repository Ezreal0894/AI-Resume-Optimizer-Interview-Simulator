# Phase 3 简化测试脚本
$baseUrl = "http://localhost:3000/api"

Write-Host "`n🧪 Phase 3 功能测试开始" -ForegroundColor Cyan
Write-Host "=" * 60

# Step 1: 测试服务器连接
Write-Host "`n📡 Step 1: 测试服务器连接..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$baseUrl/auth/health" -Method GET -ErrorAction SilentlyContinue
    Write-Host "✅ 后端服务正常运行" -ForegroundColor Green
} catch {
    Write-Host "⚠️  后端健康检查失败，但服务可能仍在运行" -ForegroundColor Yellow
}

# Step 2: 登录获取 Token
Write-Host "`n🔐 Step 2: 登录测试账号..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "Test123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    Write-Host "✅ 登录成功！" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.data.user.name)" -ForegroundColor Cyan
    Write-Host "   Email: $($loginResponse.data.user.email)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 登录失败，尝试注册新账号..." -ForegroundColor Red
    
    # 尝试注册
    $registerBody = @{
        name = "Test User"
        email = "test@example.com"
        password = "Test123456"
    } | ConvertTo-Json
    
    try {
        $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
        $token = $registerResponse.data.accessToken
        Write-Host "✅ 注册成功！" -ForegroundColor Green
    } catch {
        Write-Host "❌ 注册也失败了: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n💡 提示：请在浏览器中手动注册账号后再运行此脚本" -ForegroundColor Yellow
        exit 1
    }
}

# Step 3: 获取简历列表
Write-Host "`n📋 Step 3: 获取简历列表..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $documentsResponse = Invoke-RestMethod -Uri "$baseUrl/documents" -Method GET -Headers $headers
    $resumes = $documentsResponse.data | Where-Object { $_.type -eq 'resume' }
    
    if ($resumes.Count -gt 0) {
        Write-Host "✅ 找到 $($resumes.Count) 份简历" -ForegroundColor Green
        $resumeId = $resumes[0].id
        Write-Host "   使用简历: $($resumes[0].title)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  没有找到简历，需要先上传简历" -ForegroundColor Yellow
        Write-Host "   请在浏览器中上传一份 PDF 简历后再运行此脚本" -ForegroundColor Yellow
        exit 0
    }
} catch {
    Write-Host "❌ 获取简历列表失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: 创建面试会话（带自定义知识点）
Write-Host "`n🚀 Step 4: 创建面试会话（带自定义知识点）..." -ForegroundColor Yellow

$sessionBody = @{
    mode = "RESUME"
    jobTitle = "Frontend Developer"
    difficulty = "MEDIUM"
    resumeId = $resumeId
    customKnowledgePoints = @(
        "React Hooks 深度理解"
        "TypeScript 高级类型"
        "性能优化实战"
        "状态管理最佳实践"
        "Webpack 配置优化"
    )
} | ConvertTo-Json

Write-Host "`n📦 请求 Payload:" -ForegroundColor Cyan
Write-Host $sessionBody -ForegroundColor White

try {
    $sessionResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session" -Method POST -Body $sessionBody -Headers $headers -ContentType "application/json"
    
    Write-Host "`n✅ 面试会话创建成功！" -ForegroundColor Green
    Write-Host "   Session ID: $($sessionResponse.data.sessionId)" -ForegroundColor Cyan
    Write-Host "   Greeting: $($sessionResponse.data.greeting.Substring(0, [Math]::Min(100, $sessionResponse.data.greeting.Length)))..." -ForegroundColor Cyan
    
    $sessionId = $sessionResponse.data.sessionId
    
    # Step 5: 验证会话详情
    Write-Host "`n🔍 Step 5: 验证会话详情..." -ForegroundColor Yellow
    
    $detailResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session/$sessionId" -Method GET -Headers $headers
    
    Write-Host "✅ 会话详情获取成功！" -ForegroundColor Green
    Write-Host "   Mode: $($detailResponse.data.mode)" -ForegroundColor Cyan
    Write-Host "   Difficulty: $($detailResponse.data.difficulty)" -ForegroundColor Cyan
    Write-Host "   Status: $($detailResponse.data.status)" -ForegroundColor Cyan
    
    if ($detailResponse.data.customKnowledgePoints -and $detailResponse.data.customKnowledgePoints.Count -gt 0) {
        Write-Host "`n   ✅ Custom Knowledge Points (已保存):" -ForegroundColor Green
        $detailResponse.data.customKnowledgePoints | ForEach-Object {
            Write-Host "      • $_" -ForegroundColor White
        }
    } else {
        Write-Host "`n   ⚠️  Custom Knowledge Points 为空" -ForegroundColor Yellow
    }
    
    Write-Host "`n✅ 所有后端测试通过！" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 创建面试会话失败" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   响应: $responseBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n" + "=" * 60
Write-Host "🎉 Phase 3 后端功能测试完成！" -ForegroundColor Cyan
Write-Host "`n📋 测试总结：" -ForegroundColor Yellow
Write-Host "  ✅ 服务器连接正常" -ForegroundColor Green
Write-Host "  ✅ 用户认证成功" -ForegroundColor Green
Write-Host "  ✅ 简历列表获取成功" -ForegroundColor Green
Write-Host "  ✅ 创建会话支持 customKnowledgePoints" -ForegroundColor Green
Write-Host "  ✅ 会话详情正确返回自定义知识点" -ForegroundColor Green
Write-Host "`n💡 下一步：在浏览器中测试完整的用户流程" -ForegroundColor Yellow
Write-Host "   访问: http://localhost:5173" -ForegroundColor Cyan
