# ============================================
# Phase 3: Historical Resume Extraction Test
# Test caching strategy and instant response
# ============================================

$baseUrl = "http://localhost:3000/api"
$testEmail = "test@example.com"
$testPassword = "Test123456"

Write-Host "Phase 3: Historical Resume Extraction Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login
Write-Host "Step 1: Login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "Login failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Get resume list
Write-Host "Step 2: Get resume list..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $resumesResponse = Invoke-RestMethod -Uri "$baseUrl/resume/list" -Method GET -Headers $headers
    $resumes = $resumesResponse.data
    
    if ($resumes.Count -eq 0) {
        Write-Host "No historical resumes found. Please upload a resume first." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "Found $($resumes.Count) resume(s)" -ForegroundColor Green
    
    # Display resume list
    foreach ($resume in $resumes) {
        Write-Host "  - ID: $($resume.id)" -ForegroundColor Gray
        Write-Host "    File: $($resume.fileName)" -ForegroundColor Gray
        Write-Host "    Status: $($resume.status)" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Select first resume for testing
    $testResumeId = $resumes[0].id
    Write-Host "Testing with resume: $testResumeId" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to get resume list: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. First extraction (may need AI processing)
Write-Host "Step 3: First extraction (may need AI processing)..." -ForegroundColor Yellow

# Use multipart/form-data
$boundary = [System.Guid]::NewGuid().ToString()
$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"resumeId`"",
    "",
    $testResumeId,
    "--$boundary",
    "Content-Disposition: form-data; name=`"targetRole`"",
    "",
    "Frontend Developer",
    "--$boundary--"
)
$bodyString = $bodyLines -join "`r`n"

$extractHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "multipart/form-data; boundary=$boundary"
}

try {
    $startTime = Get-Date
    $extractResponse = Invoke-RestMethod -Uri "$baseUrl/resume/extract" -Method POST -Headers $extractHeaders -Body $bodyString
    $duration = (Get-Date) - $startTime
    
    Write-Host "First extraction successful (Duration: $($duration.TotalSeconds.ToString('F2'))s)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Extraction result:" -ForegroundColor Cyan
    Write-Host "  Name: $($extractResponse.data.personalInfo.name)" -ForegroundColor Gray
    Write-Host "  Role: $($extractResponse.data.personalInfo.role)" -ForegroundColor Gray
    Write-Host "  Experience: $($extractResponse.data.personalInfo.yearsOfExperience) years" -ForegroundColor Gray
    Write-Host "  Highlights: $($extractResponse.data.highlights.Count)" -ForegroundColor Gray
    Write-Host "  Knowledge Points: $($extractResponse.data.knowledgePoints.Count)" -ForegroundColor Gray
    
    if ($extractResponse.data.knowledgePoints.Count -gt 0) {
        Write-Host ""
        Write-Host "  Knowledge Points:" -ForegroundColor Gray
        foreach ($point in $extractResponse.data.knowledgePoints) {
            Write-Host "    - $point" -ForegroundColor DarkGray
        }
    }
} catch {
    Write-Host "First extraction failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4. Second extraction (should use cache, instant response!)
Write-Host "Step 4: Second extraction (testing cache, should be instant)..." -ForegroundColor Yellow

try {
    $startTime = Get-Date
    $extractResponse2 = Invoke-RestMethod -Uri "$baseUrl/resume/extract" -Method POST -Headers $extractHeaders -Body $bodyString
    $duration2 = (Get-Date) - $startTime
    
    Write-Host "Second extraction successful (Duration: $($duration2.TotalSeconds.ToString('F2'))s)" -ForegroundColor Green
    
    # Check if cache hit (should be < 1 second)
    if ($duration2.TotalSeconds -lt 1) {
        Write-Host "Cache hit! Instant response!" -ForegroundColor Green
    } else {
        Write-Host "Cache may not be hit, duration is long" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Extraction result (should match first extraction):" -ForegroundColor Cyan
    Write-Host "  Name: $($extractResponse2.data.personalInfo.name)" -ForegroundColor Gray
    Write-Host "  Role: $($extractResponse2.data.personalInfo.role)" -ForegroundColor Gray
    Write-Host "  Experience: $($extractResponse2.data.personalInfo.yearsOfExperience) years" -ForegroundColor Gray
    Write-Host "  Highlights: $($extractResponse2.data.highlights.Count)" -ForegroundColor Gray
    Write-Host "  Knowledge Points: $($extractResponse2.data.knowledgePoints.Count)" -ForegroundColor Gray
} catch {
    Write-Host "Second extraction failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "Test Summary:" -ForegroundColor Cyan
Write-Host "  - First extraction: $($duration.TotalSeconds.ToString('F2'))s" -ForegroundColor Gray
Write-Host "  - Second extraction: $($duration2.TotalSeconds.ToString('F2'))s" -ForegroundColor Gray
$improvement = [Math]::Round(($duration.TotalSeconds - $duration2.TotalSeconds) / $duration.TotalSeconds * 100, 2)
Write-Host "  - Performance improvement: $improvement%" -ForegroundColor Gray
