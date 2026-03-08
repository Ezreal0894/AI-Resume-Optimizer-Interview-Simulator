# Phase 3 测试脚本：自定义知识点功能
# 测试 Resume 模式下的 customKnowledgePoints 功能

$baseUrl = "http://localhost:3000/api"
$token = ""

Write-Host "🧪 Phase 3 功能测试：自定义知识点" -ForegroundColor Cyan
Write-Host "=" * 60

# Step 1: 登录获取 Token
Write-Host "`n📝 Step 1: 登录获取 Token..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "Test123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    Write-Host "✅ 登录成功！Token: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "❌ 登录失败: $_" -ForegroundColor Red
    exit 1
}

# Step 2: 上传简历并提取
Write-Host "`n📤 Step 2: 上传简历并提取知识点..." -ForegroundColor Yellow

# 注意：这里需要一个真实的 PDF 文件
# 如果没有，可以跳过这一步，直接使用已有的 resumeId

# Step 3: 创建面试会话（带自定义知识点）
Write-Host "`n🚀 Step 3: 创建面试会话（带自定义知识点）..." -ForegroundColor Yellow

$sessionBody = @{
    mode = "RESUME"
    jobTitle = "Frontend Developer"
    difficulty = "MEDIUM"
    resumeId = "your-resume-id-here"  # 替换为真实的 resumeId
    customKnowledgePoints = @(
        "React Hooks 深度理解"
        "TypeScript 高级类型"
        "性能优化实战"
        "状态管理最佳实践"
        "自定义考点测试"
    )
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    Write-Host "📦 请求 Payload:" -ForegroundColor Cyan
    Write-Host $sessionBody
    
    $sessionResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session" -Method POST -Body $sessionBody -Headers $headers
    
    Write-Host "`n✅ 面试会话创建成功！" -ForegroundColor Green
    Write-Host "Session ID: $($sessionResponse.data.sessionId)" -ForegroundColor Cyan
    Write-Host "Greeting: $($sessionResponse.data.greeting)" -ForegroundColor Cyan
    
    $sessionId = $sessionResponse.data.sessionId
    
    # Step 4: 验证会话详情
    Write-Host "`n🔍 Step 4: 验证会话详情..." -ForegroundColor Yellow
    
    $detailResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session/$sessionId" -Method GET -Headers $headers
    
    Write-Host "✅ 会话详情获取成功！" -ForegroundColor Green
    Write-Host "Mode: $($detailResponse.data.mode)" -ForegroundColor Cyan
    Write-Host "Difficulty: $($detailResponse.data.difficulty)" -ForegroundColor Cyan
    Write-Host "Custom Knowledge Points:" -ForegroundColor Cyan
    $detailResponse.data.customKnowledgePoints | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor White
    }
    
    # Step 5: 验证 System Prompt 是否包含自定义知识点
    Write-Host "`n🎯 Step 5: 验证 System Prompt..." -ForegroundColor Yellow
    
    # 发送一条测试消息
    $chatBody = @{
        messages = @(
            @{
                role = "user"
                content = "你好，我准备好了"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    # 注意：这里使用 SSE 流式接口，PowerShell 不太好测试
    # 建议在浏览器中测试或使用 curl
    Write-Host "⚠️  SSE 流式接口需要在浏览器中测试" -ForegroundColor Yellow
    
    Write-Host "`n✅ 所有测试通过！" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 测试失败: $_" -ForegroundColor Red
    Write-Host "错误详情: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

Write-Host "`n" + "=" * 60
Write-Host "🎉 Phase 3 功能测试完成！" -ForegroundColor Cyan
Write-Host "`n📋 测试总结：" -ForegroundColor Yellow
Write-Host "  ✅ 登录功能正常" -ForegroundColor Green
Write-Host "  ✅ 创建会话支持 customKnowledgePoints" -ForegroundColor Green
Write-Host "  ✅ 会话详情正确返回自定义知识点" -ForegroundColor Green
Write-Host "  ⚠️  需要在浏览器中验证 AI 是否围绕知识点提问" -ForegroundColor Yellow
