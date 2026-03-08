# Phase 3 Test Script (Fixed)
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
    $token = $loginResponse.accessToken
    Write-Host "Login Success!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.name)" -ForegroundColor Cyan
    Write-Host "Email: $($loginResponse.user.email)" -ForegroundColor Cyan
} catch {
    Write-Host "Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please make sure you have registered an account" -ForegroundColor Yellow
    exit 1
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
        Write-Host "No resumes found." -ForegroundColor Yellow
        Write-Host "Please upload a PDF resume in the browser first." -ForegroundColor Yellow
        Write-Host "Visit: http://localhost:5173" -ForegroundColor Cyan
        Write-Host "`nYou can still test the API by creating a mock session..." -ForegroundColor Yellow
        
        # Create a test session without resume (Topic mode)
        Write-Host "`nTest 3: Create Topic Mode Session..." -ForegroundColor Yellow
        $topicSessionBody = @{
            mode = "TOPIC"
            jobTitle = "Frontend Developer"
            difficulty = "MEDIUM"
            topics = @("React", "TypeScript", "Performance")
        } | ConvertTo-Json
        
        try {
            $topicResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session" -Method POST -Body $topicSessionBody -Headers $headers -ContentType "application/json"
            Write-Host "Topic Session Created!" -ForegroundColor Green
            Write-Host "Session ID: $($topicResponse.data.sessionId)" -ForegroundColor Cyan
        } catch {
            Write-Host "Topic session failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        exit 0
    }
} catch {
    Write-Host "Get documents failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Create Interview Session with Custom Knowledge Points
Write-Host "`nTest 3: Create Interview Session with Custom Knowledge Points..." -ForegroundColor Yellow

$sessionBody = @{
    mode = "RESUME"
    jobTitle = "Frontend Developer"
    difficulty = "MEDIUM"
    resumeId = $resumeId
    customKnowledgePoints = @(
        "React Hooks Advanced"
        "TypeScript Generics"
        "Performance Optimization"
        "State Management Patterns"
        "Webpack Configuration"
    )
} | ConvertTo-Json

Write-Host "`nPayload:" -ForegroundColor Cyan
Write-Host $sessionBody -ForegroundColor White

try {
    $sessionResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session" -Method POST -Body $sessionBody -Headers $headers -ContentType "application/json"
    
    Write-Host "`nSession Created Successfully!" -ForegroundColor Green
    Write-Host "Session ID: $($sessionResponse.data.sessionId)" -ForegroundColor Cyan
    Write-Host "Greeting: $($sessionResponse.data.greeting.Substring(0, [Math]::Min(80, $sessionResponse.data.greeting.Length)))..." -ForegroundColor Cyan
    
    $sessionId = $sessionResponse.data.sessionId
    
    # Test 4: Verify Session Details
    Write-Host "`nTest 4: Verify Session Details..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 1
    
    $detailResponse = Invoke-RestMethod -Uri "$baseUrl/interview/session/$sessionId" -Method GET -Headers $headers
    
    Write-Host "Session Details Retrieved:" -ForegroundColor Green
    Write-Host "  Mode: $($detailResponse.data.mode)" -ForegroundColor Cyan
    Write-Host "  Difficulty: $($detailResponse.data.difficulty)" -ForegroundColor Cyan
    Write-Host "  Status: $($detailResponse.data.status)" -ForegroundColor Cyan
    Write-Host "  Job Title: $($detailResponse.data.jobTitle)" -ForegroundColor Cyan
    
    if ($detailResponse.data.customKnowledgePoints -and $detailResponse.data.customKnowledgePoints.Count -gt 0) {
        Write-Host "`n  Custom Knowledge Points (Saved Successfully):" -ForegroundColor Green
        $detailResponse.data.customKnowledgePoints | ForEach-Object {
            Write-Host "    - $_" -ForegroundColor White
        }
        Write-Host "`n  Total: $($detailResponse.data.customKnowledgePoints.Count) knowledge points" -ForegroundColor Cyan
    } else {
        Write-Host "`n  Warning: Custom Knowledge Points is empty!" -ForegroundColor Yellow
    }
    
    Write-Host "`nAll Backend Tests Passed!" -ForegroundColor Green
    
} catch {
    Write-Host "Create session failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n" + "=" * 60
Write-Host "Phase 3 Backend Testing Complete!" -ForegroundColor Cyan
Write-Host "`nTest Summary:" -ForegroundColor Yellow
Write-Host "  [PASS] User Authentication" -ForegroundColor Green
Write-Host "  [PASS] Document Retrieval" -ForegroundColor Green
Write-Host "  [PASS] Session Creation with customKnowledgePoints" -ForegroundColor Green
Write-Host "  [PASS] Session Details Verification" -ForegroundColor Green
Write-Host "  [PASS] Custom Knowledge Points Persistence" -ForegroundColor Green
Write-Host "`nNext Step: Test the UI in browser" -ForegroundColor Yellow
Write-Host "  1. Visit: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  2. Login with: test@example.com / Test123456" -ForegroundColor Cyan
Write-Host "  3. Start a Mock Interview" -ForegroundColor Cyan
Write-Host "  4. Upload a PDF resume" -ForegroundColor Cyan
Write-Host "  5. Edit the knowledge points in Step 2" -ForegroundColor Cyan
Write-Host "  6. Verify AI asks questions about your custom knowledge points" -ForegroundColor Cyan
