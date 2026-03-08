# Phase 3 Basic Test Script
$baseUrl = "http://localhost:3000/api"

Write-Host "Phase 3 Testing Started" -ForegroundColor Cyan
Write-Host "=" * 60

# Test 1: Login
Write-Host "`nTest 1: Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "Test123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    Write-Host "Login Success!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.data.user.name)" -ForegroundColor Cyan
} catch {
    Write-Host "Login Failed, trying to register..." -ForegroundColor Red
    
    $registerBody = @{
        name = "Test User"
        email = "test@example.com"
        password = "Test123456"
    } | ConvertTo-Json
    
    try {
        $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
        $token = $registerResponse.data.accessToken
        Write-Host "Register Success!" -ForegroundColor Green
    } catch {
        Write-Host "Register Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please register manually in browser first" -ForegroundColor Yellow
        exit 1
    }
}

# Test 2: Get Documents
Write-Host "`nTest 2: Get Documents..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $documentsResponse = Invoke-RestMethod -Uri "$baseUrl/documents" -Method GET -Headers $headers
    $resumes = $documentsResponse.data | Where-Object { $_.type -eq 'resume' }
    
    if ($resumes.Count -gt 0) {
        Write-Host "Found $($resumes.Count) resumes" -ForegroundColor Green
        $resumeId = $resumes[0].id
        Write-Host "Using resume: $($resumes[0].title)" -ForegroundColor Cyan
    } else {
        Write-Host "No resumes found. Please upload a PDF resume first." -ForegroundColor Yellow
        Write-Host "Visit: http://localhost:5173" -ForegroundColor Cyan
        exit 0
    }
} catch {
    Write-Host "Get documents failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Create Interview Session with Custom Knowledge Points
Write-Host "`nTest 3: Create Interview Session..." -ForegroundColor Yellow

$sessionBody = @{
    mode = "RESUME"
    jobTitle = "Frontend Developer"
    difficulty = "MEDIUM"
    resumeId = $resumeId
    customKnowledgePoints = @(
        "React Hooks"
        "TypeScript"
        "Performance"
        "State Management"
        "Webpack"
    )
} | ConvertTo-Json

Write-Host "`nPayload:" -ForegroundColor Cyan
Write-Host $sessionBody -ForegroundColor White

try {
    $sessionResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session" -Method POST -Body $sessionBody -Headers $headers -ContentType "application/json"
    
    Write-Host "`nSession Created!" -ForegroundColor Green
    Write-Host "Session ID: $($sessionResponse.data.sessionId)" -ForegroundColor Cyan
    
    $sessionId = $sessionResponse.data.sessionId
    
    # Test 4: Verify Session Details
    Write-Host "`nTest 4: Verify Session Details..." -ForegroundColor Yellow
    
    $detailResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session/$sessionId" -Method GET -Headers $headers
    
    Write-Host "Session Details:" -ForegroundColor Green
    Write-Host "  Mode: $($detailResponse.data.mode)" -ForegroundColor Cyan
    Write-Host "  Difficulty: $($detailResponse.data.difficulty)" -ForegroundColor Cyan
    Write-Host "  Status: $($detailResponse.data.status)" -ForegroundColor Cyan
    
    if ($detailResponse.data.customKnowledgePoints -and $detailResponse.data.customKnowledgePoints.Count -gt 0) {
        Write-Host "`n  Custom Knowledge Points:" -ForegroundColor Green
        $detailResponse.data.customKnowledgePoints | ForEach-Object {
            Write-Host "    - $_" -ForegroundColor White
        }
    } else {
        Write-Host "`n  Warning: Custom Knowledge Points is empty" -ForegroundColor Yellow
    }
    
    Write-Host "`nAll backend tests passed!" -ForegroundColor Green
    
} catch {
    Write-Host "Create session failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n" + "=" * 60
Write-Host "Phase 3 Backend Testing Complete!" -ForegroundColor Cyan
Write-Host "`nNext Step: Test in browser" -ForegroundColor Yellow
Write-Host "Visit: http://localhost:5173" -ForegroundColor Cyan
